/**
 * When statutory reminders are due.
 *
 * A pure function over a subscription record and a clock. No database, no
 * Stripe, no dates read from the environment, so every cadence rule can be
 * tested directly rather than inferred from what the cron happened to send.
 *
 * The cadence is computed from `billing_interval` and `billing_interval_count`
 * rather than hardcoded to monthly. Vitrine has no annual price today, so the
 * annual rules describe an empty set. Adding an annual price later brings them
 * into play with no code change, which is the point.
 */

import type { NoticeType } from './notices'

/** The subset of the subscriptions mirror this needs. */
export type ScheduleSubject = {
  stripe_subscription_id: string
  status: string | null
  billing_interval: string | null
  billing_interval_count: number | null
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  cancel_at_period_end: boolean | null
  created_at: string | null
}

export type DueNotice = {
  type: NoticeType
  /** The moment the notice became due. Also the idempotency key component. */
  scheduledAt: string
  /** The renewal or conversion the notice is about. */
  eventAt: string
}

const DAY = 24 * 60 * 60 * 1000

/**
 * Notices due for this subscription at `now`.
 *
 * A notice is "due" from the moment its trigger passes until the event it warns
 * about. The daily cron therefore still catches a notice whose exact moment
 * fell between runs, which matters on Vercel's hobby plan where crons fire once
 * a day at an approximate time. Duplicate sends are prevented by the unique
 * index on (subscription, type, scheduled_at), not by narrow timing.
 */
export function dueNotices(sub: ScheduleSubject, now: Date = new Date()): DueNotice[] {
  const out: DueNotice[] = []
  const t = now.getTime()

  // A subscription already set to cancel is not going to renew, so warning
  // about a renewal would be wrong. Trial reminders still apply: the customer
  // may yet be charged if they change their mind.
  const willRenew = !sub.cancel_at_period_end

  // ---- Trial conversion -------------------------------------------------
  if (sub.status === 'trialing' && sub.trial_end) {
    const end = new Date(sub.trial_end).getTime()
    const start = sub.trial_start ? new Date(sub.trial_start).getTime() : null
    const lengthDays = start !== null ? (end - start) / DAY : 30

    // Under seven days there is no room for a seven-day warning, so the rules
    // fall back to the midpoint and 24 hours.
    const triggers: Array<[NoticeType, number]> =
      lengthDays >= 7
        ? [
            ['trial_ending_7d', end - 7 * DAY],
            ['trial_ending_2d', end - 2 * DAY],
          ]
        : [
            ['trial_ending_mid', start !== null ? start + (end - start) / 2 : end - 1 * DAY],
            ['trial_ending_24h', end - 1 * DAY],
          ]

    for (const [type, at] of triggers) {
      if (t >= at && t < end) {
        out.push({
          type,
          scheduledAt: new Date(at).toISOString(),
          eventAt: new Date(end).toISOString(),
        })
      }
    }
    // While trialing there is no renewal to warn about yet.
    return out
  }

  if (sub.status !== 'active' || !sub.current_period_end) return out

  const periodEnd = new Date(sub.current_period_end).getTime()
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start).getTime()
    : null

  if (!willRenew) return out

  const interval = sub.billing_interval ?? 'month'
  const count = sub.billing_interval_count ?? 1
  const periodDays = approximatePeriodDays(interval, count)

  // ---- Long terms: 30 days and 7 days before renewal --------------------
  // Applied to any term long enough for a 30-day warning to sit inside it,
  // which is every annual plan and anything else of similar length.
  if (periodDays >= 60) {
    for (const [type, offset] of [
      ['renewal_30d', 30],
      ['renewal_7d', 7],
    ] as Array<[NoticeType, number]>) {
      const at = periodEnd - offset * DAY
      if (t >= at && t < periodEnd) {
        out.push({
          type,
          scheduledAt: new Date(at).toISOString(),
          eventAt: new Date(periodEnd).toISOString(),
        })
      }
    }
    return out
  }

  // ---- Short terms, in practice monthly ---------------------------------
  // Two obligations. A seven-day warning before the first renewal after
  // signing up, and a reminder at least every six months thereafter.

  const isFirstPeriod = periodStart !== null && sub.created_at
    ? new Date(sub.created_at).getTime() >= periodStart - DAY
    : false

  if (isFirstPeriod) {
    const at = periodEnd - 7 * DAY
    if (t >= at && t < periodEnd) {
      out.push({
        type: 'renewal_7d',
        scheduledAt: new Date(at).toISOString(),
        eventAt: new Date(periodEnd).toISOString(),
      })
    }
  }

  // The six-monthly reminder is anchored to the subscription's own start date
  // so it lands on a stable schedule rather than drifting with billing cycles.
  const anchor = sub.created_at ? new Date(sub.created_at).getTime() : periodStart
  if (anchor !== null) {
    const sixMonths = 182 * DAY
    const elapsed = t - anchor
    if (elapsed >= sixMonths) {
      const periodsPassed = Math.floor(elapsed / sixMonths)
      const at = anchor + periodsPassed * sixMonths
      out.push({
        type: 'periodic_6m',
        scheduledAt: new Date(at).toISOString(),
        eventAt: new Date(periodEnd).toISOString(),
      })
    }
  }

  return out
}

/**
 * Approximate length of a billing period in days.
 *
 * Only used to decide which cadence applies, never to compute a date shown to a
 * customer, so month-length variation does not matter here.
 */
function approximatePeriodDays(interval: string, count: number): number {
  const perUnit: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 }
  return (perUnit[interval] ?? 30) * (count || 1)
}
