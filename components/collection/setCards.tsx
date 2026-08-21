import Link from 'next/link'
import type { SetTreatment } from '@/lib/collectionGroups'
import SetCover from './SetCover'
import type { GridObject, GridTheme } from './types'

/**
 * The four set-card treatments, derived from the museum's `grid_variant`
 * rather than hand-authored per template. See lib/collectionGroups/presentation.
 *
 * As with the collection grids, no treatment defines a colour, radius or face
 * of its own — everything arrives resolved on GridTheme, so dark mode and all
 * nine templates work by construction rather than by maintenance (invariant V).
 */

export interface SetCardData {
  id: string
  slug: string
  title: string
  subtitle: string | null
  coverImageUrl: string | null
  coverObjectId: string | null
  dateLabel: string | null
  members: GridObject[]
  count: number
}

interface CardsProps {
  sets: SetCardData[]
  slug: string
  theme: GridTheme
  itemPlural: string
}

function setHref(slug: string, setSlug: string): string {
  return `/museum/${slug}/sets/${setSlug}`
}

function countLabel(count: number, itemPlural: string): string {
  return `${count} ${count === 1 ? itemPlural.replace(/s$/i, '') : itemPlural}`.toLowerCase()
}

/** Cards for sets of five or more get a stacked-depth cue behind the cover. */
function Depth({ show, theme }: { show: boolean; theme: GridTheme }) {
  if (!show) return null
  return (
    <>
      <span
        aria-hidden
        className="absolute -z-10 inset-x-2 -bottom-1 h-3"
        style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: theme.radius }}
      />
      <span
        aria-hidden
        className="absolute -z-20 inset-x-4 -bottom-2 h-3"
        style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: theme.radius }}
      />
    </>
  )
}

// ─── plates ─────────────────────────────────────────────────────────────────
// Cover matted on the page ground, caption beneath. A hang label, scaled up.

export function PlateSetCards({ sets, slug, theme, itemPlural }: CardsProps) {
  const framed = theme.options.frame === true
  const cols = Math.min(theme.columns, Math.max(sets.length, 1))
  return (
    <div
      className="grid gap-x-8 gap-y-14 md:gap-x-12"
      style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, minmax(0, 1fr))` }}
    >
      {sets.map(set => (
        <Link key={set.id} href={setHref(slug, set.slug)} className="group relative block">
          <Depth show={set.count >= 5} theme={theme} />
          <div
            style={framed ? { border: `1px solid ${theme.accent}`, padding: 10, borderRadius: theme.radius } : undefined}
          >
            <SetCover
              members={set.members}
              coverImageUrl={set.coverImageUrl}
              coverObjectId={set.coverObjectId}
              aspect={theme.imageAspect}
              radius={theme.radius}
              imageBg={theme.imageBg}
              border={theme.border}
              accent={theme.accent}
            />
          </div>
          <div className={`mt-4 ${framed ? 'text-center' : ''}`}>
            <div className="text-lg leading-snug" style={{ ...theme.headingStyle, color: theme.heading }}>
              {set.title}
            </div>
            {set.subtitle && (
              <div className="text-sm mt-1" style={{ color: theme.body }}>{set.subtitle}</div>
            )}
            <div className="text-xs font-mono mt-1.5" style={{ color: theme.muted }}>
              {[countLabel(set.count, itemPlural), set.dateLabel].filter(Boolean).join('  ·  ')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── ledger ─────────────────────────────────────────────────────────────────
// Hairline-ruled rows. The catalogue templates earn their formality by not
// showing a hero-sized cover: a small square, a title, a count in figures.

export function LedgerSetCards({ sets, slug, theme, itemPlural }: CardsProps) {
  const numbered = theme.options.numbered === true
  return (
    <div style={{ borderTop: `1px solid ${theme.border}` }}>
      {sets.map((set, i) => (
        <Link
          key={set.id}
          href={setHref(slug, set.slug)}
          className="group flex items-center gap-5 py-5 px-2 -mx-2 transition-colors"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          {numbered && (
            <div className="text-xs font-mono w-10 shrink-0 tabular-nums" style={{ color: theme.muted }}>
              {String(i + 1).padStart(3, '0')}
            </div>
          )}

          <div className="w-20 h-20 md:w-24 md:h-24 shrink-0">
            <SetCover
              members={set.members}
              coverImageUrl={set.coverImageUrl}
              coverObjectId={set.coverObjectId}
              aspect="aspect-square"
              radius={theme.radius}
              imageBg={theme.imageBg}
              border={theme.border}
              accent={theme.accent}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-lg leading-snug" style={{ ...theme.headingStyle, color: theme.heading }}>
              {set.title}
            </div>
            {set.subtitle && (
              <div className="text-sm mt-0.5" style={{ color: theme.body }}>{set.subtitle}</div>
            )}
            {set.dateLabel && (
              <div className="text-xs font-mono mt-1.5" style={{ color: theme.muted }}>{set.dateLabel}</div>
            )}
          </div>

          <div className="text-xs font-mono shrink-0 text-right tabular-nums" style={{ color: theme.muted }}>
            {set.count}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── tiles ──────────────────────────────────────────────────────────────────
// Full-bleed covers butted on a hairline gap, title over a bottom scrim. The
// dark templates' idiom — a border around every set fights the atmosphere.

export function TileSetCards({ sets, slug, theme, itemPlural }: CardsProps) {
  const cols = Math.min(theme.columns, Math.max(sets.length, 1), 3)
  return (
    <div
      className="grid gap-px"
      style={{ background: theme.border, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {sets.map(set => (
        <Link key={set.id} href={setHref(slug, set.slug)} className="group relative block">
          <SetCover
            members={set.members}
            coverImageUrl={set.coverImageUrl}
            coverObjectId={set.coverObjectId}
            aspect={theme.imageAspect}
            radius={0}
            imageBg={theme.imageBg}
            border={theme.border}
            accent={theme.accent}
            wide
          />
          <div
            className="absolute inset-x-0 bottom-0 p-5 pt-12"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)' }}
          >
            <div className="text-lg leading-snug text-white" style={theme.headingStyle}>{set.title}</div>
            {set.subtitle && (
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{set.subtitle}</div>
            )}
            <div className="text-[11px] font-mono mt-2" style={{ color: theme.accent }}>
              {[countLabel(set.count, itemPlural), set.dateLabel].filter(Boolean).join('  ·  ')}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── feature ────────────────────────────────────────────────────────────────
// One large lead set, the rest smaller beneath. Matches the editorial rhythm
// of the templates whose collections already alternate scale.

export function FeatureSetCards({ sets, slug, theme, itemPlural }: CardsProps) {
  const [lead, ...rest] = sets
  if (!lead) return null

  return (
    <div>
      <Link href={setHref(slug, lead.slug)} className="group grid md:grid-cols-2 gap-8 md:gap-12 items-center mb-16">
        <SetCover
          members={lead.members}
          coverImageUrl={lead.coverImageUrl}
          coverObjectId={lead.coverObjectId}
          aspect="aspect-[4/3]"
          radius={theme.radius}
          imageBg={theme.imageBg}
          border={theme.border}
          accent={theme.accent}
          wide
        />
        <div style={{ borderLeft: `2px solid ${theme.accent}`, paddingLeft: '1.5rem' }}>
          <div className="text-3xl md:text-4xl leading-tight" style={{ ...theme.headingStyle, color: theme.heading }}>
            {lead.title}
          </div>
          {lead.subtitle && (
            <div className="text-base mt-3" style={{ color: theme.body }}>{lead.subtitle}</div>
          )}
          <div className="text-xs font-mono mt-4" style={{ color: theme.muted }}>
            {[countLabel(lead.count, itemPlural), lead.dateLabel].filter(Boolean).join('  ·  ')}
          </div>
        </div>
      </Link>

      {rest.length > 0 && (
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map(set => (
            <Link key={set.id} href={setHref(slug, set.slug)} className="group relative block">
              <Depth show={set.count >= 5} theme={theme} />
              <SetCover
                members={set.members}
                coverImageUrl={set.coverImageUrl}
                coverObjectId={set.coverObjectId}
                aspect={theme.imageAspect}
                radius={theme.radius}
                imageBg={theme.imageBg}
                border={theme.border}
                accent={theme.accent}
              />
              <div className="mt-3">
                <div className="text-base leading-snug" style={{ ...theme.headingStyle, color: theme.heading }}>
                  {set.title}
                </div>
                <div className="text-xs font-mono mt-1.5" style={{ color: theme.muted }}>
                  {[countLabel(set.count, itemPlural), set.dateLabel].filter(Boolean).join('  ·  ')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const TREATMENTS: Record<SetTreatment, (p: CardsProps) => React.ReactElement | null> = {
  plates: PlateSetCards,
  ledger: LedgerSetCards,
  tiles: TileSetCards,
  feature: FeatureSetCards,
}

export default function SetCards({ treatment, ...props }: CardsProps & { treatment: SetTreatment }) {
  const Cards = TREATMENTS[treatment] ?? PlateSetCards
  return <Cards {...props} />
}
