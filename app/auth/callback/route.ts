import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const redirectUrl = `${origin}${next}`

  if (code) {
    // Create the redirect response first so we can write cookies directly onto it
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

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

    return response
  }

  return NextResponse.redirect(redirectUrl)
}
