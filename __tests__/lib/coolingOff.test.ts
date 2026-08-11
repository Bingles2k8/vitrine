import { describe, it, expect } from 'vitest'
import {
  coolingOffWindow,
  isWithinCoolingOff,
  coolingOffDaysRemaining,
  coolingOffRefundAmount,
  formatBillingDate,
} from '@/lib/billing/coolingOff'

describe('coolingOffWindow', () => {
  it('runs 14 days from the start instant', () => {
    const w = coolingOffWindow('2026-08-11T10:00:00.000Z', 'initial')
    expect(w.startsAt).toBe('2026-08-11T10:00:00.000Z')
    expect(w.endsAt).toBe('2026-08-25T10:00:00.000Z')
    expect(w.reason).toBe('initial')
  })

  it('accepts a Date as well as an ISO string', () => {
    const w = coolingOffWindow(new Date('2026-01-01T00:00:00.000Z'), 'renewal')
    expect(w.endsAt).toBe('2026-01-15T00:00:00.000Z')
  })

  it('rejects an invalid start date rather than producing a NaN window', () => {
    expect(() => coolingOffWindow('not a date', 'initial')).toThrow(/invalid start date/i)
  })
})

describe('BST/GMT correctness', () => {
  // UK clocks go back on the last Sunday of October: 26 October 2025 and
  // 25 October 2026. A window spanning that boundary must still be 14 real
  // days, and must display the correct local date on each side.

  it('a window opened before the 2025 transition still ends 14 real days later', () => {
    const w = coolingOffWindow('2025-10-20T12:00:00.000Z', 'renewal')
    const elapsed = new Date(w.endsAt).getTime() - new Date(w.startsAt).getTime()
    expect(elapsed).toBe(14 * 24 * 60 * 60 * 1000)
    expect(w.endsAt).toBe('2025-11-03T12:00:00.000Z')
  })

  it('a window opened before the 2026 transition still ends 14 real days later', () => {
    const w = coolingOffWindow('2026-10-18T12:00:00.000Z', 'renewal')
    expect(new Date(w.endsAt).getTime() - new Date(w.startsAt).getTime()).toBe(
      14 * 24 * 60 * 60 * 1000
    )
    expect(w.endsAt).toBe('2026-11-01T12:00:00.000Z')
  })

  it('renews on 26 October and displays the right London date either side', () => {
    // 26 October 2025 01:30 UTC is 01:30 GMT, the transition having happened at
    // 02:00 BST that morning. The day before, the same UTC time is 02:30 BST.
    expect(formatBillingDate('2025-10-25T01:30:00.000Z')).toBe('25 October 2025')
    expect(formatBillingDate('2025-10-26T01:30:00.000Z')).toBe('26 October 2025')
  })

  it('shows the local date, not the UTC date, when they differ', () => {
    // 23:30 UTC on 25 October 2026 is 00:30 on the 26th in Berlin.
    expect(formatBillingDate('2026-10-25T23:30:00.000Z', { timeZone: 'Europe/London' }))
      .toBe('25 October 2026')
    expect(formatBillingDate('2026-10-25T23:30:00.000Z', { timeZone: 'Europe/Berlin' }))
      .toBe('26 October 2026')
  })

  it('formats in the customer locale', () => {
    expect(formatBillingDate('2026-08-11T10:00:00.000Z', { locale: 'de-DE', timeZone: 'Europe/Berlin' }))
      .toBe('11. August 2026')
  })
})

describe('isWithinCoolingOff', () => {
  const w = coolingOffWindow('2026-08-11T10:00:00.000Z', 'initial')

  it('includes the opening instant', () => {
    expect(isWithinCoolingOff(w, new Date('2026-08-11T10:00:00.000Z'))).toBe(true)
  })

  it('includes a moment before the close', () => {
    expect(isWithinCoolingOff(w, new Date('2026-08-25T09:59:59.999Z'))).toBe(true)
  })

  it('excludes the closing instant, so the window is exactly 14 days', () => {
    expect(isWithinCoolingOff(w, new Date('2026-08-25T10:00:00.000Z'))).toBe(false)
  })

  it('excludes a time before it opened', () => {
    expect(isWithinCoolingOff(w, new Date('2026-08-10T10:00:00.000Z'))).toBe(false)
  })

  it('is false when there is no window', () => {
    expect(isWithinCoolingOff(null)).toBe(false)
    expect(isWithinCoolingOff(undefined)).toBe(false)
  })
})

describe('coolingOffDaysRemaining', () => {
  const w = coolingOffWindow('2026-08-11T10:00:00.000Z', 'initial')

  it('reports the full length on day one', () => {
    expect(coolingOffDaysRemaining(w, new Date('2026-08-11T10:00:00.000Z'))).toBe(14)
  })

  it('rounds part days up, so a customer is never told they have less than they do', () => {
    expect(coolingOffDaysRemaining(w, new Date('2026-08-24T22:00:00.000Z'))).toBe(1)
  })

  it('is zero once closed', () => {
    expect(coolingOffDaysRemaining(w, new Date('2026-08-25T10:00:00.000Z'))).toBe(0)
    expect(coolingOffDaysRemaining(w, new Date('2027-01-01T00:00:00.000Z'))).toBe(0)
  })
})

describe('coolingOffRefundAmount', () => {
  const period = {
    periodStart: '2026-08-01T00:00:00.000Z',
    periodEnd: '2026-08-31T00:00:00.000Z', // 30 days
    unitAmount: 7900, // £79.00
  }

  it('pro-rates by the time left in the period', () => {
    // Cancelling on day 3 leaves 27 of 30 days: 7900 * 27/30 = 7110.
    const amount = coolingOffRefundAmount({
      ...period,
      cancelledAt: '2026-08-04T00:00:00.000Z',
      mode: 'pro_rata',
    })
    expect(amount).toBe(7110)
  })

  it('never refunds more than was charged', () => {
    const amount = coolingOffRefundAmount({
      ...period,
      cancelledAt: '2026-07-01T00:00:00.000Z', // before the period even began
      mode: 'pro_rata',
    })
    expect(amount).toBe(7900)
  })

  it('refunds nothing once the period is over', () => {
    const amount = coolingOffRefundAmount({
      ...period,
      cancelledAt: '2026-09-01T00:00:00.000Z',
      mode: 'pro_rata',
    })
    expect(amount).toBe(0)
  })

  it('floors rather than rounds, so rounding cannot overpay', () => {
    // 1000 * (1 day of 3) = 333.33
    const amount = coolingOffRefundAmount({
      unitAmount: 1000,
      periodStart: '2026-08-01T00:00:00.000Z',
      periodEnd: '2026-08-04T00:00:00.000Z',
      cancelledAt: '2026-08-03T00:00:00.000Z',
      mode: 'pro_rata',
    })
    expect(amount).toBe(333)
  })

  it('refunds the whole charge in full mode regardless of elapsed time', () => {
    const amount = coolingOffRefundAmount({
      ...period,
      cancelledAt: '2026-08-14T00:00:00.000Z',
      mode: 'full',
    })
    expect(amount).toBe(7900)
  })

  it('fails toward the customer when the period is nonsense', () => {
    const amount = coolingOffRefundAmount({
      unitAmount: 7900,
      periodStart: '2026-08-31T00:00:00.000Z',
      periodEnd: '2026-08-01T00:00:00.000Z', // inverted
      cancelledAt: '2026-08-05T00:00:00.000Z',
      mode: 'pro_rata',
    })
    expect(amount).toBe(7900)
  })

  it('returns nothing for a zero or negative charge', () => {
    expect(coolingOffRefundAmount({ ...period, unitAmount: 0, cancelledAt: '2026-08-04T00:00:00.000Z' })).toBe(0)
    expect(coolingOffRefundAmount({ ...period, unitAmount: -100, cancelledAt: '2026-08-04T00:00:00.000Z' })).toBe(0)
  })

  it('spans a BST/GMT transition without losing or gaining an hour of value', () => {
    // A 30-day period straddling the 2026 transition. Cancelling exactly
    // halfway through the elapsed real time should refund half, not half
    // plus or minus the hour the clocks moved.
    const amount = coolingOffRefundAmount({
      unitAmount: 3000,
      periodStart: '2026-10-11T00:00:00.000Z',
      periodEnd: '2026-11-10T00:00:00.000Z',
      cancelledAt: '2026-10-26T00:00:00.000Z',
      mode: 'pro_rata',
    })
    expect(amount).toBe(1500)
  })
})
