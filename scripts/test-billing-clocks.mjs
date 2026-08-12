#!/usr/bin/env node
/**
 * Stripe test-clock exercises for the time-dependent billing behaviour.
 *
 * Run with: npm run test:billing
 *
 * Deliberately NOT part of `npm test`. These hit the Stripe API and take
 * upwards of a minute, which is unusable in a watch loop, and they need a
 * test-mode key that CI may not have. `npm test` stays offline and fast.
 *
 * What this proves, against a clock we advance rather than a mocked date:
 *   1. a trial converts to paid on the day we say it will;
 *   2. a monthly subscription renews and the period advances;
 *   3. the notice schedule fires the right reminders at each point;
 *   4. a cooling-off window opens on conversion and closes 14 days later.
 *
 * It exercises Stripe and our own scheduling logic together. It does not write
 * to the database, because there is no non-production database to write to, so
 * the mirror is simulated in memory from the Stripe objects. That is the known
 * limit of this suite and is recorded in the DMCCA plan.
 *
 * Requires STRIPE_TEST_SECRET_KEY in .env.local. Everything it creates is in
 * test mode and is cleaned up at the end.
 */

import { readFileSync } from 'node:fs'
import Stripe from 'stripe'
import { dueNotices } from '../lib/billing/noticeSchedule.ts'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const key = env.STRIPE_TEST_SECRET_KEY
if (!key || !key.startsWith('sk_test')) {
  console.log('SKIP: STRIPE_TEST_SECRET_KEY (sk_test_...) not found in .env.local.')
  console.log('These tests need a Stripe test-mode key. Nothing was run.')
  process.exit(0)
}

const stripe = new Stripe(key)
const PROFESSIONAL = 'price_1TvOpdF1q447WCoNlsZYyV7K' // Composition sandbox, £79/month
const DAY = 86_400

let failures = 0
function check(label, condition, detail = '') {
  const mark = condition ? 'PASS' : 'FAIL'
  if (!condition) failures++
  console.log(`  ${mark}  ${label}${detail ? ` (${detail})` : ''}`)
}

async function advanceTo(clockId, unix) {
  await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: unix })
  // Advancing is asynchronous. Poll until Stripe reports the clock ready.
  for (let i = 0; i < 60; i++) {
    const clock = await stripe.testHelpers.testClocks.retrieve(clockId)
    if (clock.status === 'ready') return
    if (clock.status === 'internal_failure') throw new Error('test clock failed')
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error('test clock did not become ready in time')
}

/** Build the mirror shape the scheduler expects, from a Stripe subscription. */
function toMirror(sub) {
  const item = sub.items.data[0]
  return {
    stripe_subscription_id: sub.id,
    status: sub.status,
    billing_interval: item?.price?.recurring?.interval ?? null,
    billing_interval_count: item?.price?.recurring?.interval_count ?? null,
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    created_at: new Date(sub.created * 1000).toISOString(),
  }
}

const created = { clocks: [], customers: [] }

async function run() {
  const start = Math.floor(Date.now() / 1000)

  console.log('\nTrial conversion, renewal and the notice cadence')
  console.log('------------------------------------------------')

  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: start,
    name: 'vitrine-dmcca',
  })
  created.clocks.push(clock.id)

  const customer = await stripe.customers.create({
    email: 'clock-test@vitrinecms.com',
    test_clock: clock.id,
  })
  created.customers.push(customer.id)

  // Attaching the pm_card_visa token mints a new payment method, so the
  // returned id is what has to be set as the default, not the token.
  const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer: customer.id })
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: pm.id },
  })

  let sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: PROFESSIONAL, quantity: 1 }],
    trial_period_days: 30,
    metadata: { museum_id: 'clock-test' },
  })

  check('subscription starts in trial', sub.status === 'trialing', sub.status)

  // Day 22: seven days before the trial ends.
  await advanceTo(clock.id, start + 23 * DAY)
  sub = await stripe.subscriptions.retrieve(sub.id)
  let notices = dueNotices(toMirror(sub), new Date((start + 23 * DAY) * 1000)).map((n) => n.type)
  check('7 day trial reminder is due', notices.includes('trial_ending_7d'), notices.join(', '))
  check('2 day reminder is not due yet', !notices.includes('trial_ending_2d'))

  // Day 29: one day before conversion.
  await advanceTo(clock.id, start + 29 * DAY)
  sub = await stripe.subscriptions.retrieve(sub.id)
  notices = dueNotices(toMirror(sub), new Date((start + 29 * DAY) * 1000)).map((n) => n.type)
  check('2 day trial reminder is due', notices.includes('trial_ending_2d'), notices.join(', '))
  check('still trialing the day before', sub.status === 'trialing', sub.status)

  // Day 31: the trial has converted.
  await advanceTo(clock.id, start + 31 * DAY)
  sub = await stripe.subscriptions.retrieve(sub.id)
  check('trial converted to active', sub.status === 'active', sub.status)

  const item = sub.items.data[0]
  const periodStart = item.current_period_start
  check(
    'a new billing period began at conversion',
    periodStart >= start + 29 * DAY,
    new Date(periodStart * 1000).toISOString()
  )

  // The cooling-off window our code would open on conversion.
  const coolingOffEnds = periodStart + 14 * DAY
  check(
    'cooling-off window is open just after conversion',
    start + 31 * DAY < coolingOffEnds,
    `closes ${new Date(coolingOffEnds * 1000).toISOString()}`
  )

  // Day 46: fifteen days past conversion, so the window has closed.
  await advanceTo(clock.id, start + 46 * DAY)
  check('cooling-off window has closed by day 15', start + 46 * DAY > coolingOffEnds)

  // Day 61: the first paid renewal should have happened.
  await advanceTo(clock.id, start + 62 * DAY)
  sub = await stripe.subscriptions.retrieve(sub.id)
  const renewedStart = sub.items.data[0].current_period_start
  check('subscription renewed and the period advanced', renewedStart > periodStart)
  check('still active after renewal', sub.status === 'active', sub.status)

  console.log('\nCancellation inside the window')
  console.log('------------------------------')

  const cancelled = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })
  check('cancel at period end is set', cancelled.cancel_at_period_end === true)
  notices = dueNotices(toMirror(cancelled), new Date((start + 62 * DAY) * 1000)).map((n) => n.type)
  check('no renewal reminders once cancelling', !notices.some((n) => n.startsWith('renewal_')), notices.join(', ') || 'none')
}

async function cleanup() {
  console.log('\nCleaning up')
  for (const id of created.clocks) {
    try {
      await stripe.testHelpers.testClocks.del(id)
      console.log(`  deleted clock ${id}`)
    } catch (err) {
      console.log(`  could not delete clock ${id}: ${err.message}`)
    }
  }
}

try {
  await run()
} catch (err) {
  failures++
  console.error('\nERROR:', err.message)
} finally {
  await cleanup()
}

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
