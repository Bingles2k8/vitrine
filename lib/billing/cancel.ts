/**
 * Subscription cancellation.
 *
 * One code path, used by both the customer-facing flow and the support action
 * in /admin. That is a DMCCA requirement rather than a tidiness preference: a
 * cancellation received by email must be honoured with the same timestamp
 * semantics as one made through the product, so the two cannot be allowed to
 * drift apart into separate implementations.
 *
 * The caller decides who initiated it. Everything else, including the evidence
 * row, happens here.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import {
  coolingOffRefundAmount,
  isWithinCoolingOff,
} from './coolingOff'
import { issueCoolingOffRefund } from './refund'

export type CancelInitiator = 'self_serve' | 'support' | 'stripe_portal'

/**
 * 'period_end' leaves service running until the customer has had what they
 * paid for. 'immediate' ends it now and is only offered inside a cooling-off
 * window, where a refund is due.
 */
export type CancelMode = 'period_end' | 'immediate'

export type CancelResult =
  | {
      ok: true
      mode: CancelMode
      /** When service actually ends. */
      effectiveAt: string
      coolingOffActive: boolean
      /** Smallest currency unit. Zero when no refund is due. */
      refundAmount: number
      currency: string | null
      customerEmail: string | null
      museumName: string | null
      /** Days the collection is retained after service ends. */
      retentionDays: number
    }
  | { ok: false; error: string; status: number }

function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cancel a museum's subscription.
 *
 * Note on division of labour: this function talks to Stripe and writes the
 * evidence row. It deliberately does NOT update `museums.plan` or the lockout
 * columns. Those remain the webhook's job, so that a cancellation made in
 * Stripe's own portal and one made here converge on identical state rather
 * than racing to write it twice.
 */
export async function cancelSubscription(args: {
  museumId: string
  mode: CancelMode
  initiatedBy: CancelInitiator
  actorUserId?: string | null
  actorEmail?: string | null
  note?: string | null
  supabase?: SupabaseClient
  now?: Date
}): Promise<CancelResult> {
  const supabase = args.supabase ?? serviceClient()
  const now = args.now ?? new Date()

  const { data: museum } = await supabase
    .from('museums')
    .select('id, name, stripe_subscription_id, contact_email, owner_id, ever_paid')
    .eq('id', args.museumId)
    .maybeSingle()

  if (!museum) {
    return { ok: false, error: 'Museum not found', status: 404 }
  }
  if (!museum.stripe_subscription_id) {
    return { ok: false, error: 'No active subscription to cancel', status: 400 }
  }

  // The contracting party is the account owner, not the museum's public
  // contact address, so the confirmation goes to the auth user. Same lookup
  // the lockout and deletion-warning emails use. contact_email is only a
  // fallback for an account whose auth record cannot be read.
  const customerEmail = await resolveOwnerEmail(supabase, museum.owner_id, museum.contact_email)

  // The mirror table carries the cooling-off window and the charged amount.
  // It may be absent for a subscription created before the mirror existed, in
  // which case we fall back to Stripe as the source of truth.
  const { data: mirror } = await supabase
    .from('subscriptions')
    .select(
      'cooling_off_started_at, cooling_off_ends_at, unit_amount, currency, current_period_start, current_period_end'
    )
    .eq('stripe_subscription_id', museum.stripe_subscription_id)
    .maybeSingle()

  const coolingOffActive = isWithinCoolingOff(
    mirror?.cooling_off_started_at && mirror?.cooling_off_ends_at
      ? { startsAt: mirror.cooling_off_started_at, endsAt: mirror.cooling_off_ends_at }
      : null,
    now
  )

  // Immediate cancellation is only meaningful inside the window. Outside it,
  // ending service early would take away time already paid for, so we refuse
  // rather than silently downgrading to period end.
  if (args.mode === 'immediate' && !coolingOffActive) {
    return {
      ok: false,
      error: 'Immediate cancellation is only available during the cooling-off period',
      status: 400,
    }
  }

  let refundAmount = 0
  if (
    args.mode === 'immediate' &&
    mirror?.unit_amount &&
    mirror.current_period_start &&
    mirror.current_period_end
  ) {
    refundAmount = coolingOffRefundAmount({
      unitAmount: mirror.unit_amount,
      periodStart: mirror.current_period_start,
      periodEnd: mirror.current_period_end,
      cancelledAt: now,
    })
  }

  // Idempotency key derived from the subscription, the mode and the day, so a
  // double-clicked button or a retried support action cannot cancel twice.
  const idempotencyKey = `cancel:${museum.stripe_subscription_id}:${args.mode}:${now.toISOString().slice(0, 10)}`

  let effectiveAt: string
  try {
    if (args.mode === 'immediate') {
      const cancelled = await stripe.subscriptions.cancel(museum.stripe_subscription_id, {
        // The refund is issued separately and explicitly in phase 4, so that
        // it is recorded and reconciled rather than left to Stripe's proration.
        prorate: false,
      })
      effectiveAt = new Date((cancelled.ended_at ?? Math.floor(now.getTime() / 1000)) * 1000).toISOString()
    } else {
      const updated = await stripe.subscriptions.update(
        museum.stripe_subscription_id,
        { cancel_at_period_end: true },
        { idempotencyKey }
      )
      const end = updated.cancel_at ?? updated.items?.data[0]?.current_period_end
      effectiveAt = end
        ? new Date(end * 1000).toISOString()
        : (mirror?.current_period_end ?? now.toISOString())
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await writeEvent(supabase, {
      museum_id: museum.id,
      stripe_subscription_id: museum.stripe_subscription_id,
      event: 'failed',
      initiated_by: args.initiatedBy,
      actor_user_id: args.actorUserId ?? null,
      actor_email: args.actorEmail ?? null,
      customer_email: customerEmail,
      cooling_off_active: coolingOffActive,
      note: `Stripe rejected the cancellation: ${message}`,
    })
    return { ok: false, error: 'Could not cancel the subscription', status: 502 }
  }

  // Issue the refund for a cooling-off cancellation. Deliberately after the
  // Stripe cancellation and before the evidence row, so that a refund failure
  // is visible in the same row as the cancellation rather than lost.
  //
  // A failure here does not undo the cancellation. The customer asked to leave
  // and has left; the money is then a support matter with a recorded trail,
  // which is a far better outcome than refusing to cancel them.
  let refundIssued = 0
  if (args.mode === 'immediate' && refundAmount > 0 && mirror?.cooling_off_started_at) {
    const refund = await issueCoolingOffRefund({
      supabase,
      museumId: museum.id,
      stripeSubscriptionId: museum.stripe_subscription_id,
      amount: refundAmount,
      coolingOffStartedAt: mirror.cooling_off_started_at,
    })
    if (refund.ok) {
      refundIssued = refund.amount
    } else {
      console.error(`[cancelSubscription] refund failed for ${museum.id}: ${refund.error}`)
    }
  }

  await writeEvent(supabase, {
    museum_id: museum.id,
    stripe_subscription_id: museum.stripe_subscription_id,
    event: args.mode === 'immediate' ? 'cancelled_immediately' : 'scheduled_at_period_end',
    initiated_by: args.initiatedBy,
    actor_user_id: args.actorUserId ?? null,
    actor_email: args.actorEmail ?? null,
    customer_email: customerEmail,
    effective_at: effectiveAt,
    cooling_off_active: coolingOffActive,
    refund_amount: refundIssued || null,
    currency: mirror?.currency ?? null,
    note: args.note ?? null,
  })

  return {
    ok: true,
    mode: args.mode,
    effectiveAt,
    coolingOffActive,
    refundAmount: refundIssued,
    currency: mirror?.currency ?? null,
    customerEmail,
    museumName: museum.name ?? null,
    retentionDays: museum.ever_paid ? 180 : 30,
  }
}

/**
 * The account owner's email, which is the address the contract is with.
 *
 * Falls back to the museum's public contact address only if the auth record
 * cannot be read, since a confirmation reaching the wrong inbox is better than
 * one reaching none.
 */
async function resolveOwnerEmail(
  supabase: SupabaseClient,
  ownerId: string | null,
  fallback: string | null
): Promise<string | null> {
  if (!ownerId) return fallback ?? null
  try {
    const { data } = await supabase.auth.admin.getUserById(ownerId)
    return data?.user?.email ?? fallback ?? null
  } catch {
    return fallback ?? null
  }
}

/**
 * Write to the append-only evidence table.
 *
 * Never throws. Losing the audit row is bad, but failing the customer's
 * cancellation because we could not write a log line would be worse, and would
 * itself be the compliance failure. A failed insert is surfaced in the server
 * log for follow-up.
 */
async function writeEvent(
  supabase: SupabaseClient,
  row: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('cancellation_events').insert(row)
  if (error) {
    console.error('[cancelSubscription] failed to write cancellation_events:', error.message)
  }
}
