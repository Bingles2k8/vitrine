import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function VerifyTicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  if (!code || !/^VIT-[0-9A-F]{32}$/i.test(code)) notFound()

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: ticket } = await serviceClient
    .from('tickets')
    .select('id, ticket_code, status, created_at, ticket_orders(buyer_name, quantity, events(title, start_date, end_date, location), event_time_slots(start_time, end_time))')
    .eq('ticket_code', code)
    .single()

  if (!ticket) notFound()

  const order = ticket.ticket_orders as any
  const event = order?.events as any
  const slot = order?.event_time_slots as any

  const isValid = ticket.status === 'valid'
  const isUsed = ticket.status === 'used'

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full overflow-hidden">
        {/* Status banner */}
        <div className={`px-6 py-5 text-center ${isValid ? 'bg-emerald-600' : isUsed ? 'bg-amber-500' : 'bg-red-500'}`}>
          <div className="text-4xl mb-2">{isValid ? '✓' : isUsed ? '◎' : '✗'}</div>
          <div className="text-white font-mono text-lg font-bold">
            {isValid ? 'Valid Ticket' : isUsed ? 'Already Used' : 'Invalid Ticket'}
          </div>
          <div className="text-white/80 text-xs font-mono mt-1">{ticket.ticket_code}</div>
        </div>

        {/* Ticket details */}
        <div className="p-6 space-y-4">
          {event && (
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 font-mono mb-1">Event</div>
              <div className="font-medium text-stone-900">{event.title}</div>
              {slot && (
                <div className="text-sm text-stone-500 font-mono mt-0.5">
                  {new Date(slot.start_time).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' — '}
                  {new Date(slot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {event.location && <div className="text-sm text-stone-400 mt-0.5">{event.location}</div>}
            </div>
          )}

          {order?.buyer_name && (
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 font-mono mb-1">Name</div>
              <div className="text-stone-900">{order.buyer_name}</div>
            </div>
          )}

          <div>
            <div className="text-xs uppercase tracking-widest text-stone-400 font-mono mb-1">Status</div>
            <span className={`text-xs font-mono px-2 py-1 rounded-full ${isValid ? 'bg-emerald-50 text-emerald-700' : isUsed ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
              {ticket.status}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="text-xs text-stone-400 text-center font-mono">
            Vitrine Ticketing
          </div>
        </div>
      </div>
    </div>
  )
}
