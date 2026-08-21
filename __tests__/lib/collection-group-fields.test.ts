import { describe, expect, it } from 'vitest'
import { RULE_FIELDS, isRuleField, opAllowed, opsForField } from '@/lib/collectionGroups/fields'
import { GROUP_SORTS } from '@/lib/collectionGroups/types'

/**
 * Invariant P — the rule vocabulary is exactly the fields already public on an
 * object page.
 *
 * A rule leaks through its *membership*, not only through what it renders: a
 * set built on `estimated_value >= 10000` publishes "these are the expensive
 * ones" to anyone who opens the page, and on a museum with `hide_money_values`
 * set that breaks a promise the app already makes.
 *
 * This test exists so that widening the whitelist has to be a deliberate act
 * with a failing test in front of it, rather than a convenient one-line
 * addition during an unrelated change.
 */

const FORBIDDEN = [
  // money
  'estimated_value', 'estimated_value_currency', 'insured_value', 'insured_value_currency',
  'acquisition_value', 'acquisition_currency',
  // donor / source
  'acquisition_source', 'acquisition_source_contact', 'acquisition_note',
  'acquisition_authorised_by', 'acquisition_documentation_ref', 'credit_line',
  // whereabouts
  'current_location', 'location_note', 'location_after_accessioning',
  // internal history and status
  'provenance', 'provenance_date_range', 'deaccession_protected', 'barcode',
  'disposal_method', 'disposal_recipient', 'disposal_note', 'disposal_authorization',
  'rights_holder_contact', 'hazard_note',
]

describe('RULE_FIELDS — invariant P', () => {
  it('excludes every money, donor, location and disposal column', () => {
    for (const key of FORBIDDEN) {
      expect(isRuleField(key), `${key} must never be rule-addressable`).toBe(false)
    }
  })

  it('rejects unknown fields outright', () => {
    expect(isRuleField('definitely_not_a_column')).toBe(false)
    expect(isRuleField('')).toBe(false)
  })

  it('has no duplicate keys', () => {
    const keys = RULE_FIELDS.map(f => f.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('gives every field at least one usable operator', () => {
    for (const field of RULE_FIELDS) {
      expect(opsForField(field.key).length, field.key).toBeGreaterThan(0)
    }
  })

  it('does not offer numeric comparison on free-text fields', () => {
    expect(opAllowed('medium', 'gte')).toBe(false)
    expect(opAllowed('artist', 'lte')).toBe(false)
  })

  it('offers numeric comparison on numeric and year fields', () => {
    expect(opAllowed('cert_grade_numeric', 'gte')).toBe(true)
    expect(opAllowed('year', 'lte')).toBe(true)
  })

  it('offers no operators at all for a non-whitelisted field', () => {
    expect(opsForField('estimated_value')).toEqual([])
    expect(opAllowed('estimated_value', 'gte')).toBe(false)
  })
})

describe('GROUP_SORTS', () => {
  it('offers no sort that would rank a public page by worth', () => {
    // Same reasoning as invariant P: the order itself is the disclosure.
    expect(GROUP_SORTS).not.toContain('insured_value')
    expect(GROUP_SORTS).not.toContain('estimated_value')
  })
})
