import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { checkSlugSchema } from '@/lib/validations'
import { publicLimiter, rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const limited = await rateLimit(publicLimiter, `slug:${ip}`)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const parsed = checkSlugSchema.safeParse({ slug: searchParams.get('slug') })
  if (!parsed.success) {
    return NextResponse.json({ available: false })
  }
  const { slug } = parsed.data

  const supabase = await createServerSideClient()

  const { data } = await supabase
    .from('museums')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
