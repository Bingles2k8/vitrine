import { createPublicClient } from '@/lib/supabase-server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import { buildPageMetadata } from '@/lib/seo'
import { getPlan } from '@/lib/plans'
import type { Metadata } from 'next'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: museum } = await supabase.from('museums').select('name').eq('slug', slug).single()
  if (!museum) return {}
  return buildPageMetadata({
    title: `Events — ${museum.name}`,
    description: `Upcoming exhibitions, workshops, and events at ${museum.name}.`,
    path: `/museum/${slug}/events`,
  })
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

export default async function PublicEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()
  if (!getPlan(museum.plan).ticketing) notFound()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('museum_id', museum.id)
    .eq('status', 'published')
    .order('start_date', { ascending: true })

  const allEvents = events || []
  const today = new Date().toISOString().split('T')[0]
  const upcoming = allEvents.filter(e => e.end_date >= today)
  const past = allEvents.filter(e => e.end_date < today)

  const { accent, content, headingStyle } = getMuseumStyles(museum)

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: accent }}>Events</div>
      <h1 className="text-5xl mb-2" style={{ ...headingStyle, color: content.heading }}>What&apos;s On</h1>
      <p className="font-light text-lg mb-12" style={{ color: content.muted }}>Discover our upcoming events and exhibitions.</p>

      {upcoming.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl mb-6" style={{ ...headingStyle, color: content.heading }}>Upcoming</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcoming.map(event => (
              <Link
                key={event.id}
                href={`/museum/${slug}/events/${event.id}`}
                className="border rounded-lg overflow-hidden transition-colors group block"
                style={{ borderColor: content.border, background: content.cardBg }}
              >
                {event.image_url && (
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image src={event.image_url} alt={event.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: accent }}>
                    {TYPE_LABELS[event.event_type] || event.event_type}
                  </div>
                  <h3 className="text-xl mb-2" style={{ ...headingStyle, color: content.heading }}>{event.title}</h3>
                  <p className="text-sm mb-1" style={{ color: content.body }}>{formatDateRange(event.start_date, event.end_date)}</p>
                  {event.location && <p className="text-sm mb-2" style={{ color: content.muted }}>{event.location}</p>}
                  <p className="text-sm font-mono mt-3" style={{ color: content.heading }}>{formatPrice(event.price_cents, event.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && (
        <div className="text-center py-16 mb-16">
          <div className="text-4xl mb-4">◎</div>
          <p className="text-sm font-mono" style={{ color: content.muted }}>No upcoming events at the moment. Check back soon!</p>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-2xl mb-6 opacity-50" style={{ ...headingStyle, color: content.heading }}>Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
            {past.map(event => (
              <div key={event.id} className="border rounded-lg p-6" style={{ borderColor: content.border, background: content.cardBg }}>
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: content.muted }}>
                  {TYPE_LABELS[event.event_type] || event.event_type}
                </div>
                <h3 className="text-xl mb-2" style={{ ...headingStyle, color: content.body }}>{event.title}</h3>
                <p className="text-sm" style={{ color: content.muted }}>{formatDateRange(event.start_date, event.end_date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
