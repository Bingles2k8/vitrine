import { describe, it, expect } from 'vitest'
import {
  COLLECTION_PROFILES, getProfile, CANONICAL_CONDITION_GRADES,
  parseGradeNumeric, conditionFromGrade, buildVerifyUrl, deriveCertificationFields,
  gradesForAuthority, scaleForAuthority, conditionIsDerived,
  allCustomFieldDefs, validateCustomFields, activeCustomFieldKeys,
  formatCustomFieldValue, certificationForAuthority, deriveCertificationForWrite,
} from '@/lib/collectionProfiles'
import { SHARED_SCALES } from '@/lib/collectionProfiles/scales'
import { buildCsvAliasMap, templateHeaders, normaliseHeader, CSV_COLUMNS } from '@/lib/collectionProfiles/csv'

const certified = COLLECTION_PROFILES.filter(p => p.certification)

describe('grading scales', () => {
  it('some profiles actually define certification', () => {
    expect(certified.length).toBeGreaterThan(5)
  })

  it('every authority resolves to a scale the profile defines', () => {
    for (const p of certified) {
      for (const authority of p.certification!.authorities) {
        const scale = p.certification!.scales.find(s => s.id === authority.scale)
        expect(scale, `${p.id}/${authority.id} → ${authority.scale}`).toBeDefined()
      }
    }
  })

  it('every scale covers every grade in numeric and toCondition', () => {
    for (const scale of SHARED_SCALES) {
      for (const grade of scale.grades) {
        expect(typeof scale.numeric[grade], `${scale.id}: ${grade}`).toBe('number')
        expect(scale.toCondition[grade], `${scale.id}: ${grade}`).toBeDefined()
      }
    }
  })

  // Invariant B — a stray value here would break CONDITION_STYLES.
  it('every toCondition value is a canonical condition grade', () => {
    for (const scale of SHARED_SCALES) {
      for (const condition of Object.values(scale.toCondition)) {
        expect(CANONICAL_CONDITION_GRADES).toContain(condition)
      }
    }
  })

  // A mis-ordered scale sorts a whole collection wrongly and is near-impossible
  // to spot by eye.
  it('numeric is strictly decreasing in grades order', () => {
    for (const scale of SHARED_SCALES) {
      const values = scale.grades.map(g => scale.numeric[g])
      for (let i = 1; i < values.length; i++) {
        expect(values[i], `${scale.id}: ${scale.grades[i]}`).toBeLessThan(values[i - 1])
      }
    }
  })

  it('scale ids are unique', () => {
    const ids = SHARED_SCALES.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('subgrade-issuing authorities name their subgrades', () => {
    const bgs = getProfile('trading-cards')!.certification!.authorities.find(a => a.id === 'BGS')!
    expect(bgs.subgrades).toEqual(['Centering', 'Corners', 'Edges', 'Surface'])
  })
})

describe('parseGradeNumeric', () => {
  const cards = getProfile('trading-cards')!.certification

  it('reads the numeric value for a known grade', () => {
    expect(parseGradeNumeric(cards, 'PSA', '10')).toBe(10)
    expect(parseGradeNumeric(cards, 'PSA', '8.5')).toBe(8.5)
    expect(parseGradeNumeric(cards, 'BGS', 'Black Label 10')).toBe(10.1)
  })

  it('returns null rather than throwing for unknown input', () => {
    expect(parseGradeNumeric(cards, 'NOPE', '10')).toBeNull()
    expect(parseGradeNumeric(cards, 'PSA', '11')).toBeNull()
    expect(parseGradeNumeric(cards, 'PSA', null)).toBeNull()
    expect(parseGradeNumeric(undefined, 'PSA', '10')).toBeNull()
  })

  it('ranks a Black Label above a plain 10, so sorting is right', () => {
    expect(parseGradeNumeric(cards, 'BGS', 'Black Label 10')!)
      .toBeGreaterThan(parseGradeNumeric(cards, 'BGS', '10')!)
  })
})

describe('conditionFromGrade', () => {
  const cards = getProfile('trading-cards')!.certification
  const stampsCert = getProfile('stamps')!.certification

  it('derives a canonical condition', () => {
    expect(conditionFromGrade(cards, 'PSA', '10')).toBe('Excellent')
    expect(conditionFromGrade(cards, 'PSA', '8')).toBe('Good')
    expect(conditionFromGrade(cards, 'PSA', '1')).toBe('Critical')
  })

  it('never derives for a profile that opts out', () => {
    expect(stampsCert!.derivesCondition).toBe(false)
    expect(conditionFromGrade(stampsCert, 'PSE', 'Genuine')).toBeNull()
  })

  it('returns null for unknown input', () => {
    expect(conditionFromGrade(cards, 'PSA', 'banana')).toBeNull()
    expect(conditionFromGrade(cards, null, '10')).toBeNull()
  })

  it('conditionIsDerived agrees with conditionFromGrade', () => {
    expect(conditionIsDerived(cards, 'PSA', '10')).toBe(true)
    expect(conditionIsDerived(cards, 'RAW', '10')).toBe(false)
    expect(conditionIsDerived(stampsCert, 'PSE', 'Genuine')).toBe(false)
  })
})

describe('buildVerifyUrl', () => {
  const cards = getProfile('trading-cards')!.certification

  // Phase 8 adds these one at a time, after checking each grader's live site.
  it('returns null for every authority without a verified template', () => {
    for (const p of certified) {
      for (const authority of p.certification!.authorities) {
        if (authority.verifyUrl) continue
        expect(buildVerifyUrl(p.certification, authority.id, '12345')).toBeNull()
      }
    }
  })

  it('never emits an unsubstituted placeholder', () => {
    for (const p of certified) {
      for (const authority of p.certification!.authorities) {
        const url = buildVerifyUrl(p.certification, authority.id, '12345')
        if (url) expect(url).not.toContain('{cert}')
      }
    }
  })

  it('returns null without a cert number', () => {
    expect(buildVerifyUrl(cards, 'PSA', '')).toBeNull()
    expect(buildVerifyUrl(cards, 'PSA', null)).toBeNull()
  })
})

describe('deriveCertificationFields', () => {
  const cards = getProfile('trading-cards')!.certification

  it('derives everything a write path needs in one call', () => {
    expect(deriveCertificationFields(cards, 'PSA', '9')).toEqual({
      cert_grade_numeric: 9,
      cert_grade_scale: 'psa10',
      condition_grade: 'Excellent',
    })
  })

  it('nulls cleanly for an ungraded item', () => {
    expect(deriveCertificationFields(cards, 'RAW', null)).toEqual({
      cert_grade_numeric: null,
      cert_grade_scale: 'raw',
      condition_grade: null,
    })
  })
})

describe('gradesForAuthority', () => {
  const cards = getProfile('trading-cards')!.certification

  it('filters the grade list to the chosen authority', () => {
    expect(gradesForAuthority(cards, 'PSA')).toContain('9.5')
    expect(gradesForAuthority(cards, 'PSA')).not.toContain('Black Label 10')
    expect(gradesForAuthority(cards, 'BGS')).toContain('Black Label 10')
  })

  it('is empty for raw and for unknown authorities', () => {
    expect(gradesForAuthority(cards, 'RAW')).toEqual([])
    expect(gradesForAuthority(cards, 'NOPE')).toEqual([])
    expect(scaleForAuthority(cards, 'NOPE')).toBeNull()
  })
})

describe('custom field definitions', () => {
  it('every key is unique and namespaced by its profile', () => {
    const seen = new Set<string>()
    for (const p of COLLECTION_PROFILES) {
      for (const def of p.customFields ?? []) {
        expect(def.key.startsWith(`${p.id}.`), def.key).toBe(true)
        expect(seen.has(def.key), `duplicate ${def.key}`).toBe(false)
        seen.add(def.key)
      }
    }
  })

  it('every select field offers options', () => {
    for (const p of COLLECTION_PROFILES) {
      for (const def of p.customFields ?? []) {
        if (def.type === 'select') {
          expect(def.options?.length, def.key).toBeGreaterThan(0)
        }
      }
    }
  })

  it('keeps each profile to a handful of fields', () => {
    for (const p of COLLECTION_PROFILES) {
      expect((p.customFields ?? []).length, p.id).toBeLessThanOrEqual(5)
    }
  })
})

describe('validateCustomFields', () => {
  const index = allCustomFieldDefs()
  const cardKeys = activeCustomFieldKeys([getProfile('trading-cards')!])

  it('coerces valid values by type', () => {
    const { values, issues } = validateCustomFields({
      'trading-cards.card_number': ' 4/102 ',
      'trading-cards.print_run': '1999',
      'trading-cards.language': 'english',
      'trading-cards.sealed': 'yes',
    }, index, cardKeys)

    expect(issues).toEqual([])
    expect(values['trading-cards.card_number']).toBe('4/102')
    expect(values['trading-cards.print_run']).toBe(1999)
    expect(values['trading-cards.language']).toBe('English')  // canonical casing
    expect(values['trading-cards.sealed']).toBe(true)
  })

  // Invariant H — custom_fields is user-writable JSONB.
  it('rejects an unknown key', () => {
    const { values, issues } = validateCustomFields(
      { 'not.a.field': 'junk' }, index, cardKeys)
    expect(values).toEqual({})
    expect(issues[0].key).toBe('not.a.field')
  })

  it('rejects a wrong type', () => {
    const { issues } = validateCustomFields(
      { 'trading-cards.print_run': 'not a number' }, index, cardKeys)
    expect(issues).toHaveLength(1)
  })

  it('rejects an out-of-range number', () => {
    const wineKeys = activeCustomFieldKeys([getProfile('wine-spirits')!])
    const { issues } = validateCustomFields(
      { 'wine-spirits.abv': 250 }, index, wineKeys)
    expect(issues).toHaveLength(1)
  })

  it('rejects a value outside a select list', () => {
    const { issues } = validateCustomFields(
      { 'trading-cards.language': 'Klingon' }, index, cardKeys)
    expect(issues).toHaveLength(1)
  })

  // Invariant G — the behaviour most likely to be broken by a later
  // "tidy up validation" change. Deactivating a profile must not strip data.
  it('preserves keys from a known but inactive profile', () => {
    const { values, issues } = validateCustomFields({
      'trading-cards.card_number': '4/102',
      'wine-spirits.abv': 13.5,        // known field, profile not active
    }, index, cardKeys)

    expect(issues).toEqual([])
    expect(values['wine-spirits.abv']).toBe(13.5)
    expect(values['trading-cards.card_number']).toBe('4/102')
  })

  it('handles null, undefined and non-objects safely', () => {
    expect(validateCustomFields(null, index, cardKeys).values).toEqual({})
    expect(validateCustomFields(undefined, index, cardKeys).values).toEqual({})
    expect(validateCustomFields([1, 2], index, cardKeys).issues).toHaveLength(1)
  })

  it('drops empty values rather than storing empty strings', () => {
    const { values } = validateCustomFields(
      { 'trading-cards.card_number': '' }, index, cardKeys)
    expect(values).toEqual({})
  })
})

describe('formatCustomFieldValue', () => {
  const index = allCustomFieldDefs()

  it('appends the unit for numbers that have one', () => {
    expect(formatCustomFieldValue(index.get('wine-spirits.abv'), 13.5)).toBe('13.5 %')
  })

  it('renders booleans as Yes/No', () => {
    expect(formatCustomFieldValue(index.get('trading-cards.sealed'), true)).toBe('Yes')
    expect(formatCustomFieldValue(index.get('trading-cards.sealed'), false)).toBe('No')
  })

  it('renders empty values as an empty string', () => {
    expect(formatCustomFieldValue(index.get('trading-cards.card_number'), null)).toBe('')
  })
})

describe('CSV header aliasing', () => {
  const map = buildCsvAliasMap()

  it('accepts canonical column names', () => {
    expect(map.get('title')).toBe('title')
    expect(map.get('artist')).toBe('artist')
    expect(map.get('cert_number')).toBe('cert_number')
  })

  it('accepts profile labels for the column they relabel', () => {
    // "Set / Manufacturer" is trading-cards' label for artist.
    expect(map.get(normaliseHeader('Set / Manufacturer'))).toBe('artist')
    expect(map.get(normaliseHeader('Producer / Vineyard'))).toBe('artist')
    expect(map.get(normaliseHeader('Grading Company'))).toBe('cert_authority')
  })

  it('maps custom field labels and their namespaced keys', () => {
    expect(map.get(normaliseHeader('trading-cards.card_number'))).toBe('custom:trading-cards.card_number')
    expect(map.get(normaliseHeader('ABV'))).toBe('custom:wine-spirits.abv')
  })

  it('never lets a profile label shadow a canonical column name', () => {
    for (const { column } of CSV_COLUMNS) {
      expect(map.get(normaliseHeader(column))).toBe(column)
    }
  })

  it('builds a template in the profile’s own words', () => {
    const headers = templateHeaders(getProfile('trading-cards')!)
    expect(headers).toContain('Set / Manufacturer')
    expect(headers).toContain('Cert Number')
    expect(headers).toContain('Card Number')
    expect(headers).not.toContain('Artist / Maker')
  })

  it('omits certification columns for profiles that do not grade', () => {
    const headers = templateHeaders(getProfile('wine-spirits')!)
    expect(headers.some(h => /cert|grading/i.test(h))).toBe(false)
    expect(headers).toContain('ABV')
  })

  it('relabels the title column too, not just the interesting ones', () => {
    const headers = templateHeaders(getProfile('trading-cards')!)
    expect(headers).toContain('Card Name')
    expect(headers).not.toContain('Title')
  })

  it('round-trips: every template header the importer emits is one it accepts', () => {
    const map = buildCsvAliasMap()
    for (const profile of COLLECTION_PROFILES) {
      for (const header of templateHeaders(profile)) {
        expect(map.has(normaliseHeader(header)), `${profile.id}: ${header}`).toBe(true)
      }
    }
  })
})

describe('deriveCertificationForWrite', () => {
  // Regression: derived columns were computed from the *active* profile, so
  // deactivating a profile silently nulled cert_grade_numeric on every graded
  // item at the next save — grade sorting broke while the grade still showed.
  // The certificate has not changed; only the UI has. Resolve registry-wide.
  it('derives the same values regardless of which profile is active', () => {
    expect(deriveCertificationForWrite('PSA', '10')).toEqual({
      cert_grade_numeric: 10,
      cert_grade_scale: 'psa10',
      condition_grade: 'Excellent',
    })
  })

  it('finds an authority defined in any profile', () => {
    expect(certificationForAuthority('PSA')).toBeDefined()
    expect(certificationForAuthority('PCGS')).toBeDefined()
    expect(certificationForAuthority('WATA')).toBeDefined()
    expect(certificationForAuthority('GIA')).toBeDefined()
    expect(certificationForAuthority('NOT_A_GRADER')).toBeUndefined()
    expect(certificationForAuthority(null)).toBeUndefined()
  })

  it('nulls cleanly for an unknown authority rather than throwing', () => {
    expect(deriveCertificationForWrite('NOT_A_GRADER', '10')).toEqual({
      cert_grade_numeric: null,
      cert_grade_scale: null,
      condition_grade: null,
    })
  })

  it('keeps a coin grade on the Sheldon scale, not the card scale', () => {
    const coin = deriveCertificationForWrite('PCGS', 'MS-65')
    expect(coin.cert_grade_scale).toBe('sheldon70')
    expect(coin.cert_grade_numeric).toBe(65)
  })
})
