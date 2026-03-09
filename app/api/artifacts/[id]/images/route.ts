import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getPlan } from '@/lib/plans'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: artifactId } = await params
  const supabase = await createServerSideClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // Verify artifact belongs to this museum
  const { data: artifact } = await supabase
    .from('artifacts')
    .select('id')
    .eq('id', artifactId)
    .eq('museum_id', museum.id)
    .maybeSingle()

  if (!artifact) return NextResponse.json({ error: 'Artifact not found' }, { status: 404 })

  // Check image count against plan limit
  const limit = getPlan(museum.plan).imagesPerArtifact
  const { count } = await supabase
    .from('artifact_images')
    .select('id', { count: 'exact', head: true })
    .eq('artifact_id', artifactId)

  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: 'Image limit reached for your plan' }, { status: 403 })
  }

  // Insert the image record
  const body = await request.json()
  const { url, is_primary, sort_order, caption } = body

  const { data: newImage, error } = await supabase
    .from('artifact_images')
    .insert({
      artifact_id: artifactId,
      museum_id: museum.id,
      url,
      is_primary: is_primary ?? false,
      sort_order: sort_order ?? 0,
      ...(caption ? { caption } : {}),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If primary, update artifacts.image_url
  if (is_primary) {
    await supabase.from('artifacts').update({ image_url: url }).eq('id', artifactId)
  }

  return NextResponse.json(newImage)
}
