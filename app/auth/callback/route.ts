import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

function getSafeRedirectPath(next: string | null): string {
  if (!next) return '/dashboard'
  try {
    // Parse against a placeholder origin — if the path resolves to a different
    // origin, it's an open redirect attempt (e.g. //evil.com, /\evil.com)
    const parsed = new URL(next, 'https://placeholder.local')
    if (parsed.origin !== 'https://placeholder.local') return '/dashboard'
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return '/dashboard'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const nextParam = searchParams.get('next')
  const safePath = getSafeRedirectPath(nextParam)
  const redirectUrl = `${origin}${safePath}`

  if (code || (tokenHash && type)) {
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

    if (tokenHash && type) {
      // Token hash flow — works cross-device (no PKCE verifier needed)
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink',
      })
      if (error) {
        return NextResponse.redirect(`${origin}/login?error=auth`)
      }
    } else {
      // PKCE code exchange — standard magic link flow
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!)
      if (exchangeError) {
        return NextResponse.redirect(`${origin}/login?error=auth`)
      }
    }

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
        .maybeSingle()
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
