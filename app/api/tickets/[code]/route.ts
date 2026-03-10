import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!code || !/^VIT-[0-9A-F]{32}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid ticket code format' }, { status: 400 })
  }

  // Rate limit by IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(apiLimiter, ip)
  if (limited) return limited

  // Use service role — ticket codes are public knowledge and the lookup must work without
  // a user session (e.g. gate staff scanning QR codes on a mobile device)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_code,
      status,
      created_at,
      order_id,
      ticket_orders (
        id,
        quantity,
        buyer_name,
        slot_id,
        museum_id,
        event_id,
        events (
          id,
          title,
          start_date,
          end_date,
          museum_id
        ),
        event_time_slots (
          id,
          start_time,
          end_time
        )
      )
    `)
    .eq('ticket_code', code)
    .maybeSingle()

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Check if the authenticated user is the museum owner — only owners can mark tickets used
  const { searchParams } = new URL(request.url)
  const markUsed = searchParams.get('mark_used') === 'true'

  if (markUsed) {
    // Require an authenticated museum owner session to mark tickets used
    const authSupabase = await createServerSideClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required to mark tickets used' }, { status: 401 })
    }

    const order = Array.isArray(ticket.ticket_orders) ? ticket.ticket_orders[0] : ticket.ticket_orders
    const museumId = order?.museum_id

    // Verify the authenticated user owns the museum this ticket belongs to,
    // or is a staff member with Admin or Editor access
    const { data: museum } = await supabase
      .from('museums')
      .select('id')
      .eq('id', museumId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!museum) {
      // Check if user is staff with Admin or Editor access
      const { data: staffMember } = await supabase
        .from('staff_members')
        .select('id')
        .eq('museum_id', museumId)
        .eq('user_id', user.id)
        .in('access', ['Admin', 'Editor'])
        .maybeSingle()

      if (!staffMember) {
        return NextResponse.json({ error: 'Not authorised to mark tickets for this museum' }, { status: 403 })
      }
    }

    if (ticket.status !== 'valid') {
      return NextResponse.json(
        { error: ticket.status === 'used' ? 'Ticket already used' : 'Ticket is not valid', ticket },
        { status: 409 }
      )
    }

    const { error: updateError } = await supabase.from('tickets').update({ status: 'used' }).eq('id', ticket.id)
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ticket: { ...ticket, status: 'used' } })
  }

  return NextResponse.json({ ticket })
}
