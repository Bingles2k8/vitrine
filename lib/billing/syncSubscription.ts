/**
 * Mirror a Stripe subscription into our own `subscriptions` table.
 *
 * Stripe stays authoritative. This is a local copy so that:
 *
 *  - the nightly reconciliation has something to reconcile Stripe against, and
 *    a missed webhook becomes visible rather than silently becoming a missed
 *    statutory notice;
 *  - the cooling-off deadline can be rendered without recomputing it, and
 *    without an API call per page load;
 *  - the billing currency is recorded somewhere we control. It otherwise exists
 *    only in a browser cookie and inside Stripe, and a renewal notice has to
 *    state the amount in the currency the customer is actually charged.
 *
 * Called from the webhook on every subscription event, and from the nightly
 * reconciliation. Safe to call repeatedly with the same subscription.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { PRICE_TO_PLAN } from '@/lib/stripe'
import { coolingOffWindow } from './coolingOff'
import type { CoolingOffReason } from './config'

export type SyncResult = {
  /** True when this call created the row rather than updating it. */
  isNew: boolean
  coolingOffOpened: CoolingOffReason | null
}

export async function syncSubscriptionToMirror(args: {
  supabase: SupabaseClient
  museumId: string
  subscription: Stripe.Subscription
}): Promise<SyncResult> {
  const { supabase, museumId, subscription } = args

  const item = subscription.items.data[0]
  const price = item?.price
  const periodStart = item?.current_period_start ?? null
  const periodEnd = item?.current_period_end ?? null

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, current_period_start, trial_end, cooling_off_started_at, status')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  const reason = coolingOffReasonFor({
    existing,
    subscription,
    periodStart,
  })

  // Only reopen the window when something has actually happened to justify it.
  // Recomputing on every webhook would silently extend it, which would be a
  // gift to a customer and a mess in the evidence trail.
  const window_ =
    reason && periodStart
      ? coolingOffWindow(new Date(periodStart * 1000), reason)
      : null

  const row: Record<string, unknown> = {
    museum_id: museumId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id:
      typeof subscription.customer === 'string'
        ? subscription.customer
        : (subscription.customer?.id ?? ''),
    stripe_price_id: price?.id ?? null,
    plan: price?.id ? (PRICE_TO_PLAN[price.id] ?? null) : null,
    status: subscription.status,
    billing_interval: price?.recurring?.interval ?? null,
    billing_interval_count: price?.recurring?.interval_count ?? null,
    currency: subscription.currency ?? price?.currency ?? null,
    unit_amount: price?.unit_amount ?? null,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  if (window_) {
    row.cooling_off_started_at = window_.startsAt
    row.cooling_off_ends_at = window_.endsAt
    row.cooling_off_reason = window_.reason
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(row, { onConflict: 'stripe_subscription_id' })

  if (error) {
    console.error(`[syncSubscription] ${subscription.id}: ${error.message}`)
  }

  return { isNew: !existing, coolingOffOpened: window_?.reason ?? null }
}

/**
 * Which event, if any, opens a new cooling-off window.
 *
 * Three triggers, matching the policy in config.ts:
 *   - 'initial'          the subscription is new to us and already paying
 *   - 'trial_conversion' it was trialing and is now active
 *   - 'renewal'          the billing period has advanced
 *
 * Returns null for everything else, including a subscription that is still in
 * its trial. A trial has taken no money, so there is nothing to refund and no
 * window to open until it converts.
 */
function coolingOffReasonFor(args: {
  existing: { current_period_start: string | null; status: string | null } | null
  subscription: Stripe.Subscription
  periodStart: number | null
}): CoolingOffReason | null {
  const { existing, subscription, periodStart } = args

  if (subscription.status === 'trialing') return null
  if (subscription.status !== 'active') return null
  if (!periodStart) return null

  if (!existing) return 'initial'
  if (existing.status === 'trialing') return 'trial_conversion'

  const previousStart = existing.current_period_start
    ? new Date(existing.current_period_start).getTime()
    : null
  if (previousStart !== null && periodStart * 1000 > previousStart) return 'renewal'

  return null
}
