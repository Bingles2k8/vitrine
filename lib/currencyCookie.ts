import { BILLING_CURRENCIES, type BillingCurrency } from './countryCurrency'

const CURRENCY_COOKIE = 'vitrine_currency'

/**
 * Client-side read of the `vitrine_currency` cookie set by middleware from
 * the visitor's geo location. Defaults to GBP if absent/invalid.
 */
export function readCurrencyCookie(): BillingCurrency {
  if (typeof document === 'undefined') return 'GBP'
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]+)`))
  const value = match?.[1]?.toUpperCase()
  return (BILLING_CURRENCIES as readonly string[]).includes(value ?? '')
    ? (value as BillingCurrency)
    : 'GBP'
}
