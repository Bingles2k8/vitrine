/**
 * Exercise the real refund code path against Stripe test mode.
 *
 * Run with: npm run test:refund
 *
 * This is the check that had to pass before REFUNDS_ENABLED was switched on in
 * production. It drives lib/billing/refund.ts itself, with an injected
 * test-mode client, rather than a reimplementation of it, so what is proven
 * here is the code that will actually run.
 *
 * Named .integration.ts rather than .test.ts so `npm test` does not pick it up.
 * That suite stays offline and fast; this one talks to Stripe and takes a
 * couple of minutes.
 *
 * The database is stubbed rather than written to, because there is no
 * non-production database. The evidence writes are plain inserts and are
 * asserted on the recorded rows here.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { issueCoolingOffRefund } from '@/lib/billing/refund'
import { coolingOffRefundAmount, coolingOffWindow } from '@/lib/billing/coolingOff'

const env = Object.fromEntries(
  readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const key = env.STRIPE_TEST_SECRET_KEY
const enabled = Boolean(key && key.startsWith('sk_test'))
const PROFESSIONAL = 'price_1TvOpdF1q447WCoNlsZYyV7K' // Composition sandbox, £79/month
const DAY = 86_400

const stripe = enabled ? new Stripe(key!) : (null as unknown as Stripe)

/** Minimal Supabase stand-in that records inserts so they can be asserted. */
function stubSupabase() {
  const rows: Record<string, unknown>[] = []
  return {
    rows,
    client: {
      from() {
        return {
          insert(row: Record<string, unknown>) {
            rows.push(row)
            return Promise.resolve({ error: null })
          },
        }
      },
    } as unknown as SupabaseClient,
  }
}

async function advanceTo(clockId: string, unix: number) {
  await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: unix })
  for (let i = 0; i < 90; i++) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId)
    if (clock.status === 'ready') return
    if (clock.status === 'internal_failure') throw new Error('test clock failed')
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('test clock did not become ready in time')
}

describe.runIf(enabled)('cooling-off refunds against Stripe test mode', () => {
  let clockId: string
  let subscriptionId: string
  let unitAmount: number
  let expectedRefund: number
  let windowStartsAt: string
  let chargeId: string
  let firstRefundId: string

  beforeAll(async () => {
    const start = Math.floor(Date.now() / 1000)

    const clock = await stripe.testHelpers.testClocks.create({
      frozen_time: start,
      name: 'vitrine-refund-check',
    })
    clockId = clock.id

    const customer = await stripe.customers.create({
      email: 'refund-test@vitrinecms.com',
      test_clock: clock.id,
    })
    const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: pm.id },
    })

    // No trial: we want a real charge immediately, so there is something to
    // refund.
    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PROFESSIONAL, quantity: 1 }],
      metadata: { museum_id: 'refund-test' },
    })
    subscriptionId = sub.id

    const item = sub.items.data[0]
    unitAmount = item.price.unit_amount!
    const periodStart = item.current_period_start
    const periodEnd = item.current_period_end
    windowStartsAt = coolingOffWindow(new Date(periodStart * 1000), 'initial').startsAt

    // Three days into the period, well inside the 14 day window.
    const cancelAt = periodStart + 3 * DAY
    await advanceTo(clock.id, cancelAt)

    expectedRefund = coolingOffRefundAmount({
      unitAmount,
      periodStart: new Date(periodStart * 1000),
      periodEnd: new Date(periodEnd * 1000),
      cancelledAt: new Date(cancelAt * 1000),
    })
  }, 300_000)

  afterAll(async () => {
    if (clockId) {
      await stripe.testHelpers.testClocks.del(clockId).catch(() => {})
    }
  })

  it('computes a partial refund that is neither nothing nor the whole charge', () => {
    expect(expectedRefund).toBeGreaterThan(0)
    expect(expectedRefund).toBeLessThan(unitAmount)
  })

  it('finds the charge and refunds exactly the computed amount', async () => {
    const db = stubSupabase()
    const result = await issueCoolingOffRefund({
      supabase: db.client,
      museumId: 'refund-test',
      stripeSubscriptionId: subscriptionId,
      amount: expectedRefund,
      coolingOffStartedAt: windowStartsAt,
      stripeClient: stripe,
      force: true,
    })

    expect(result.ok, result.ok ? '' : result.error).toBe(true)
    if (!result.ok) return

    expect(result.amount).toBe(expectedRefund)
    firstRefundId = result.refundId

    const issued = db.rows.find((r) => r.event === 'issued')
    expect(issued).toBeDefined()
    expect(issued!.idempotency_key).toBeTruthy()
    expect(issued!.refund_mode).toBe('pro_rata')
    chargeId = issued!.stripe_charge_id as string
  }, 120_000)

  it('does not refund twice when called again for the same window', async () => {
    // The failure that would actually cost money.
    const db = stubSupabase()
    const second = await issueCoolingOffRefund({
      supabase: db.client,
      museumId: 'refund-test',
      stripeSubscriptionId: subscriptionId,
      amount: expectedRefund,
      coolingOffStartedAt: windowStartsAt,
      stripeClient: stripe,
      force: true,
    })

    // Stripe replays the original refund for a repeated idempotency key, so a
    // success here is fine provided it is the same refund.
    if (second.ok) expect(second.refundId).toBe(firstRefundId)

    const charge = await stripe.charges.retrieve(chargeId)
    expect(charge.amount_refunded).toBe(expectedRefund)
  }, 120_000)

  it('refuses an over-large refund rather than clamping it', async () => {
    const db = stubSupabase()
    const tooMuch = await issueCoolingOffRefund({
      supabase: db.client,
      museumId: 'refund-test',
      stripeSubscriptionId: subscriptionId,
      amount: unitAmount * 2,
      coolingOffStartedAt: windowStartsAt,
      stripeClient: stripe,
      force: true,
    })

    expect(tooMuch.ok).toBe(false)
    expect(db.rows.some((r) => r.event === 'failed')).toBe(true)

    // And crucially, no extra money left.
    const charge = await stripe.charges.retrieve(chargeId)
    expect(charge.amount_refunded).toBe(expectedRefund)
  }, 120_000)

  it('attempts nothing while the kill switch is off, but still records it', async () => {
    const db = stubSupabase()
    const gated = await issueCoolingOffRefund({
      supabase: db.client,
      museumId: 'refund-test',
      stripeSubscriptionId: subscriptionId,
      amount: 100,
      coolingOffStartedAt: windowStartsAt,
      stripeClient: stripe,
      // force omitted, and REFUNDS_ENABLED is unset in the test environment
    })

    expect(gated.ok).toBe(false)
    expect(db.rows.some((r) => String(r.error).includes('REFUNDS_ENABLED'))).toBe(true)
  }, 60_000)
})
