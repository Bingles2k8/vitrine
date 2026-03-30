import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase
    .from('museums').select('id').eq('owner_id', userId).maybeSingle()
  if (owned) return owned

  const { data: staff } = await supabase
    .from('staff_members').select('museum_id, access')
    .eq('user_id', userId).in('access', ['Admin', 'Editor']).maybeSingle()
  if (!staff) return null

  return { id: staff.museum_id }
}

// DELETE /api/objects/[id]/duplicates/[duplicateId]
// duplicateId = the object_id of the other object in the pair
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; duplicateId: string }> }
) {
  const { id: objectId, duplicateId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Delete both directions
  const { error } = await supabase.from('object_duplicates').delete().eq('museum_id', museum.id).or(
    `and(object_id.eq.${objectId},duplicate_of_id.eq.${duplicateId}),and(object_id.eq.${duplicateId},duplicate_of_id.eq.${objectId})`
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
