import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import PageViewTracker from '@/components/PageViewTracker'
import PublicImageGallery from '@/components/PublicImageGallery'

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

  const metaRows = [
    { label: 'Date', value: formatDate(object) },
    { label: 'Object Type', value: object.object_type },
    { label: 'Medium', value: object.medium },
    { label: 'Culture', value: object.culture },
    { label: 'Production Place', value: object.production_place },
    { label: 'Accession', value: object.accession_no },
    { label: 'Dimensions', value: formatDimensions(object) },
    parseInt(object.number_of_parts) > 1 ? { label: 'No. of Parts', value: String(object.number_of_parts) } : null,
    { label: 'Status', value: object.status },
    { label: 'Location', value: object.current_location },
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <PageViewTracker museumId={museum.id} pageType="object" objectId={object.id} />
      <Link
        href={`/museum/${slug}`}
        className="text-xs font-mono transition-colors mb-10 inline-block"
        style={{ color: content.muted }}
      >
        ← Back to collection
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

        <div className="sticky top-24">
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

          {associations.length > 0 && (
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

          <div className="mt-10 pt-8 border-t" style={{ borderColor: content.border }}>
            <Link
              href={`/museum/${slug}/visit`}
              className="inline-block text-sm font-mono px-6 py-3 rounded text-white transition-colors"
              style={{ background: accent }}
            >
              Plan your visit to see this work
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
