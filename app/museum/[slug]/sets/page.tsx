import { createPublicClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import { buildPageMetadata } from '@/lib/seo'
import { collectionLabels } from '@/lib/publicProfile'
import { groupNouns, setTreatment, PHASE_LABELS } from '@/lib/collectionGroups'
import { groupSetsByPhase, hasDatedSets, loadPublicSets } from '@/lib/collectionGroups/publicSets'
import SetCards, { type SetCardData } from '@/components/collection/setCards'
import PageViewTracker from '@/components/PageViewTracker'
import type { GridTheme } from '@/components/collection/types'
import type { Metadata } from 'next'

export const revalidate = 3600

const RATIO_CLASS: Record<string, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[16/9]',
}

const PAD_CLASS: Record<string, string> = {
  tight: 'p-2', normal: 'p-4', generous: 'p-6',
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: museum } = await supabase
    .from('museums')
    .select('name, plan, collection_profiles, collection_category, locked_at')
    .eq('slug', slug)
    .single()
  if (!museum || museum.locked_at) return {}

  const nouns = groupNouns(museum)
  return buildPageMetadata({
    title: `${nouns.plural} — ${museum.name}`,
    description: `Browse the ${nouns.plural.toLowerCase()} in the collection of ${museum.name}.`,
    path: `/museum/${slug}/sets`,
  })
}

export default async function PublicSetsIndex({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: museum } = await supabase.from('museums').select('*').eq('slug', slug).single()
  if (!museum || museum.locked_at) notFound()

  const { data: objects } = await supabase
    .from('objects')
    .select('*')
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .is('deleted_at', null)

  const sets = await loadPublicSets(supabase, museum.id, objects || [])

  // No published sets means no index — an empty-state page is worse than a 404
  // and the nav link is absent for the same reason (invariant U).
  if (sets.length === 0) notFound()

  const { tmpl, accent, content, headingStyle, gridVariant, gridOptions } = getMuseumStyles(museum)
  const labels = collectionLabels(museum)
  const nouns = groupNouns(museum)
  const treatment = setTreatment(gridVariant)

  const theme: GridTheme = {
    accent,
    heading: content.heading,
    body: content.body,
    muted: content.muted,
    border: content.border,
    cardBg: content.cardBg,
    imageBg: content.imageBg,
    headingStyle,
    radius: museum.card_radius ?? tmpl.card_radius,
    imageAspect: RATIO_CLASS[museum.image_ratio || tmpl.image_ratio] || 'aspect-square',
    columns: museum.grid_columns ?? tmpl.grid_columns,
    padding: PAD_CLASS[museum.card_padding || tmpl.card_padding] || 'p-4',
    metadata: museum.card_metadata || tmpl.card_metadata,
    options: gridOptions,
    labels,
  }

  const toCard = (s: (typeof sets)[number]): SetCardData => ({
    id: s.group.id,
    slug: s.group.slug,
    title: s.group.title,
    subtitle: s.group.subtitle,
    coverImageUrl: s.group.cover_image_url,
    coverObjectId: s.group.cover_object_id,
    dateLabel: s.dateLabel,
    members: s.members,
    count: s.count,
  })

  const totalItems = new Set(sets.flatMap(s => s.members.map(m => m.id))).size
  const sectioned = hasDatedSets(sets)

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
      <PageViewTracker museumId={museum.id} pageType="sets" />

      <header className="mb-14 md:mb-20">
        <h1 className="text-4xl md:text-6xl leading-tight" style={{ ...headingStyle, color: content.heading }}>
          {nouns.plural}
        </h1>
        <p className="text-xs font-mono mt-4" style={{ color: content.muted }}>
          {sets.length} {sets.length === 1 ? nouns.singular.toLowerCase() : nouns.plural.toLowerCase()}
          {' · '}
          {totalItems} {totalItems === 1 ? labels.item.toLowerCase() : labels.itemPlural.toLowerCase()}
        </p>
      </header>

      {sectioned ? (
        <div className="space-y-20">
          {groupSetsByPhase(sets).map(({ phase, sets: bucket }) => (
            <section key={phase}>
              {phase !== 'undated' && (
                <h2
                  className="text-xs uppercase tracking-[0.2em] mb-8 pb-3"
                  style={{ color: content.muted, borderBottom: `1px solid ${content.border}` }}
                >
                  {PHASE_LABELS[phase]}
                </h2>
              )}
              <SetCards
                treatment={treatment}
                sets={bucket.map(toCard)}
                slug={slug}
                theme={theme}
                itemPlural={labels.itemPlural}
              />
            </section>
          ))}
        </div>
      ) : (
        <SetCards
          treatment={treatment}
          sets={sets.map(toCard)}
          slug={slug}
          theme={theme}
          itemPlural={labels.itemPlural}
        />
      )}

      <div className="mt-20 pt-8" style={{ borderTop: `1px solid ${content.border}` }}>
        <Link
          href={`/museum/${slug}`}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: accent }}
        >
          ← All {labels.itemPlural.toLowerCase()}
        </Link>
      </div>
    </div>
  )
}
