import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase.from('museums').select('id').eq('owner_id', userId).maybeSingle()
  if (owned) return { museumId: owned.id as string, canEdit: true }
  const { data: staff } = await supabase.from('staff_members').select('museum_id, access').eq('user_id', userId).maybeSingle()
  if (!staff) return null
  return { museumId: staff.museum_id as string, canEdit: staff.access === 'Admin' || staff.access === 'Editor' }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = await resolveMuseum(supabase, user.id)
  if (!resolved || !resolved.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('object_share_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('museum_id', resolved.museumId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
