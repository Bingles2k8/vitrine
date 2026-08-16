import type { CollectionProfile } from './types'
import { COLLECTION_PROFILES } from './index'

/**
 * CSV header aliasing.
 * See docs/collection-profiles-plan.md §7.10.
 *
 * A card collector who has spent all day seeing "Set / Manufacturer" should not
 * download a template headed "artist". The template uses the profile's labels,
 * and the importer accepts the canonical column name *or* any profile's label
 * for it — so a file exported before a profile change still imports.
 */

/** Header text → lookup key. Mirrors the parser's own normalisation. */
export function normaliseHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

/** Canonical CSV columns the importer understands, plus their default labels. */
export const CSV_COLUMNS: { column: string; label: string }[] = [
  { column: 'title', label: 'Title' },
  { column: 'artist', label: 'Artist / Maker' },
  { column: 'year', label: 'Year' },
  { column: 'medium', label: 'Medium' },
  { column: 'dimensions', label: 'Dimensions' },
  { column: 'condition', label: 'Condition' },
  { column: 'description', label: 'Description' },
  { column: 'accession_no', label: 'Accession No' },
  { column: 'purchase_price', label: 'Purchase Price' },
  { column: 'purchase_date', label: 'Purchase Date' },
  { column: 'acquired_from', label: 'Acquired From' },
  { column: 'status', label: 'Status' },
  { column: 'object_type', label: 'Object Type' },
  { column: 'culture', label: 'Culture' },
  { column: 'rarity', label: 'Edition / Rarity' },
  { column: 'cert_authority', label: 'Grading Company' },
  { column: 'cert_number', label: 'Cert Number' },
  { column: 'cert_grade', label: 'Grade' },
  { column: 'cert_date', label: 'Graded Date' },
]

/** Which profile field a CSV column maps to, for relabelling the template. */
const COLUMN_TO_FIELD: Record<string, 'artist' | 'medium' | 'title' | 'condition_grade' | 'description' | 'object_type' | 'culture' | 'rarity'> = {
  artist: 'artist',
  medium: 'medium',
  title: 'title',
  condition: 'condition_grade',
  description: 'description',
  object_type: 'object_type',
  culture: 'culture',
  rarity: 'rarity',
}

/**
 * Every accepted header, mapped to what it means.
 * Values are either a canonical column name or `custom:<key>`.
 *
 * Built from every profile, not just the active one, so a file produced under
 * one profile still imports under another.
 */
export function buildCsvAliasMap(): Map<string, string> {
  const map = new Map<string, string>()

  // Canonical names and default labels always win — registered first, and
  // later profile labels never overwrite an existing entry.
  for (const { column, label } of CSV_COLUMNS) {
    map.set(normaliseHeader(column), column)
    if (!map.has(normaliseHeader(label))) map.set(normaliseHeader(label), column)
  }

  for (const profile of COLLECTION_PROFILES) {
    for (const { column } of CSV_COLUMNS) {
      const field = COLUMN_TO_FIELD[column]
      const label = field ? profile.fields[field]?.label : undefined
      if (label) {
        const key = normaliseHeader(label)
        if (!map.has(key)) map.set(key, column)
      }
    }

    if (profile.certification) {
      const labels = profile.certification.labels ?? {}
      const pairs: [string | undefined, string][] = [
        [labels.authority, 'cert_authority'],
        [labels.number, 'cert_number'],
        [labels.grade, 'cert_grade'],
        [labels.date, 'cert_date'],
      ]
      for (const [label, column] of pairs) {
        if (!label) continue
        const key = normaliseHeader(label)
        if (!map.has(key)) map.set(key, column)
      }
    }

    for (const def of profile.customFields ?? []) {
      // The namespaced key itself is always accepted, so a round-tripped export
      // imports even if two profiles happen to share a label.
      map.set(normaliseHeader(def.key), `custom:${def.key}`)
      const key = normaliseHeader(def.label)
      if (!map.has(key)) map.set(key, `custom:${def.key}`)
    }
  }

  return map
}

/** Header row for the downloadable template, in the profile's own words. */
export function templateHeaders(profile: CollectionProfile): string[] {
  const headers = CSV_COLUMNS
    .filter(({ column }) => {
      // Drop certification columns for profiles that don't grade.
      if (column.startsWith('cert_')) return Boolean(profile.certification)
      return true
    })
    .map(({ column, label }) => {
      if (column.startsWith('cert_')) {
        const labels = profile.certification?.labels ?? {}
        if (column === 'cert_authority') return labels.authority ?? label
        if (column === 'cert_number') return labels.number ?? label
        if (column === 'cert_grade') return labels.grade ?? label
        if (column === 'cert_date') return labels.date ?? label
      }
      const field = COLUMN_TO_FIELD[column]
      if (field && profile.fields[field]?.hidden) return null
      return (field && profile.fields[field]?.label) || label
    })
    .filter((h): h is string => h !== null)

  return [...headers, ...(profile.customFields ?? []).map(d => d.label)]
}
