import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { publicLimiter, rateLimit } from '@/lib/rate-limit'
import { trackViewSchema } from '@/lib/validations'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  // Rate limit by IP — allow 60/min per IP (fire-and-forget, generous limit)
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(publicLimiter, `track:${ip}`)
  if (limited) return NextResponse.json({}, { status: 200 }) // silently ignore rate-limited views

  const raw = await request.json().catch(() => null)
  const result = trackViewSchema.safeParse(raw)
  if (!result.success) return NextResponse.json({}, { status: 200 })
  const { museum_id, object_id, page_type } = result.data

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verify the museum exists before inserting. The INSERT RLS policy on page_views is
  // public (so browsers can ping anonymously), which means application-level validation
  // is the only guard against analytics pollution with arbitrary UUIDs.
  const { data: museum } = await supabase
    .from('museums')
    .select('id')
    .eq('id', museum_id)
    .maybeSingle()
  if (!museum) return NextResponse.json({}, { status: 200 })

  await supabase.from('page_views').insert({
    museum_id,
    object_id: object_id ?? null,
    page_type,
  })

  return NextResponse.json({ ok: true })
}
