import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
    .select('id, slug, name, logo_emoji')
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

  // Find the order by Stripe session ID
  let tickets: { ticket_code: string; status: string }[] = []
  let order: any = null

  if (session_id) {
    const { data: o } = await supabase
      .from('ticket_orders')
      .select('id, buyer_name, quantity, status, slot_id')
      .eq('stripe_checkout_session_id', session_id)
      .single()

    if (o) {
      order = o
      const { data: t } = await supabase
        .from('tickets')
        .select('ticket_code, status')
        .eq('order_id', o.id)
      tickets = t || []
    }
  }

  // Get the slot info for calendar
  let slotInfo: { start_time: string; end_time: string } | null = null
  if (order?.slot_id) {
    const { data: s } = await supabase
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

  // Build .ics calendar data
  let icsUrl = ''
  if (slotInfo) {
    const start = new Date(slotInfo.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const end = new Date(slotInfo.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\n')
    icsUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`
  }

  const processing = order?.status === 'pending' || (!order && session_id)

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-stone-200 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/museum/${slug}`} className="font-serif text-2xl italic text-stone-900">
            {museum.logo_emoji} {museum.name}
          </Link>
          <div className="flex items-center gap-8">
            <Link href={`/museum/${slug}`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">Collection</Link>
            <Link href={`/museum/${slug}/events`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">Events</Link>
            <Link href={`/museum/${slug}/visit`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">Plan Your Visit</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        {processing ? (
          <div className="text-center">
            <div className="text-5xl mb-5">⏳</div>
            <h1 className="font-serif text-3xl italic text-stone-900 mb-3">Processing your booking</h1>
            <p className="text-sm text-stone-400 mb-6">Your payment is being confirmed. This usually takes a few seconds. Please refresh this page shortly.</p>
            <Link href={`/museum/${slug}/events/${id}/checkout/success?session_id=${session_id}`}
              className="text-sm font-mono text-stone-500 hover:text-stone-900 transition-colors">
              Refresh →
            </Link>
          </div>
        ) : tickets.length > 0 ? (
          <>
            <div className="text-center mb-8">
              <div className="text-5xl mb-5">✓</div>
              <h1 className="font-serif text-3xl italic text-stone-900 mb-3">Booking Confirmed</h1>
              <p className="text-sm text-stone-400">Thank you for your booking! Here are your ticket details.</p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 mb-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">Event</div>
              <h2 className="font-serif text-xl italic text-stone-900 mb-1">{event.title}</h2>
              <p className="text-sm text-stone-500">{formatDateRange(event.start_date, event.end_date)}</p>
              {event.location && <p className="text-sm text-stone-400 mt-1">{event.location}</p>}
              {slotInfo && (
                <p className="text-sm font-mono text-stone-500 mt-2">
                  {new Date(slotInfo.start_time).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(slotInfo.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-xs uppercase tracking-widest text-stone-400">Your Tickets</div>
              {tickets.map(t => (
                <div key={t.ticket_code} className="bg-white border border-stone-200 rounded-lg px-5 py-4 flex items-center justify-between">
                  <span className="font-mono text-lg text-stone-900">{t.ticket_code}</span>
                  <span className="text-xs font-mono text-emerald-600 uppercase">{t.status}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {icsUrl && (
                <a href={icsUrl} download={`${event.title}.ics`}
                  className="text-xs font-mono px-4 py-2.5 rounded border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors">
                  Add to calendar
                </a>
              )}
              <Link href={`/museum/${slug}/events`}
                className="text-xs font-mono px-4 py-2.5 rounded bg-stone-900 text-white hover:bg-stone-700 transition-colors">
                Back to events →
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-5">◎</div>
            <h1 className="font-serif text-3xl italic text-stone-900 mb-3">Booking not found</h1>
            <p className="text-sm text-stone-400 mb-6">We couldn't find this booking. Please check your email for confirmation.</p>
            <Link href={`/museum/${slug}/events`} className="text-sm font-mono text-stone-500 hover:text-stone-900 transition-colors">
              Back to events →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
