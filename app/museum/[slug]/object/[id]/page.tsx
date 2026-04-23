import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import { getPlan } from '@/lib/plans'
import PageViewTracker from '@/components/PageViewTracker'
import PublicImageGallery from '@/components/PublicImageGallery'
import PublicObjectMap from '@/components/PublicObjectMap'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import type { Metadata } from 'next'

function toFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v)
    if (Number.isFinite(n)) return n
  }
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}): Promise<Metadata> {
  const { slug, id } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('name')
    .eq('slug', slug)
    .single()

  if (!museum) return {}

  const { data: object } = await supabase
    .from('objects')
    .select('title, artist, description, medium, production_date, year, image_url')
    .eq('id', id)
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .single()

  if (!object) return {}

  const { data: primaryImageRow } = await supabase
    .from('object_images')
    .select('url')
    .eq('object_id', id)
    .eq('is_primary', true)
    .maybeSingle()

  const imageUrl = primaryImageRow?.url ?? object.image_url ?? null

  // Build description from available fields
  const parts: string[] = []
  if (object.artist) parts.push(object.artist)
  const date = object.production_date || object.year
  if (date) parts.push(String(date))
  if (object.medium) parts.push(object.medium)
  const prefix = parts.length > 0 ? parts.join(', ') + '. ' : ''
  const body = object.description
    ? (prefix + object.description).slice(0, 155)
    : prefix
      ? prefix.slice(0, 155)
      : `${object.title} from ${museum.name}'s collection.`

  const title = `${object.title} — ${museum.name}`

  return buildPageMetadata({
    title,
    description: body,
    path: `/museum/${slug}/object/${id}`,
    image: imageUrl ? { url: imageUrl, width: 1200, height: 630, alt: object.title } : undefined,
  })
}

function formatDate(object: any): string | null {
  const date = object.production_date || object.year
  if (!date) return null
  if (object.production_date_qualifier && object.production_date) {
    return `${object.production_date_qualifier} ${object.production_date}`
  }
  return date
}

function formatDimensions(object: any): string | null {
  const dims: string[] = []
  if (object.dimension_height) dims.push(`H ${object.dimension_height}`)
  if (object.dimension_width) dims.push(`W ${object.dimension_width}`)
  if (object.dimension_depth) dims.push(`D ${object.dimension_depth}`)
  const parts: string[] = []
  if (dims.length > 0) {
    parts.push(dims.join(' × ') + (object.dimension_unit ? ` ${object.dimension_unit}` : ''))
  }
  if (object.dimension_weight) {
    parts.push(`${object.dimension_weight}${object.dimension_weight_unit ? ` ${object.dimension_weight_unit}` : ''}`)
  }
  if (object.dimension_notes) parts.push(object.dimension_notes)
  return parts.length > 0 ? parts.join(' · ') : (object.dimensions || null)
}

export default async function PublicObject({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: object } = await supabase
    .from('objects')
    .select('*')
    .eq('id', id)
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .single()

  if (!object) notFound()

  const { data: galleryImages } = await supabase
    .from('object_images')
    .select('url, caption, is_primary')
    .eq('object_id', object.id)
    .order('sort_order', { ascending: true })

  const rawImages = galleryImages || []
  // Build ordered list: primary first, then the rest in sort order
  const primaryImage = rawImages.find(img => img.is_primary) || rawImages[0]
  const allImages = primaryImage
    ? [primaryImage, ...rawImages.filter(img => img.url !== primaryImage.url)]
    : object.image_url
      ? [{ url: object.image_url, caption: null }]
      : []

  const { accent, content, headingStyle } = getMuseumStyles(museum)

  const isFullMode = getPlan(museum.plan).fullMode
  const metaRows = [
    { label: 'Date', value: formatDate(object) },
    { label: 'Object Type', value: object.object_type },
    { label: isFullMode ? 'Medium' : 'Medium / Material', value: object.medium },
    { label: isFullMode ? 'Culture' : 'Origin', value: object.culture },
    { label: 'Production Place', value: object.production_place },
    isFullMode ? { label: 'Accession', value: object.accession_no } : null,
    { label: 'Dimensions', value: formatDimensions(object) },
    parseInt(object.number_of_parts) > 1 ? { label: 'No. of Parts', value: String(object.number_of_parts) } : null,
    isFullMode ? { label: 'Status', value: object.status } : null,
    isFullMode ? { label: 'Location', value: object.status === 'Storage' ? 'In Storage' : object.current_location } : null,
    object.condition_grade ? { label: 'Condition', value: object.condition_grade } : null,
  ].filter((row): row is { label: string; value: string } => !!row && !!row.value)

  const proseSections = [
    { label: 'Historical Context', value: object.historical_context },
    { label: 'Marks and Inscriptions', value: object.inscription },
    { label: 'Materials & Techniques', value: object.physical_materials },
    { label: 'Provenance', value: object.provenance },
    { label: 'Credit Line', value: object.credit_line },
  ].filter(s => !!s.value)

  const associations = [
    { label: 'Associated Person', value: object.associated_person },
    { label: 'Associated Organisation', value: object.associated_organisation },
    { label: 'Associated Place', value: object.associated_place },
  ].filter(a => !!a.value)

  const objectUrl = `${SITE_URL}/museum/${slug}/object/${id}`
  const museumUrl = `${SITE_URL}/museum/${slug}`

  const visualArtworkSchema = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: object.title,
    ...(object.artist && { creator: { '@type': 'Person', name: object.artist } }),
    ...(object.production_date || object.year ? { dateCreated: String(object.production_date || object.year) } : {}),
    ...(object.description && { description: object.description }),
    ...(primaryImage?.url && { image: primaryImage.url }),
    url: objectUrl,
    isPartOf: { '@type': 'CollectionPage', name: museum.name, url: museumUrl },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: museum.name, item: museumUrl },
      { '@type': 'ListItem', position: 3, name: object.title, item: objectUrl },
    ],
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pt-6 pb-16 md:py-16">
      <JsonLd data={visualArtworkSchema} />
      <JsonLd data={breadcrumbSchema} />
      <PageViewTracker museumId={museum.id} pageType="object" objectId={object.id} />
      <Link
        href={`/museum/${slug}`}
        className="text-xs font-mono transition-colors mb-10 inline-block"
        style={{ color: content.muted }}
      >
        ← Back to collection
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

        <div className="md:sticky md:top-24">
          <PublicImageGallery
            images={allImages}
            title={object.title}
            emoji={object.emoji}
            cardBg={content.cardBg}
            border={content.border}
          />
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: content.muted }}>{object.culture}</div>
          <h1 className="text-4xl font-normal leading-tight mb-2" style={{ ...headingStyle, color: content.heading }}>
            {object.title}
          </h1>
          <p className={`text-xl ${object.rarity ? 'mb-1' : 'mb-8'}`} style={{ ...headingStyle, color: content.muted }}>{object.artist}</p>
          {object.rarity && (
            <p className="text-sm font-mono mb-8" style={{ color: accent }}>{object.rarity}</p>
          )}

          {metaRows.length > 0 && (
            <div className="grid grid-cols-2 border rounded-lg overflow-hidden mb-8" style={{ borderColor: content.border }}>
              {metaRows.map((row, i) => (
                <div
                  key={row.label}
                  className={'p-4 ' + (i % 2 === 0 ? 'border-r ' : '') + 'border-b last:border-b-0'}
                  style={{ borderColor: content.border }}
                >
                  <div className="text-xs uppercase tracking-widest mb-1 font-mono" style={{ color: content.muted }}>{row.label}</div>
                  <div className="text-sm" style={{ color: content.heading }}>{row.value}</div>
                </div>
              ))}
            </div>
          )}

          {object.description && (
            <p className="leading-relaxed font-light text-sm mb-8" style={{ color: content.body }}>{object.description}</p>
          )}

          {proseSections.map(section => (
            <div key={section.label} className="mb-6">
              <div className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>{section.label}</div>
              <p className="leading-relaxed font-light text-sm" style={{ color: content.body }}>{section.value}</p>
            </div>
          ))}

          {(() => {
            const mapLat = toFiniteNumber(object.origin_lat)
            const mapLng = toFiniteNumber(object.origin_lng)
            if (!object.origin_map_public || mapLat === null || mapLng === null) return null
            return (
              <div className="mb-6">
                <div className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>Location</div>
                <PublicObjectMap
                  lat={mapLat}
                  lng={mapLng}
                  label={object.origin_place || null}
                  accent={accent}
                  borderColor={content.border}
                />
              </div>
            )
          })()}

          {isFullMode && associations.length > 0 && (
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: content.muted }}>Associations</div>
              <div className="space-y-1">
                {associations.map(a => (
                  <div key={a.label} className="text-sm" style={{ color: content.body }}>
                    <span className="font-mono text-xs" style={{ color: content.muted }}>{a.label}: </span>{a.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {getPlan(museum.plan).visitInfo && (
            <div className="mt-10 pt-8 border-t" style={{ borderColor: content.border }}>
              <Link
                href={`/museum/${slug}/visit`}
                className="inline-block text-sm font-mono px-6 py-3 rounded text-white transition-colors"
                style={{ background: accent }}
              >
                Plan your visit to see this work
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
