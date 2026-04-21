import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getPlan } from '@/lib/plans'
import { objectCreateSchema } from '@/lib/validations'
import { rateLimit, apiLimiter } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  let museumId: string | null = null
  let ownerId: string | null = null
  let plan = 'community'

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id, owner_id, plan')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museumId = ownedMuseum.id
    ownerId = ownedMuseum.owner_id
    plan = ownedMuseum.plan
  } else {
    const { data: staffRecord } = await supabase
      .from('staff_members')
      .select('museum_id, access, museums(owner_id, plan)')
      .eq('user_id', user.id)
      .in('access', ['Admin', 'Editor'])
      .maybeSingle()
    if (staffRecord) {
      museumId = staffRecord.museum_id
      const m = staffRecord.museums as any
      ownerId = m?.owner_id
      plan = m?.plan ?? 'community'
    }
  }

  if (!museumId || !ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = objectCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const planInfo = getPlan(plan)
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await service.rpc('insert_object_if_quota_ok', {
    p_museum_id: museumId,
    p_owner_id: ownerId,
    p_created_by: user.id,
    p_limit: planInfo.objects,
    p_object_data: parsed.data,
  })

  if (error) {
    if (error.message?.includes('object_limit_exceeded')) {
      return NextResponse.json({
        error: `Your ${planInfo.label} plan allows up to ${planInfo.objects?.toLocaleString()} objects. Upgrade your plan to add more.`,
        code: 'object_limit_exceeded',
      }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ object: data })
}
