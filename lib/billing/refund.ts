/**
 * Cooling-off refunds.
 *
 * The only code in Vitrine that moves money back to a customer, so it is
 * written defensively. Four guards, all deliberate:
 *
 *  1. A mandatory idempotency key derived from the charge and the cooling-off
 *     window, so a retry, a double-clicked button or a replayed webhook cannot
 *     refund twice. Stripe honours the key; the unique index on `refunds`
 *     backs it up at the database level.
 *  2. A hard ceiling checked against the original charge before calling
 *     Stripe. If the computed amount exceeds what was actually paid, we refuse
 *     rather than clamp, because that combination means something upstream is
 *     wrong and quietly capping it would hide the bug.
 *  3. A kill switch, off by default in production until a manual smoke test has
 *     been done. See REFUNDS_ENABLED.
 *  4. Every attempt is recorded, including failures. A refund that Stripe
 *     rejected is evidence too.
 *
 * There is no test-clock coverage of the live path, by agreement. These guards
 * are what stands in for it, so do not weaken them for convenience.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { COOLING_OFF_REFUND_MODE } from './config'

export type RefundResult =
  | { ok: true; refundId: string; amount: number; currency: string }
  | { ok: false; error: string; recorded: boolean }

/**
 * Whether the code is allowed to initiate a refund.
 *
 * Deliberately opt-in. The first live refund should be issued by hand from the
 * Stripe dashboard, with the reconciliation path observing it, before this is
 * switched on. Set REFUNDS_ENABLED=true in Vercel once that has been done.
 */
export function refundsEnabled(): boolean {
  return process.env.REFUNDS_ENABLED === 'true'
}

export async function issueCoolingOffRefund(args: {
  supabase: SupabaseClient
  museumId: string
  stripeSubscriptionId: string
  /** Smallest currency unit. Computed by coolingOffRefundAmount. */
  amount: number
  /** Identifies the window, so a refund for a later period gets a new key. */
  coolingOffStartedAt: string
  reason?: 'cooling_off' | 'goodwill' | 'support'
}): Promise<RefundResult> {
  const { supabase, museumId, stripeSubscriptionId, amount } = args
  const reason = args.reason ?? 'cooling_off'

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'Refund amount must be positive', recorded: false }
  }

  // Find the charge this refund is against: the latest paid invoice on the
  // subscription. Stripe is authoritative here rather than our mirror, because
  // getting the wrong charge would refund the wrong money.
  let charge: { id: string; amount: number; currency: string; paymentIntent: string | null }
  try {
    const invoices = await stripe.invoices.list({
      subscription: stripeSubscriptionId,
      status: 'paid',
      limit: 1,
      expand: ['data.payments'],
    })
    const invoice = invoices.data[0]

    // `invoice.charge` was removed in the Basil API version. The payment is now
    // reached through invoice.payments, which surfaces either a payment intent
    // or, for older charges without one, a charge directly.
    const chargeId = await resolveChargeId(invoice)
    if (!chargeId) {
      return { ok: false, error: 'No paid charge found to refund', recorded: false }
    }
    const full = await stripe.charges.retrieve(chargeId)
    charge = {
      id: full.id,
      amount: full.amount,
      currency: full.currency,
      paymentIntent:
        typeof full.payment_intent === 'string' ? full.payment_intent : (full.payment_intent?.id ?? null),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await record(supabase, {
      museum_id: museumId,
      stripe_subscription_id: stripeSubscriptionId,
      event: 'failed',
      amount,
      reason,
      refund_mode: COOLING_OFF_REFUND_MODE,
      error: `Could not resolve the charge: ${message}`,
    })
    return { ok: false, error: 'Could not resolve the charge to refund', recorded: true }
  }

  // Guard 2. Refuse rather than clamp: an over-large amount means the
  // computation is wrong, and silently capping it would hide that.
  const alreadyRefunded = await amountAlreadyRefunded(charge.id)
  if (amount + alreadyRefunded > charge.amount) {
    await record(supabase, {
      museum_id: museumId,
      stripe_subscription_id: stripeSubscriptionId,
      event: 'failed',
      stripe_charge_id: charge.id,
      amount,
      currency: charge.currency,
      reason,
      refund_mode: COOLING_OFF_REFUND_MODE,
      error: `Refusing to refund ${amount} on a charge of ${charge.amount} with ${alreadyRefunded} already refunded`,
    })
    return { ok: false, error: 'Refund would exceed the original charge', recorded: true }
  }

  // Guard 1. Same window plus same charge always yields the same key.
  const idempotencyKey = `coolingoff:${charge.id}:${args.coolingOffStartedAt}`

  if (!refundsEnabled()) {
    await record(supabase, {
      museum_id: museumId,
      stripe_subscription_id: stripeSubscriptionId,
      event: 'failed',
      stripe_charge_id: charge.id,
      amount,
      currency: charge.currency,
      reason,
      refund_mode: COOLING_OFF_REFUND_MODE,
      idempotency_key: idempotencyKey,
      error: 'REFUNDS_ENABLED is not set; refund not attempted',
    })
    return { ok: false, error: 'Refunds are not enabled', recorded: true }
  }

  try {
    const refund = await stripe.refunds.create(
      {
        charge: charge.id,
        amount,
        metadata: {
          museum_id: museumId,
          subscription: stripeSubscriptionId,
          reason,
        },
      },
      { idempotencyKey }
    )

    await record(supabase, {
      museum_id: museumId,
      stripe_subscription_id: stripeSubscriptionId,
      event: 'issued',
      stripe_refund_id: refund.id,
      stripe_charge_id: charge.id,
      stripe_payment_intent_id: charge.paymentIntent,
      amount: refund.amount,
      currency: refund.currency,
      reason,
      refund_mode: COOLING_OFF_REFUND_MODE,
      idempotency_key: idempotencyKey,
    })

    return { ok: true, refundId: refund.id, amount: refund.amount, currency: refund.currency }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await record(supabase, {
      museum_id: museumId,
      stripe_subscription_id: stripeSubscriptionId,
      event: 'failed',
      stripe_charge_id: charge.id,
      amount,
      currency: charge.currency,
      reason,
      refund_mode: COOLING_OFF_REFUND_MODE,
      idempotency_key: idempotencyKey,
      error: message,
    })
    return { ok: false, error: 'The refund could not be processed', recorded: true }
  }
}

/**
 * The charge behind a paid invoice, on the current API version.
 *
 * Prefers the payment intent, which is what Stripe surfaces for anything
 * finalised since 2019, and falls back to a directly attached charge.
 */
async function resolveChargeId(invoice: Stripe.Invoice | undefined): Promise<string | null> {
  const payment = invoice?.payments?.data?.[0]?.payment
  if (!payment) return null

  if (payment.charge) {
    return typeof payment.charge === 'string' ? payment.charge : payment.charge.id
  }

  if (payment.payment_intent) {
    const piId =
      typeof payment.payment_intent === 'string'
        ? payment.payment_intent
        : payment.payment_intent.id
    const pi = await stripe.paymentIntents.retrieve(piId)
    const latest = pi.latest_charge
    if (!latest) return null
    return typeof latest === 'string' ? latest : latest.id
  }

  return null
}

/** How much of this charge Stripe has already refunded. */
async function amountAlreadyRefunded(chargeId: string): Promise<number> {
  try {
    const charge = await stripe.charges.retrieve(chargeId)
    return charge.amount_refunded ?? 0
  } catch {
    // Fail safe: assume the whole charge is gone, so the ceiling check refuses.
    return Number.MAX_SAFE_INTEGER
  }
}

/**
 * Append a row to the refunds evidence table. Never throws.
 *
 * A refund that happened but was not recorded is far worse than one recorded
 * twice, so failures here are shouted about rather than swallowed quietly.
 */
async function record(supabase: SupabaseClient, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('refunds').insert(row)
  if (error) {
    console.error(`[refund] FAILED TO RECORD REFUND: ${error.message}`, row)
  }
}
