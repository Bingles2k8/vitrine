import { describe, it, expect } from 'vitest'
import { collectionLabels, objectLabels, publicCertification, publicCustomFields } from '@/lib/publicProfile'

const coins = { plan: 'hobbyist', collection_profiles: ['coins-banknotes'] }
const cards = { plan: 'hobbyist', collection_profiles: ['trading-cards'] }
const mixed = { plan: 'hobbyist', collection_profiles: ['coins-banknotes', 'watches-clocks'] }
const noProfile = { plan: 'hobbyist', collection_profiles: [] }
const museumPlan = { plan: 'professional', collection_profiles: ['coins-banknotes'] }

describe('collectionLabels', () => {
  it('speaks the hobby language for a single-profile collection', () => {
    const l = collectionLabels(coins)
    expect(l.itemPlural).toBe('Coins')
    expect(l.maker).toBe('Mint / Issuing Authority')
    expect(l.medium).toBe('Metal / Composition')
    expect(l.origin).toBe('Country of Issue')
    expect(l.rarity).toBe('Mintage')
  })

  it('builds a search placeholder from the profile field labels', () => {
    expect(collectionLabels(coins).searchPlaceholder)
      .toBe('Search by coin / note, mint / issuing authority, metal / composition, country of issue…')
  })

  it('falls back to neutral wording when two profiles are active', () => {
    // "Coins" while showing a watch reads as a bug.
    expect(collectionLabels(mixed).itemPlural).toBe('Items')
  })

  it('uses neutral wording when no profile is chosen', () => {
    expect(collectionLabels(noProfile).itemPlural).toBe('Items')
  })

  it('leaves full-mode plans on the museum wording they already had', () => {
    const l = collectionLabels(museumPlan)
    expect(l.itemPlural).toBe('Objects')
    expect(l.medium).toBe('Medium')
  })

  it('maps canonical condition grades to the hobby scale', () => {
    expect(collectionLabels(cards).conditionLabels.Excellent).toBe('Mint / Gem Mint')
    expect(collectionLabels(coins).conditionLabels.Excellent).toBe('Uncirculated')
    // Full mode keeps the canonical word.
    expect(collectionLabels(museumPlan).conditionLabels.Excellent).toBe('Excellent')
  })

  it('maps canonical statuses to the hobby scale', () => {
    expect(collectionLabels(coins).statusLabels.Storage).toBe('In Cabinet')
    expect(collectionLabels(coins).statusLabels.Deaccessioned).toBe('Sold / Traded')
  })

  it('reports fields the profile hides', () => {
    // coins-banknotes hides number_of_parts.
    expect(collectionLabels(coins).hidden.number_of_parts).toBe(true)
    expect(collectionLabels(coins).hidden.medium).toBeUndefined()
  })
})

describe('objectLabels', () => {
  it('prefers the object’s own profile over the collection default', () => {
    const l = objectLabels({ collection_profile: 'trading-cards' }, mixed)
    expect(l.itemPlural).toBe('Items')       // nouns stay neutral for a mixed collection
    expect(l.maker).toBe('Set / Manufacturer') // but the field labels follow the object
  })

  it('falls back to the collection profile when the object names none', () => {
    expect(objectLabels({ collection_profile: null }, coins).maker).toBe('Mint / Issuing Authority')
  })

  it('degrades gracefully for a retired profile slug', () => {
    expect(() => objectLabels({ collection_profile: 'no-such-profile' }, coins)).not.toThrow()
    expect(objectLabels({ collection_profile: 'no-such-profile' }, coins).maker)
      .toBe('Mint / Issuing Authority')
  })
})

describe('publicCertification', () => {
  it('returns null for an ungraded object', () => {
    expect(publicCertification({ cert_authority: null })).toBeNull()
  })

  it('returns null when an authority carries neither grade nor number', () => {
    expect(publicCertification({ cert_authority: 'PCGS', cert_grade: null, cert_number: '  ' })).toBeNull()
  })

  it('resolves the grader label and card title registry-wide', () => {
    const cert = publicCertification({ cert_authority: 'PCGS', cert_grade: 'MS-65', cert_number: '12345678' })
    expect(cert).not.toBeNull()
    expect(cert!.authorityLabel).toBe('PCGS')
    expect(cert!.title).toBe('Grading & Certification')
    expect(cert!.grade).toBe('MS-65')
  })

  it('keeps an unknown authority visible rather than dropping the grade', () => {
    const cert = publicCertification({ cert_authority: 'Some Local Grader', cert_grade: 'A1' })
    expect(cert!.authorityLabel).toBe('Some Local Grader')
    expect(cert!.verifyUrl).toBeNull()
  })
})

describe('publicCustomFields', () => {
  it('returns nothing when the profile defines no detail fields', () => {
    expect(publicCustomFields({ collection_profile: null, custom_fields: { x: 1 } }, noProfile)).toEqual([])
  })

  it('ignores malformed custom_fields payloads', () => {
    expect(publicCustomFields({ custom_fields: 'not an object' }, coins)).toEqual([])
    expect(publicCustomFields({ custom_fields: null }, coins)).toEqual([])
  })

  it('skips keys the resolved profile does not define', () => {
    const out = publicCustomFields(
      { collection_profile: 'coins-banknotes', custom_fields: { 'stamps.perforation': '11x11' } },
      coins,
    )
    expect(out).toEqual([])
  })
})
