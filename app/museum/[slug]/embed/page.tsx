import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import CollectionSearch from '@/components/CollectionSearch'
import { getMuseumStyles } from '@/lib/museum-styles'

export default async function EmbedCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('*')
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { tmpl, accent } = getMuseumStyles(museum)

  const styleSettings = {
    template: tmpl.id,
    accentColor: accent,
    card_radius: museum.card_radius ?? tmpl.card_radius,
    grid_columns: Math.min(museum.grid_columns ?? tmpl.grid_columns, 3), // cap at 3 for embed
    image_ratio: museum.image_ratio || tmpl.image_ratio,
    card_padding: museum.card_padding || tmpl.card_padding,
    card_metadata: museum.card_metadata || tmpl.card_metadata,
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: 'white', minHeight: '100%' }}>
      <div className="px-4 py-4">
        <CollectionSearch
          artifacts={artifacts || []}
          slug={slug}
          settings={styleSettings}
        />
      </div>
      <div className="text-center pb-4 pt-2">
        <a
          href={`/museum/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-stone-400 hover:text-stone-600 transition-colors"
        >
          View full collection on Vitrine →
        </a>
      </div>
    </div>
  )
}
