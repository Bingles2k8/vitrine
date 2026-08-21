import {
  resolveCollectionProfile,
  type ProfileMuseumLike,
} from '@/lib/collectionProfiles'
import { groupNounsForProfile, type GroupNouns } from './vocab'
import type { CollectionGroupRow } from './types'

export * from './types'
export * from './fields'
export * from './rules'
export * from './presentation'
export { groupNounsForProfile, DEFAULT_GROUP_NOUNS, MUSEUM_GROUP_NOUNS } from './vocab'
export type { GroupNouns } from './vocab'

/**
 * Sets are available on every tier, unlimited — decision D2.
 *
 * This exists so the absence of a gate is explicit rather than implied by
 * there being no check anywhere. If sets are ever gated, this is the one
 * place that changes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the parameter
// is the point: it marks where a plan gate would go if sets are ever gated.
export function groupsEnabled(plan: string | null | undefined): boolean {
  return true
}

/** The set vocabulary for a collection: "Sets", "Exhibitions", "Runs". */
export function groupNouns(
  museum: ProfileMuseumLike & { plan?: string | null },
): GroupNouns {
  return groupNounsForProfile(resolveCollectionProfile(museum).id)
}

// ── Slugs ────────────────────────────────────────────────────────────────

/**
 * Slug from a title. Matches the museum-slug rules in lib/validations.ts so a
 * set slug can never be something the route or the validator will reject.
 */
export function slugifyGroupTitle(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return base || 'set'
}

/** Append -2, -3 … until the slug is free within this museum. */
export function uniqueGroupSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let n = 2; n < 500; n++) {
    const candidate = `${base.slice(0, 57)}-${n}`
    if (!used.has(candidate)) return candidate
  }
  return `${base.slice(0, 50)}-${Date.now().toString(36)}`
}

// ── Dates ────────────────────────────────────────────────────────────────

export type GroupPhase = 'current' | 'upcoming' | 'past' | 'undated'

export function groupPhase(
  group: Pick<CollectionGroupRow, 'date_start' | 'date_end'>,
  now: Date = new Date(),
): GroupPhase {
  const { date_start, date_end } = group
  if (!date_start && !date_end) return 'undated'

  const today = now.toISOString().slice(0, 10)
  if (date_start && date_start > today) return 'upcoming'
  if (date_end && date_end < today) return 'past'
  return 'current'
}

const MONTH_DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
const MONTH_DAY_YEAR = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function parseDay(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * A date range in words rather than a raw span: "Until 4 June",
 * "Opens 12 March", "12 March – 4 June 2026", "Since 2019".
 *
 * A public page saying "2026-03-12 — 2026-06-04" reads like a database, which
 * is the thing this whole feature is trying not to look like.
 */
export function formatGroupDates(
  group: Pick<CollectionGroupRow, 'date_start' | 'date_end'>,
  now: Date = new Date(),
): string | null {
  const start = group.date_start ? parseDay(group.date_start) : null
  const end = group.date_end ? parseDay(group.date_end) : null
  if (!start && !end) return null

  const phase = groupPhase(group, now)

  if (start && end) {
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
    return sameYear
      ? `${MONTH_DAY.format(start)} – ${MONTH_DAY_YEAR.format(end)}`
      : `${MONTH_DAY_YEAR.format(start)} – ${MONTH_DAY_YEAR.format(end)}`
  }

  if (start) {
    return phase === 'upcoming'
      ? `Opens ${MONTH_DAY_YEAR.format(start)}`
      : `Since ${MONTH_DAY_YEAR.format(start)}`
  }

  return phase === 'past'
    ? `Closed ${MONTH_DAY_YEAR.format(end!)}`
    : `Until ${MONTH_DAY_YEAR.format(end!)}`
}

export const PHASE_LABELS: Record<Exclude<GroupPhase, 'undated'>, string> = {
  current: 'Now showing',
  upcoming: 'Coming soon',
  past: 'Past',
}

/** How many sets the homepage expands as sections before deferring to the index. */
export const MAX_HOMEPAGE_SECTIONS = 6

/** Items shown in a homepage section before "View all". */
export const HOMEPAGE_SECTION_ITEMS = 8

/** Below this, a set page shows no search/sort chrome. */
export const SET_BROWSER_THRESHOLD = 12
