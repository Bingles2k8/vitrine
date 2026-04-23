import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

// #2 Barcode lookup — cascades OpenLibrary (ISBN) → MusicBrainz (UPC/EAN) →
// UPCItemDB (general UPC fallback). All providers are free and keyless.
// Normalises each response to {title, artist?, year?, medium?, description?, image_url?, source}.

export const dynamic = 'force-dynamic'

const lookupSchema = z.object({
  code: z.string().min(4).max(64).regex(/^[0-9A-Z-]+$/i, 'Invalid barcode'),
  format: z.string().max(32).optional(),
})

type Normalised = {
  title: string
  artist?: string | null
  year?: string | null
  medium?: string | null
  description?: string | null
  image_url?: string | null
  source: string
}

function stripIsbnHyphens(code: string): string {
  return code.replace(/[^0-9X]/gi, '').toUpperCase()
}

function looksLikeIsbn(code: string): boolean {
  const c = stripIsbnHyphens(code)
  if (c.length === 10) return /^[0-9]{9}[0-9X]$/.test(c)
  if (c.length === 13) return /^(978|979)[0-9]{10}$/.test(c)
  return false
}

async function tryOpenLibrary(code: string): Promise<Normalised | null> {
  try {
    const isbn = stripIsbnHyphens(code)
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: any = await res.json()
    const entry = json?.[`ISBN:${isbn}`]
    if (!entry?.title) return null
    const authors = Array.isArray(entry.authors) ? entry.authors.map((a: any) => a.name).filter(Boolean).join(', ') : null
    const year = entry.publish_date ? String(entry.publish_date).match(/\d{4}/)?.[0] : null
    return {
      title: String(entry.title),
      artist: authors || null,
      year: year || null,
      medium: 'Book',
      description: entry.subtitle || null,
      image_url: entry.cover?.large || entry.cover?.medium || entry.cover?.small || null,
      source: 'OpenLibrary',
    }
  } catch {
    return null
  }
}

async function tryMusicBrainz(code: string): Promise<Normalised | null> {
  try {
    const url = `https://musicbrainz.org/ws/2/release/?query=barcode:${encodeURIComponent(code)}&fmt=json&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': 'Vitrine/1.0 (support@vitrinecms.com)' }, next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: any = await res.json()
    const release = Array.isArray(json?.releases) ? json.releases[0] : null
    if (!release?.title) return null
    const artist = Array.isArray(release['artist-credit']) ? release['artist-credit'].map((a: any) => a.name || a?.artist?.name).filter(Boolean).join(', ') : null
    const year = release.date ? String(release.date).match(/\d{4}/)?.[0] : null
    return {
      title: String(release.title),
      artist: artist || null,
      year: year || null,
      medium: 'Audio recording',
      description: release.country ? `Released in ${release.country}` : null,
      image_url: null,
      source: 'MusicBrainz',
    }
  } catch {
    return null
  }
}

async function tryUpcItemDb(code: string): Promise<Normalised | null> {
  try {
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return null
    const json: any = await res.json()
    const item = Array.isArray(json?.items) ? json.items[0] : null
    if (!item?.title) return null
    return {
      title: String(item.title),
      artist: item.brand || null,
      year: null,
      medium: item.category || null,
      description: item.description || null,
      image_url: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null,
      source: 'UPCItemDB',
    }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, `barcode:${user.id}`)
  if (limited) return limited

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = lookupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { code, format } = parsed.data

  const providers: Array<() => Promise<Normalised | null>> = []
  if (format === 'isbn' || looksLikeIsbn(code)) providers.push(() => tryOpenLibrary(code))
  providers.push(() => tryMusicBrainz(code))
  providers.push(() => tryUpcItemDb(code))

  for (const p of providers) {
    const result = await p()
    if (result) return NextResponse.json({ match: result })
  }
  return NextResponse.json({ match: null })
}
