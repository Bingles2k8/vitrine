import type { CollectionCategory } from '@/lib/categories'

/**
 * What this collection calls a set.
 *
 * A museum runs exhibitions; a comics collector chases runs; a militaria
 * collector buys groupings; a wine collector builds verticals. Resolved from
 * two signals, in order:
 *
 *   1. the collection profile, when exactly one is active
 *   2. `museums.collection_category` — the Discover category, which most
 *      collectors set even when they never pick a profile
 *   3. "Set"
 *
 * **"Collection" is never a valid answer.** The public masthead already has a
 * "Collection" link, so returning it here produced `Collection | Collections`
 * — two nav items one letter apart. Anything without a better word falls back
 * to "Set", which is short, generic and cannot collide.
 *
 * Same discipline as the rest of collection profiles: an absent entry degrades
 * to something safe. Only words that are genuinely used by collectors in that
 * field are mapped; a confidently wrong term is worse than a plain one.
 */

export interface GroupNouns {
  singular: string
  plural: string
}

export const DEFAULT_GROUP_NOUNS: GroupNouns = { singular: 'Set', plural: 'Sets' }

export const MUSEUM_GROUP_NOUNS: GroupNouns = { singular: 'Exhibition', plural: 'Exhibitions' }

/** The words we use, so a typo becomes a type error rather than a live label. */
const N = {
  set: DEFAULT_GROUP_NOUNS,
  series: { singular: 'Series', plural: 'Series' },
  run: { singular: 'Run', plural: 'Runs' },
  grouping: { singular: 'Grouping', plural: 'Groupings' },
  suite: { singular: 'Suite', plural: 'Suites' },
  line: { singular: 'Line', plural: 'Lines' },
  vertical: { singular: 'Vertical', plural: 'Verticals' },
  theme: { singular: 'Theme', plural: 'Themes' },
  group: { singular: 'Group', plural: 'Groups' },
} satisfies Record<string, GroupNouns>

// ── By collection profile (21 + the full-mode fixed profile) ─────────────

export const GROUP_NOUNS_BY_PROFILE: Record<string, GroupNouns> = {
  'museum-fixed':        MUSEUM_GROUP_NOUNS,

  'comics':              N.run,
  'militaria':           N.grouping,
  'wine-spirits':        N.vertical,
  'jewellery':           N.suite,
  'fashion-sneakers':    N.line,
  'toys-models':         N.line,

  'stamps':              N.series,
  'books':               N.series,
  'art':                 N.series,
  'photography-cameras': N.series,
  'natural-history':     N.series,
  'coins-banknotes':     N.series,

  'trading-cards':       N.set,
  'sports-memorabilia':  N.set,
  'antiques':            N.set,
  'ceramics-glass':      N.set,
  'vinyl-music':         N.set,
  'watches-clocks':      N.set,
  'video-games':         N.set,
  'automobilia':         N.set,
  'general':             N.set,
}

// ── By Discover category (lib/categories.ts) ─────────────────────────────
// The signal most collectors actually set. Only entries with a genuine
// collector term are listed; everything else resolves to "Set".

export const GROUP_NOUNS_BY_CATEGORY: Partial<Record<CollectionCategory, GroupNouns>> = {
  'Comics & Graphic Novels':   N.run,
  'Militaria & Arms':          N.grouping,
  'Wine & Spirits':            N.vertical,
  'LEGO & Building Sets':      N.theme,

  'Jewellery':                 N.suite,
  'Furniture':                 N.suite,
  'Fossils & Minerals':        N.suite,

  'Fashion & Clothing':        N.line,
  'Sneakers & Streetwear':     N.line,
  'Handbags & Accessories':    N.line,
  'Toys & Models':             N.line,

  'Art & Paintings':           N.series,
  'Photography':               N.series,
  'Archives & Documents':      N.series,
  'Books & Manuscripts':       N.series,
  'Maps & Prints':             N.series,
  'Postcards':                 N.series,
  'Stamps & Ephemera':         N.series,
  'Coins & Medals':            N.series,
  'Banknotes & Paper Money':   N.series,
  'Natural History':           N.series,

  'Archaeology':               N.group,
  'Tribal & Ethnographic':     N.group,
  'Social History':            N.group,
  'Religious & Devotional':    N.group,
  'Textiles':                  N.group,
  'Rugs & Carpets':            N.group,
  'Taxidermy':                 N.group,
  'Industrial Heritage':       N.group,
}

export function groupNounsForProfile(profileId: string | null | undefined): GroupNouns | null {
  if (!profileId) return null
  return GROUP_NOUNS_BY_PROFILE[profileId] ?? null
}

export function groupNounsForCategory(category: string | null | undefined): GroupNouns | null {
  if (!category) return null
  return GROUP_NOUNS_BY_CATEGORY[category as CollectionCategory] ?? null
}
