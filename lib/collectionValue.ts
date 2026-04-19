export interface CollectionValueObject {
  id: string
  estimated_value?: string | number | null
  estimated_value_currency?: string | null
  acquisition_value?: string | number | null
  acquisition_currency?: string | null
  insured_value?: string | number | null
}

export interface CollectionValueValuation {
  object_id: string
  value?: string | number | null
  currency?: string | null
  valuation_date?: string | null
}

export interface CollectionValueResult {
  total: number
  currency: string
  counted: number
}

function toNumber(v: unknown): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? n : 0
}

/**
 * Canonical collection value: per-object latest valuation → estimated_value → acquisition_value.
 * `valuations` may be unsorted; we pick the one with the most recent valuation_date per object_id.
 */
export function getCollectionValue(
  objects: CollectionValueObject[],
  valuations: CollectionValueValuation[] = []
): CollectionValueResult {
  const latestByObject = new Map<string, CollectionValueValuation>()
  for (const v of valuations) {
    if (!v.object_id) continue
    const existing = latestByObject.get(v.object_id)
    if (!existing) { latestByObject.set(v.object_id, v); continue }
    const a = v.valuation_date || ''
    const b = existing.valuation_date || ''
    if (a > b) latestByObject.set(v.object_id, v)
  }

  const currencyTally = new Map<string, number>()
  let total = 0
  let counted = 0

  for (const o of objects) {
    const val = latestByObject.get(o.id)
    let amount = 0
    let currency: string | null | undefined
    if (val && toNumber(val.value) > 0) {
      amount = toNumber(val.value)
      currency = val.currency
    } else if (toNumber(o.estimated_value) > 0) {
      amount = toNumber(o.estimated_value)
      currency = o.estimated_value_currency
    } else if (toNumber(o.acquisition_value) > 0) {
      amount = toNumber(o.acquisition_value)
      currency = o.acquisition_currency
    }
    if (amount > 0) {
      total += amount
      counted += 1
      const c = (currency || 'GBP').toUpperCase()
      currencyTally.set(c, (currencyTally.get(c) || 0) + 1)
    }
  }

  let dominantCurrency = 'GBP'
  let bestCount = -1
  for (const [c, n] of currencyTally) {
    if (n > bestCount) { dominantCurrency = c; bestCount = n }
  }

  return { total, currency: dominantCurrency, counted }
}

export function formatCollectionValue(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
