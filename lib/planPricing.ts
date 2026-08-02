import type { PlanId } from './plans'
import type { BillingCurrency } from './countryCurrency'
import { BILLING_CURRENCIES } from './countryCurrency'

// GBP-base FX snapshot, captured 2026-07-20 from the same Frankfurter/ECB feed
// used by app/api/cron/fx-sync/route.ts. This is deliberately NOT the live
// fx_rates table — subscription prices must stay stable between reviews, not
// drift with a daily-refreshed rate. TODO: review this snapshot quarterly.
export const FX_SNAPSHOT: Record<BillingCurrency, number> = {
  GBP: 1,
  USD: 1.346,
  EUR: 1.178,
  CAD: 1.8886,
  AUD: 1.921,
  NZD: 2.2995,
  CHF: 1.088,
  SEK: 13.0113,
  NOK: 13.0077,
  DKK: 8.8064,
  PLN: 5.1032,
  CZK: 28.496,
  HUF: 425.68,
  RON: 6.1738,
  ISK: 168.69,
  TRY: 63.506,
}

// Stripe's zero-decimal currencies, intersected with BILLING_CURRENCIES.
export const ZERO_DECIMAL_CURRENCIES: BillingCurrency[] = ['ISK']

type BillablePlanId = 'hobbyist' | 'professional' | 'institution'

export const GBP_BASE_PRICE: Record<BillablePlanId, number> = {
  hobbyist: 5,
  professional: 79,
  institution: 349,
}

// Rounds up to a "nice" increment based on magnitude. Always rounds up, so
// rounded / rate >= basePriceGBP always holds — we never undercut the GBP price.
export function roundUpToIncrement(raw: number): number {
  const increment =
    raw < 10 ? 1 :
    raw < 100 ? 5 :
    raw < 1000 ? 10 :
    raw < 10000 ? 100 :
    raw < 100000 ? 1000 :
    5000
  return Math.ceil(raw / increment) * increment
}

// PLAN_PRICES[plan][currency] = whole-number localised price, computed once
// at module load from FX_SNAPSHOT.
export const PLAN_PRICES: Record<BillablePlanId, Record<BillingCurrency, number>> = (() => {
  const table = {} as Record<BillablePlanId, Record<BillingCurrency, number>>
  for (const plan of Object.keys(GBP_BASE_PRICE) as BillablePlanId[]) {
    const row = {} as Record<BillingCurrency, number>
    for (const currency of BILLING_CURRENCIES) {
      // GBP is the base price itself — never round it, it's already exact.
      row[currency] = currency === 'GBP'
        ? GBP_BASE_PRICE[plan]
        : roundUpToIncrement(GBP_BASE_PRICE[plan] * FX_SNAPSHOT[currency])
    }
    table[plan] = row
  }
  return table
})()

function isBillablePlan(planId: string): planId is BillablePlanId {
  return planId === 'hobbyist' || planId === 'professional' || planId === 'institution'
}

/**
 * Formatted, localised amount for a plan in a given currency, e.g. "£5" or
 * "$7" — no "/mo" suffix. Community/Enterprise return their static labels
 * ("Free" / "Contact us"); any other plan falls back to GBP if the currency
 * isn't in the table for some reason.
 */
export function formatPlanAmount(planId: PlanId, currency: BillingCurrency): string {
  if (planId === 'community') return 'Free'
  if (planId === 'enterprise') return 'Contact us'
  if (!isBillablePlan(planId)) return 'Contact us'

  const amount = PLAN_PRICES[planId]?.[currency] ?? PLAN_PRICES[planId].GBP
  const resolvedCurrency = PLAN_PRICES[planId]?.[currency] != null ? currency : 'GBP'

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: resolvedCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatted, localised "£5/mo"-style price string for a plan in a given
 * currency.
 */
export function formatPlanPrice(planId: PlanId, currency: BillingCurrency): string {
  const amount = formatPlanAmount(planId, currency)
  if (amount === 'Free' || amount === 'Contact us') return amount
  return `${amount}/mo`
}
