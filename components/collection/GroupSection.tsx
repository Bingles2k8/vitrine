import Link from 'next/link'
import SetItems from './SetItems'
import type { GridObject, GridTheme } from './types'
import type { GridVariant } from '@/lib/templates'

/**
 * One set as a band on the homepage.
 *
 * Deliberately one row deep. The homepage expands at most six of these
 * (MAX_HOMEPAGE_SECTIONS) and defers the rest to the index — "unlimited sets"
 * is a promise about how many you can make, not about how many will be stacked
 * on your front page before it collapses.
 *
 * Always renders in the museum's own grid variant, never the set's chosen nav
 * style: a homepage carrying six cover flows would be unusable, and the styles
 * belong to the set's own page.
 */

interface Props {
  title: string
  subtitle: string | null
  dateLabel: string | null
  href: string
  members: GridObject[]
  total: number
  slug: string
  setSlug: string
  theme: GridTheme
  gridVariant: GridVariant
  itemPlural: string
}

export default function GroupSection({
  title, subtitle, dateLabel, href, members, total,
  slug, setSlug, theme, gridVariant, itemPlural,
}: Props) {
  if (members.length === 0) return null

  // One row of the museum's grid, whatever that grid's column count is.
  const row = members.slice(0, Math.max(theme.columns, 2))
  const remaining = total - row.length

  return (
    <section className="max-w-6xl mx-auto px-6 pt-14">
      <div className="flex items-end justify-between gap-6 mb-6">
        <div className="min-w-0">
          <Link href={href} className="group inline-block">
            <h2
              className="text-2xl md:text-3xl leading-tight transition-opacity group-hover:opacity-70"
              style={{ ...theme.headingStyle, color: theme.heading }}
            >
              {title}
            </h2>
          </Link>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: theme.body }}>{subtitle}</p>
          )}
          <div className="text-xs font-mono mt-1.5" style={{ color: theme.muted }}>
            {[`${total} ${total === 1 ? itemPlural.replace(/s$/i, '') : itemPlural}`.toLowerCase(), dateLabel]
              .filter(Boolean).join('  ·  ')}
          </div>
        </div>

        <Link
          href={href}
          className="text-xs font-mono shrink-0 whitespace-nowrap transition-opacity hover:opacity-70 pb-1"
          style={{ color: theme.accent }}
        >
          {remaining > 0 ? `View all ${total} →` : 'View →'}
        </Link>
      </div>

      <SetItems
        items={row}
        slug={slug}
        setSlug={setSlug}
        theme={{ ...theme, columns: Math.min(theme.columns, Math.max(row.length, 2)) }}
        navStyle="grid"
        gridVariant={gridVariant}
      />
    </section>
  )
}
