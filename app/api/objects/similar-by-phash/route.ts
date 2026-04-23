import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { isValidPhash } from '@/lib/phash'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { museum_id, phash, exclude_object_id, threshold, limit } = body ?? {}
  if (typeof museum_id !== 'string' || !isValidPhash(phash)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { data: ownedMuseum } = await supabase
    .from('museums').select('id').eq('owner_id', user.id).eq('id', museum_id).maybeSingle()
  let authorised = !!ownedMuseum
  if (!authorised) {
    const { data: staffRecord } = await supabase
      .from('staff_members').select('museum_id, access')
      .eq('user_id', user.id).eq('museum_id', museum_id).maybeSingle()
    authorised = !!staffRecord
  }
  if (!authorised) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await service.rpc('find_similar_object_images', {
    p_museum_id: museum_id,
    p_phash: phash,
    p_threshold: Number.isInteger(threshold) ? threshold : 8,
    p_limit: Number.isInteger(limit) ? limit : 5,
    p_exclude_object_id: typeof exclude_object_id === 'string' ? exclude_object_id : null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ matches: data ?? [] })
}
