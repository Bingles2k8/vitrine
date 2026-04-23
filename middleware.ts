import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// API routes that legitimately receive POST requests from external services
// or are fully public — exempt from same-origin CSRF check
const CSRF_EXEMPT_PATHS = new Set([
  '/api/stripe/webhook',   // Stripe server-to-server, verified via signature
  '/api/track-view',       // Public analytics fire-and-forget
  '/api/ticket-checkout',  // Public unauthenticated checkout
])

// Dashboard paths accessible while a museum is locked-out (payment wall).
// Everything else under /dashboard redirects to /dashboard/billing-required.
function isLockoutAllowedPath(pathname: string): boolean {
  if (pathname.startsWith('/dashboard/billing-required')) return true
  if (pathname.startsWith('/dashboard/plan')) return true
  return false
}

function isCsrfExempt(pathname: string): boolean {
  if (CSRF_EXEMPT_PATHS.has(pathname)) return true
  // Public ticket lookup/mark-used
  if (pathname.startsWith('/api/tickets/')) return true
  return false
}

// Paths that bypass the beta gate entirely
function isBetaExempt(pathname: string): boolean {
  if (pathname.startsWith('/beta')) return true
  if (pathname.startsWith('/login')) return true
  if (pathname.startsWith('/signup')) return true
  if (pathname.startsWith('/auth')) return true
  // Public API routes
  if (CSRF_EXEMPT_PATHS.has(pathname)) return true
  if (pathname.startsWith('/api/tickets/')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── CSRF protection for all state-changing API routes ──────────────
  // For POST/PUT/PATCH/DELETE requests, verify the Origin header matches
  // our own host. Browsers always send Origin for cross-origin requests,
  // so a mismatch means the request originated from a different domain.
  if (
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
    pathname.startsWith('/api/') &&
    !isCsrfExempt(pathname)
  ) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (!origin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // ── Beta gate ────────────────────────────────────────────────────────
  // Block all access unless the visitor has the beta_access cookie or is
  // already logged in. Only active when BETA_PASSWORD is set.
  if (process.env.BETA_PASSWORD && !isBetaExempt(pathname)) {
    const betaCookie = request.cookies.get('beta_access')?.value
    const hasAccess = betaCookie === process.env.BETA_PASSWORD

    if (!hasAccess) {
      // Check for an active Supabase session before redirecting
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll() },
            setAll() {},
          },
        }
      )
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        const url = new URL('/beta', request.url)
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
      }
    }
  }

  // ── Auth protection for dashboard, print, and admin routes ────────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/print') || pathname.startsWith('/admin')) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Lockout gate for dashboard: if the user's museum is locked, redirect
    // all dashboard paths except the payment-wall exceptions to /dashboard/billing-required.
    if (pathname.startsWith('/dashboard') && !isLockoutAllowedPath(pathname)) {
      // Check as owner first, then as staff member — cover both cases.
      const [ownedRes, staffRes] = await Promise.all([
        supabase.from('museums').select('locked_at').eq('owner_id', user.id).maybeSingle(),
        supabase.from('staff_members').select('museum_id').eq('user_id', user.id).maybeSingle(),
      ])

      let lockedAt: string | null = ownedRes.data?.locked_at ?? null
      if (!ownedRes.data && staffRes.data?.museum_id) {
        const { data: staffMuseum } = await supabase
          .from('museums')
          .select('locked_at')
          .eq('id', staffRes.data.museum_id)
          .maybeSingle()
        lockedAt = staffMuseum?.locked_at ?? null
      }

      if (lockedAt) {
        return NextResponse.redirect(new URL('/dashboard/billing-required', request.url))
      }
    }

    return supabaseResponse
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
}
