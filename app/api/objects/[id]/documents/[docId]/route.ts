import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id: objectId, docId } = await params
  const supabase = await createServerSideClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve museum (owner or Admin/Editor staff)
  let museum: any = null
  const { data: owned } = await supabase
    .from('museums')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (owned) {
    museum = owned
  } else {
    const { data: staff } = await supabase
      .from('staff_members')
      .select('museum_id')
      .eq('user_id', user.id)
      .in('access', ['Admin', 'Editor'])
      .maybeSingle()
    if (staff) museum = { id: staff.museum_id }
  }

  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Soft-delete — verify it belongs to this museum and object
  const { error } = await supabase
    .from('object_documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', docId)
    .eq('object_id', objectId)
    .eq('museum_id', museum.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
