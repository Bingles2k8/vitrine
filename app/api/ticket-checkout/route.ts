import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { ticketCheckoutSchema, parseBody } from '@/lib/validations'
import { publicLimiter, rateLimit } from '@/lib/rate-limit'
import { generateTicketCode } from '@/lib/ticket-utils'
import { getPlan } from '@/lib/plans'
import { headers } from 'next/headers'
import { Resend } from 'resend'

export async function POST(request: Request) {
  // Rate limit by IP since this is a public endpoint
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(publicLimiter, ip)
  if (limited) return limited

  const parsed = parseBody(ticketCheckoutSchema, await request.json())
  if (!parsed.success) return parsed.response
  const { eventId, slotId, quantity, buyerName, buyerEmail } = parsed.data

  // Use service role — public endpoint, no user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch event and verify it's published
  const { data: event } = await supabase
    .from('events')
    .select('id, museum_id, title, price_cents, currency, status')
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Fetch slot and verify capacity
  const { data: slot } = await supabase
    .from('event_time_slots')
    .select('id, event_id, capacity, booked_count, start_time, end_time, open_entry')
    .eq('id', slotId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (!slot) return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
  const now = new Date()
  const slotStarted = new Date(slot.start_time) <= now
  const slotEnded = new Date(slot.end_time) <= now
  if (slotEnded || (!slot.open_entry && slotStarted)) {
    return NextResponse.json({ error: 'This time slot has already passed' }, { status: 409 })
  }
  if (slot.booked_count + quantity > slot.capacity) {
    return NextResponse.json({ error: 'Not enough capacity' }, { status: 409 })
  }

  // Fetch museum for plan check and Stripe Connect info
  const { data: museum } = await supabase
    .from('museums')
    .select('id, name, slug, plan, stripe_connect_id, stripe_connect_onboarded')
    .eq('id', event.museum_id)
    .maybeSingle()

  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })

  if (!getPlan(museum.plan).ticketing) {
    return NextResponse.json({ error: 'Ticketing not available' }, { status: 403 })
  }

  const totalCents = event.price_cents * quantity
  const platformFeeCents = Math.round(totalCents * 0.02)

  // For paid events, verify Stripe Connect is set up before creating an order.
  // This prevents orphaned cancelled orders accumulating when the museum isn't onboarded.
  if (totalCents > 0 && (!museum.stripe_connect_id || !museum.stripe_connect_onboarded)) {
    return NextResponse.json({ error: 'Museum not set up for payments' }, { status: 400 })
  }

  // Create pending order — always starts as pending, completed only after tickets generated
  const { data: order, error: orderError } = await supabase
    .from('ticket_orders')
    .insert({
      event_id: eventId,
      slot_id: slotId,
      museum_id: museum.id,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      quantity,
      amount_cents: totalCents,
      platform_fee_cents: platformFeeCents,
      currency: event.currency,
      status: 'pending',
    })
    .select('id')
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }

  // Free event — complete immediately
  if (totalCents === 0) {
    // Atomically increment slot bookings
    const { data: success, error: rpcError } = await supabase.rpc('increment_slot_bookings', {
      slot_uuid: slotId,
      qty: quantity,
    })

    if (rpcError) console.error('[ticket-checkout] RPC error:', rpcError)
    if (!success) {
      await supabase.from('ticket_orders').update({ status: 'cancelled' }).eq('id', order.id)
      return NextResponse.json({ error: 'Slot is now full' }, { status: 409 })
    }

    // Generate tickets
    const tickets = Array.from({ length: quantity }, () => ({
      order_id: order.id,
      ticket_code: generateTicketCode(),
      status: 'valid',
    }))
    const { error: ticketError } = await supabase.from('tickets').insert(tickets)

    if (ticketError) {
      // Rollback: release the slot and cancel the order
      await supabase.rpc('decrement_slot_bookings', { slot_uuid: slotId, qty: quantity })
      await supabase.from('ticket_orders').update({ status: 'cancelled' }).eq('id', order.id)
      console.error('[ticket-checkout] Failed to insert tickets:', ticketError)
      return NextResponse.json({ error: 'Failed to generate tickets' }, { status: 500 })
    }

    // Mark order completed now that tickets exist
    await supabase.from('ticket_orders').update({ status: 'completed' }).eq('id', order.id)

    // Log activity (non-critical, ignore errors)
    await supabase.from('activity_log').insert({
      museum_id: museum.id,
      action_type: 'ticket_sold',
      description: `${quantity} free ticket(s) booked for "${event.title}" — ${buyerName}`,
    })

    // Send confirmation email to buyer (non-critical)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
    const { data: slot } = await supabase
      .from('event_time_slots')
      .select('start_time, end_time')
      .eq('id', slotId)
      .maybeSingle()
    const slotLine = slot
      ? `<p style="color:#666;margin:0 0 16px">${new Date(slot.start_time).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${new Date(slot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>`
      : ''
    const ticketLines = tickets
      .map(t => `<p style="margin:0 0 8px;font-family:monospace"><a href="${siteUrl}/verify/${t.ticket_code}" style="color:#000">${t.ticket_code}</a></p>`)
      .join('')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Vitrine <noreply@contact.vitrinecms.com>',
      to: buyerEmail,
      subject: `Your tickets for ${event.title}`,
      html: `
        <p>Hi ${buyerName},</p>
        <p>Your booking is confirmed! Here are your tickets for <strong>${event.title}</strong>.</p>
        ${slotLine}
        <div style="margin:16px 0">${ticketLines}</div>
        <p style="color:#666;font-size:13px">Scan these codes at the door. Each link shows the full ticket details.</p>
        <p style="margin-top:24px">See you there!<br>— ${museum.name ?? 'The Vitrine team'}</p>
      `,
    }).catch(err => console.error('[ticket-checkout] Failed to send confirmation email:', err))

    return NextResponse.json({
      success: true,
      orderId: order.id,
      tickets: tickets.map(t => t.ticket_code),
    })
  }

  // Paid event — create Stripe Checkout session
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: event.currency,
        unit_amount: event.price_cents,
        product_data: { name: `${event.title} — Ticket` },
      },
      quantity,
    }],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      on_behalf_of: museum.stripe_connect_id,
      transfer_data: { destination: museum.stripe_connect_id },
    },
    customer_email: buyerEmail,
    metadata: { order_id: order.id, museum_id: museum.id },
    success_url: `${siteUrl}/museum/${museum.slug}/events/${eventId}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/museum/${museum.slug}/events/${eventId}`,
  })

  // Store checkout session ID on the order
  await supabase
    .from('ticket_orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id)

  return NextResponse.json({ url: session.url })
}
