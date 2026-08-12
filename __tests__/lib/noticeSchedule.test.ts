import { describe, it, expect } from 'vitest'
import { dueNotices, type ScheduleSubject } from '@/lib/billing/noticeSchedule'

const DAY = 24 * 60 * 60 * 1000
const iso = (ms: number) => new Date(ms).toISOString()

const base: ScheduleSubject = {
  stripe_subscription_id: 'sub_1',
  status: 'active',
  billing_interval: 'month',
  billing_interval_count: 1,
  current_period_start: null,
  current_period_end: null,
  trial_start: null,
  trial_end: null,
  cancel_at_period_end: false,
  created_at: null,
}

const types = (sub: ScheduleSubject, now: Date) => dueNotices(sub, now).map((n) => n.type)

describe('trial reminders', () => {
  const trialStart = Date.parse('2026-08-01T00:00:00Z')
  const trialEnd = trialStart + 30 * DAY // 31 August

  const trialing: ScheduleSubject = {
    ...base,
    status: 'trialing',
    trial_start: iso(trialStart),
    trial_end: iso(trialEnd),
  }

  it('sends nothing early in the trial', () => {
    expect(types(trialing, new Date(trialStart + 5 * DAY))).toEqual([])
  })

  it('sends the 7 day reminder once inside seven days', () => {
    expect(types(trialing, new Date(trialEnd - 7 * DAY))).toContain('trial_ending_7d')
  })

  it('sends both reminders inside two days', () => {
    const t = types(trialing, new Date(trialEnd - 1 * DAY))
    expect(t).toContain('trial_ending_7d')
    expect(t).toContain('trial_ending_2d')
  })

  it('stops once the trial has ended', () => {
    expect(types(trialing, new Date(trialEnd + 1))).toEqual([])
  })

  it('uses a stable scheduled_at so a late cron run cannot duplicate a send', () => {
    const early = dueNotices(trialing, new Date(trialEnd - 7 * DAY))
    const late = dueNotices(trialing, new Date(trialEnd - 6 * DAY))
    const findSeven = (n: typeof early) => n.find((x) => x.type === 'trial_ending_7d')!.scheduledAt
    expect(findSeven(early)).toBe(findSeven(late))
  })

  it('falls back to midpoint and 24 hours on a trial shorter than seven days', () => {
    const shortStart = Date.parse('2026-08-01T00:00:00Z')
    const shortEnd = shortStart + 5 * DAY
    const short: ScheduleSubject = {
      ...base,
      status: 'trialing',
      trial_start: iso(shortStart),
      trial_end: iso(shortEnd),
    }
    expect(types(short, new Date(shortStart + 1 * DAY))).toEqual([])
    expect(types(short, new Date(shortStart + 2.5 * DAY))).toContain('trial_ending_mid')
    const near = types(short, new Date(shortEnd - 12 * 60 * 60 * 1000))
    expect(near).toContain('trial_ending_mid')
    expect(near).toContain('trial_ending_24h')
    expect(near).not.toContain('trial_ending_7d')
  })

  it('warns about the trial even when the customer has already cancelled', () => {
    // They may reinstate, and being charged after a cancellation they forgot
    // about is exactly the surprise the regime exists to prevent.
    const cancelled = { ...trialing, cancel_at_period_end: true }
    expect(types(cancelled, new Date(trialEnd - 1 * DAY))).toContain('trial_ending_2d')
  })
})

describe('annual renewals', () => {
  const periodStart = Date.parse('2026-01-01T00:00:00Z')
  const periodEnd = Date.parse('2027-01-01T00:00:00Z')

  const annual: ScheduleSubject = {
    ...base,
    billing_interval: 'year',
    billing_interval_count: 1,
    current_period_start: iso(periodStart),
    current_period_end: iso(periodEnd),
    created_at: iso(periodStart),
  }

  it('sends nothing mid-term', () => {
    expect(types(annual, new Date(periodEnd - 90 * DAY))).toEqual([])
  })

  it('sends the 30 day reminder', () => {
    expect(types(annual, new Date(periodEnd - 30 * DAY))).toEqual(['renewal_30d'])
  })

  it('sends both inside seven days', () => {
    const t = types(annual, new Date(periodEnd - 3 * DAY))
    expect(t).toContain('renewal_30d')
    expect(t).toContain('renewal_7d')
  })

  it('sends nothing when the subscription is already cancelling', () => {
    expect(types({ ...annual, cancel_at_period_end: true }, new Date(periodEnd - 3 * DAY))).toEqual([])
  })

  it('applies the same cadence to a two-year term without a code change', () => {
    const biennial = { ...annual, billing_interval_count: 2 }
    expect(types(biennial, new Date(periodEnd - 30 * DAY))).toEqual(['renewal_30d'])
  })
})

describe('monthly renewals', () => {
  const created = Date.parse('2026-08-01T00:00:00Z')
  const periodStart = created
  const periodEnd = Date.parse('2026-09-01T00:00:00Z')

  const firstMonth: ScheduleSubject = {
    ...base,
    current_period_start: iso(periodStart),
    current_period_end: iso(periodEnd),
    created_at: iso(created),
  }

  it('warns seven days before the first renewal', () => {
    expect(types(firstMonth, new Date(periodEnd - 7 * DAY))).toContain('renewal_7d')
  })

  it('does not warn earlier in the first month', () => {
    expect(types(firstMonth, new Date(periodEnd - 20 * DAY))).toEqual([])
  })

  it('does not repeat the seven day warning in later months', () => {
    const secondMonth: ScheduleSubject = {
      ...firstMonth,
      current_period_start: iso(periodEnd),
      current_period_end: iso(Date.parse('2026-10-01T00:00:00Z')),
    }
    expect(types(secondMonth, new Date(Date.parse('2026-10-01T00:00:00Z') - 3 * DAY))).toEqual([])
  })

  it('sends a six monthly reminder once six months have passed', () => {
    const later: ScheduleSubject = {
      ...firstMonth,
      current_period_start: iso(created + 200 * DAY),
      current_period_end: iso(created + 230 * DAY),
    }
    expect(types(later, new Date(created + 200 * DAY))).toContain('periodic_6m')
  })

  it('anchors the six monthly reminder so it does not drift with billing cycles', () => {
    const later: ScheduleSubject = {
      ...firstMonth,
      current_period_start: iso(created + 200 * DAY),
      current_period_end: iso(created + 230 * DAY),
    }
    const a = dueNotices(later, new Date(created + 200 * DAY))
    const b = dueNotices(later, new Date(created + 210 * DAY))
    const at = (n: typeof a) => n.find((x) => x.type === 'periodic_6m')!.scheduledAt
    expect(at(a)).toBe(at(b))
  })

  it('moves the six monthly reminder on to the next window after a year', () => {
    const yearLater: ScheduleSubject = {
      ...firstMonth,
      current_period_start: iso(created + 380 * DAY),
      current_period_end: iso(created + 410 * DAY),
    }
    const first = dueNotices(
      { ...firstMonth, current_period_start: iso(created + 200 * DAY), current_period_end: iso(created + 230 * DAY) },
      new Date(created + 200 * DAY)
    ).find((n) => n.type === 'periodic_6m')!.scheduledAt
    const second = dueNotices(yearLater, new Date(created + 380 * DAY)).find(
      (n) => n.type === 'periodic_6m'
    )!.scheduledAt
    expect(second).not.toBe(first)
  })
})

describe('subscriptions that should get nothing', () => {
  it('ignores a past_due subscription', () => {
    expect(types({ ...base, status: 'past_due', current_period_end: iso(Date.now() + DAY) }, new Date())).toEqual([])
  })

  it('ignores a cancelled subscription', () => {
    expect(types({ ...base, status: 'canceled', current_period_end: iso(Date.now() + DAY) }, new Date())).toEqual([])
  })

  it('ignores one with no period end recorded', () => {
    expect(types({ ...base, status: 'active' }, new Date())).toEqual([])
  })
})

describe('BST/GMT correctness', () => {
  it('a renewal on 26 October still warns exactly seven days earlier in real time', () => {
    const periodEnd = Date.parse('2025-10-26T12:00:00Z')
    const sub: ScheduleSubject = {
      ...base,
      billing_interval: 'year',
      current_period_start: iso(Date.parse('2024-10-26T12:00:00Z')),
      current_period_end: iso(periodEnd),
      created_at: iso(Date.parse('2024-10-26T12:00:00Z')),
    }
    const due = dueNotices(sub, new Date(periodEnd - 7 * DAY))
    const sevenDay = due.find((n) => n.type === 'renewal_7d')!
    // Seven real days, spanning the clocks going back, not six or eight.
    expect(Date.parse(sevenDay.eventAt) - Date.parse(sevenDay.scheduledAt)).toBe(7 * DAY)
  })
})
