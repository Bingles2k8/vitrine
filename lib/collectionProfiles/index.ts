import { getPlan } from '@/lib/plans'
import type { CollectionCategory } from '@/lib/categories'
import type {
  CollectionProfile, ProfileNouns, ProfileFieldKey, FieldOverride,
  CustomFieldDef, CanonicalStatus, CanonicalConditionGrade, CertificationConfig,
} from './types'
import { deriveCertificationFields } from './certification'
import { NEUTRAL_NOUNS, MUSEUM_NOUNS } from './vocab'
import { general } from './profiles/general'
import { tradingCards } from './profiles/trading-cards'
import { coinsBanknotes } from './profiles/coins-banknotes'
import { stamps } from './profiles/stamps'
import { watchesClocks } from './profiles/watches-clocks'
import { vinylMusic } from './profiles/vinyl-music'
import { wineSpirits } from './profiles/wine-spirits'
import { art } from './profiles/art'
import { comics } from './profiles/comics'
import { books } from './profiles/books'
import { toysModels } from './profiles/toys-models'
import { videoGames } from './profiles/video-games'
import { militaria } from './profiles/militaria'
import { sportsMemorabilia } from './profiles/sports-memorabilia'
import { fashionSneakers } from './profiles/fashion-sneakers'
import { jewellery } from './profiles/jewellery'
import { ceramicsGlass } from './profiles/ceramics-glass'
import { naturalHistory } from './profiles/natural-history'
import { automobilia } from './profiles/automobilia'
import { photographyCameras } from './profiles/photography-cameras'
import { antiques } from './profiles/antiques'

export * from './types'
export * from './certification'
export * from './customFields'
export { NEUTRAL_NOUNS, MUSEUM_NOUNS, DEFAULT_FIELD_ORDER, resolveFieldOrder } from './vocab'

/**
 * Collection Profiles registry.
 * See docs/collection-profiles-plan.md.
 *
 * `general` is first — it is the fallback and the picker's default option.
 */
export const COLLECTION_PROFILES: CollectionProfile[] = [
  general,
  tradingCards,
  coinsBanknotes,
  stamps,
  watchesClocks,
  vinylMusic,
  wineSpirits,
  art,
  comics,
  books,
  toysModels,
  videoGames,
  militaria,
  sportsMemorabilia,
  fashionSneakers,
  jewellery,
  ceramicsGlass,
  naturalHistory,
  automobilia,
  photographyCameras,
  antiques,
]

const BY_ID = new Map(COLLECTION_PROFILES.map(p => [p.id, p]))

export const GENERAL_PROFILE = general

/**
 * The profile used by every full-mode (Professional and above) plan.
 *
 * It carries today's full-mode labels so the component defaults can be a
 * single call rather than a `fullMode ? … : …` ternary, and it is deliberately
 * NOT in COLLECTION_PROFILES — it is never selectable.
 */
export const MUSEUM_FIXED: CollectionProfile = {
  id: 'museum-fixed',
  label: 'Museum',
  blurb: 'Full collections management vocabulary',
  emoji: '🏛️',
  category: 'Antiques & Collectibles',
  nouns: MUSEUM_NOUNS,
  fields: {
    medium: { label: 'Medium' },
    culture: { label: 'Culture / Origin' },
  },
  vocab: {},
}

/**
 * Profiles apply to Community and Hobbyist only.
 *
 * Expressed as `!fullMode` rather than a plan allowlist because those are the
 * same predicate today, and if a paid tier ever gains simple mode the profile
 * system should follow it rather than silently exclude it.
 */
export function profilesEnabled(plan: string | null | undefined): boolean {
  return !getPlan(plan ?? 'community').fullMode
}

export function getProfile(id: string | null | undefined): CollectionProfile | null {
  if (!id) return null
  return BY_ID.get(id) ?? null
}

/** Never throws: an unknown or retired slug degrades to `general`. */
export function getProfileOrGeneral(id: string | null | undefined): CollectionProfile {
  return getProfile(id) ?? general
}

// ── Shapes the resolvers accept ──────────────────────────────────────────
// Deliberately structural rather than the full DB row types, so callers can
// pass a partially-selected museum or object without casting.

export interface ProfileMuseumLike {
  plan?: string | null
  collection_profiles?: string[] | null
}

export interface ProfileObjectLike {
  collection_profile?: string | null
}

/** The active profiles for a collection, in order. Primary is index 0. */
export function activeProfiles(museum: ProfileMuseumLike | null | undefined): CollectionProfile[] {
  const ids = museum?.collection_profiles ?? []
  return ids.map(getProfile).filter((p): p is CollectionProfile => p !== null)
}

export function primaryProfile(museum: ProfileMuseumLike | null | undefined): CollectionProfile | null {
  return activeProfiles(museum)[0] ?? null
}

/**
 * §6.1 — which profile dresses an individual object's form.
 * Full mode always resolves to MUSEUM_FIXED, so paid tiers see zero diff.
 */
export function resolveObjectProfile(
  object: ProfileObjectLike | null | undefined,
  museum: ProfileMuseumLike | null | undefined,
): CollectionProfile {
  if (!profilesEnabled(museum?.plan)) return MUSEUM_FIXED
  const own = getProfile(object?.collection_profile)
  if (own) return own
  return primaryProfile(museum) ?? general
}

/**
 * §6.3 — which profile dresses collection-wide surfaces (list columns,
 * analytics, filters). These can't be per-object, so a mixed collection
 * falls back to neutral rather than picking a winner.
 */
export function resolveCollectionProfile(
  museum: ProfileMuseumLike | null | undefined,
): CollectionProfile {
  if (!profilesEnabled(museum?.plan)) return MUSEUM_FIXED
  const active = activeProfiles(museum)
  return active.length === 1 ? active[0] : general
}

/**
 * §6.2 — nav and app chrome terminology.
 *
 * Only a single active profile earns its own nouns. Two or more falls back to
 * neutral, because "Add Card" while adding a watch reads as a bug. Flip this
 * to `primaryProfile(museum)?.nouns` if the neutral wording proves too timid.
 */
export function resolveAppNouns(museum: ProfileMuseumLike | null | undefined): ProfileNouns {
  if (!profilesEnabled(museum?.plan)) return MUSEUM_NOUNS
  const active = activeProfiles(museum)
  return active.length === 1 ? active[0].nouns : NEUTRAL_NOUNS
}

// ── Field lookup helpers ─────────────────────────────────────────────────

export function fieldOverride(
  profile: CollectionProfile,
  key: ProfileFieldKey,
): FieldOverride | undefined {
  return profile.fields[key]
}

export function fieldLabel(
  profile: CollectionProfile,
  key: ProfileFieldKey,
  fallback: string,
): string {
  return profile.fields[key]?.label ?? fallback
}

export function fieldPlaceholder(
  profile: CollectionProfile,
  key: ProfileFieldKey,
  fallback?: string,
): string | undefined {
  return profile.fields[key]?.placeholder ?? fallback
}

export function fieldVisible(profile: CollectionProfile, key: ProfileFieldKey): boolean {
  return profile.fields[key]?.hidden !== true
}

/** Profile help text wins over the Learn Mode description for this field. */
export function fieldHelp(
  profile: CollectionProfile,
  key: ProfileFieldKey,
  fallback: string | undefined,
): string | undefined {
  return profile.fields[key]?.help ?? fallback
}

export function statusLabel(
  profile: CollectionProfile,
  status: string,
  fallback: string,
): string {
  return profile.vocab.statusLabels?.[status as CanonicalStatus] ?? fallback
}

export function conditionLabel(
  profile: CollectionProfile,
  grade: string,
  fallback?: string,
): string {
  return profile.vocab.conditionLabels?.[grade as CanonicalConditionGrade] ?? fallback ?? grade
}

/**
 * Vocabulary for an autocomplete or select.
 *
 * For a mixed collection this is the deduplicated union of every active
 * profile's list, which matches how AutocompleteInput already behaves — it
 * merges the static list with values learned from the collection.
 */
export function resolveVocab(
  museum: ProfileMuseumLike | null | undefined,
  key: 'objectTypes' | 'mediums' | 'cultures' | 'emojis',
  fallback: readonly string[],
): string[] {
  if (!profilesEnabled(museum?.plan)) return [...fallback]
  const active = activeProfiles(museum)
  if (active.length === 0) return [...fallback]

  const lists = active.map(p => p.vocab[key]).filter((l): l is string[] => Array.isArray(l))
  if (lists.length === 0) return [...fallback]

  // A profile with no list of its own still wants the default available.
  if (lists.length < active.length) lists.push([...fallback])

  return Array.from(new Set(lists.flat()))
}

/**
 * Finds the certification config that knows a given authority, across every
 * profile — not just the active one.
 *
 * Derived certification columns describe the *certificate*, not the UI. If they
 * were computed from the active profile, deactivating a profile would silently
 * null `cert_grade_numeric` on every graded item the next time it was saved,
 * quietly breaking grade sorting while the grade itself still displayed. Write
 * paths must use this rather than the resolved profile's own config.
 */
export function certificationForAuthority(
  authorityId: string | null | undefined,
): CertificationConfig | undefined {
  if (!authorityId) return undefined
  for (const profile of COLLECTION_PROFILES) {
    if (profile.certification?.authorities.some(a => a.id === authorityId)) {
      return profile.certification
    }
  }
  return undefined
}

/**
 * Derived certification columns for a write path. Resolves the authority
 * registry-wide, so the result never depends on which profile is active.
 */
export function deriveCertificationForWrite(
  authorityId: string | null | undefined,
  grade: string | null | undefined,
) {
  return deriveCertificationFields(certificationForAuthority(authorityId), authorityId, grade)
}

/** Every custom field defined by any profile, for validation (invariant H). */
export function allCustomFieldDefs(): Map<string, CustomFieldDef> {
  const index = new Map<string, CustomFieldDef>()
  for (const profile of COLLECTION_PROFILES) {
    for (const def of profile.customFields ?? []) index.set(def.key, def)
  }
  return index
}

/**
 * Maps a Discover category to the profile that best dresses it. Many
 * categories share one profile (Whisky → wine-spirits; Fossils, Minerals and
 * Taxidermy → natural-history). Anything unmapped falls back to `general`.
 */
export function profileForCategory(category: string | null | undefined): CollectionProfile {
  if (!category) return general
  const direct = COLLECTION_PROFILES.find(p => p.category === category)
  if (direct) return direct
  return getProfileOrGeneral(CATEGORY_TO_PROFILE[category as CollectionCategory])
}

export const CATEGORY_TO_PROFILE: Partial<Record<CollectionCategory, string>> = {
  'Advertising & Signage': 'antiques',
  'Antiques & Collectibles': 'antiques',
  'Archaeology': 'natural-history',
  'Archives & Documents': 'books',
  'Art & Paintings': 'art',
  'Autographs & Memorabilia': 'sports-memorabilia',
  'Automobilia & Vehicles': 'automobilia',
  'Aviation & Maritime': 'automobilia',
  'Banknotes & Paper Money': 'coins-banknotes',
  'Board Games & Puzzles': 'toys-models',
  'Books & Manuscripts': 'books',
  'Bottles & Breweriana': 'antiques',
  'Cameras & Optical Equipment': 'photography-cameras',
  'Ceramics & Pottery': 'ceramics-glass',
  'Clocks & Watches': 'watches-clocks',
  'Coins & Medals': 'coins-banknotes',
  'Comics & Graphic Novels': 'comics',
  'Decorative Arts': 'antiques',
  'Dolls & Bears': 'toys-models',
  'Fashion & Clothing': 'fashion-sneakers',
  'Film & Entertainment': 'toys-models',
  'Fossils & Minerals': 'natural-history',
  'Furniture': 'antiques',
  'Glassware & Crystal': 'ceramics-glass',
  'Handbags & Accessories': 'fashion-sneakers',
  'Industrial Heritage': 'antiques',
  'Jewellery': 'jewellery',
  'Kitchenalia & Domestic': 'antiques',
  'LEGO & Building Sets': 'toys-models',
  'Lighting & Lamps': 'antiques',
  'Maps & Prints': 'art',
  'Medical & Pharmacy': 'antiques',
  'Militaria & Arms': 'militaria',
  'Model Railways': 'toys-models',
  'Motorcycles': 'automobilia',
  'Musical Instruments': 'antiques',
  'Natural History': 'natural-history',
  'Pens & Writing Instruments': 'antiques',
  'Perfume & Vanity': 'antiques',
  'Photography': 'photography-cameras',
  'Pins, Badges & Buttons': 'antiques',
  'Postcards': 'stamps',
  'Records & Music': 'vinyl-music',
  'Religious & Devotional': 'antiques',
  'Rugs & Carpets': 'antiques',
  'Scientific Instruments': 'photography-cameras',
  'Silver & Metalwork': 'antiques',
  'Sneakers & Streetwear': 'fashion-sneakers',
  'Social History': 'antiques',
  'Space & Astronomy': 'sports-memorabilia',
  'Sports & Games': 'sports-memorabilia',
  'Sports Memorabilia': 'sports-memorabilia',
  'Stamps & Ephemera': 'stamps',
  'Taxidermy': 'natural-history',
  'Textiles': 'fashion-sneakers',
  'Tools & Workshop': 'antiques',
  'Toys & Models': 'toys-models',
  'Trading Cards & TCGs': 'trading-cards',
  'Tribal & Ethnographic': 'natural-history',
  'Video Games & Consoles': 'video-games',
  'Vintage Electronics & Tech': 'photography-cameras',
  'Wine & Spirits': 'wine-spirits',
}
