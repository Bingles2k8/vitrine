import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

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
        <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">Events</div>
        <h1 className="font-serif text-5xl italic text-stone-900 mb-2">What's On</h1>
        <p className="text-stone-400 font-light text-lg mb-12">Discover our upcoming events and exhibitions.</p>

        {upcoming.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-2xl italic text-stone-900 mb-6">Upcoming</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map(event => (
                <Link
                  key={event.id}
                  href={`/museum/${slug}/events/${event.id}`}
                  className="border border-stone-200 rounded-lg overflow-hidden hover:border-stone-400 transition-colors group"
                >
                  {event.image_url && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="text-xs uppercase tracking-widest text-amber-600 mb-2">{TYPE_LABELS[event.event_type] || event.event_type}</div>
                    <h3 className="font-serif text-xl italic text-stone-900 mb-2">{event.title}</h3>
                    <p className="text-sm text-stone-500 mb-1">{formatDateRange(event.start_date, event.end_date)}</p>
                    {event.location && <p className="text-sm text-stone-400 mb-2">{event.location}</p>}
                    <p className="text-sm font-mono text-stone-900 mt-3">{formatPrice(event.price_cents, event.currency)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && (
          <div className="text-center py-16 mb-16">
            <div className="text-4xl mb-4">◎</div>
            <p className="text-sm text-stone-400 font-mono">No upcoming events at the moment. Check back soon!</p>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl italic text-stone-400 mb-6">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
              {past.map(event => (
                <div key={event.id} className="border border-stone-200 rounded-lg p-6">
                  <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">{TYPE_LABELS[event.event_type] || event.event_type}</div>
                  <h3 className="font-serif text-xl italic text-stone-600 mb-2">{event.title}</h3>
                  <p className="text-sm text-stone-400">{formatDateRange(event.start_date, event.end_date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
