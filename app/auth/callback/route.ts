import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createServerSideClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Link user_id to staff_members record if this is an invited staff member
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: staffRecord } = await admin
        .from('staff_members')
        .select('id')
        .eq('email', user.email)
        .is('user_id', null)
        .single()
      if (staffRecord) {
        await admin
          .from('staff_members')
          .update({ user_id: user.id })
          .eq('id', staffRecord.id)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
