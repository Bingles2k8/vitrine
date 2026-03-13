import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getPlan } from '@/lib/plans'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase
    .from('museums')
    .select('id, plan')
    .eq('owner_id', userId)
    .maybeSingle()
  if (owned) return owned

  const { data: staff } = await supabase
    .from('staff_members')
    .select('museum_id, access')
    .eq('user_id', userId)
    .in('access', ['Admin', 'Editor'])
    .maybeSingle()
  if (!staff) return null

  const { data: museum } = await supabase
    .from('museums')
    .select('id, plan')
    .eq('id', staff.museum_id)
    .maybeSingle()
  return museum ?? null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: objectId } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const recordId = searchParams.get('recordId')

  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let q = supabase
    .from('object_documents')
    .select('*')
    .eq('object_id', objectId)
    .eq('museum_id', museum.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (type) q = q.eq('related_to_type', type)
  if (recordId) {
    q = q.eq('related_to_id', recordId)
  } else if (type) {
    q = q.is('related_to_id', null)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
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

  // Verify object belongs to this museum
  const { data: object } = await supabase
    .from('objects')
    .select('id')
    .eq('id', objectId)
    .eq('museum_id', museum.id)
    .maybeSingle()

  if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

  const body = await request.json()
  const { related_to_type, related_to_id, label, document_type, file_url, file_name, file_size, mime_type } = body

  if (!related_to_type || !label || !file_url || !file_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Enforce storage quota
  const limitMb = getPlan(museum.plan).documentStorageMb
  if (limitMb !== null) {
    const { data: usage } = await supabase
      .from('object_documents')
      .select('file_size.sum()')
      .eq('museum_id', museum.id)
      .is('deleted_at', null)
      .single()
    const usedBytes = (usage as any)?.sum ?? 0
    const limitBytes = limitMb * 1024 * 1024
    if (usedBytes + (file_size ?? 0) > limitBytes) {
      return NextResponse.json({ error: 'Storage limit reached for your plan' }, { status: 403 })
    }
  }

  const { data: doc, error } = await supabase
    .from('object_documents')
    .insert({
      object_id: objectId,
      museum_id: museum.id,
      uploaded_by: user.id,
      related_to_type,
      related_to_id: related_to_id ?? null,
      label,
      document_type: document_type ?? null,
      file_url,
      file_name,
      file_size: file_size ?? null,
      mime_type: mime_type ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(doc)
}
