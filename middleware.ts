import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// API routes that legitimately receive POST requests from external services
// or are fully public — exempt from same-origin CSRF check
const CSRF_EXEMPT_PATHS = new Set([
  '/api/stripe/webhook',   // Stripe server-to-server, verified via signature
  '/api/track-view',       // Public analytics fire-and-forget
  '/api/ticket-checkout',  // Public unauthenticated checkout
])

function isCsrfExempt(pathname: string): boolean {
  if (CSRF_EXEMPT_PATHS.has(pathname)) return true
  // Public ticket lookup/mark-used
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
    if (origin && host) {
      try {
        if (new URL(origin).host !== host) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // ── Auth protection for dashboard and print routes ─────────────────
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/print')) {
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

    return supabaseResponse
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/dashboard/:path*', '/print/:path*', '/api/:path*'],
}
