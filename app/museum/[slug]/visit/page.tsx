import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function VisitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  // Fetch upcoming events for summary
  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, event_type, start_date, end_date, price_cents, currency')
    .eq('museum_id', museum.id)
    .eq('status', 'published')
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(4)

  const hasEvents = (upcomingEvents?.length ?? 0) > 0

  function formatDateRange(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    if (start === end) return s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} — ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }

  function formatPrice(cents: number, currency: string) {
    if (cents === 0) return 'Free'
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(cents / 100)
  }

  const typeLabels: Record<string, string> = {
    exhibition: 'Exhibition', workshop: 'Workshop', talk: 'Talk', tour: 'Tour',
  }

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
            {hasEvents && (
              <Link href={`/museum/${slug}/events`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
                Events
              </Link>
            )}
            <Link href={`/museum/${slug}/visit`} className="text-sm text-stone-900 border-b border-stone-900 pb-0.5">
              Plan Your Visit
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">Visit</div>
          <h1 className="font-serif text-5xl italic text-stone-900 mb-2">Plan Your Visit</h1>
          <p className="text-stone-400 font-light text-lg">We'd love to welcome you.</p>
        </div>

        {/* About */}
        {museum.about_text && (
          <div>
            <h2 className="font-serif text-2xl italic text-stone-900 mb-4">About {museum.name}</h2>
            <p className="text-stone-600 leading-relaxed">{museum.about_text}</p>
          </div>
        )}

        {/* Hours & Getting Here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-stone-200 rounded-lg p-6">
            <h2 className="font-serif text-xl italic text-stone-900 mb-4">Opening Hours</h2>
            {museum.opening_hours ? (
              <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line">{museum.opening_hours}</p>
            ) : (
              <p className="text-sm text-stone-400 italic">Opening hours not set yet.</p>
            )}
          </div>

          <div className="border border-stone-200 rounded-lg p-6">
            <h2 className="font-serif text-xl italic text-stone-900 mb-4">Getting Here</h2>
            {museum.address ? (
              <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line">{museum.address}</p>
            ) : (
              <p className="text-sm text-stone-400 italic">Address not set yet.</p>
            )}
          </div>
        </div>

        {/* Map */}
        {museum.maps_embed_url && (
          <div>
            <h2 className="font-serif text-2xl italic text-stone-900 mb-4">Location</h2>
            <div className="rounded-lg overflow-hidden border border-stone-200">
              <iframe
                src={museum.maps_embed_url}
                width="100%"
                height="360"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}

        {/* Contact */}
        {(museum.contact_phone || museum.contact_email) && (
          <div>
            <h2 className="font-serif text-2xl italic text-stone-900 mb-4">Contact</h2>
            <div className="flex flex-col gap-3">
              {museum.contact_phone && (
                <a href={`tel:${museum.contact_phone}`}
                  className="inline-flex items-center gap-3 text-stone-600 hover:text-stone-900 transition-colors group w-fit">
                  <span className="w-8 h-8 rounded-full border border-stone-200 group-hover:border-stone-400 flex items-center justify-center text-sm transition-colors">
                    📞
                  </span>
                  <span className="text-sm">{museum.contact_phone}</span>
                </a>
              )}
              {museum.contact_email && (
                <a href={`mailto:${museum.contact_email}`}
                  className="inline-flex items-center gap-3 text-stone-600 hover:text-stone-900 transition-colors group w-fit">
                  <span className="w-8 h-8 rounded-full border border-stone-200 group-hover:border-stone-400 flex items-center justify-center text-sm transition-colors">
                    ✉️
                  </span>
                  <span className="text-sm">{museum.contact_email}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Facilities */}
        {museum.facilities && (
          <div>
            <h2 className="font-serif text-2xl italic text-stone-900 mb-4">Facilities & Accessibility</h2>
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{museum.facilities}</p>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <div>
            <h2 className="font-serif text-2xl italic text-stone-900 mb-6">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map(event => (
                <Link href={`/museum/${slug}/events/${event.id}`} key={event.id}
                  className="border border-stone-200 rounded-lg p-6 hover:border-stone-400 transition-colors">
                  <div className="text-xs uppercase tracking-widest text-amber-600 mb-2">{typeLabels[event.event_type] || event.event_type}</div>
                  <h3 className="font-serif text-xl italic text-stone-900 mb-2">{event.title}</h3>
                  <p className="text-sm text-stone-500">{formatDateRange(event.start_date, event.end_date)}</p>
                  <p className="text-sm text-stone-400 mt-1">{formatPrice(event.price_cents, event.currency)}</p>
                </Link>
              ))}
            </div>
            <Link href={`/museum/${slug}/events`}
              className="inline-block mt-4 text-sm font-mono text-stone-500 hover:text-stone-900 transition-colors">
              View all events →
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="border border-stone-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">{museum.logo_emoji}</div>
          <h2 className="font-serif text-2xl italic text-stone-900 mb-2">{museum.name}</h2>
          <p className="text-stone-400 text-sm mb-6">Free entry to the permanent collection.</p>
          <Link
            href={`/museum/${slug}`}
            className="inline-block bg-stone-900 text-white text-sm font-mono px-6 py-3 rounded"
          >
            Browse the collection →
          </Link>
        </div>
      </div>
    </div>
  )
}
