import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'

export default async function PublicArtifact({ params }: { params: Promise<{ slug: string, id: string }> }) {
  const { slug, id } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .single()

  if (!artifact) notFound()

  const { data: galleryImages } = await supabase
    .from('artifact_images')
    .select('url, caption, is_primary')
    .eq('artifact_id', artifact.id)
    .order('sort_order', { ascending: true })

  const images = galleryImages || []
  const primaryImage = images.find(img => img.is_primary)?.url || images[0]?.url || artifact.image_url
  const additionalImages = images.length > 1 ? images.filter(img => img.url !== primaryImage) : []

  const { accent, content, headingStyle } = getMuseumStyles(museum)

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <Link
        href={`/museum/${slug}`}
        className="text-xs font-mono transition-colors mb-10 inline-block"
        style={{ color: content.muted }}
      >
        ← Back to collection
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

        <div className="sticky top-24 space-y-3">
          <div
            className="aspect-square rounded-xl flex items-center justify-center text-[120px] overflow-hidden border"
            style={{ background: content.cardBg, borderColor: content.border }}
          >
            {primaryImage ? (
              <img src={primaryImage} alt={artifact.title} className="w-full h-full object-cover" />
            ) : (
              <span>{artifact.emoji}</span>
            )}
          </div>
          {additionalImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {additionalImages.map((img, i) => (
                <div key={i} className="flex-shrink-0 w-16 h-16 rounded-lg border overflow-hidden" style={{ borderColor: content.border, background: content.cardBg }}>
                  <img src={img.url} alt={img.caption || `${artifact.title} — image ${i + 2}`} className="w-full h-full object-cover" title={img.caption || undefined} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: content.muted }}>{artifact.culture}</div>
          <h1 className="text-4xl font-normal leading-tight mb-2" style={{ ...headingStyle, color: content.heading }}>
            {artifact.title}
          </h1>
          <p className="text-xl mb-8" style={{ ...headingStyle, color: content.muted }}>{artifact.artist}</p>

          <div className="grid grid-cols-2 border rounded-lg overflow-hidden mb-8" style={{ borderColor: content.border }}>
            {[
              { label: 'Date', value: artifact.year },
              { label: 'Medium', value: artifact.medium },
              { label: 'Culture', value: artifact.culture },
              { label: 'Accession', value: artifact.accession_no },
              { label: 'Dimensions', value: artifact.dimensions },
              { label: 'Status', value: artifact.status },
            ].map((row, i) => (
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

          {artifact.description && (
            <p className="leading-relaxed font-light text-sm" style={{ color: content.body }}>{artifact.description}</p>
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
