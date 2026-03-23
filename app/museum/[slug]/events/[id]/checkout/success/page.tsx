import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import TicketQRCodes from './TicketQRCodes'
import ProcessingState from './ProcessingState'
import { stripe } from '@/lib/stripe'
import { generateTicketCode } from '@/lib/ticket-utils'
import { Resend } from 'resend'

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { slug, id } = await params
  const { session_id } = await searchParams
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, event_type, start_date, end_date, location')
    .eq('id', id)
    .eq('museum_id', museum.id)
    .single()

  if (!event) notFound()

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  let tickets: { ticket_code: string; status: string }[] = []
  let order: any = null

  if (session_id) {
    const { data: o } = await serviceSupabase
      .from('ticket_orders')
      .select('id, buyer_name, buyer_email, quantity, status, slot_id')
      .eq('stripe_checkout_session_id', session_id)
      .eq('event_id', event.id)
      .single()

    if (o) {
      order = o
      const { data: t } = await serviceSupabase
        .from('tickets')
        .select('ticket_code, status')
        .eq('order_id', o.id)
      tickets = t || []
    }

    // Webhook fallback: if order is pending, verify payment directly with Stripe
    // and complete the order here. This handles cases where the webhook is delayed
    // or misconfigured.
    if (order?.status === 'pending' && tickets.length === 0) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(session_id)
        if (stripeSession.payment_status === 'paid') {
          // Idempotency: check again inside the guard (parallel renders)
          const { count: existing } = await serviceSupabase
            .from('tickets')
            .select('id', { count: 'exact', head: true })
            .eq('order_id', order.id)

          if (!existing || existing === 0) {
            const { data: slotSuccess } = await serviceSupabase.rpc('increment_slot_bookings', {
              slot_uuid: order.slot_id,
              qty: order.quantity,
            })

            if (slotSuccess) {
              const newTickets = Array.from({ length: order.quantity }, () => ({
                order_id: order.id,
                ticket_code: generateTicketCode(),
                status: 'valid',
              }))
              const { error: ticketError } = await serviceSupabase.from('tickets').insert(newTickets)

              if (!ticketError) {
                const paymentIntentId = typeof stripeSession.payment_intent === 'string'
                  ? stripeSession.payment_intent
                  : stripeSession.payment_intent?.id ?? null

                await serviceSupabase
                  .from('ticket_orders')
                  .update({ status: 'completed', stripe_payment_intent_id: paymentIntentId })
                  .eq('id', order.id)

                tickets = newTickets.map(t => ({ ticket_code: t.ticket_code, status: t.status }))
                order = { ...order, status: 'completed' }

                // Send confirmation email (non-critical)
                if (order.buyer_email) {
                  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrine.museum'
                  const { data: slotData } = await serviceSupabase
                    .from('event_time_slots')
                    .select('start_time, end_time')
                    .eq('id', order.slot_id)
                    .single()
                  const slotLine = slotData
                    ? `<p style="color:#666;margin:0 0 16px">${new Date(slotData.start_time).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${new Date(slotData.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>`
                    : ''
                  const ticketLines = newTickets
                    .map(t => `<p style="margin:0 0 8px;font-family:monospace"><a href="${siteUrl}/verify/${t.ticket_code}" style="color:#000">${t.ticket_code}</a></p>`)
                    .join('')
                  const resend = new Resend(process.env.RESEND_API_KEY)
                  await resend.emails.send({
                    from: 'Vitrine <noreply@contact.vitrinecms.com>',
                    to: order.buyer_email,
                    subject: `Your tickets for ${esc(event.title)}`,
                    html: `
                      <p>Hi ${esc(order.buyer_name)},</p>
                      <p>Your booking is confirmed! Here are your tickets for <strong>${esc(event.title)}</strong>.</p>
                      ${slotLine}
                      <div style="margin:16px 0">${ticketLines}</div>
                      <p style="color:#666;font-size:13px">Scan these codes at the door.</p>
                      <p style="margin:24px 0 0"><a href="${siteUrl}/museum/${slug}/events/${id}/checkout/success?session_id=${session_id}" style="color:#666;font-size:13px">View your booking →</a></p>
                      <p style="margin-top:24px">See you there!<br>— ${esc(museum.name ?? 'The Vitrine team')}</p>
                    `,
                  }).catch(err => console.error('[success-page] Failed to send confirmation email:', err))
                }
              } else {
                // Ticket insert failed — release the capacity we incremented
                await serviceSupabase.rpc('decrement_slot_bookings', { slot_uuid: order.slot_id, qty: order.quantity })
                console.error('[success-page] Failed to insert tickets for order', order.id, ticketError)
              }
            } else {
              // Slot is full — cancel the order
              await serviceSupabase
                .from('ticket_orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id)
              order = { ...order, status: 'cancelled' }
            }
          } else {
            // Tickets were already generated (race condition) — just fetch them
            const { data: t } = await serviceSupabase
              .from('tickets')
              .select('ticket_code, status')
              .eq('order_id', order.id)
            tickets = t || []
            order = { ...order, status: 'completed' }
          }
        }
      } catch (err) {
        console.error('[success-page] Stripe verification failed:', err)
      }
    }
  }

  let slotInfo: { start_time: string; end_time: string } | null = null
  if (order?.slot_id) {
    const { data: s } = await serviceSupabase
      .from('event_time_slots')
      .select('start_time, end_time')
      .eq('id', order.slot_id)
      .single()
    slotInfo = s
  }

  function formatDateRange(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    if (start === end) return s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} — ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  let icsUrl = ''
  if (slotInfo) {
    const start = new Date(slotInfo.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const end = new Date(slotInfo.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
      `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\n')
    icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  }

  const processing = order?.status === 'pending' || (!order && session_id)
  const { accent, content, headingStyle } = getMuseumStyles(museum)

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      {processing ? (
        <ProcessingState
          headingStyle={headingStyle}
          headingColor={content.heading}
          mutedColor={content.muted}
        />
      ) : tickets.length > 0 ? (
        <>
          <div className="text-center mb-8">
            <div className="text-5xl mb-5">✓</div>
            <h1 className="text-3xl mb-3" style={{ ...headingStyle, color: content.heading }}>Booking Confirmed</h1>
            <p className="text-sm" style={{ color: content.muted }}>Thank you for your booking! Here are your ticket details.</p>
          </div>

          <div className="border rounded-lg p-6 mb-6" style={{ borderColor: content.border, background: content.cardBg }}>
            <div className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>Event</div>
            <h2 className="text-xl mb-1" style={{ ...headingStyle, color: content.heading }}>{event.title}</h2>
            <p className="text-sm" style={{ color: content.body }}>{formatDateRange(event.start_date, event.end_date)}</p>
            {event.location && <p className="text-sm mt-1" style={{ color: content.muted }}>{event.location}</p>}
            {slotInfo && (
              <p className="text-sm font-mono mt-2" style={{ color: content.body }}>
                {new Date(slotInfo.start_time).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {' — '}
                {new Date(slotInfo.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div className="space-y-3 mb-6">
            <div className="text-xs uppercase tracking-widest font-mono" style={{ color: content.muted }}>Your Tickets</div>
            {tickets.map(t => (
              <div key={t.ticket_code} className="border rounded-lg px-5 py-4" style={{ borderColor: content.border, background: content.cardBg }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-lg" style={{ color: content.heading }}>{t.ticket_code}</span>
                  <span className="text-xs font-mono uppercase" style={{ color: 'rgb(52,211,153)' }}>{t.status}</span>
                </div>
                <TicketQRCodes tickets={[t]} />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {icsUrl && (
              <a href={icsUrl} download={`${event.title}.ics`}
                className="text-xs font-mono px-4 py-2.5 rounded border transition-colors"
                style={{ borderColor: content.border, color: content.body }}>
                Add to calendar
              </a>
            )}
            <Link href={`/museum/${slug}/events`}
              className="text-xs font-mono px-4 py-2.5 rounded transition-colors text-white"
              style={{ background: accent }}>
              Back to events →
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-5">◎</div>
          <h1 className="text-3xl mb-3" style={{ ...headingStyle, color: content.heading }}>Booking not found</h1>
          <p className="text-sm mb-6" style={{ color: content.muted }}>We couldn&apos;t find this booking. Please check your email for confirmation.</p>
          <Link href={`/museum/${slug}/events`} className="text-sm font-mono transition-colors" style={{ color: content.muted }}>
            Back to events →
          </Link>
        </div>
      )}
    </div>
  )
}
