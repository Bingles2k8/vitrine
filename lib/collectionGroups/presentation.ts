import type { GridVariant } from '@/lib/templates'
import type { SetNavStyle } from './types'

/**
 * How sets are drawn, derived rather than hand-authored.
 *
 * The public site already carries three axes of template identity —
 * `layout_variant` (the masthead), `grid_variant` (the collection),
 * `object_variant` (the item page) — plus chrome and a paired body face. A set
 * index rendered as rounded cards on Archival, whose collection is a ruled
 * catalogue list, would look like a different product bolted on.
 *
 * Nine hand-authored set layouts is the wrong fix. Instead the existing
 * `grid_variant` maps onto four set treatments, so a new template or a new
 * grid variant costs one line here rather than a new component.
 */

export type SetTreatment =
  | 'plates'   // cover matted on the page ground, caption beneath — a hang label
  | 'ledger'   // hairline-ruled rows, numbers, counts in tabular figures
  | 'tiles'    // full-bleed covers butted on a 1px gap, title over a scrim
  | 'feature'  // one large lead set, the rest smaller — editorial rhythm

export const SET_TREATMENT: Record<GridVariant, SetTreatment> = {
  uniform:   'plates',
  plate:     'plates',
  catalogue: 'ledger',
  spotlight: 'tiles',
  mosaic:    'tiles',
  salon:     'feature',
  editorial: 'feature',
  stack:     'feature',
  // Object-led variants hold one thing at a time, so a set index of them wants
  // the quietest treatment: plates let the set covers speak without competing
  // with the layout the visitor is about to land in.
  flip:       'plates',
  foil:       'plates',
  northlight: 'plates',
  verso:      'plates',
  viewfinder: 'plates',
}

export function setTreatment(variant: GridVariant | null | undefined): SetTreatment {
  return (variant && SET_TREATMENT[variant]) || 'plates'
}

// ── Nav styles ───────────────────────────────────────────────────────────

export interface SetNavStyleMeta {
  id: SetNavStyle
  label: string
  /** Shown under the label in the picker. */
  blurb: string
  /** Rough shape drawn in the picker swatch. */
  icon: 'grid' | 'coverflow' | 'carousel' | 'filmstrip' | 'shelf' | 'sheet' | 'timeline' | 'reel'
  /** Below this many items the style has nothing to do; falls back to grid. */
  minItems: number
  /** Reads badly without images — flagged in the picker, never blocked. */
  wantsImages: boolean
}

export const SET_NAV_STYLE_META: SetNavStyleMeta[] = [
  {
    id: 'grid',
    label: 'Grid',
    blurb: 'Your site’s own collection layout. Everything visible at once.',
    icon: 'grid',
    minItems: 1,
    wantsImages: false,
  },
  {
    id: 'coverflow',
    label: 'Cover Flow',
    blurb: 'Items angle away on both sides and swing forward as you move. Drag, scroll or use the arrow keys.',
    icon: 'coverflow',
    minItems: 3,
    wantsImages: true,
  },
  {
    id: 'carousel',
    label: 'One at a time',
    blurb: 'A single item, full width, with arrows either side and a counter.',
    icon: 'carousel',
    minItems: 2,
    wantsImages: false,
  },
  {
    id: 'filmstrip',
    label: 'Filmstrip',
    blurb: 'A large stage above, a scrolling strip of thumbnails below.',
    icon: 'filmstrip',
    minItems: 3,
    wantsImages: true,
  },
  {
    id: 'shelf',
    label: 'Shelves',
    blurb: 'Items stood in rows on drawn shelves, like a cabinet.',
    icon: 'shelf',
    minItems: 3,
    wantsImages: false,
  },
  {
    id: 'contact-sheet',
    label: 'Contact sheet',
    blurb: 'Dense numbered thumbnails on a dark ground, the way a darkroom proof reads.',
    icon: 'sheet',
    minItems: 6,
    wantsImages: true,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    blurb: 'Laid along a date line, earliest first. Needs dates on your items.',
    icon: 'timeline',
    minItems: 2,
    wantsImages: false,
  },
  {
    id: 'reel',
    label: 'Reel',
    blurb: 'One item per screen, snapping as you scroll. Strongest on a phone.',
    icon: 'reel',
    minItems: 2,
    wantsImages: true,
  },
]

const NAV_META_BY_ID = new Map(SET_NAV_STYLE_META.map(m => [m.id, m]))

export function navStyleMeta(id: SetNavStyle): SetNavStyleMeta {
  return NAV_META_BY_ID.get(id) ?? NAV_META_BY_ID.get('grid')!
}

/**
 * The style actually used to render, which is not always the one chosen.
 *
 * A cover flow of two items, or a timeline where nothing carries a date, is
 * worse than the grid it replaced. Rather than block those choices in the
 * editor — the owner may be mid-build with two items and twelve to come — the
 * renderer quietly falls back and the editor says so.
 */
export function effectiveNavStyle(
  chosen: SetNavStyle,
  items: { year?: string | null; production_date?: string | null }[],
): SetNavStyle {
  const meta = navStyleMeta(chosen)
  if (items.length < meta.minItems) return 'grid'
  if (chosen === 'timeline') {
    const dated = items.filter(i => i.year || i.production_date).length
    if (dated < 2) return 'grid'
  }
  return chosen
}
