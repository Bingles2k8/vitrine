import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import PageViewTracker from '@/components/PageViewTracker'
import PublicImageGallery from '@/components/PublicImageGallery'

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

          <div className="grid grid-cols-2 border rounded-lg overflow-hidden mb-8" style={{ borderColor: content.border }}>
            {[
              { label: 'Date', value: object.year },
              { label: 'Medium', value: object.medium },
              { label: 'Culture', value: object.culture },
              { label: 'Accession', value: object.accession_no },
              { label: 'Dimensions', value: object.dimensions },
              { label: 'Status', value: object.status },
              object.condition_grade ? { label: 'Condition', value: object.condition_grade } : null,
            ].filter(Boolean).map((row: any, i) => (
              <div
                key={row.label}
                className={'p-4 ' + (i % 2 === 0 ? 'border-r ' : '') + 'border-b last:border-b-0'}
                style={{ borderColor: content.border }}
              >
                <div className="text-xs uppercase tracking-widest mb-1 font-mono" style={{ color: content.muted }}>{row.label}</div>
                <div className="text-sm" style={{ color: content.heading }}>{row.value || '—'}</div>
              </div>
            ))}
          </div>

          {object.description && (
            <p className="leading-relaxed font-light text-sm" style={{ color: content.body }}>{object.description}</p>
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
