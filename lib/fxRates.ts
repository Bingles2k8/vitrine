import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Loads cached FX rates from the fx_rates table into a Map keyed `${base}:${quote}` -> rate.
 * Returns an empty Map on error, so callers fall back to raw (unconverted) sums.
 */
export async function loadFxRates(supabase: SupabaseClient): Promise<Map<string, number>> {
  const rates = new Map<string, number>()
  try {
    const { data, error } = await supabase.from('fx_rates').select('base, quote, rate')
    if (error || !data) return rates
    for (const row of data) {
      if (!row?.base || !row?.quote || row?.rate == null) continue
      const r = typeof row.rate === 'number' ? row.rate : parseFloat(String(row.rate))
      if (!Number.isFinite(r)) continue
      rates.set(`${String(row.base).toUpperCase()}:${String(row.quote).toUpperCase()}`, r)
    }
  } catch {
    return rates
  }
  return rates
}

/**
 * The museum's base display currency (first entry of display_currencies), defaulting to GBP.
 */
export function getBaseCurrency(museum: { display_currencies?: string[] | null } | null | undefined | Record<string, unknown>): string {
  const currencies = (museum as { display_currencies?: string[] | null } | null | undefined)?.display_currencies
  return (Array.isArray(currencies) ? currencies[0] : undefined) || 'GBP'
}
