import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { staffId, email } = await request.json()

  // Verify caller is authenticated
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Determine which museum the caller manages (as owner or Admin staff)
  let museumId: string | null = null

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museumId = ownedMuseum.id
  } else {
    // Check if they are an Admin-level staff member
    const { data: adminStaff } = await supabase
      .from('staff_members')
      .select('museum_id')
      .eq('user_id', user.id)
      .eq('access', 'Admin')
      .maybeSingle()
    if (adminStaff) museumId = adminStaff.museum_id
  }

  if (!museumId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Verify the staffId belongs to this museum
  const { data: staffRecord } = await supabase
    .from('staff_members')
    .select('id')
    .eq('id', staffId)
    .eq('museum_id', museumId)
    .maybeSingle()
  if (!staffRecord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
  })

  const alreadyRegistered = error?.message?.includes('already been registered')
  if (error && !alreadyRegistered) {
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 400 })
  }

  // Only record invite timestamp if the invite was actually sent
  if (!error) {
    await admin
      .from('staff_members')
      .update({ invited_at: new Date().toISOString() })
      .eq('id', staffId)
  }

  return NextResponse.json({ success: true })
}
