import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { communityLimitsSummary, retentionDays, tryDescribeOverage } from '@/lib/billing/downgrade'

/**
 * What would be over Community's limits if the subscription ended now, and
 * how long it would be kept before deletion. Shown in the cancel dialogue so
 * the owner sees exactly what is at risk before they confirm.
 *
 * Read-only. Owner only, like cancellation itself.
 */
export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const { data: museum } = await supabase
    .from('museums')
    .select('id, ever_paid')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })

  const lines = await tryDescribeOverage(
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!),
    museum.id
  )

  return NextResponse.json({
    // Null when it could not be measured: the dialogue falls back to `limits`.
    lines: lines ?? null,
    limits: communityLimitsSummary(),
    // A museum still on its trial has never paid, so gets the shorter window.
    retentionDays: retentionDays(museum.ever_paid === true),
  })
}
