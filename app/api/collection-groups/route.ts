import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { parseBody, collectionGroupSchema, reorderGroupsSchema } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { slugifyGroupTitle, uniqueGroupSlug } from '@/lib/collectionGroups'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sets are available on every tier, unlimited (decision D2) — there is
 * deliberately no plan check in this file.
 */

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

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('collection_groups')
    .select('*')
    .eq('museum_id', museum.id)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(collectionGroupSchema, raw)
  if (!parsed.success) return parsed.response
  const body = parsed.data

  // Slug is derived, then made unique within the museum. Uniqueness is also a
  // DB constraint; this just avoids handing the user a 500 for a duplicate title.
  const { data: existing } = await supabase
    .from('collection_groups').select('slug').eq('museum_id', museum.id)
  const slug = uniqueGroupSlug(
    slugifyGroupTitle(body.title),
    (existing ?? []).map((g: { slug: string }) => g.slug),
  )

  const { data, error } = await supabase
    .from('collection_groups')
    .insert({
      museum_id: museum.id,
      slug,
      title: body.title.trim(),
      subtitle: body.subtitle || null,
      description: body.description || null,
      cover_image_url: body.cover_image_url || null,
      cover_object_id: body.cover_object_id || null,
      status: body.status ?? 'draft',
      membership: body.membership ?? 'manual',
      rule: body.rule ?? {},
      sort_by: body.sort_by ?? 'manual',
      nav_style: body.nav_style ?? 'grid',
      show_as_section: body.show_as_section ?? true,
      show_as_chip: body.show_as_chip ?? false,
      display_order: body.display_order ?? null,
      date_start: body.date_start || null,
      date_end: body.date_end || null,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

/** Reorder — the array position becomes display_order. */
export async function PATCH(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(reorderGroupsSchema, raw)
  if (!parsed.success) return parsed.response

  for (const [index, id] of parsed.data.ids.entries()) {
    const { error } = await supabase
      .from('collection_groups')
      .update({ display_order: index })
      .eq('id', id)
      .eq('museum_id', museum.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
