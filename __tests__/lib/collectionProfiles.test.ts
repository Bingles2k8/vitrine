import { describe, it, expect } from 'vitest'
import {
  COLLECTION_PROFILES, MUSEUM_FIXED, GENERAL_PROFILE, CATEGORY_TO_PROFILE,
  profilesEnabled, getProfile, getProfileOrGeneral,
  resolveObjectProfile, resolveCollectionProfile, resolveAppNouns,
  resolveVocab, allCustomFieldDefs, profileForCategory,
  fieldLabel, fieldVisible, statusLabel,
  NEUTRAL_NOUNS, MUSEUM_NOUNS, resolveFieldOrder, DEFAULT_FIELD_ORDER,
  CANONICAL_STATUSES, CANONICAL_CONDITION_GRADES, PROFILE_FIELD_KEYS,
} from '@/lib/collectionProfiles'
import { COLLECTION_CATEGORIES } from '@/lib/categories'
import { PLANS } from '@/lib/plans'

const hobbyist = { plan: 'hobbyist' }
const professional = { plan: 'professional' }

describe('registry integrity', () => {
  it('every profile id is unique and slug-shaped', () => {
    const ids = COLLECTION_PROFILES.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('every profile category exists in COLLECTION_CATEGORIES', () => {
    for (const p of COLLECTION_PROFILES) {
      expect(COLLECTION_CATEGORIES).toContain(p.category)
    }
  })

  it('every profile has complete nouns', () => {
    for (const p of COLLECTION_PROFILES) {
      expect(p.nouns.item).toBeTruthy()
      expect(p.nouns.itemPlural).toBeTruthy()
      expect(p.nouns.collection).toBeTruthy()
      expect(p.nouns.addItem).toBeTruthy()
    }
  })

  it('every field override key is a real profile field key', () => {
    for (const p of COLLECTION_PROFILES) {
      for (const key of Object.keys(p.fields)) {
        expect(PROFILE_FIELD_KEYS).toContain(key)
      }
      for (const key of p.fieldOrder ?? []) {
        expect(PROFILE_FIELD_KEYS).toContain(key)
      }
    }
  })

  // Invariant A — status values drive real behaviour (On Loan filters,
  // deaccession protection). Profiles may relabel but never redefine them.
  it('every statusLabels key is a canonical status', () => {
    for (const p of COLLECTION_PROFILES) {
      for (const key of Object.keys(p.vocab.statusLabels ?? {})) {
        expect(CANONICAL_STATUSES).toContain(key)
      }
    }
  })

  // Invariant B — CONDITION_STYLES and the analytics colour map key off these.
  it('every conditionLabels key is a canonical condition grade', () => {
    for (const p of COLLECTION_PROFILES) {
      for (const key of Object.keys(p.vocab.conditionLabels ?? {})) {
        expect(CANONICAL_CONDITION_GRADES).toContain(key)
      }
    }
  })

  it('list columns are capped at three', () => {
    for (const p of COLLECTION_PROFILES) {
      expect((p.listColumns ?? []).length).toBeLessThanOrEqual(3)
    }
  })

  it('every custom: reference in listColumns and breakdowns resolves to a real field', () => {
    const known = allCustomFieldDefs()
    for (const p of COLLECTION_PROFILES) {
      const refs = [...(p.listColumns ?? []), ...(p.breakdowns ?? [])]
      for (const ref of refs) {
        if (ref.field.startsWith('custom:')) {
          expect(known.has(ref.field.slice('custom:'.length))).toBe(true)
        }
      }
    }
  })

  it('CATEGORY_TO_PROFILE only names profiles that exist', () => {
    for (const id of Object.values(CATEGORY_TO_PROFILE)) {
      expect(getProfile(id!)).not.toBeNull()
    }
  })

  it('every category maps to a profile', () => {
    for (const category of COLLECTION_CATEGORIES) {
      expect(profileForCategory(category)).toBeTruthy()
    }
  })
})

describe('the general fallback', () => {
  // The regression baseline: a Community user who picks nothing must see
  // exactly today's simple mode.
  it('changes nothing', () => {
    expect(GENERAL_PROFILE.fields).toEqual({})
    expect(GENERAL_PROFILE.certification).toBeUndefined()
    expect(GENERAL_PROFILE.customFields).toBeUndefined()
    expect(GENERAL_PROFILE.vocab.objectTypes).toBeUndefined()
    expect(GENERAL_PROFILE.vocab.mediums).toBeUndefined()
    expect(GENERAL_PROFILE.vocab.statusLabels).toBeUndefined()
    expect(GENERAL_PROFILE.vocab.conditionLabels).toBeUndefined()
  })

  it('is not selectable as MUSEUM_FIXED and vice versa', () => {
    expect(COLLECTION_PROFILES.some(p => p.id === MUSEUM_FIXED.id)).toBe(false)
  })
})

describe('profilesEnabled', () => {
  it('is true for exactly the simple-mode plans', () => {
    for (const [id, plan] of Object.entries(PLANS)) {
      expect(profilesEnabled(id)).toBe(!plan.fullMode)
    }
  })

  it('covers community and hobbyist only', () => {
    expect(profilesEnabled('community')).toBe(true)
    expect(profilesEnabled('hobbyist')).toBe(true)
    expect(profilesEnabled('professional')).toBe(false)
    expect(profilesEnabled('institution')).toBe(false)
    expect(profilesEnabled('enterprise')).toBe(false)
  })

  it('treats an unknown plan as community', () => {
    expect(profilesEnabled('nonsense')).toBe(true)
    expect(profilesEnabled(null)).toBe(true)
  })
})

describe('resolveObjectProfile', () => {
  // Invariant E — paid tiers must see zero diff.
  it('returns MUSEUM_FIXED for every full-mode plan', () => {
    for (const [id, plan] of Object.entries(PLANS)) {
      if (!plan.fullMode) continue
      const museum = { plan: id, collection_profiles: ['trading-cards'] }
      expect(resolveObjectProfile({ collection_profile: 'trading-cards' }, museum))
        .toBe(MUSEUM_FIXED)
    }
  })

  it('prefers the object own profile', () => {
    const museum = { ...hobbyist, collection_profiles: ['wine-spirits', 'trading-cards'] }
    expect(resolveObjectProfile({ collection_profile: 'trading-cards' }, museum).id)
      .toBe('trading-cards')
  })

  it('falls back to the primary profile', () => {
    const museum = { ...hobbyist, collection_profiles: ['wine-spirits', 'trading-cards'] }
    expect(resolveObjectProfile({ collection_profile: null }, museum).id).toBe('wine-spirits')
  })

  // Invariant D — a retired slug must not brick a saved object.
  it('degrades an unknown slug to general rather than throwing', () => {
    const museum = { ...hobbyist, collection_profiles: [] }
    expect(resolveObjectProfile({ collection_profile: 'retired-in-2027' }, museum).id)
      .toBe('general')
    expect(getProfileOrGeneral('nope').id).toBe('general')
  })

  it('handles a museum with no profiles at all', () => {
    expect(resolveObjectProfile(null, hobbyist).id).toBe('general')
    expect(resolveObjectProfile(undefined, undefined).id).toBe('general')
  })
})

describe('resolveAppNouns', () => {
  it('uses the profile nouns when exactly one is active', () => {
    const museum = { ...hobbyist, collection_profiles: ['trading-cards'] }
    expect(resolveAppNouns(museum).addItem).toBe('Add Card')
  })

  // "Add Card" while adding a watch reads as a bug — neutral is safer.
  it('falls back to neutral for two or more active profiles', () => {
    const museum = { ...hobbyist, collection_profiles: ['trading-cards', 'watches-clocks'] }
    expect(resolveAppNouns(museum)).toEqual(NEUTRAL_NOUNS)
  })

  it('falls back to neutral when none are active', () => {
    expect(resolveAppNouns({ ...hobbyist, collection_profiles: [] })).toEqual(NEUTRAL_NOUNS)
  })

  it('uses museum nouns in full mode', () => {
    const museum = { ...professional, collection_profiles: ['trading-cards'] }
    expect(resolveAppNouns(museum)).toEqual(MUSEUM_NOUNS)
  })
})

describe('resolveCollectionProfile', () => {
  it('uses the single active profile', () => {
    expect(resolveCollectionProfile({ ...hobbyist, collection_profiles: ['comics'] }).id)
      .toBe('comics')
  })

  it('falls back to general for a mixed collection', () => {
    expect(resolveCollectionProfile({ ...hobbyist, collection_profiles: ['comics', 'books'] }).id)
      .toBe('general')
  })

  it('returns MUSEUM_FIXED in full mode', () => {
    expect(resolveCollectionProfile({ ...professional, collection_profiles: ['comics'] }))
      .toBe(MUSEUM_FIXED)
  })
})

describe('resolveVocab', () => {
  const FALLBACK = ['Painting', 'Sculpture']

  it('returns the fallback in full mode', () => {
    const museum = { ...professional, collection_profiles: ['trading-cards'] }
    expect(resolveVocab(museum, 'objectTypes', FALLBACK)).toEqual(FALLBACK)
  })

  it('returns the profile list for a single profile', () => {
    const museum = { ...hobbyist, collection_profiles: ['trading-cards'] }
    const vocab = resolveVocab(museum, 'objectTypes', FALLBACK)
    expect(vocab).toContain('Holo Rare')
    expect(vocab).not.toContain('Painting')
  })

  it('unions the lists for a mixed collection, without duplicates', () => {
    const museum = { ...hobbyist, collection_profiles: ['trading-cards', 'comics'] }
    const vocab = resolveVocab(museum, 'objectTypes', FALLBACK)
    expect(vocab).toContain('Holo Rare')
    expect(vocab).toContain('Graphic Novel')
    expect(new Set(vocab).size).toBe(vocab.length)
  })

  it('keeps the default available when an active profile has no list of its own', () => {
    // antiques defines no `cultures`, so the default should survive.
    const museum = { ...hobbyist, collection_profiles: ['wine-spirits', 'antiques'] }
    const vocab = resolveVocab(museum, 'cultures', FALLBACK)
    expect(vocab).toContain('Islay')
    expect(vocab).toContain('Painting')
  })
})

describe('field helpers', () => {
  const cards = getProfile('trading-cards')!

  it('returns the profile label, or the fallback when unset', () => {
    expect(fieldLabel(cards, 'artist', 'Artist / Maker')).toBe('Set / Manufacturer')
    expect(fieldLabel(cards, 'title', 'Title')).toBe('Card Name')
    expect(fieldLabel(GENERAL_PROFILE, 'artist', 'Artist / Maker')).toBe('Artist / Maker')
  })

  it('reports hidden fields', () => {
    expect(fieldVisible(cards, 'culture')).toBe(false)
    expect(fieldVisible(cards, 'title')).toBe(true)
    expect(fieldVisible(GENERAL_PROFILE, 'culture')).toBe(true)
  })

  it('relabels statuses without changing the value', () => {
    expect(statusLabel(cards, 'Storage', 'In Storage')).toBe('In Binder / Box')
    expect(statusLabel(cards, 'Entry', 'New Addition')).toBe('New Addition')
  })
})

describe('resolveFieldOrder', () => {
  it('returns the default when a profile specifies none', () => {
    expect(resolveFieldOrder(undefined)).toEqual(DEFAULT_FIELD_ORDER)
  })

  it('puts the profile order first and appends the rest', () => {
    const order = resolveFieldOrder(['status', 'title'])
    expect(order.slice(0, 2)).toEqual(['status', 'title'])
    expect(new Set(order).size).toBe(order.length)
    expect(order).toHaveLength(DEFAULT_FIELD_ORDER.length)
  })

  it('drops unknown keys rather than losing a field', () => {
    const order = resolveFieldOrder(['title', 'not_a_field' as never])
    expect(order).not.toContain('not_a_field')
    expect(order).toHaveLength(DEFAULT_FIELD_ORDER.length)
  })
})
