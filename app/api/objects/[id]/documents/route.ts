import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getPlan } from '@/lib/plans'
import { documentUploadSchema, parseBody } from '@/lib/validations'

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

  const rawBody = await request.json()
  const parsed = parseBody(documentUploadSchema, rawBody)
  if (!parsed.success) return parsed.response
  const { related_to_type, related_to_id, label, document_type, file_url, file_name, file_size, mime_type } = parsed.data

  const limitMb = getPlan(museum.plan).documentStorageMb
  const limitBytes = limitMb !== null ? limitMb * 1024 * 1024 : null

  // Quota check + insert run atomically inside a Postgres function that
  // locks the museum row (FOR UPDATE), preventing concurrent uploads from
  // both passing the quota check and together exceeding the limit.
  const { data: doc, error } = await supabase.rpc('insert_document_if_quota_ok', {
    p_museum_id:       museum.id,
    p_object_id:       objectId,
    p_uploaded_by:     user.id,
    p_related_to_type: related_to_type,
    p_related_to_id:   related_to_id ?? null,
    p_label:           label,
    p_document_type:   document_type ?? null,
    p_file_url:        file_url,
    p_file_name:       file_name,
    p_file_size:       file_size ?? null,
    p_mime_type:       mime_type ?? null,
    p_limit_bytes:     limitBytes,
  })

  if (error) {
    if (error.message.includes('storage_limit_exceeded')) {
      return NextResponse.json({ error: 'Storage limit reached for your plan' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(doc)
}
