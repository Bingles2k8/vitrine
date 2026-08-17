import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import { getPlan } from '@/lib/plans'
import PageViewTracker from '@/components/PageViewTracker'
import PublicImageGallery from '@/components/PublicImageGallery'
import PublicObjectMap from '@/components/PublicObjectMap'
import ContactMuseumButton from '@/components/ContactMuseumButton'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { objectLabels, publicCertification, publicCustomFields } from '@/lib/publicProfile'
import CertificationPanel from '@/components/collection/CertificationPanel'
import { GALLERY_PRESET, OBJECT_LAYOUTS, type ObjectTheme } from '@/components/collection/object-layouts'
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

  const {
    tmpl, accent, content, headingStyle, chrome, objectVariant, objectOptions,
  } = getMuseumStyles(museum)
  const radius = museum.card_radius ?? tmpl.card_radius

  // This object's own vocabulary — resolved per object, so a collection running
  // two profiles still labels each item in its own language. Full-mode plans
  // resolve to the museum wording they already had.
  const labels = objectLabels(object, museum)
  const certification = publicCertification(object)
  const customFields = publicCustomFields(object, museum)

  const isFullMode = getPlan(museum.plan).fullMode
  const metaRows = [
    { label: labels.date, value: formatDate(object) },
    { label: labels.type, value: object.object_type },
    labels.hidden.medium ? null : { label: labels.medium, value: object.medium },
    labels.hidden.culture ? null : { label: labels.origin, value: object.culture },
    { label: 'Production Place', value: object.production_place },
    isFullMode ? { label: 'Accession', value: object.accession_no } : null,
    { label: 'Dimensions', value: formatDimensions(object) },
    !labels.hidden.number_of_parts && parseInt(object.number_of_parts) > 1
      ? { label: 'No. of Parts', value: String(object.number_of_parts) }
      : null,
    isFullMode ? { label: 'Status', value: labels.statusLabels[object.status] ?? object.status } : null,
    isFullMode ? { label: labels.location, value: object.status === 'Storage' ? 'In Storage' : object.current_location } : null,
    // A derived grade is already stated in full on the certification panel.
    object.condition_grade && !certification
      ? { label: labels.condition, value: labels.conditionLabels[object.condition_grade] ?? object.condition_grade }
      : null,
    // Profile detail fields — sizes, pressings, calibres, whatever this hobby
    // records that the shared object columns have no room for.
    ...customFields.map(f => ({ label: f.label, value: f.value })),
  ].filter((row): row is { label: string; value: string } => !!row && !!row.value)

  const proseSections = [
    { label: 'Historical Context', value: object.historical_context },
    labels.hidden.inscription ? null : { label: labels.inscription, value: object.inscription },
    { label: 'Materials & Techniques', value: object.physical_materials },
    { label: 'Provenance', value: object.provenance },
    { label: 'Credit Line', value: object.credit_line },
  ].filter((s): s is { label: string; value: string } => !!s && !!s.value)

  const associations = [
    { label: 'Associated Person', value: object.associated_person },
    { label: 'Associated Organisation', value: object.associated_organisation },
    { label: 'Associated Place', value: object.associated_place },
  ].filter((a): a is { label: string; value: string } => !!a.value)

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

  // ── Blocks ────────────────────────────────────────────────────────────────
  // Assembled once here; the template's layout decides only where they sit.

  const theme: ObjectTheme = {
    accent,
    heading: content.heading,
    body: content.body,
    muted: content.muted,
    border: content.border,
    cardBg: content.cardBg,
    headingStyle,
    chrome,
    radius,
    options: objectOptions,
  }

  const preset = GALLERY_PRESET[objectVariant] ?? GALLERY_PRESET.standard

  const gallery = (
    <PublicImageGallery
      images={allImages}
      title={object.title}
      emoji={object.emoji}
      cardBg={content.cardBg}
      border={content.border}
      accent={accent}
      radius={radius}
      frame={preset.frame}
      aspect={preset.aspect}
      fit={preset.fit}
    />
  )

  const back = (
    <Link
      href={`/museum/${slug}`}
      className="text-xs font-mono transition-opacity hover:opacity-70 mb-10 inline-block"
      style={{ color: content.muted }}
    >
      ← Back to {labels.collection.toLowerCase()}
    </Link>
  )

  const actions = museum.accept_messages ? (
    <ContactMuseumButton
      recipientMuseumId={museum.id}
      recipientMuseumName={museum.name}
      objectId={object.id}
      objectTitle={object.title}
      accent={accent}
    />
  ) : null

  const mapLat = toFiniteNumber(object.origin_lat)
  const mapLng = toFiniteNumber(object.origin_lng)
  const showMap = object.origin_map_public && mapLat !== null && mapLng !== null

  const extras = (showMap || (isFullMode && associations.length > 0)) ? (
    <>
      {showMap && (
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.18em] mb-2 font-mono" style={{ color: content.muted }}>
            Location
          </div>
          <PublicObjectMap
            lat={mapLat!}
            lng={mapLng!}
            label={object.origin_place || null}
            accent={accent}
            borderColor={content.border}
          />
        </div>
      )}
      {isFullMode && associations.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.18em] mb-2 font-mono" style={{ color: content.muted }}>
            Associations
          </div>
          <div className="space-y-1">
            {associations.map(a => (
              <div key={a.label} className="text-sm" style={{ color: content.body }}>
                <span className="font-mono text-xs" style={{ color: content.muted }}>{a.label}: </span>{a.value}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  ) : null

  const footer = getPlan(museum.plan).visitInfo ? (
    <div className="mt-10 pt-8 border-t" style={{ borderColor: content.border }}>
      <Link
        href={`/museum/${slug}/visit`}
        className="inline-block text-sm font-mono px-6 py-3 text-white transition-opacity hover:opacity-90"
        style={{ background: accent, borderRadius: chrome === 'hard' ? 0 : 6 }}
      >
        Plan your visit to see this {labels.item.toLowerCase()}
      </Link>
    </div>
  ) : null

  const Layout = OBJECT_LAYOUTS[objectVariant] ?? OBJECT_LAYOUTS.standard

  return (
    <>
      <JsonLd data={visualArtworkSchema} />
      <JsonLd data={breadcrumbSchema} />
      <PageViewTracker museumId={museum.id} pageType="object" objectId={object.id} />
      <Layout
        theme={theme}
        back={back}
        gallery={gallery}
        eyebrow={labels.hidden.culture ? null : (object.culture || null)}
        title={object.title}
        maker={object.artist || null}
        rarity={object.rarity && !labels.hidden.rarity ? { label: labels.rarity, value: object.rarity } : null}
        certification={certification ? (
          <CertificationPanel
            cert={certification}
            accent={accent}
            heading={content.heading}
            muted={content.muted}
            border={content.border}
            cardBg={content.cardBg}
            square={chrome === 'hard'}
          />
        ) : null}
        actions={actions}
        meta={metaRows}
        description={object.description || null}
        prose={proseSections}
        extras={extras}
        footer={footer}
      />
    </>
  )
}
