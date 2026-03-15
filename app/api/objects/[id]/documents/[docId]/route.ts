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

  // Fetch the document to get the storage path
  const { data: doc } = await supabase
    .from('object_documents')
    .select('id, file_url')
    .eq('id', docId)
    .eq('object_id', objectId)
    .eq('museum_id', museum.id)
    .maybeSingle()

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete from Supabase Storage
  const marker = '/object-documents/'
  const markerIdx = doc.file_url.indexOf(marker)
  if (markerIdx === -1) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
  }
  const storagePath = doc.file_url.slice(markerIdx + marker.length)
  if (!storagePath) {
    return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 })
  }
  await supabase.storage.from('object-documents').remove([storagePath])

  // Hard-delete the row
  const { error } = await supabase
    .from('object_documents')
    .delete()
    .eq('id', docId)
    .eq('object_id', objectId)
    .eq('museum_id', museum.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
