import type { CollectionProfile } from '../types'

/**
 * The fallback profile.
 *
 * This is the regression baseline: it MUST render byte-identically to today's
 * simple mode. A Community user who never picks anything sees zero change.
 *
 * That is why `fields` is empty, there is no `certification`, and there are no
 * `customFields` — every lookup falls through to the hardcoded default. A test
 * enforces this; do not add overrides here to "improve" the default wording.
 * Change the component default instead, so full mode stays in step.
 */
export const general: CollectionProfile = {
  id: 'general',
  label: 'A museum or general collection',
  blurb: 'Mixed or unspecified — keeps the standard Vitrine wording',
  emoji: '🏛️',
  category: 'Antiques & Collectibles',

  nouns: {
    item: 'Item',
    itemPlural: 'Items',
    collection: 'Collection',
    addItem: 'Add Item',
  },

  fields: {},
  vocab: {},
}
