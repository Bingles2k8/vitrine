import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { parseBody, objectComponentSchema } from '@/lib/validations'

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: objectId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('object_components')
    .select('*')
    .eq('parent_object_id', objectId)
    .eq('museum_id', museum.id)
    .order('component_number', { ascending: true })

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
    .select('id, accession_no')
    .eq('id', objectId)
    .eq('museum_id', museum.id)
    .maybeSingle()
  if (!object) return NextResponse.json({ error: 'Object not found' }, { status: 404 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(objectComponentSchema, raw)
  if (!parsed.success) return parsed.response
  const { title, notes, part_number_label } = parsed.data

  // Get next component number
  const { data: existing } = await supabase
    .from('object_components')
    .select('component_number')
    .eq('parent_object_id', objectId)
    .order('component_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const componentNumber = existing ? existing.component_number + 1 : 1
  const componentAccessionNo = object.accession_no
    ? `${object.accession_no}.${componentNumber}`
    : null

  const { data, error } = await supabase
    .from('object_components')
    .insert({
      museum_id: museum.id,
      parent_object_id: objectId,
      component_number: componentNumber,
      component_accession_no: componentAccessionNo,
      part_number_label: part_number_label || null,
      title: title || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
