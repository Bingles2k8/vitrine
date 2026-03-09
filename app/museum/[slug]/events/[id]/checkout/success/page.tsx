import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import TicketQRCodes from './TicketQRCodes'

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
      .select('id, buyer_name, quantity, status, slot_id')
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
        <div className="text-center">
          <div className="text-5xl mb-5">⏳</div>
          <h1 className="text-3xl mb-3" style={{ ...headingStyle, color: content.heading }}>Processing your booking</h1>
          <p className="text-sm mb-6" style={{ color: content.muted }}>Your payment is being confirmed. This usually takes a few seconds. Please refresh this page shortly.</p>
          <Link href={`/museum/${slug}/events/${id}/checkout/success?session_id=${session_id}`}
            className="text-sm font-mono transition-colors" style={{ color: content.muted }}>
            Refresh →
          </Link>
        </div>
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
