import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { GridObject } from './types'
import { objectHref } from './types'

/**
 * The set an object was reached through, rendered on the object page.
 *
 * Walking a set item by item is what makes it feel like an exhibition rather
 * than a saved filter, and it is the reason a set page is worth having at all.
 * All three pieces here are theme-driven only — no colours of their own
 * (invariant V).
 */

interface Colors {
  heading: string
  body: string
  muted: string
  border: string
  cardBg: string
  accent: string
  headingStyle: CSSProperties
  radius: number
}

// ── Breadcrumb ───────────────────────────────────────────────────────────

export function SetBreadcrumb({
  slug, setSlug, setTitle, collectionLabel, setsLabel, colors,
}: {
  slug: string
  setSlug: string
  setTitle: string
  collectionLabel: string
  setsLabel: string
  colors: Colors
}) {
  return (
    <nav
      className="text-xs font-mono mb-10 flex items-center gap-2 flex-wrap"
      style={{ color: colors.muted }}
      aria-label="Breadcrumb"
    >
      <Link href={`/museum/${slug}`} className="transition-opacity hover:opacity-70">
        {collectionLabel}
      </Link>
      <span aria-hidden>/</span>
      <Link href={`/museum/${slug}/sets`} className="transition-opacity hover:opacity-70">
        {setsLabel}
      </Link>
      <span aria-hidden>/</span>
      <Link
        href={`/museum/${slug}/sets/${setSlug}`}
        className="transition-opacity hover:opacity-70"
        style={{ color: colors.accent }}
      >
        {setTitle}
      </Link>
    </nav>
  )
}

// ── Prev / next within the set ───────────────────────────────────────────

function PagerLink({
  slug, setSlug, item, direction, colors,
}: {
  slug: string
  setSlug: string
  item: GridObject | null
  direction: 'previous' | 'next'
  colors: Colors
}) {
  if (!item) {
    // Held open so the pager doesn't jump left and right at the ends.
    return <div className="flex-1 min-w-0" aria-hidden />
  }

  const isNext = direction === 'next'
  return (
    <Link
      href={objectHref(slug, item.id, setSlug)}
      className={`group flex-1 min-w-0 flex items-center gap-3 ${isNext ? 'flex-row-reverse text-right' : ''}`}
      rel={isNext ? 'next' : 'prev'}
    >
      <div
        className="w-12 h-12 shrink-0 relative overflow-hidden"
        style={{ background: colors.cardBg, borderRadius: colors.radius, border: `1px solid ${colors.border}` }}
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-lg">{item.emoji || '🖼️'}</span>
        )}
      </div>

      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: colors.muted }}>
          {isNext ? 'Next' : 'Previous'}
        </div>
        <div
          className="text-sm truncate transition-opacity group-hover:opacity-70"
          style={{ ...colors.headingStyle, color: colors.heading }}
        >
          {item.title}
        </div>
      </div>
    </Link>
  )
}

export function SetPager({
  slug, setSlug, setTitle, previous, next, index, total, colors,
}: {
  slug: string
  setSlug: string
  setTitle: string
  previous: GridObject | null
  next: GridObject | null
  index: number
  total: number
  colors: Colors
}) {
  return (
    <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-center gap-2 mb-6 text-xs font-mono" style={{ color: colors.muted }}>
        <Link
          href={`/museum/${slug}/sets/${setSlug}`}
          className="transition-opacity hover:opacity-70"
          style={{ color: colors.accent }}
        >
          {setTitle}
        </Link>
        <span aria-hidden>·</span>
        <span className="tabular-nums">{index + 1} of {total}</span>
      </div>

      <div className="flex items-center gap-6">
        <PagerLink slug={slug} setSlug={setSlug} item={previous} direction="previous" colors={colors} />
        <PagerLink slug={slug} setSlug={setSlug} item={next} direction="next" colors={colors} />
      </div>
    </div>
  )
}

// ── Chips for every set this object is in ────────────────────────────────

/**
 * Shown regardless of how the visitor arrived. This is the bottom-up route
 * into sets — someone landing on one object from search finds the two sets it
 * belongs to, rather than only ever discovering sets from the top down.
 */
export function SetChips({
  slug, sets, label, colors, square = false,
}: {
  slug: string
  sets: { id: string; slug: string; title: string }[]
  label: string
  colors: Colors
  square?: boolean
}) {
  if (sets.length === 0) return null

  return (
    <div className="mt-8">
      <div className="text-[10px] font-mono uppercase tracking-widest mb-2.5" style={{ color: colors.muted }}>
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {sets.map(set => (
          <Link
            key={set.id}
            href={`/museum/${slug}/sets/${set.slug}`}
            className="text-xs font-mono px-3 py-1.5 transition-colors"
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: square ? 0 : 999,
              color: colors.body,
              background: colors.cardBg,
            }}
          >
            {set.title}
          </Link>
        ))}
      </div>
    </div>
  )
}
