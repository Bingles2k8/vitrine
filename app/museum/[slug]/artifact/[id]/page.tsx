import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

  const { count: eventCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('museum_id', museum.id)
    .eq('status', 'published')
  const hasEvents = (eventCount ?? 0) > 0

  const { data: galleryImages } = await supabase
    .from('artifact_images')
    .select('url, caption, is_primary')
    .eq('artifact_id', artifact.id)
    .order('sort_order', { ascending: true })

  const images = galleryImages || []
  const primaryImage = images.find(img => img.is_primary)?.url || images[0]?.url || artifact.image_url
  const additionalImages = images.length > 1 ? images.filter(img => img.url !== primaryImage) : []

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
            <Link href={`/museum/${slug}/visit`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
              Plan Your Visit
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <Link
          href={`/museum/${slug}`}
          className="text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors mb-10 inline-block"
        >
          Back to collection
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          <div className="sticky top-24 space-y-3">
            <div className="aspect-square bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl flex items-center justify-center text-[120px] border border-stone-200 overflow-hidden">
              {primaryImage ? (
                <img src={primaryImage} alt={artifact.title} className="w-full h-full object-cover" />
              ) : (
                <span>{artifact.emoji}</span>
              )}
            </div>
            {additionalImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {additionalImages.map((img, i) => (
                  <div key={i} className="flex-shrink-0 w-16 h-16 rounded-lg border border-stone-200 overflow-hidden bg-stone-50">
                    <img src={img.url} alt={img.caption || `${artifact.title} — image ${i + 2}`} className="w-full h-full object-cover" title={img.caption || undefined} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">{artifact.culture}</div>
            <h1 className="font-serif text-4xl font-normal leading-tight text-stone-900 mb-2">
              {artifact.title}
            </h1>
            <p className="font-serif italic text-xl text-stone-400 mb-8">{artifact.artist}</p>

            <div className="grid grid-cols-2 border border-stone-200 rounded-lg overflow-hidden mb-8">
              {[
                { label: 'Date', value: artifact.year },
                { label: 'Medium', value: artifact.medium },
                { label: 'Culture', value: artifact.culture },
                { label: 'Accession', value: artifact.accession_no },
                { label: 'Dimensions', value: artifact.dimensions },
                { label: 'Status', value: artifact.status },
              ].map((row, i) => (
                <div key={row.label} className={'p-4 ' + (i % 2 === 0 ? 'border-r ' : '') + 'border-b border-stone-200'}>
                  <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">{row.label}</div>
                  <div className="text-sm text-stone-900">{row.value || '—'}</div>
                </div>
              ))}
            </div>

            {artifact.description && (
              <p className="text-stone-500 leading-relaxed font-light text-sm">{artifact.description}</p>
            )}

            <div className="mt-10 pt-8 border-t border-stone-100">
              <Link
                href={`/museum/${slug}/visit`}
                className="inline-block bg-stone-900 text-white text-sm font-mono px-6 py-3 rounded hover:bg-stone-700 transition-colors"
              >
                Plan your visit to see this work
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}