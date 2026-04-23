export const SUPPORTED_CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY'] as const
export type Currency = typeof SUPPORTED_CURRENCIES[number]

export type FxRateRow = { base: string; quote: string; rate: number | string }

export type RateMap = Map<string, number>

function key(base: string, quote: string) {
  return `${base.toUpperCase()}:${quote.toUpperCase()}`
}

export function buildRateMap(rows: FxRateRow[] | null | undefined): RateMap {
  const m = new Map<string, number>()
  if (!rows) return m
  for (const r of rows) {
    const rate = typeof r.rate === 'number' ? r.rate : parseFloat(String(r.rate))
    if (!Number.isFinite(rate) || rate <= 0) continue
    m.set(key(r.base, r.quote), rate)
  }
  return m
}

// Convert `amount` from -> to. Falls back to `amount` unchanged when no rate is available.
export function convertValue(amount: number, from: string, to: string, rates: RateMap): number {
  if (!Number.isFinite(amount) || amount === 0) return 0
  const f = (from || 'GBP').toUpperCase()
  const t = (to || 'GBP').toUpperCase()
  if (f === t) return amount
  const direct = rates.get(key(f, t))
  if (direct) return amount * direct
  const inverse = rates.get(key(t, f))
  if (inverse) return amount / inverse
  // Cross-rate via any shared hub (e.g. GBP).
  for (const hub of SUPPORTED_CURRENCIES) {
    const a = rates.get(key(f, hub))
    const b = rates.get(key(hub, t))
    if (a && b) return amount * a * b
  }
  return amount
}

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: (currency || 'GBP').toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
