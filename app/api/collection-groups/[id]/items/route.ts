import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { parseBody, groupItemsSchema } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import type { SupabaseClient } from '@supabase/supabase-js'

async function resolveMuseum(supabase: SupabaseClient, userId: string) {
  const { data: owned } = await supabase
    .from('museums').select('id, plan').eq('owner_id', userId).maybeSingle()
  if (owned) return owned

  const { data: staff } = await supabase
    .from('staff_members').select('museum_id, access')
    .eq('user_id', userId).in('access', ['Admin', 'Editor']).maybeSingle()
  if (!staff) return null

  const { data: museum } = await supabase
    .from('museums').select('id, plan').eq('id', staff.museum_id).maybeSingle()
  return museum ?? null
}

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('collection_group_items')
    .select('*')
    .eq('group_id', id)
    .eq('museum_id', museum.id)
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * Membership edits.
 *
 * `add` / `remove` are the manual membership on a manual set, and pins /
 * un-pins on a rule set. `exclude` writes the private override that removes a
 * rule match. `order` rewrites sort_order. `notes` sets per-item captions.
 */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: group } = await supabase
    .from('collection_groups')
    .select('id')
    .eq('id', id)
    .eq('museum_id', museum.id)
    .maybeSingle()
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(groupItemsSchema, raw)
  if (!parsed.success) return parsed.response
  const { add = [], remove = [], exclude = [], order, notes } = parsed.data

  // Every object referenced must belong to this museum. Without this check a
  // valid session could staple another collection's object into its own set.
  const referenced = Array.from(new Set([...add, ...exclude, ...(order ?? []), ...Object.keys(notes ?? {})]))
  if (referenced.length > 0) {
    const { data: owned } = await supabase
      .from('objects')
      .select('id')
      .eq('museum_id', museum.id)
      .in('id', referenced)
    const ownedIds = new Set((owned ?? []).map((o: { id: string }) => o.id))
    const stranger = referenced.find(objectId => !ownedIds.has(objectId))
    if (stranger) return NextResponse.json({ error: 'Unknown object' }, { status: 400 })
  }

  if (remove.length > 0) {
    const { error } = await supabase
      .from('collection_group_items')
      .delete()
      .eq('group_id', id)
      .eq('museum_id', museum.id)
      .in('object_id', remove)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const upserts = [
    ...add.map(objectId => ({ group_id: id, museum_id: museum.id, object_id: objectId, role: 'include' })),
    ...exclude.map(objectId => ({ group_id: id, museum_id: museum.id, object_id: objectId, role: 'exclude' })),
  ]
  if (upserts.length > 0) {
    const { error } = await supabase
      .from('collection_group_items')
      .upsert(upserts, { onConflict: 'group_id,object_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (order) {
    for (const [index, objectId] of order.entries()) {
      const { error } = await supabase
        .from('collection_group_items')
        .update({ sort_order: index })
        .eq('group_id', id)
        .eq('museum_id', museum.id)
        .eq('object_id', objectId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  if (notes) {
    for (const [objectId, note] of Object.entries(notes)) {
      const { error } = await supabase
        .from('collection_group_items')
        .update({ note: note || null })
        .eq('group_id', id)
        .eq('museum_id', museum.id)
        .eq('object_id', objectId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from('collection_group_items')
    .select('*')
    .eq('group_id', id)
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
