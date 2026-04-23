import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { parseBody, shareLinkUnlockSchema } from '@/lib/validations'
import { verifyPasscode } from '@/lib/share-link-crypto'

// Public unlock endpoint. Service-role reads the link row so we can verify
// passcodes without leaking existence through RLS. Rate-limited per-link so
// a guesser can't blanket-attack every link from one IP.

export const dynamic = 'force-dynamic'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const limited = await rateLimit(apiLimiter, `share-unlock:${id}`)
  if (limited) return limited

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = parseBody(shareLinkUnlockSchema, body)
  if (!parsed.success) return parsed.response

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: link } = await service
    .from('object_share_links')
    .select('id, museum_id, scope_filter, passcode_hash, passcode_salt, expires_at, max_views, view_count, revoked_at')
    .eq('id', id)
    .maybeSingle()

  if (!link || link.revoked_at) return NextResponse.json({ error: 'Gone' }, { status: 410 })
  if (link.expires_at && new Date(link.expires_at) < new Date()) return NextResponse.json({ error: 'Expired' }, { status: 410 })
  if (link.max_views !== null && link.view_count >= link.max_views) return NextResponse.json({ error: 'View limit reached' }, { status: 410 })

  const ok = await verifyPasscode(parsed.data.passcode, link.passcode_hash, link.passcode_salt)
  if (!ok) return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })

  const filter = (link.scope_filter ?? {}) as { ids?: string[]; status?: string[] }
  let query = service
    .from('objects')
    .select('id, title, emoji, image_url, medium, year, production_date, description, status, accession_no')
    .eq('museum_id', link.museum_id)
    .is('deleted_at', null)
    .limit(500)
  if (Array.isArray(filter.ids) && filter.ids.length > 0) query = query.in('id', filter.ids)
  if (Array.isArray(filter.status) && filter.status.length > 0) query = query.in('status', filter.status)

  const { data: objects, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service
    .from('object_share_links')
    .update({ view_count: link.view_count + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', id)

  const { data: museum } = await service.from('museums').select('name, logo_emoji').eq('id', link.museum_id).maybeSingle()

  return NextResponse.json({ objects: objects ?? [], museum })
}
