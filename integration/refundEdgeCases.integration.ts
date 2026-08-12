/**
 * Edge cases and the full cancellation path, against Stripe test mode.
 *
 * The companion to refund.integration.ts, which covers the happy path. This
 * covers the ways it can go wrong, and the entry point customers actually use:
 * cancelSubscription, not issueCoolingOffRefund directly.
 *
 * Run with: npm run test:refund
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { issueCoolingOffRefund } from '@/lib/billing/refund'
import { cancelSubscription } from '@/lib/billing/cancel'
import { reconcileSubscriptionRefund } from '@/lib/billing/reconcileRefund'
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
const PROFESSIONAL = 'price_1TvOpdF1q447WCoNlsZYyV7K'
const DAY = 86_400

const stripe = enabled ? new Stripe(key!) : (null as unknown as Stripe)

/**
 * Supabase stand-in backed by simple in-memory tables, enough to satisfy the
 * reads cancelSubscription performs and to record what it writes.
 */
function stubSupabase(fixtures: {
  museum?: Record<string, unknown>
  subscription?: Record<string, unknown>
  refundsIssued?: Record<string, unknown>[]
}) {
  const rows: Record<string, unknown>[] = []
  const client = {
    from(table: string) {
      const builder: Record<string, unknown> = {
        insert(row: Record<string, unknown>) {
          rows.push({ __table: table, ...row })
          return Promise.resolve({ error: null })
        },
        select() { return builder },
        eq() { return builder },
        limit() {
          if (table === 'refunds') return Promise.resolve({ data: [], error: null })
          return builder
        },
        maybeSingle() {
          if (table === 'museums') {
            return Promise.resolve({ data: fixtures.museum ?? null, error: null })
          }
          if (table === 'subscriptions') {
            return Promise.resolve({ data: fixtures.subscription ?? null, error: null })
          }
          if (table === 'refunds') {
            return Promise.resolve({ data: fixtures.refundsIssued?.[0] ?? null, error: null })
          }
          return Promise.resolve({ data: null, error: null })
        },
      }
      return builder
    },
    auth: { admin: { getUserById: () => Promise.resolve({ data: { user: { email: 'owner@example.org' } } }) } },
  } as unknown as SupabaseClient

  return { rows, client }
}

async function advanceTo(clockId: string, unix: number) {
  await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: unix })
  for (let i = 0; i < 90; i++) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId)
    if (clock.status === 'ready') return
    if (clock.status === 'internal_failure') throw new Error('test clock failed')
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('test clock did not become ready')
}

describe.runIf(enabled)('refund edge cases and the full cancellation path', () => {
  const clocks: string[] = []
  let paidSub: Stripe.Subscription
  let trialingSub: Stripe.Subscription
  let unitAmount: number
  let windowStartsAt: string
  let periodStartIso: string
  let periodEndIso: string

  beforeAll(async () => {
    const start = Math.floor(Date.now() / 1000)

    // A paying subscription.
    const clock = await stripe.testHelpers.testClocks.create({ frozen_time: start, name: 'vitrine-edge' })
    clocks.push(clock.id)
    const customer = await stripe.customers.create({ email: 'edge@vitrinecms.com', test_clock: clock.id })
    const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
    await stripe.customers.update(customer.id, { invoice_settings: { default_payment_method: pm.id } })

    paidSub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PROFESSIONAL, quantity: 1 }],
      metadata: { museum_id: 'edge-test' },
    })

    const item = paidSub.items.data[0]
    unitAmount = item.price.unit_amount!
    periodStartIso = new Date(item.current_period_start * 1000).toISOString()
    periodEndIso = new Date(item.current_period_end * 1000).toISOString()
    windowStartsAt = coolingOffWindow(new Date(item.current_period_start * 1000), 'initial').startsAt

    await advanceTo(clock.id, item.current_period_start + 3 * DAY)

    // A trialing subscription, which has taken no money.
    const clock2 = await stripe.testHelpers.testClocks.create({ frozen_time: start, name: 'vitrine-edge-trial' })
    clocks.push(clock2.id)
    const customer2 = await stripe.customers.create({ email: 'edge2@vitrinecms.com', test_clock: clock2.id })
    const pm2 = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer2.id })
    await stripe.customers.update(customer2.id, { invoice_settings: { default_payment_method: pm2.id } })
    trialingSub = await stripe.subscriptions.create({
      customer: customer2.id,
      items: [{ price: PROFESSIONAL, quantity: 1 }],
      trial_period_days: 30,
      metadata: { museum_id: 'edge-trial' },
    })
  }, 300_000)

  afterAll(async () => {
    for (const id of clocks) await stripe.testHelpers.testClocks.del(id).catch(() => {})
  })

  describe('amounts that should never reach Stripe', () => {
    for (const amount of [0, -1, -7110, Number.NaN, Number.POSITIVE_INFINITY]) {
      it(`rejects an amount of ${amount} without calling Stripe`, async () => {
        const db = stubSupabase({})
        const result = await issueCoolingOffRefund({
          supabase: db.client,
          museumId: 'edge-test',
          stripeSubscriptionId: paidSub.id,
          amount,
          coolingOffStartedAt: windowStartsAt,
          stripeClient: stripe,
          force: true,
        })
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toMatch(/positive/i)
      })
    }
  })

  it('fails cleanly when the subscription has never been charged', async () => {
    // A trial has taken no money, so there is nothing to refund. This must be
    // a clean refusal rather than an exception or a zero-value Stripe call.
    const db = stubSupabase({})
    const result = await issueCoolingOffRefund({
      supabase: db.client,
      museumId: 'edge-trial',
      stripeSubscriptionId: trialingSub.id,
      amount: 1000,
      coolingOffStartedAt: windowStartsAt,
      stripeClient: stripe,
      force: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/no paid charge/i)
  }, 60_000)

  it('fails cleanly on a subscription id that does not exist', async () => {
    const db = stubSupabase({})
    const result = await issueCoolingOffRefund({
      supabase: db.client,
      museumId: 'edge-test',
      stripeSubscriptionId: 'sub_does_not_exist',
      amount: 1000,
      coolingOffStartedAt: windowStartsAt,
      stripeClient: stripe,
      force: true,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.recorded).toBe(true) // the failure is evidenced
  }, 60_000)

  describe('the full cancellation path, which is what customers actually hit', () => {
    it('cancels immediately and issues the pro-rata refund', async () => {
      const expected = coolingOffRefundAmount({
        unitAmount,
        periodStart: periodStartIso,
        periodEnd: periodEndIso,
        cancelledAt: new Date(),
      })

      const db = stubSupabase({
        museum: {
          id: 'edge-test',
          name: 'Edge Museum',
          stripe_subscription_id: paidSub.id,
          contact_email: 'edge@vitrinecms.com',
          owner_id: null,
          ever_paid: true,
        },
        subscription: {
          cooling_off_started_at: windowStartsAt,
          cooling_off_ends_at: new Date(Date.parse(windowStartsAt) + 14 * DAY * 1000).toISOString(),
          unit_amount: unitAmount,
          currency: 'gbp',
          current_period_start: periodStartIso,
          current_period_end: periodEndIso,
        },
      })

      const result = await cancelSubscription({
        museumId: 'edge-test',
        mode: 'immediate',
        initiatedBy: 'self_serve',
        supabase: db.client,
        stripeClient: stripe,
        forceRefund: true,
      })

      expect(result.ok, result.ok ? '' : result.error).toBe(true)
      if (!result.ok) return

      expect(result.coolingOffActive).toBe(true)
      expect(result.refundAmount).toBeGreaterThan(0)

      // The subscription really is cancelled in Stripe.
      const fresh = await stripe.subscriptions.retrieve(paidSub.id)
      expect(fresh.status).toBe('canceled')

      // And the money really moved, for the computed amount.
      const issued = db.rows.find((r) => r.__table === 'refunds' && r.event === 'issued')
      expect(issued).toBeDefined()
      const charge = await stripe.charges.retrieve(issued!.stripe_charge_id as string)
      expect(charge.amount_refunded).toBe(expected)

      // And the cancellation is evidenced, recording what was actually refunded.
      const evidence = db.rows.find((r) => r.__table === 'cancellation_events')
      expect(evidence).toBeDefined()
      expect(evidence!.event).toBe('cancelled_immediately')
      expect(evidence!.cooling_off_active).toBe(true)
      expect(evidence!.refund_amount).toBe(result.refundAmount)
    }, 180_000)

    it('refuses an immediate cancellation outside the cooling-off window', async () => {
      const db = stubSupabase({
        museum: {
          id: 'edge-test',
          name: 'Edge Museum',
          stripe_subscription_id: paidSub.id,
          contact_email: 'edge@vitrinecms.com',
          owner_id: null,
          ever_paid: true,
        },
        subscription: {
          // A window that closed a year ago.
          cooling_off_started_at: '2025-01-01T00:00:00.000Z',
          cooling_off_ends_at: '2025-01-15T00:00:00.000Z',
          unit_amount: unitAmount,
          currency: 'gbp',
          current_period_start: periodStartIso,
          current_period_end: periodEndIso,
        },
      })

      const result = await cancelSubscription({
        museumId: 'edge-test',
        mode: 'immediate',
        initiatedBy: 'self_serve',
        supabase: db.client,
        stripeClient: stripe,
        forceRefund: true,
      })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/cooling-off/i)
      // Nothing was refunded.
      expect(db.rows.some((r) => r.__table === 'refunds')).toBe(false)
    }, 60_000)
  })

  describe('reconciliation against charge.refunded', () => {
    it('confirms a refund whose amount matches what we issued', async () => {
      const charge = {
        id: 'ch_recon',
        customer: 'cus_x',
        on_behalf_of: null,
        refunds: { data: [{ id: 're_recon', amount: 7110, currency: 'gbp' }] },
      } as unknown as Stripe.Charge

      const db = stubSupabase({
        refundsIssued: [
          {
            museum_id: 'm1',
            stripe_subscription_id: 'sub_x',
            amount: 7110,
            currency: 'gbp',
            reason: 'cooling_off',
            refund_mode: 'pro_rata',
          },
        ],
      })

      await reconcileSubscriptionRefund(db.client, charge)

      const written = db.rows.find((r) => r.__table === 'refunds')
      expect(written).toBeDefined()
      expect(written!.event).toBe('confirmed')
      expect(written!.error).toBeNull()
    })

    it('flags a mismatch when Stripe refunded a different amount', async () => {
      const charge = {
        id: 'ch_recon2',
        customer: 'cus_x',
        on_behalf_of: null,
        refunds: { data: [{ id: 're_recon2', amount: 9999, currency: 'gbp' }] },
      } as unknown as Stripe.Charge

      const db = stubSupabase({
        refundsIssued: [
          {
            museum_id: 'm1',
            stripe_subscription_id: 'sub_x',
            amount: 7110,
            currency: 'gbp',
            reason: 'cooling_off',
            refund_mode: 'pro_rata',
          },
        ],
      })

      await reconcileSubscriptionRefund(db.client, charge)

      const written = db.rows.find((r) => r.__table === 'refunds')
      expect(written!.event).toBe('mismatch')
      expect(String(written!.error)).toMatch(/7110/)
      expect(String(written!.error)).toMatch(/9999/)
    })

    it('ignores Connect charges, which are ticketing rather than subscriptions', async () => {
      const charge = {
        id: 'ch_connect',
        on_behalf_of: 'acct_other',
        refunds: { data: [{ id: 're_c', amount: 500, currency: 'gbp' }] },
      } as unknown as Stripe.Charge

      const db = stubSupabase({})
      await reconcileSubscriptionRefund(db.client, charge)
      expect(db.rows).toHaveLength(0)
    })
  })
})
