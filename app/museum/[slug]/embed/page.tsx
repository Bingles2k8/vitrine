import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import CollectionSearch from '@/components/CollectionSearch'
import { getMuseumStyles, googleFontsHref } from '@/lib/museum-styles'
import { collectionLabels } from '@/lib/publicProfile'
import { toGridObject } from '@/components/collection/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function EmbedCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: objects } = await supabase
    .from('objects')
    .select('*')
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const {
    tmpl, accent, font, bodyFont, bodyStyle, headingStyle,
    content, pageBg, templateOptions, gridVariant, gridOptions, chrome,
  } = getMuseumStyles(museum)

  const styleSettings = {
    template: tmpl.id,
    accentColor: accent,
    card_radius: museum.card_radius ?? tmpl.card_radius,
    grid_columns: Math.min(museum.grid_columns ?? tmpl.grid_columns, 3), // cap at 3 for embed
    image_ratio: museum.image_ratio || tmpl.image_ratio,
    card_padding: museum.card_padding || tmpl.card_padding,
    card_metadata: museum.card_metadata || tmpl.card_metadata,
    gridVariant,
    gridOptions,
    chrome,
    content,
    headingStyle,
    labels: collectionLabels(museum),
  }

  return (
    // The embed follows the collection's own ground rather than a fixed white.
    // It used to force white while the grid drew the template's colours on top,
    // so a dark template embedded as dark cards floating on a white page.
    <div style={{ ...bodyStyle, background: pageBg, minHeight: '100%' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={googleFontsHref(font, bodyFont)} />
      <div className="px-4 py-4">
        <CollectionSearch
          objects={(objects || []).map(toGridObject)}
          slug={slug}
          settings={styleSettings}
        />
      </div>
      <div className="text-center pb-4 pt-2">
        <a
          href={`/museum/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono transition-opacity hover:opacity-70"
          style={{ color: content.muted }}
        >
          View full collection on Vitrine →
        </a>
      </div>
    </div>
  )
}
