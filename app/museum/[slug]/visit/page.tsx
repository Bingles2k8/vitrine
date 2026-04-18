import { createPublicClient } from '@/lib/supabase-server'

export const revalidate = 3600
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import { buildPageMetadata } from '@/lib/seo'
import { getPlan } from '@/lib/plans'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: museum } = await supabase.from('museums').select('name').eq('slug', slug).single()
  if (!museum) return {}
  return buildPageMetadata({
    title: `Visit — ${museum.name}`,
    description: `Plan your visit to ${museum.name}. Opening hours, location, and upcoming events.`,
    path: `/museum/${slug}/visit`,
  })
}

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

export default async function VisitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()
  if (!getPlan(museum.plan).visitInfo) notFound()

  const today = new Date().toISOString().split('T')[0]
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('id, title, event_type, start_date, end_date, price_cents, currency')
    .eq('museum_id', museum.id)
    .eq('status', 'published')
    .gte('end_date', today)
    .order('start_date', { ascending: true })
    .limit(4)

  const { accent, content, headingStyle } = getMuseumStyles(museum)

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <div>
        <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: accent }}>Visit</div>
        <h1 className="text-5xl mb-2" style={{ ...headingStyle, color: content.heading }}>Plan Your Visit</h1>
        <p className="font-light text-lg" style={{ color: content.muted }}>We&apos;d love to welcome you.</p>
      </div>

      {museum.about_text && (
        <div>
          <h2 className="text-2xl mb-4" style={{ ...headingStyle, color: content.heading }}>About {museum.name}</h2>
          <p className="leading-relaxed" style={{ color: content.body }}>{museum.about_text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6" style={{ borderColor: content.border, background: content.cardBg }}>
          <h2 className="text-xl mb-4" style={{ ...headingStyle, color: content.heading }}>Opening Hours</h2>
          {museum.opening_hours ? (
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: content.body }}>{museum.opening_hours}</p>
          ) : (
            <p className="text-sm italic" style={{ color: content.muted }}>Opening hours not set yet.</p>
          )}
        </div>
        <div className="border rounded-lg p-6" style={{ borderColor: content.border, background: content.cardBg }}>
          <h2 className="text-xl mb-4" style={{ ...headingStyle, color: content.heading }}>Getting Here</h2>
          {museum.address ? (
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: content.body }}>{museum.address}</p>
          ) : (
            <p className="text-sm italic" style={{ color: content.muted }}>Address not set yet.</p>
          )}
        </div>
      </div>

      {museum.maps_embed_url && (
        <div>
          <h2 className="text-2xl mb-4" style={{ ...headingStyle, color: content.heading }}>Location</h2>
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: content.border }}>
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

      {(museum.contact_phone || museum.contact_email) && (
        <div>
          <h2 className="text-2xl mb-4" style={{ ...headingStyle, color: content.heading }}>Contact</h2>
          <div className="flex flex-col gap-3">
            {museum.contact_phone && (
              <a href={`tel:${museum.contact_phone}`} className="inline-flex items-center gap-3 transition-colors w-fit" style={{ color: content.body }}>
                <span className="w-8 h-8 rounded-full border flex items-center justify-center text-sm" style={{ borderColor: content.border }}>📞</span>
                <span className="text-sm">{museum.contact_phone}</span>
              </a>
            )}
            {museum.contact_email && (
              <a href={`mailto:${museum.contact_email}`} className="inline-flex items-center gap-3 transition-colors w-fit" style={{ color: content.body }}>
                <span className="w-8 h-8 rounded-full border flex items-center justify-center text-sm" style={{ borderColor: content.border }}>✉️</span>
                <span className="text-sm">{museum.contact_email}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {museum.facilities && (
        <div>
          <h2 className="text-2xl mb-4" style={{ ...headingStyle, color: content.heading }}>Facilities &amp; Accessibility</h2>
          <p className="leading-relaxed whitespace-pre-line" style={{ color: content.body }}>{museum.facilities}</p>
        </div>
      )}

      {upcomingEvents && upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-2xl mb-6" style={{ ...headingStyle, color: content.heading }}>Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map(event => (
              <Link
                href={`/museum/${slug}/events/${event.id}`}
                key={event.id}
                className="border rounded-lg p-6 transition-colors block"
                style={{ borderColor: content.border, background: content.cardBg }}
              >
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: accent }}>
                  {typeLabels[event.event_type] || event.event_type}
                </div>
                <h3 className="text-xl mb-2" style={{ ...headingStyle, color: content.heading }}>{event.title}</h3>
                <p className="text-sm" style={{ color: content.body }}>{formatDateRange(event.start_date, event.end_date)}</p>
                <p className="text-sm mt-1" style={{ color: content.muted }}>{formatPrice(event.price_cents, event.currency)}</p>
              </Link>
            ))}
          </div>
          <Link href={`/museum/${slug}/events`} className="inline-block mt-4 text-sm font-mono transition-colors" style={{ color: content.muted }}>
            View all events →
          </Link>
        </div>
      )}

      <div className="border rounded-lg p-8 text-center" style={{ borderColor: content.border, background: content.cardBg }}>
        <div className="text-4xl mb-4">{museum.logo_emoji}</div>
        <h2 className="text-2xl mb-2" style={{ ...headingStyle, color: content.heading }}>{museum.name}</h2>
        <p className="text-sm mb-6" style={{ color: content.muted }}>Free entry to the permanent collection.</p>
        <Link
          href={`/museum/${slug}`}
          className="inline-block text-sm font-mono px-6 py-3 rounded text-white"
          style={{ background: accent }}
        >
          Browse the collection →
        </Link>
      </div>
    </div>
  )
}
