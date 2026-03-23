import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getPlan } from '@/lib/plans'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: objectId } = await params
  const supabase = await createServerSideClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  // Resolve museum — owner or Admin/Editor staff
  let museum: any = null

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id, plan')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museum = ownedMuseum
  } else {
    const { data: staffRecord } = await supabase
      .from('staff_members')
      .select('museum_id, access')
      .eq('user_id', user.id)
      .in('access', ['Admin', 'Editor'])
      .maybeSingle()
    if (staffRecord) {
      const { data: staffMuseum } = await supabase
        .from('museums')
        .select('id, plan')
        .eq('id', staffRecord.museum_id)
        .maybeSingle()
      if (staffMuseum) museum = staffMuseum
    }
  }

  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify object belongs to this museum
  const { data: object } = await supabase
    .from('objects')
    .select('id')
    .eq('id', objectId)
    .eq('museum_id', museum.id)
    .maybeSingle()

  if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

  // Check image count against plan limit
  const limit = getPlan(museum.plan).imagesPerObject
  const { count } = await supabase
    .from('object_images')
    .select('id', { count: 'exact', head: true })
    .eq('object_id', objectId)

  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: 'Image limit reached for your plan' }, { status: 403 })
  }

  // Insert the image record
  const body = await request.json()
  const { url, is_primary, sort_order, caption } = body

  const { data: newImage, error } = await supabase
    .from('object_images')
    .insert({
      object_id: objectId,
      museum_id: museum.id,
      url,
      is_primary: is_primary ?? false,
      sort_order: sort_order ?? 0,
      ...(caption ? { caption } : {}),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If primary, update objects.image_url
  if (is_primary) {
    await supabase.from('objects').update({ image_url: url }).eq('id', objectId)
  }

  return NextResponse.json(newImage)
}
