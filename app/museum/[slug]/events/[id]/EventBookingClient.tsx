'use client'

import { useState } from 'react'
import { getMuseumStyles } from '@/lib/museum-styles'
import TicketQRCodes from './checkout/success/TicketQRCodes'

interface Event {
  id: string
  museum_id: string
  title: string
  event_type: string
  description: string | null
  start_date: string
  end_date: string
  location: string | null
  image_url: string | null
  price_cents: number
  currency: string
  status: string
}

interface TimeSlot {
  id: string
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  open_entry: boolean
}

interface Props {
  event: Event
  museum: any
  slots: TimeSlot[]
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return 'Free'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
}

function formatSlotTime(dt: string) {
  return new Date(dt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatSlotEnd(dt: string) {
  return new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function EventBookingClient({ event, museum, slots }: Props) {
  const { accent, content, headingStyle } = getMuseumStyles(museum)
  const canAcceptPayments = event.price_cents === 0 || museum.stripe_connect_onboarded

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ tickets: string[] } | null>(null)
  const [error, setError] = useState('')

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !buyerName.trim() || !buyerEmail.trim()) return
    setBooking(true)
    setError('')

    try {
      const res = await fetch('/api/ticket-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          slotId: selectedSlot,
          quantity,
          buyerName: buyerName.trim(),
          buyerEmail: buyerEmail.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        setBooking(false)
        return
      }

      if (data.success && data.tickets) {
        setBookingResult({ tickets: data.tickets })
        setBooking(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      setBooking(false)
    } catch {
      setError('Something went wrong. Please try again.')
      setBooking(false)
    }
  }

  return (
    <>
      {bookingResult && (
        <div className="border rounded-lg p-8 mb-12" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)' }}>
          <div className="text-2xl mb-3">✓</div>
          <h2 className="text-2xl mb-2" style={{ ...headingStyle, color: content.heading }}>Booking Confirmed</h2>
          <p className="text-sm mb-4" style={{ color: content.body }}>Your tickets have been booked. Please save your ticket codes:</p>
          <div className="space-y-4">
            {bookingResult.tickets.map(code => (
              <div key={code} className="border rounded px-4 py-4" style={{ borderColor: 'rgba(52,211,153,0.3)', background: content.cardBg }}>
                <div className="font-mono text-sm mb-3" style={{ color: content.heading }}>{code}</div>
                <TicketQRCodes tickets={[{ ticket_code: code, status: 'valid' }]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!bookingResult && canAcceptPayments && slots.length > 0 && (
        <div className="border rounded-lg p-8" style={{ borderColor: content.border, background: content.cardBg }}>
          <h2 className="text-2xl mb-6" style={{ ...headingStyle, color: content.heading }}>Book Tickets</h2>

          <form onSubmit={handleBook} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: content.muted }}>Select a time slot</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {slots.map(slot => {
                  const now = new Date()
                  const started = new Date(slot.start_time) <= now
                  const ended = new Date(slot.end_time) <= now
                  const remaining = slot.capacity - slot.booked_count
                  const soldOut = remaining <= 0
                  const bookable = !ended && (!started || slot.open_entry)
                  const isSelected = selectedSlot === slot.id
                  const subLabel = soldOut ? 'Sold Out'
                    : ended ? 'Ended'
                    : started && !slot.open_entry ? 'In Progress'
                    : `${remaining} spot${remaining === 1 ? '' : 's'} remaining`
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={soldOut || !bookable}
                      onClick={() => setSelectedSlot(slot.id)}
                      className="text-left border rounded-lg p-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: isSelected ? accent : content.border,
                        background: isSelected ? content.inputBg : 'transparent',
                      }}
                    >
                      <div className="text-sm font-mono" style={{ color: content.heading }}>
                        {formatSlotTime(slot.start_time)} — {formatSlotEnd(slot.end_time)}
                      </div>
                      <div className="text-xs mt-1" style={{ color: content.muted }}>
                        {subLabel}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedSlot && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>Quantity</label>
                    <select value={quantity} onChange={e => setQuantity(parseInt(e.target.value))}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor: content.border, background: content.inputBg, color: content.heading }}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>Your Name</label>
                    <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} required
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor: content.border, background: content.inputBg, color: content.heading }} />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>Email</label>
                    <input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor: content.border, background: content.inputBg, color: content.heading }} />
                  </div>
                </div>

                {error && (
                  <div className="text-sm rounded px-4 py-3" style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)' }}>{error}</div>
                )}

                <div className="space-y-3">
                  {event.price_cents > 0 ? (
                    <>
                      <div className="text-sm space-y-1.5" style={{ color: content.body }}>
                        <div className="flex justify-between">
                          <span>Tickets ({quantity} × {formatPrice(event.price_cents, event.currency)})</span>
                          <span className="font-mono">{formatPrice(event.price_cents * quantity, event.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Booking fee</span>
                          <span className="font-mono">{formatPrice(Math.round(event.price_cents * quantity * 0.04) + 20, event.currency)}</span>
                        </div>
                        <div className="flex justify-between font-medium pt-1.5 border-t" style={{ borderColor: content.border, color: content.heading }}>
                          <span>Total</span>
                          <span className="font-mono">{formatPrice(event.price_cents * quantity + Math.round(event.price_cents * quantity * 0.04) + 20, event.currency)}</span>
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: content.muted }}>
                        Refunds are available on request from the museum. The booking fee and payment processing fee are non-refundable.
                      </p>
                    </>
                  ) : (
                    <div className="text-sm" style={{ color: content.body }}>
                      Total: <span className="font-mono font-medium" style={{ color: content.heading }}>Free</span>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button type="submit" disabled={booking}
                      className="text-sm font-mono px-6 py-3 rounded transition-colors disabled:opacity-50 text-white"
                      style={{ background: accent }}>
                      {booking ? 'Processing...' : event.price_cents === 0 ? 'Reserve Tickets' : 'Book Now'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {!canAcceptPayments && (
        <div className="border rounded-lg p-8 text-center" style={{ borderColor: content.border, background: content.cardBg }}>
          <div className="text-4xl mb-4">◎</div>
          <p className="text-sm font-mono" style={{ color: content.muted }}>Tickets coming soon</p>
        </div>
      )}

      {canAcceptPayments && slots.length === 0 && !bookingResult && (
        <div className="border rounded-lg p-8 text-center" style={{ borderColor: content.border, background: content.cardBg }}>
          <div className="text-4xl mb-4">◎</div>
          <p className="text-sm font-mono" style={{ color: content.muted }}>No time slots available yet. Check back soon!</p>
        </div>
      )}
    </>
  )
}
