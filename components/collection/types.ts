import type { CSSProperties } from 'react'
import type { GridOptions } from '@/lib/templates'
import type { PublicLabels } from '@/lib/publicProfile'

/** The object fields the public grid renders. */
export interface GridObject {
  id: string
  title: string
  artist: string
  year: string
  medium: string
  culture: string
  status: string
  emoji: string
  image_url: string | null
  condition_grade?: string | null
  rarity?: string | null
  description?: string | null
  /** Production date, for the timeline nav style. */
  production_date?: string | null
  /** The curator's note on this item *within the set being rendered*. */
  note?: string | null
  /** Published sets this item belongs to — drives the collection filter chips. */
  groupIds?: string[]
  /** Modal colour of the picture's own border, sampled at upload. Null when the
   *  border is too busy to sample, which is common for objects shot in situ.
   *  The object-led templates use it as the surround so a photograph sits in a
   *  fixed frame without cropping and without a hard seam. */
  matte?: string | null
  /** Natural width / height, so a frame can be sized before the image loads. */
  aspect?: number | null
  /** condition_grade mapped onto the canonical scale, where a mapping exists.
   *  Display always uses condition_grade; this is only for ranking. */
  conditionCanonical?: string | null
}

/**
 * Everything a grid variant needs to draw itself.
 *
 * Colours arrive as resolved values rather than Tailwind class maps. The maps
 * were duplicated per template inside the grid and had to be extended by hand
 * for every new template and for dark mode; `getMuseumStyles` already resolves
 * exactly these values once, correctly, including dark mode.
 */
export interface GridTheme {
  accent: string
  heading: string
  body: string
  muted: string
  border: string
  cardBg: string
  imageBg: string
  /** Font family/style for work titles. */
  headingStyle: CSSProperties
  radius: number
  /** Tailwind aspect-ratio class, e.g. `aspect-square`. */
  imageAspect: string
  columns: number
  /** Tailwind padding class for card interiors. */
  padding: string
  /** none | title | title+artist | full */
  metadata: string
  options: GridOptions
  labels: PublicLabels
  /** Resolved per-template levers from `museums.template_options`, defaults
   *  filled in. Only the object-led variants read these. */
  templateOptions?: Record<string, string | boolean>
}

export interface GridProps {
  items: GridObject[]
  slug: string
  theme: GridTheme
  /** Set the items were reached through, carried into every item link. */
  setSlug?: string | null
}

/**
 * Narrow an object row to the fields the public grid renders.
 *
 * The grid is a client component, so whatever is handed to it is serialised
 * into the page payload and readable by any visitor. Rows arrive from
 * `select('*')`, which carries purchase prices, valuations and internal notes
 * that are never displayed — those must not cross the boundary.
 */
export function toGridObject(o: Record<string, unknown>): GridObject {
  const str = (v: unknown): string => (typeof v === 'string' ? v : '')
  const orNull = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null)

  return {
    id: String(o.id),
    title: str(o.title),
    artist: str(o.artist),
    year: str(o.year),
    medium: str(o.medium),
    culture: str(o.culture),
    status: str(o.status),
    emoji: str(o.emoji),
    image_url: orNull(o.image_url),
    condition_grade: orNull(o.condition_grade),
    rarity: orNull(o.rarity),
    description: orNull(o.description),
    production_date: orNull(o.production_date),
    matte: orNull(o.image_matte),
    aspect: typeof o.image_aspect === 'number' ? o.image_aspect : null,
    conditionCanonical: orNull(o.condition_canonical),
  }
}

/**
 * Link to an object, optionally carrying the set it was reached through.
 *
 * Every grid variant routes its links through here, so threading set context
 * into all eight is this one parameter. The object page validates the slug
 * against real membership before rendering anything set-shaped — invariant W.
 */
export function objectHref(slug: string, id: string, setSlug?: string | null): string {
  const base = `/museum/${slug}/object/${id}`
  return setSlug ? `${base}?set=${encodeURIComponent(setSlug)}` : base
}

/** This hobby's word for a canonical status, e.g. "Sold / Traded". */
export function statusText(theme: GridTheme, status: string): string {
  return theme.labels.statusLabels[status] ?? status
}

/** This hobby's word for a canonical condition grade, e.g. "Uncirculated". */
export function conditionText(theme: GridTheme, grade: string): string {
  return theme.labels.conditionLabels[grade] ?? grade
}

/** The caption line beneath a work: maker, then date, as available. */
export function captionParts(item: GridObject, theme: GridTheme): string[] {
  const parts: string[] = []
  if (theme.metadata === 'title+artist' || theme.metadata === 'full') {
    if (item.artist) parts.push(item.artist)
  }
  if (theme.metadata === 'full' && item.year) parts.push(item.year)
  return parts
}
