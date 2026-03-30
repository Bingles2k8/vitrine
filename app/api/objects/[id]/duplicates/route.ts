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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: objectId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch all duplicates for this object (stored bidirectionally — get where object_id = this)
  const { data, error } = await supabase
    .from('object_duplicates')
    .select('id, duplicate_of_id, objects!object_duplicates_duplicate_of_id_fkey(id, title, emoji, year, medium)')
    .eq('object_id', objectId)
    .eq('museum_id', museum.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: objectId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { duplicate_of_id } = body

  if (!duplicate_of_id) return NextResponse.json({ error: 'duplicate_of_id is required' }, { status: 400 })
  if (duplicate_of_id === objectId) return NextResponse.json({ error: 'Cannot link an object to itself' }, { status: 400 })

  // Verify both objects belong to this museum
  const { data: objects } = await supabase
    .from('objects').select('id').eq('museum_id', museum.id).in('id', [objectId, duplicate_of_id])
  if (!objects || objects.length < 2) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

  // Insert both directions (upsert to handle duplicates gracefully)
  const { error } = await supabase.from('object_duplicates').upsert([
    { museum_id: museum.id, object_id: objectId, duplicate_of_id },
    { museum_id: museum.id, object_id: duplicate_of_id, duplicate_of_id: objectId },
  ], { onConflict: 'object_id,duplicate_of_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
