import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { cancelSubscription } from '@/lib/billing/cancel'
import { renderCancellationEmail } from '@/lib/billing/cancellationEmail'
import { sendComplianceEmail } from '@/lib/email/send'

/**
 * Self-serve cancellation.
 *
 * Reachable in two clicks from the dashboard: "Plan & Billing" in the sidebar,
 * then "Cancel subscription". No survey, no save offer, no second confirmation
 * beyond the one dialogue on the plan page.
 *
 * The confirmation email is sent inline rather than queued, so the statutory
 * one-hour deadline is met by construction. It is deliberately not awaited in a
 * way that can fail the cancellation: if the email fails the cancellation still
 * stands, because refusing to cancel because we could not send a receipt would
 * be the worse outcome.
 */

const bodySchema = z.object({
  mode: z.enum(['period_end', 'immediate']).default('period_end'),
})

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  let mode: 'period_end' | 'immediate' = 'period_end'
  try {
    const parsed = bodySchema.safeParse(await request.json())
    if (parsed.success) mode = parsed.data.mode
  } catch {
    // No body is fine; period end is the default and the safest reading of a
    // bare cancel request.
  }

  // Owner-only, matching the checkout and portal routes. Staff, including
  // Admins, cannot cancel the contract. See the note in the DMCCA plan about
  // institutions whose owner has left.
  const { data: museum } = await supabase
    .from('museums')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!museum) {
    return NextResponse.json(
      { error: 'Only the account owner can cancel this subscription' },
      { status: 403 }
    )
  }

  const result = await cancelSubscription({
    museumId: museum.id,
    mode,
    initiatedBy: 'self_serve',
    actorUserId: user.id,
    actorEmail: user.email ?? null,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  if (result.customerEmail) {
    const { subject, html } = renderCancellationEmail({
      museumName: result.museumName,
      effectiveAt: result.effectiveAt,
      mode: result.mode,
      retentionDays: result.retentionDays,
      refundAmount: result.refundAmount,
      currency: result.currency,
      initiatedBy: 'self_serve',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com',
    })
    const sent = await sendComplianceEmail({ to: result.customerEmail, subject, html })
    if (sent.error) {
      console.error('[subscription/cancel] confirmation email failed:', sent.error)
    }
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    effectiveAt: result.effectiveAt,
    refundAmount: result.refundAmount,
    currency: result.currency,
    retentionDays: result.retentionDays,
  })
}
