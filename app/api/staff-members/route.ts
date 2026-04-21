import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getPlan } from '@/lib/plans'
import { createStaffMemberSchema, parseBody } from '@/lib/validations'
import { authLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(authLimiter, `staff-create:${user.id}`)
  if (limited) return limited

  const parsed = parseBody(createStaffMemberSchema, await request.json().catch(() => null))
  if (!parsed.success) return parsed.response

  let museumId: string | null = null
  let plan = 'community'

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id, plan')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museumId = ownedMuseum.id
    plan = ownedMuseum.plan
  } else {
    const { data: adminStaff } = await supabase
      .from('staff_members')
      .select('museum_id, museums(plan)')
      .eq('user_id', user.id)
      .eq('access', 'Admin')
      .maybeSingle()
    if (adminStaff) {
      museumId = adminStaff.museum_id
      plan = (adminStaff.museums as any)?.plan ?? 'community'
    }
  }

  if (!museumId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const planInfo = getPlan(plan)
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await service.rpc('insert_staff_member_if_quota_ok', {
    p_museum_id: museumId,
    p_limit: planInfo.staff,
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_department: parsed.data.department,
    p_access: parsed.data.access,
  })

  if (error) {
    if (error.message?.includes('staff_limit_exceeded')) {
      return NextResponse.json({
        error: `Your ${planInfo.label} plan allows up to ${planInfo.staff} staff member${planInfo.staff === 1 ? '' : 's'}. Upgrade your plan to add more.`,
        code: 'staff_limit_exceeded',
      }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ staff: data })
}
