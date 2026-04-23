import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { parseBody, shareLinkCreateSchema } from '@/lib/validations'
import { getPlan } from '@/lib/plans'
import { hashPasscode } from '@/lib/share-link-crypto'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase.from('museums').select('id, plan').eq('owner_id', userId).maybeSingle()
  if (owned) return { museumId: owned.id as string, plan: owned.plan as string, canEdit: true }
  const { data: staff } = await supabase
    .from('staff_members')
    .select('museum_id, access, museums(plan)')
    .eq('user_id', userId)
    .maybeSingle()
  if (!staff) return null
  const plan = (staff.museums as any)?.plan ?? 'community'
  return { museumId: staff.museum_id as string, plan, canEdit: staff.access === 'Admin' || staff.access === 'Editor' }
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const resolved = await resolveMuseum(supabase, user.id)
  if (!resolved || !resolved.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const planInfo = getPlan(resolved.plan)
  if (planInfo.shareLinks === 0) {
    return NextResponse.json({ error: 'Share links are not available on your plan.' }, { status: 403 })
  }

  if (planInfo.shareLinks !== null) {
    const { count } = await supabase
      .from('object_share_links')
      .select('*', { count: 'exact', head: true })
      .eq('museum_id', resolved.museumId)
      .is('revoked_at', null)
    if ((count ?? 0) >= planInfo.shareLinks) {
      return NextResponse.json({
        error: `Your ${planInfo.label} plan allows ${planInfo.shareLinks} active share link${planInfo.shareLinks === 1 ? '' : 's'}. Revoke one or upgrade to add more.`,
        code: 'share_link_limit_exceeded',
      }, { status: 400 })
    }
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = parseBody(shareLinkCreateSchema, body)
  if (!parsed.success) return parsed.response

  const { hash, salt } = await hashPasscode(parsed.data.passcode)

  const { data, error } = await supabase.from('object_share_links').insert({
    museum_id: resolved.museumId,
    created_by: user.id,
    label: parsed.data.label || null,
    scope_filter: parsed.data.scope_filter ?? {},
    passcode_hash: hash,
    passcode_salt: salt,
    expires_at: parsed.data.expires_at || null,
    max_views: parsed.data.max_views || null,
  }).select('id, label, scope_filter, expires_at, max_views, view_count, created_at').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ link: data })
}

export async function GET(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = await resolveMuseum(supabase, user.id)
  if (!resolved) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('object_share_links')
    .select('id, label, scope_filter, expires_at, max_views, view_count, last_viewed_at, created_at, revoked_at')
    .eq('museum_id', resolved.museumId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ links: data ?? [] })
}
