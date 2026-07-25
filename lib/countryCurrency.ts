// Country (ISO-3166 alpha-2) -> billing currency, used to localise subscription
// pricing. Scope: core Anglosphere + Eurozone + other European countries with
// their own liquid, ratable currency get their own currency; everywhere else
// falls back to GBP/USD/EUR. See lib/planPricing.ts for the actual price table.

export const BILLING_CURRENCIES = [
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD',
  'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'ISK', 'TRY',
] as const

export type BillingCurrency = typeof BILLING_CURRENCIES[number]

const EUROZONE: BillingCurrency = 'EUR'

export const COUNTRY_CURRENCY: Record<string, BillingCurrency> = {
  // Anglosphere
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  IE: EUROZONE,

  // Eurozone (21 members, incl. Bulgaria as of 2026)
  AT: EUROZONE, BE: EUROZONE, HR: EUROZONE, CY: EUROZONE, EE: EUROZONE,
  FI: EUROZONE, FR: EUROZONE, DE: EUROZONE, GR: EUROZONE, IT: EUROZONE,
  LV: EUROZONE, LT: EUROZONE, LU: EUROZONE, MT: EUROZONE, NL: EUROZONE,
  PT: EUROZONE, SK: EUROZONE, SI: EUROZONE, ES: EUROZONE, BG: EUROZONE,

  // Uses EUR without being in the Eurozone
  MC: EUROZONE, SM: EUROZONE, VA: EUROZONE, AD: EUROZONE, XK: EUROZONE, ME: EUROZONE,

  // Rest of Europe with its own currency
  CH: 'CHF', LI: 'CHF', // Liechtenstein uses the Swiss franc directly
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  IS: 'ISK',
  TR: 'TRY',

  // UK Crown Dependencies & territories — GBP-pegged, not worth a separate currency
  IM: 'GBP', JE: 'GBP', GG: 'GBP', GI: 'GBP', FK: 'GBP', SH: 'GBP',
}

// CFA-franc-zone and EU-accession-adjacent countries where EUR is the more
// natural fallback than USD (peg or dominant trade currency).
const EUR_FALLBACK_COUNTRIES = new Set([
  // West & Central African CFA franc zone (pegged to EUR)
  'BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG', // XOF
  'CM', 'CF', 'TD', 'CG', 'GQ', 'GA', // XAF
  // Balkans / Eastern Europe EU-accession pipeline & EUR-linked economies
  'RS', 'BA', 'MK', 'AL', 'MD', 'UA',
])

/**
 * Resolve a billing currency for a country code. Falls back to EUR for a
 * short list of EUR-pegged/EU-accession economies, GBP for unknown/missing
 * country codes (site default), otherwise USD (global default).
 */
export function getCurrencyForCountry(countryCode?: string | null): BillingCurrency {
  if (!countryCode) return 'GBP'
  const cc = countryCode.toUpperCase()
  const direct = COUNTRY_CURRENCY[cc]
  if (direct) return direct
  if (EUR_FALLBACK_COUNTRIES.has(cc)) return 'EUR'
  return 'USD'
}
