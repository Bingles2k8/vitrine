/**
 * What this hobby calls a set.
 *
 * A museum runs exhibitions; a card collector completes sets; a comics
 * collector chases runs; a militaria collector buys groupings. Following the
 * same discipline as the rest of collection profiles: an absent override falls
 * back to "Set", which is safe. A confidently wrong word is not — the entries
 * marked with a comment are the ones worth checking with a collector in that
 * field before they harden.
 *
 * Keyed by collection profile id. `museum-fixed` is the full-mode (Professional
 * and above) profile, so paid museum sites read "Exhibition" throughout.
 */

export interface GroupNouns {
  singular: string
  plural: string
}

export const DEFAULT_GROUP_NOUNS: GroupNouns = { singular: 'Set', plural: 'Sets' }

export const MUSEUM_GROUP_NOUNS: GroupNouns = { singular: 'Exhibition', plural: 'Exhibitions' }

export const GROUP_NOUNS_BY_PROFILE: Record<string, GroupNouns> = {
  'museum-fixed':        MUSEUM_GROUP_NOUNS,

  'trading-cards':       { singular: 'Set', plural: 'Sets' },
  'sports-memorabilia':  { singular: 'Set', plural: 'Sets' },
  'antiques':            { singular: 'Set', plural: 'Sets' },

  'comics':              { singular: 'Run', plural: 'Runs' },
  'militaria':           { singular: 'Grouping', plural: 'Groupings' },

  'stamps':              { singular: 'Series', plural: 'Series' },
  'books':               { singular: 'Series', plural: 'Series' },
  'art':                 { singular: 'Series', plural: 'Series' },
  'photography-cameras': { singular: 'Series', plural: 'Series' },
  'natural-history':     { singular: 'Series', plural: 'Series' },
  'coins-banknotes':     { singular: 'Series', plural: 'Series' },   // check with a numismatist

  'wine-spirits':        { singular: 'Vertical', plural: 'Verticals' }, // check
  'jewellery':           { singular: 'Suite', plural: 'Suites' },       // check
  'ceramics-glass':      { singular: 'Service', plural: 'Services' },   // check
  'toys-models':         { singular: 'Wave', plural: 'Waves' },         // check
  'fashion-sneakers':    { singular: 'Line', plural: 'Lines' },         // check

  'vinyl-music':         { singular: 'Collection', plural: 'Collections' },
  'watches-clocks':      { singular: 'Collection', plural: 'Collections' },
  'video-games':         { singular: 'Collection', plural: 'Collections' },
  'automobilia':         { singular: 'Collection', plural: 'Collections' },
  'general':             { singular: 'Collection', plural: 'Collections' },
}

export function groupNounsForProfile(profileId: string | null | undefined): GroupNouns {
  if (!profileId) return DEFAULT_GROUP_NOUNS
  return GROUP_NOUNS_BY_PROFILE[profileId] ?? DEFAULT_GROUP_NOUNS
}
