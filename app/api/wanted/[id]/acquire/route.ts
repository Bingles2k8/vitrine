import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getPlan } from '@/lib/plans'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase
    .from('museums').select('id, plan, owner_id').eq('owner_id', userId).maybeSingle()
  if (owned) return owned

  const { data: staff } = await supabase
    .from('staff_members').select('museum_id, access')
    .eq('user_id', userId).in('access', ['Admin', 'Editor']).maybeSingle()
  if (!staff) return null

  const { data: museum } = await supabase
    .from('museums').select('id, plan, owner_id').eq('id', staff.museum_id).maybeSingle()
  return museum ?? null
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!getPlan(museum.plan).wishlist) return NextResponse.json({ error: 'Not available on this plan' }, { status: 403 })

  // Load the wanted item
  const { data: item } = await supabase
    .from('wanted_items').select('*').eq('id', id).eq('museum_id', museum.id).maybeSingle()
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  if (item.acquired_at) return NextResponse.json({ error: 'Already acquired' }, { status: 409 })

  // Check plan object limit before creating
  const planInfo = getPlan(museum.plan)
  if (planInfo.objects !== null) {
    const { count } = await supabase
      .from('objects')
      .select('*', { count: 'exact', head: true })
      .eq('museum_id', museum.id)
      .is('deleted_at', null)
    if ((count ?? 0) >= planInfo.objects) {
      return NextResponse.json(
        { error: `Your ${planInfo.label} plan allows up to ${planInfo.objects.toLocaleString()} objects. Upgrade your plan or delete existing objects to acquire this item.` },
        { status: 403 }
      )
    }
  }

  // Create a new object pre-populated from the wanted item
  const { data: newObject, error: objError } = await supabase
    .from('objects')
    .insert({
      museum_id: museum.id,
      owner_id: museum.owner_id,
      created_by: user.id,
      updated_by: user.id,
      title: item.title,
      year: item.year || null,
      medium: item.medium || null,
      description: item.notes || null,
      status: 'Entry',
      show_on_site: false,
      emoji: '🖼️',
    })
    .select('id').single()

  if (objError) return NextResponse.json({ error: objError.message }, { status: 500 })

  // Archive the wanted item
  const { error: updateError } = await supabase
    .from('wanted_items')
    .update({ acquired_at: new Date().toISOString(), converted_object_id: newObject.id })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ objectId: newObject.id }, { status: 201 })
}
