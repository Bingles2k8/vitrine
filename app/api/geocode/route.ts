import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

// Nominatim geocoder proxy. Rate-limited aggressively because Nominatim's
// terms cap us at 1 request per second per IP. Forwards the request with a
// proper User-Agent header as Nominatim requires.

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, `geocode:${user.id}`)
  if (limited) return limited

  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim()
  if (!q || q.length < 2 || q.length > 200) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  try {
    const nom = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`
    const res = await fetch(nom, {
      headers: { 'User-Agent': 'Vitrine/1.0 (support@vitrinecms.com)' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    const json: any[] = await res.json()
    const results = (json || []).slice(0, 5).map(r => ({
      display_name: String(r.display_name || ''),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      country_code: (r.address?.country_code || '').toString().toUpperCase() || null,
    })).filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lng))
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Geocode failed' }, { status: 502 })
  }
}
