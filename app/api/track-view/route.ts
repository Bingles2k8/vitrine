import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicLimiter, rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const VALID_PAGE_TYPES = ['home', 'object', 'events', 'visit', 'embed'] as const

export async function POST(request: Request) {
  // Rate limit by IP — allow 60/min per IP (fire-and-forget, generous limit)
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(publicLimiter, `track:${ip}`)
  if (limited) return NextResponse.json({}, { status: 200 }) // silently ignore rate-limited views

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({}, { status: 200 })
  }

  const { museum_id, object_id, page_type } = body

  if (!museum_id || typeof museum_id !== 'string') return NextResponse.json({}, { status: 200 })
  if (!VALID_PAGE_TYPES.includes(page_type)) return NextResponse.json({}, { status: 200 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from('page_views').insert({
    museum_id,
    object_id: object_id || null,
    page_type,
  })

  return NextResponse.json({ ok: true })
}
