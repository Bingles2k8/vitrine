/**
 * Cooling-off window arithmetic and refund calculation.
 *
 * Every function here is pure and takes an explicit `now`, so the behaviour is
 * testable without mocking the clock or waiting on a Stripe test clock.
 *
 * Timezone rule, applied throughout: windows are computed as UTC instants and
 * only converted to a local timezone for display. A 14-day window is 14 real
 * days, not "the same wall-clock time a fortnight later". Those two differ by
 * an hour across a BST/GMT transition, and the instant-based reading is the one
 * that gives every customer the same amount of time.
 */

import { COOLING_OFF_DAYS, COOLING_OFF_REFUND_MODE, type CoolingOffReason } from './config'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type CoolingOffWindow = {
  startsAt: string
  endsAt: string
  reason: CoolingOffReason
}

/**
 * Open a cooling-off window running `days` real days from `startIso`.
 *
 * Called at three moments: initial subscription start, the instant a trial
 * converts to paid, and every renewal.
 */
export function coolingOffWindow(
  startIso: string | Date,
  reason: CoolingOffReason,
  days: number = COOLING_OFF_DAYS
): CoolingOffWindow {
  const start = startIso instanceof Date ? startIso : new Date(startIso)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`coolingOffWindow: invalid start date ${String(startIso)}`)
  }
  return {
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + days * MS_PER_DAY).toISOString(),
    reason,
  }
}

/**
 * Is `now` inside the window? The window is inclusive of its start and
 * exclusive of its end, so a customer gets the full 14 days and not a moment
 * more.
 */
export function isWithinCoolingOff(
  window: Pick<CoolingOffWindow, 'startsAt' | 'endsAt'> | null | undefined,
  now: Date = new Date()
): boolean {
  if (!window?.endsAt) return false
  const t = now.getTime()
  return t >= new Date(window.startsAt).getTime() && t < new Date(window.endsAt).getTime()
}

/** Whole days left in the window, rounded up. Zero once it has closed. */
export function coolingOffDaysRemaining(
  window: Pick<CoolingOffWindow, 'endsAt'> | null | undefined,
  now: Date = new Date()
): number {
  if (!window?.endsAt) return 0
  const ms = new Date(window.endsAt).getTime() - now.getTime()
  return ms <= 0 ? 0 : Math.ceil(ms / MS_PER_DAY)
}

/**
 * How much to refund for a cancellation inside the cooling-off window.
 *
 * Under 'pro_rata' we keep the value of the service already supplied since the
 * charge and refund the rest, which is what the regulations permit. Under
 * 'full' the whole charge goes back.
 *
 * Amounts are in the smallest currency unit, matching Stripe. The result is
 * floored so rounding can never refund more than was charged, and clamped to
 * the charge in both directions so a clock skew or a bad period cannot produce
 * a negative or excessive refund.
 */
export function coolingOffRefundAmount(args: {
  unitAmount: number
  periodStart: string | Date
  periodEnd: string | Date
  cancelledAt: string | Date
  mode?: 'pro_rata' | 'full'
}): number {
  const { unitAmount } = args
  const mode = args.mode ?? COOLING_OFF_REFUND_MODE

  if (!Number.isFinite(unitAmount) || unitAmount <= 0) return 0
  if (mode === 'full') return Math.floor(unitAmount)

  const start = toDate(args.periodStart).getTime()
  const end = toDate(args.periodEnd).getTime()
  const at = toDate(args.cancelledAt).getTime()

  const total = end - start
  // A zero or inverted period would make the proportion meaningless. Refunding
  // in full is the customer-favourable reading, and it is the safe direction to
  // fail in.
  if (!Number.isFinite(total) || total <= 0) return Math.floor(unitAmount)

  const remaining = end - at
  if (remaining <= 0) return 0
  if (remaining >= total) return Math.floor(unitAmount)

  return Math.floor((unitAmount * remaining) / total)
}

/**
 * Format an instant for display to a customer.
 *
 * Defaults to Europe/London because that is where the statutory rights bite
 * and where most customers are, but the timezone is a parameter so a museum
 * abroad sees its own date. The date shown is the local date at that instant,
 * which is the point of doing this rather than slicing the ISO string.
 */
export function formatBillingDate(
  iso: string | Date,
  opts: { locale?: string; timeZone?: string } = {}
): string {
  const { locale = 'en-GB', timeZone = 'Europe/London' } = opts
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(toDate(iso))
}

function toDate(value: string | Date): Date {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${String(value)}`)
  }
  return d
}
