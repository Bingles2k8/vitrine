/**
 * Reconcile a Stripe refund against what we recorded when we issued it.
 *
 * Called from the charge.refunded webhook. Three outcomes:
 *
 *  - amounts agree: write a 'confirmed' row and we are done;
 *  - amounts disagree: write a 'mismatch' row and shout, because that means
 *    the money that left is not the money we intended to send;
 *  - we have no record of issuing it: also a 'mismatch', because a refund we
 *    did not initiate appearing on a subscription is worth knowing about. It
 *    is the expected case for a refund issued by hand from the dashboard, which
 *    is how the first live one is meant to happen.
 *
 * Nothing here updates a row. The refunds table is append-only, so the history
 * is issued-then-confirmed rather than a single mutable record.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export async function reconcileSubscriptionRefund(
  supabase: SupabaseClient,
  charge: Stripe.Charge
): Promise<void> {
  // Ticketing charges go through Connect and are handled separately. A
  // subscription charge has no on_behalf_of.
  if (charge.on_behalf_of) return

  const refunds = charge.refunds?.data ?? []
  if (refunds.length === 0) return

  for (const refund of refunds) {
    // Have we already confirmed this one? The webhook can be replayed, and each
    // replay carries the full refund list, so without this every retry would
    // add another row.
    const { data: seen } = await supabase
      .from('refunds')
      .select('id')
      .eq('stripe_refund_id', refund.id)
      .eq('event', 'confirmed')
      .limit(1)
    if ((seen?.length ?? 0) > 0) continue

    const { data: issued } = await supabase
      .from('refunds')
      .select('museum_id, stripe_subscription_id, amount, currency, reason, refund_mode')
      .eq('stripe_refund_id', refund.id)
      .eq('event', 'issued')
      .maybeSingle()

    if (!issued) {
      // Not one of ours. Try to attribute it to a museum through the charge's
      // customer so the record is still useful, then flag it.
      const museumId = await museumForCharge(supabase, charge)
      if (!museumId) continue

      await supabase.from('refunds').insert({
        museum_id: museumId,
        event: 'mismatch',
        stripe_refund_id: refund.id,
        stripe_charge_id: charge.id,
        amount: refund.amount,
        currency: refund.currency,
        reason: 'support',
        error: 'Refund observed that this system did not issue, possibly made by hand in Stripe',
      })
      console.warn(`[reconcileRefund] refund ${refund.id} was not issued by this system`)
      continue
    }

    const agrees = issued.amount === refund.amount && issued.currency === refund.currency

    await supabase.from('refunds').insert({
      museum_id: issued.museum_id,
      stripe_subscription_id: issued.stripe_subscription_id,
      event: agrees ? 'confirmed' : 'mismatch',
      stripe_refund_id: refund.id,
      stripe_charge_id: charge.id,
      amount: refund.amount,
      currency: refund.currency,
      reason: issued.reason,
      refund_mode: issued.refund_mode,
      error: agrees
        ? null
        : `Issued ${issued.amount} ${issued.currency} but Stripe refunded ${refund.amount} ${refund.currency}`,
    })

    if (!agrees) {
      console.error(
        `[reconcileRefund] MISMATCH on ${refund.id}: issued ${issued.amount} ${issued.currency}, Stripe refunded ${refund.amount} ${refund.currency}`
      )
    }
  }
}

/** Best effort attribution of a charge to a museum, via the Stripe customer. */
async function museumForCharge(
  supabase: SupabaseClient,
  charge: Stripe.Charge
): Promise<string | null> {
  const customerId =
    typeof charge.customer === 'string' ? charge.customer : (charge.customer?.id ?? null)
  if (!customerId) return null

  const { data } = await supabase
    .from('museums')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  return data?.id ?? null
}
