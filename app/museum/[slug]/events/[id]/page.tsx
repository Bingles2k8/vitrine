'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
}

interface Museum {
  id: string
  slug: string
  name: string
  logo_emoji: string
  stripe_connect_onboarded: boolean
}

const TYPE_LABELS: Record<string, string> = {
  exhibition: 'Exhibition', workshop: 'Workshop', talk: 'Talk', tour: 'Tour',
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  if (start === end) return s.toLocaleDateString('en-GB', opts)
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} — ${e.toLocaleDateString('en-GB', opts)}`
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

export default function PublicEventDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [museum, setMuseum] = useState<Museum | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ tickets: string[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: m } = await supabase
        .from('museums')
        .select('id, slug, name, logo_emoji, stripe_connect_onboarded')
        .eq('slug', slug)
        .single()
      if (!m) return

      const { data: evt } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('museum_id', m.id)
        .eq('status', 'published')
        .single()

      if (!evt) return

      const { data: s } = await supabase
        .from('event_time_slots')
        .select('*')
        .eq('event_id', id)
        .order('start_time', { ascending: true })

      setMuseum(m)
      setEvent(evt)
      setSlots(s || [])
      setLoading(false)
    }
    load()
  }, [slug, id])

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!event || !selectedSlot || !buyerName.trim() || !buyerEmail.trim()) return
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

      // Free event — show tickets inline
      if (data.success && data.tickets) {
        setBookingResult({ tickets: data.tickets })
        setBooking(false)
        return
      }

      // Paid event — redirect to Stripe
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-stone-300 text-sm font-mono">Loading...</div>
      </div>
    )
  }

  if (!event || !museum) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">◎</div>
          <p className="text-sm text-stone-400 font-mono">Event not found</p>
        </div>
      </div>
    )
  }

  const canAcceptPayments = event.price_cents === 0 || museum.stripe_connect_onboarded

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-stone-200 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/museum/${slug}`} className="font-serif text-2xl italic text-stone-900">
            {museum.logo_emoji} {museum.name}
          </Link>
          <div className="flex items-center gap-8">
            <Link href={`/museum/${slug}`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
              Collection
            </Link>
            <Link href={`/museum/${slug}/events`} className="text-sm text-stone-900 border-b border-stone-900 pb-0.5">
              Events
            </Link>
            <Link href={`/museum/${slug}/visit`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
              Plan Your Visit
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Event header */}
        {event.image_url && (
          <div className="aspect-[21/9] rounded-lg overflow-hidden mb-8">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="text-xs uppercase tracking-widest text-amber-600 mb-3">{TYPE_LABELS[event.event_type] || event.event_type}</div>
        <h1 className="font-serif text-5xl italic text-stone-900 mb-4">{event.title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-stone-500 mb-8">
          <span>{formatDateRange(event.start_date, event.end_date)}</span>
          {event.location && <span>· {event.location}</span>}
          <span>· {formatPrice(event.price_cents, event.currency)}</span>
        </div>

        {event.description && (
          <div className="prose prose-stone max-w-none mb-12">
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        )}

        {/* Booking success */}
        {bookingResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 mb-12">
            <div className="text-2xl mb-3">✓</div>
            <h2 className="font-serif text-2xl italic text-stone-900 mb-2">Booking Confirmed</h2>
            <p className="text-sm text-stone-500 mb-4">Your tickets have been booked. Please save your ticket codes:</p>
            <div className="space-y-2">
              {bookingResult.tickets.map(code => (
                <div key={code} className="bg-white border border-emerald-200 rounded px-4 py-3 font-mono text-lg text-stone-900">
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking form */}
        {!bookingResult && canAcceptPayments && slots.length > 0 && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-8">
            <h2 className="font-serif text-2xl italic text-stone-900 mb-6">Book Tickets</h2>

            <form onSubmit={handleBook} className="space-y-6">
              {/* Slot selection */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-3">Select a time slot</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {slots.map(slot => {
                    const remaining = slot.capacity - slot.booked_count
                    const soldOut = remaining <= 0
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`text-left border rounded-lg p-4 transition-colors ${
                          selectedSlot === slot.id
                            ? 'border-stone-900 bg-white'
                            : soldOut
                              ? 'border-stone-200 bg-stone-100 opacity-50 cursor-not-allowed'
                              : 'border-stone-200 bg-white hover:border-stone-400 cursor-pointer'
                        }`}
                      >
                        <div className="text-sm font-mono text-stone-900">
                          {formatSlotTime(slot.start_time)} — {formatSlotEnd(slot.end_time)}
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                          {soldOut ? 'Sold Out' : `${remaining} spot${remaining === 1 ? '' : 's'} remaining`}
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
                      <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Quantity</label>
                      <select
                        value={quantity}
                        onChange={e => setQuantity(parseInt(e.target.value))}
                        className="w-full border border-stone-200 rounded px-3 py-2 text-sm bg-white text-stone-900 focus:outline-none focus:border-stone-400"
                      >
                        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Your Name</label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={e => setBuyerName(e.target.value)}
                        required
                        className="w-full border border-stone-200 rounded px-3 py-2 text-sm bg-white text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Email</label>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={e => setBuyerEmail(e.target.value)}
                        required
                        className="w-full border border-stone-200 rounded px-3 py-2 text-sm bg-white text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">{error}</div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-stone-500">
                      Total: <span className="font-mono text-stone-900 font-medium">
                        {formatPrice(event.price_cents * quantity, event.currency)}
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={booking}
                      className="bg-stone-900 text-white text-sm font-mono px-6 py-3 rounded hover:bg-stone-700 transition-colors disabled:opacity-50"
                    >
                      {booking ? 'Processing...' : event.price_cents === 0 ? 'Reserve Tickets' : 'Book Now'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}

        {/* No payments set up */}
        {!canAcceptPayments && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">◎</div>
            <p className="text-sm text-stone-400 font-mono">Tickets coming soon</p>
          </div>
        )}

        {/* No slots */}
        {canAcceptPayments && slots.length === 0 && !bookingResult && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">◎</div>
            <p className="text-sm text-stone-400 font-mono">No time slots available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  )
}
