import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const { staffId, email } = await request.json()

  // Verify caller is authenticated
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
  })

  if (error && !error.message.includes('already been registered')) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Record invite timestamp
  await admin
    .from('staff_members')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', staffId)

  return NextResponse.json({ success: true })
}
