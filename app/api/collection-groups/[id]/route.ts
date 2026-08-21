import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { parseBody, updateCollectionGroupSchema } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { slugifyGroupTitle, uniqueGroupSlug } from '@/lib/collectionGroups'
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

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(updateCollectionGroupSchema, raw)
  if (!parsed.success) return parsed.response
  const body = parsed.data

  const { data: current } = await supabase
    .from('collection_groups')
    .select('id, slug, title')
    .eq('id', id)
    .eq('museum_id', museum.id)
    .maybeSingle()
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = {}
  for (const key of [
    'subtitle', 'description', 'cover_image_url', 'cover_object_id', 'status',
    'membership', 'sort_by', 'nav_style', 'show_as_section', 'show_as_chip',
    'display_order', 'date_start', 'date_end',
  ] as const) {
    if (body[key] !== undefined) update[key] = body[key] === '' ? null : body[key]
  }
  if (body.rule !== undefined) update.rule = body.rule

  // A retitled set keeps its slug: the old URL may already be linked or
  // indexed, and silently moving it would break those links. Slug only
  // regenerates for a set that has never been published under a real title.
  if (body.title !== undefined) {
    update.title = body.title.trim()
    if (current.slug === 'set' || current.slug.startsWith('untitled')) {
      const { data: siblings } = await supabase
        .from('collection_groups').select('slug').eq('museum_id', museum.id).neq('id', id)
      update.slug = uniqueGroupSlug(
        slugifyGroupTitle(body.title),
        (siblings ?? []).map((g: { slug: string }) => g.slug),
      )
    }
  }

  const { data, error } = await supabase
    .from('collection_groups')
    .update(update)
    .eq('id', id)
    .eq('museum_id', museum.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Membership rows cascade. Objects are never touched — deleting a set must
  // never look like deleting what is in it.
  const { error } = await supabase
    .from('collection_groups')
    .delete()
    .eq('id', id)
    .eq('museum_id', museum.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
