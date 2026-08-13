import type { ProfileFieldKey, ProfileNouns } from './types'

export {
  CANONICAL_STATUSES, CANONICAL_CONDITION_GRADES, PROFILE_FIELD_KEYS,
} from './types'
export type {
  CanonicalStatus, CanonicalConditionGrade, ProfileFieldKey,
} from './types'

/**
 * Terminology used when no single profile can speak for the collection —
 * a collection running both trading-cards and watches-clocks cannot honestly
 * label the sidebar "Cards". See docs/collection-profiles-plan.md §6.2.
 *
 * Note this is still an improvement on the museum wording for a hobbyist:
 * "Item / Items / Add Item" beats "Object / Objects / Object Entry".
 */
export const NEUTRAL_NOUNS: ProfileNouns = {
  item: 'Item',
  itemPlural: 'Items',
  collection: 'Collection',
  addItem: 'Add Item',
}

/** Today's wording. Used for every full-mode (Professional+) plan. */
export const MUSEUM_NOUNS: ProfileNouns = {
  item: 'Object',
  itemPlural: 'Objects',
  collection: 'Collection',
  addItem: 'Add Object',
}

/**
 * Default render order of the Object Information card in simple mode.
 * A profile's `fieldOrder` replaces the leading portion of this; anything it
 * omits keeps its default position afterwards.
 */
export const DEFAULT_FIELD_ORDER: ProfileFieldKey[] = [
  'title',
  'artist',
  'production_date',
  'production_date_qualifier',
  'medium',
  'object_type',
  'culture',
  'rarity',
  'number_of_parts',
  'status',
  'description',
  'inscription',
]

/**
 * Applies a profile's partial ordering: listed fields first in the given
 * order, then everything else in default order. Unknown keys are dropped so
 * a bad profile can't remove a field by typo.
 */
export function resolveFieldOrder(order: ProfileFieldKey[] | undefined): ProfileFieldKey[] {
  if (!order || order.length === 0) return DEFAULT_FIELD_ORDER
  const valid = order.filter(k => DEFAULT_FIELD_ORDER.includes(k))
  const seen = new Set(valid)
  return [...valid, ...DEFAULT_FIELD_ORDER.filter(k => !seen.has(k))]
}
