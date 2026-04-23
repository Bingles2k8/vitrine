import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPPORTED_CURRENCIES } from '@/lib/fx'

// Daily FX sync. Pulls rates from exchangerate.host (free, no key) with a
// Frankfurter fallback, then upserts base-quote pairs for every supported
// currency. Runs via vercel.json cron, gated by CRON_SECRET.

export const dynamic = 'force-dynamic'

type ProviderRates = Record<string, number>

async function fromExchangerateHost(base: string, symbols: string[]): Promise<ProviderRates | null> {
  try {
    const url = `https://api.exchangerate.host/latest?base=${base}&symbols=${symbols.join(',')}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: any = await res.json()
    if (!json?.rates) return null
    return json.rates as ProviderRates
  } catch {
    return null
  }
}

async function fromFrankfurter(base: string, symbols: string[]): Promise<ProviderRates | null> {
  try {
    const url = `https://api.frankfurter.app/latest?from=${base}&to=${symbols.join(',')}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: any = await res.json()
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
    const primary = await fromExchangerateHost(base, [...targets])
    const rates = primary ?? await fromFrankfurter(base, [...targets])
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
