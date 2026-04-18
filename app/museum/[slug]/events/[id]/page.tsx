import { createPublicClient } from '@/lib/supabase-server'
import Image from 'next/image'

export const revalidate = 3600
import { notFound } from 'next/navigation'
import { getMuseumStyles } from '@/lib/museum-styles'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import EventBookingClient from './EventBookingClient'
import { getPlan } from '@/lib/plans'
import type { Metadata } from 'next'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}): Promise<Metadata> {
  const { slug, id } = await params
  const supabase = createPublicClient()

  const { data: museum } = await supabase.from('museums').select('name').eq('slug', slug).single()
  if (!museum) return {}

  const { data: event } = await supabase
    .from('events')
    .select('title, description, image_url, event_type, start_date')
    .eq('id', id)
    .eq('status', 'published')
    .single()
  if (!event) return {}

  const description = event.description
    ? event.description.slice(0, 155)
    : `${event.title} at ${museum.name}.`

  return buildPageMetadata({
    title: `${event.title} — ${museum.name}`,
    description,
    path: `/museum/${slug}/events/${id}`,
    image: event.image_url ? { url: event.image_url, width: 1200, height: 630, alt: event.title } : undefined,
  })
}

export default async function PublicEventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const supabase = createPublicClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()
  if (!getPlan(museum.plan).ticketing) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('museum_id', museum.id)
    .eq('status', 'published')
    .single()

  if (!event) notFound()

  const { data: slots } = await supabase
    .from('event_time_slots')
    .select('*')
    .eq('event_id', id)
    .order('start_time', { ascending: true })

  const { accent, content, headingStyle } = getMuseumStyles(museum)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.start_date,
    endDate: event.end_date,
    ...(event.location && { location: { '@type': 'Place', name: event.location } }),
    ...(event.image_url && { image: event.image_url }),
    url: `${SITE_URL}/museum/${slug}/events/${id}`,
    organizer: {
      '@type': 'Organization',
      name: museum.name,
      url: `${SITE_URL}/museum/${slug}`,
    },
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <JsonLd data={jsonLd} />

      {event.image_url && (
        <div className="relative aspect-[4/3] md:aspect-[21/9] rounded-lg overflow-hidden mb-8">
          <Image src={event.image_url} alt={event.title} fill priority sizes="(max-width: 768px) 100vw, 1024px" className="object-cover" />
        </div>
      )}

      <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: accent }}>
        {TYPE_LABELS[event.event_type] || event.event_type}
      </div>
      <h1 className="text-5xl mb-4" style={{ ...headingStyle, color: content.heading }}>{event.title}</h1>

      <div className="flex flex-wrap gap-4 text-sm mb-8" style={{ color: content.body }}>
        <span>{formatDateRange(event.start_date, event.end_date)}</span>
        {event.location && <span>· {event.location}</span>}
        <span>· {formatPrice(event.price_cents, event.currency)}</span>
      </div>

      {event.description && (
        <div className="mb-12">
          <p className="leading-relaxed whitespace-pre-line" style={{ color: content.body }}>{event.description}</p>
        </div>
      )}

      <EventBookingClient event={event} museum={museum} slots={slots || []} />
    </div>
  )
}
