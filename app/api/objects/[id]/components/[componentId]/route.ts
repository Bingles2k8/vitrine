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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  const { componentId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(objectComponentSchema, raw)
  if (!parsed.success) return parsed.response
  const { title, notes, part_number_label } = parsed.data

  const { data, error } = await supabase
    .from('object_components')
    .update({ title: title ?? null, notes: notes ?? null, part_number_label: part_number_label ?? null })
    .eq('id', componentId)
    .eq('museum_id', museum.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; componentId: string }> }
) {
  const { componentId } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('object_components')
    .delete()
    .eq('id', componentId)
    .eq('museum_id', museum.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
