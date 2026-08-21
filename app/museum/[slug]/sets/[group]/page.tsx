import { createPublicClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMuseumStyles } from '@/lib/museum-styles'
import { buildPageMetadata } from '@/lib/seo'
import { collectionLabels } from '@/lib/publicProfile'
import {
  effectiveNavStyle, groupNouns, setTreatment, SET_BROWSER_THRESHOLD,
} from '@/lib/collectionGroups'
import { loadPublicSets } from '@/lib/collectionGroups/publicSets'
import SetCards, { type SetCardData } from '@/components/collection/setCards'
import SetCover from '@/components/collection/SetCover'
import SetItems from '@/components/collection/SetItems'
import SetBrowser from '@/components/collection/SetBrowser'
import PageViewTracker from '@/components/PageViewTracker'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo'
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

type Params = Promise<{ slug: string; group: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, group } = await params
  const supabase = createPublicClient()

  const { data: museum } = await supabase
    .from('museums').select('id, name, locked_at').eq('slug', slug).single()
  if (!museum || museum.locked_at) return {}

  const { data: set } = await supabase
    .from('collection_groups')
    .select('title, subtitle, description, cover_image_url')
    .eq('museum_id', museum.id)
    .eq('slug', group)
    .eq('status', 'published')
    .maybeSingle()
  if (!set) return {}

  return buildPageMetadata({
    title: `${set.title} — ${museum.name}`,
    description: set.description?.slice(0, 300) || set.subtitle || `${set.title}, from the collection of ${museum.name}.`,
    path: `/museum/${slug}/sets/${group}`,
    image: set.cover_image_url || undefined,
  })
}

export default async function PublicSetPage({ params }: { params: Params }) {
  const { slug, group } = await params
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
  const current = sets.find(s => s.group.slug === group)

  // Draft, empty, or nonexistent all land here — a set with nothing visible in
  // it has no page, same as it has no card (invariant U).
  if (!current) notFound()

  const { tmpl, accent, content, headingStyle, gridVariant, gridOptions, chrome, bodyFont } = getMuseumStyles(museum)
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

  const { group: set, members, count, dateLabel } = current
  const navStyle = effectiveNavStyle(set.nav_style, members)
  const siblings = sets.filter(s => s.group.id !== set.id).slice(0, 3)

  const meta = [
    `${count} ${count === 1 ? labels.item.toLowerCase() : labels.itemPlural.toLowerCase()}`,
    dateLabel,
  ].filter(Boolean).join('  ·  ')

  const cover = (
    <SetCover
      members={members}
      coverImageUrl={set.cover_image_url}
      coverObjectId={set.cover_object_id}
      aspect={treatment === 'tiles' ? 'aspect-[16/9]' : 'aspect-[4/3]'}
      radius={theme.radius}
      imageBg={theme.imageBg}
      border={theme.border}
      accent={accent}
      emoji={museum.logo_emoji}
      wide
    />
  )

  const description = set.description && (
    <p
      className="text-base leading-relaxed mt-5 max-w-2xl whitespace-pre-line"
      style={{ color: content.body, fontFamily: bodyFont.css }}
    >
      {set.description}
    </p>
  )

  // ── Hero, per treatment (plan §8.3) ───────────────────────────────────
  let hero
  if (treatment === 'ledger') {
    // The catalogue templates earn their formality by *not* showing a hero
    // image: a ruled masthead and a definition row instead.
    hero = (
      <header className="mb-14">
        <h1 className="text-4xl md:text-5xl leading-tight" style={{ ...headingStyle, color: content.heading }}>
          {set.title}
        </h1>
        {set.subtitle && (
          <p className="text-lg mt-2" style={{ color: content.body }}>{set.subtitle}</p>
        )}
        <div className="mt-6 pt-4 text-xs font-mono" style={{ borderTop: `1px solid ${content.border}`, color: content.muted }}>
          {meta}
        </div>
        {description}
      </header>
    )
  } else if (treatment === 'tiles') {
    hero = (
      <header className="mb-14 relative">
        <div className="relative overflow-hidden" style={{ borderRadius: theme.radius }}>
          {cover}
          <div
            className="absolute inset-x-0 bottom-0 p-6 md:p-10 pt-24"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
          >
            <h1 className="text-3xl md:text-5xl leading-tight text-white" style={headingStyle}>{set.title}</h1>
            {set.subtitle && (
              <p className="text-base mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>{set.subtitle}</p>
            )}
            <div className="text-xs font-mono mt-3" style={{ color: accent }}>{meta}</div>
          </div>
        </div>
        {description}
      </header>
    )
  } else if (treatment === 'feature') {
    hero = (
      <header className="mb-14 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        {cover}
        <div style={{ borderLeft: `2px solid ${accent}`, paddingLeft: '1.5rem' }}>
          <h1 className="text-4xl md:text-5xl leading-tight" style={{ ...headingStyle, color: content.heading }}>
            {set.title}
          </h1>
          {set.subtitle && <p className="text-lg mt-2" style={{ color: content.body }}>{set.subtitle}</p>}
          <div className="text-xs font-mono mt-4" style={{ color: content.muted }}>{meta}</div>
          {description}
        </div>
      </header>
    )
  } else {
    // plates — a wall label, scaled up.
    hero = (
      <header className="mb-14">
        <div className="max-w-3xl mx-auto">{cover}</div>
        <div className="text-center mt-8">
          <h1 className="text-4xl md:text-5xl leading-tight" style={{ ...headingStyle, color: content.heading }}>
            {set.title}
          </h1>
          {set.subtitle && <p className="text-lg mt-2" style={{ color: content.body }}>{set.subtitle}</p>}
          <div className="text-xs font-mono mt-3" style={{ color: content.muted }}>{meta}</div>
        </div>
        {set.description && (
          <p
            className="text-base leading-relaxed mt-6 max-w-2xl mx-auto text-center whitespace-pre-line"
            style={{ color: content.body, fontFamily: bodyFont.css }}
          >
            {set.description}
          </p>
        )}
      </header>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <PageViewTracker museumId={museum.id} pageType="group" />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: set.title,
          description: set.description || set.subtitle || undefined,
          url: `${SITE_URL}/museum/${slug}/sets/${set.slug}`,
          isPartOf: { '@type': 'WebSite', name: museum.name, url: `${SITE_URL}/museum/${slug}` },
        }}
      />

      <nav className="mb-8 text-xs font-mono flex items-center gap-2 flex-wrap" style={{ color: content.muted }}>
        <Link href={`/museum/${slug}`} className="transition-opacity hover:opacity-70">
          {labels.collection}
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/museum/${slug}/sets`} className="transition-opacity hover:opacity-70">
          {nouns.plural}
        </Link>
        <span aria-hidden>/</span>
        <span style={{ color: content.body }}>{set.title}</span>
      </nav>

      {hero}

      {count > SET_BROWSER_THRESHOLD ? (
        <SetBrowser
          items={members}
          slug={slug}
          setSlug={set.slug}
          theme={theme}
          navStyle={navStyle}
          gridVariant={gridVariant}
          chrome={chrome}
          curatorOrder={set.sort_by === 'manual'}
        />
      ) : (
        <SetItems
          items={members}
          slug={slug}
          setSlug={set.slug}
          theme={theme}
          navStyle={navStyle}
          gridVariant={gridVariant}
        />
      )}

      {siblings.length > 0 && (
        <section className="mt-24 pt-10" style={{ borderTop: `1px solid ${content.border}` }}>
          <h2 className="text-xs uppercase tracking-[0.2em] mb-8" style={{ color: content.muted }}>
            Other {nouns.plural.toLowerCase()}
          </h2>
          <SetCards
            treatment={treatment}
            sets={siblings.map((s): SetCardData => ({
              id: s.group.id,
              slug: s.group.slug,
              title: s.group.title,
              subtitle: s.group.subtitle,
              coverImageUrl: s.group.cover_image_url,
              coverObjectId: s.group.cover_object_id,
              dateLabel: s.dateLabel,
              members: s.members,
              count: s.count,
            }))}
            slug={slug}
            theme={theme}
            itemPlural={labels.itemPlural}
          />
          <div className="mt-10">
            <Link href={`/museum/${slug}/sets`} className="text-sm transition-opacity hover:opacity-70" style={{ color: accent }}>
              All {nouns.plural.toLowerCase()} →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
