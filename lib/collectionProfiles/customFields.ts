import type { CollectionProfile, CustomFieldDef, CustomFieldValue } from './types'

/**
 * Tier B detail fields — coercion and validation against the registry.
 * See docs/collection-profiles-plan.md §5.6, invariants G and H.
 *
 * objects.custom_fields is user-writable JSONB reached by an authenticated
 * client, so it is validated server-side, not just in the form component.
 */

export interface CustomFieldIssue {
  key: string
  message: string
}

export interface CustomFieldValidation {
  values: Record<string, CustomFieldValue>
  issues: CustomFieldIssue[]
}

/** Every custom field defined by any profile, keyed by its namespaced key. */
export function buildFieldIndex(profiles: CollectionProfile[]): Map<string, CustomFieldDef> {
  const index = new Map<string, CustomFieldDef>()
  for (const profile of profiles) {
    for (const def of profile.customFields ?? []) index.set(def.key, def)
  }
  return index
}

function coerce(def: CustomFieldDef, raw: unknown): { value: CustomFieldValue; issue?: string } {
  if (raw === null || raw === undefined || raw === '') return { value: null }

  switch (def.type) {
    case 'number': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).trim())
      if (!Number.isFinite(n)) return { value: null, issue: 'must be a number' }
      if (def.min !== undefined && n < def.min) return { value: null, issue: `must be at least ${def.min}` }
      if (def.max !== undefined && n > def.max) return { value: null, issue: `must be at most ${def.max}` }
      return { value: n }
    }
    case 'boolean': {
      if (typeof raw === 'boolean') return { value: raw }
      const s = String(raw).trim().toLowerCase()
      if (['true', 'yes', 'y', '1'].includes(s)) return { value: true }
      if (['false', 'no', 'n', '0'].includes(s)) return { value: false }
      return { value: null, issue: 'must be true or false' }
    }
    case 'select': {
      const s = String(raw).trim()
      const match = (def.options ?? []).find(o => o.toLowerCase() === s.toLowerCase())
      if (!match) return { value: null, issue: `must be one of: ${(def.options ?? []).join(', ')}` }
      return { value: match }
    }
    case 'date': {
      const s = String(raw).trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { value: null, issue: 'must be a date (YYYY-MM-DD)' }
      return { value: s }
    }
    case 'text':
    default: {
      const s = String(raw).trim()
      if (s.length > 2000) return { value: null, issue: 'is too long (max 2000 characters)' }
      return { value: s }
    }
  }
}

/**
 * Validates a custom_fields payload against the registry.
 *
 * `activeKeys` is the set of keys belonging to currently-active profiles.
 * Keys outside it but still present in `index` are **preserved untouched** —
 * that is invariant G: deactivating a profile hides its fields but must never
 * strip their values on the next save.
 *
 * Keys in neither set are dropped and reported: custom_fields is unbounded
 * JSONB otherwise, and a stale client would fill it with junk.
 */
export function validateCustomFields(
  raw: unknown,
  index: Map<string, CustomFieldDef>,
  activeKeys: Set<string>,
): CustomFieldValidation {
  const issues: CustomFieldIssue[] = []
  const values: Record<string, CustomFieldValue> = {}

  if (raw === null || raw === undefined) return { values, issues }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { values, issues: [{ key: '', message: 'custom_fields must be an object' }] }
  }

  for (const [key, rawValue] of Object.entries(raw as Record<string, unknown>)) {
    const def = index.get(key)

    if (!def) {
      issues.push({ key, message: 'is not a known field and was ignored' })
      continue
    }

    // Invariant G — a known key from an inactive profile is carried through
    // verbatim rather than revalidated or dropped.
    if (!activeKeys.has(key)) {
      values[key] = (rawValue ?? null) as CustomFieldValue
      continue
    }

    const { value, issue } = coerce(def, rawValue)
    if (issue) issues.push({ key, message: issue })
    if (value !== null) values[key] = value
  }

  return { values, issues }
}

/** Keys defined by the given profiles — the "active" set for validation. */
export function activeCustomFieldKeys(profiles: CollectionProfile[]): Set<string> {
  return new Set(profiles.flatMap(p => (p.customFields ?? []).map(d => d.key)))
}

/** Reads one value out of a custom_fields bag, for list columns and breakdowns. */
export function readCustomField(
  customFields: Record<string, CustomFieldValue> | null | undefined,
  key: string,
): CustomFieldValue {
  if (!customFields) return null
  return customFields[key] ?? null
}

/** Human-readable rendering of a stored value, for tables and breakdowns. */
export function formatCustomFieldValue(
  def: CustomFieldDef | undefined,
  value: CustomFieldValue,
): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (def?.type === 'number' && def.unit) return `${value} ${def.unit}`
  return String(value)
}
