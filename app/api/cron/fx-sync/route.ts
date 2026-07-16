import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPPORTED_CURRENCIES } from '@/lib/fx'

// Daily FX sync. Pulls rates from Frankfurter (free, no key), falling back to
// exchangerate.host. Upserts base-quote pairs for every supported currency.
// Runs via vercel.json cron, gated by CRON_SECRET.
//
// NOTE: this only runs if CRON_SECRET is set in the environment — Vercel only
// attaches the Bearer header when that variable exists, and without it the
// guard below rejects every invocation.

export const dynamic = 'force-dynamic'

type ProviderRates = Record<string, number>

// Canonical host: api.frankfurter.app 301-redirects here.
async function fromFrankfurter(base: string, symbols: string[]): Promise<ProviderRates | null> {
  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=${base}&symbols=${symbols.join(',')}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: { rates?: ProviderRates } | null = await res.json()
    if (!json?.rates) return null
    return json.rates as ProviderRates
  } catch {
    return null
  }
}

// Secondary. Free tier now requires access_key; without EXCHANGERATE_HOST_KEY
// this returns an error payload with no `rates`, and we fall through to null.
async function fromExchangerateHost(base: string, symbols: string[]): Promise<ProviderRates | null> {
  try {
    const key = process.env.EXCHANGERATE_HOST_KEY
    const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols.join(',')}${key ? `&access_key=${key}` : ''}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: { rates?: ProviderRates } | null = await res.json()
    if (!json?.rates) return null
    return json.rates as ProviderRates
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const authz = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authz !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const rows: { base: string; quote: string; rate: number; fetched_at: string }[] = []
  const now = new Date().toISOString()
  const failed: string[] = []

  for (const base of SUPPORTED_CURRENCIES) {
    const targets = SUPPORTED_CURRENCIES.filter(c => c !== base)
    const primary = await fromFrankfurter(base, [...targets])
    const rates = primary ?? await fromExchangerateHost(base, [...targets])
    if (!rates) { failed.push(base); continue }
    for (const quote of targets) {
      const rate = rates[quote]
      if (!Number.isFinite(rate) || rate <= 0) continue
      rows.push({ base, quote, rate, fetched_at: now })
    }
  }

  if (rows.length === 0) {
    return NextResponse.json({ upserted: 0, failed }, { status: 502 })
  }

  const { error } = await service.from('fx_rates').upsert(rows, { onConflict: 'base,quote' })
  if (error) return NextResponse.json({ error: error.message, failed }, { status: 500 })
  return NextResponse.json({ upserted: rows.length, failed })
}
