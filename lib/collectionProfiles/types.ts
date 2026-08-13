import type { CollectionCategory } from '@/lib/categories'

/**
 * Collection Profiles — type definitions.
 * See docs/collection-profiles-plan.md §5.1.
 *
 * A profile re-dresses the simple-mode UI for a particular kind of collecting.
 * It is pure data: no profile may contain a function, so the whole registry
 * serialises to JSON for VitrineCapture (§12).
 */

// ── Canonical values ─────────────────────────────────────────────────────
// These are the values actually stored in the database. Profiles may relabel
// them but must never change them — see invariants A and B.

export const CANONICAL_STATUSES = [
  'Entry', 'On Display', 'Storage', 'On Loan',
  'Restoration', 'Conservation', 'Deaccessioned',
] as const
export type CanonicalStatus = typeof CANONICAL_STATUSES[number]

export const CANONICAL_CONDITION_GRADES = [
  'Excellent', 'Good', 'Fair', 'Poor', 'Critical',
] as const
export type CanonicalConditionGrade = typeof CANONICAL_CONDITION_GRADES[number]

// ── Fields a profile may override ────────────────────────────────────────
// Deliberately limited to the columns rendered in simple mode. Full mode
// (Professional and above) never resolves a profile at all.

export const PROFILE_FIELD_KEYS = [
  'emoji', 'title', 'artist', 'production_date', 'production_date_qualifier',
  'medium', 'object_type', 'culture', 'rarity', 'number_of_parts',
  'status', 'description', 'inscription',
  'dimension_height', 'dimension_width', 'dimension_depth', 'dimension_weight',
  'condition_grade', 'current_location',
  'insured_value', 'estimated_value', 'year',
] as const
export type ProfileFieldKey = typeof PROFILE_FIELD_KEYS[number]

export interface FieldOverride {
  /** Replaces the hardcoded <label>. */
  label?: string
  /** Replaces the input placeholder. */
  placeholder?: string
  /** Replaces the Learn Mode description for this field under this profile. */
  help?: string
  /** Removes the field from the form entirely for this profile. */
  hidden?: boolean
}

// ── Tier A: certification & grading ──────────────────────────────────────

export interface GradingAuthority {
  /** Stored in objects.cert_authority. Stable — persisted, never rename. */
  id: string
  /** Display name shown in the dropdown. */
  label: string
  /** Which GradingScale this authority grades on. */
  scale: string
  /**
   * Template for the public cert-lookup page, with {cert} substituted.
   *
   * MUST be omitted unless verified against the grader's live site. A link
   * that 404s on a collector's slab is worse than no link. When absent, the
   * cert number renders as plain selectable text. See plan §5.5 / Phase 8.
   */
  verifyUrl?: string
  /** Component subgrades this authority issues, e.g. Beckett's four. */
  subgrades?: string[]
}

export interface GradingScale {
  id: string
  /** Ordered best → worst. Display strings; also the accepted input values. */
  grades: string[]
  /** grade → numeric, for sorting and analytics. Must cover every grade. */
  numeric: Record<string, number>
  /** grade → canonical condition_grade. Must cover every grade. */
  toCondition: Record<string, CanonicalConditionGrade>
}

export interface CertificationConfig {
  /** Card heading, e.g. 'Grading & Certification', 'Diamond Certification'. */
  title: string
  /** Field labels within the card — domains disagree on what to call these. */
  labels?: {
    authority?: string
    number?: string
    grade?: string
    date?: string
  }
  authorities: GradingAuthority[]
  scales: GradingScale[]
  /** When true, a graded item's condition_grade is derived and read-only. */
  derivesCondition: boolean
}

// ── Tier B: per-profile detail fields ────────────────────────────────────

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'boolean'

export interface CustomFieldDef {
  /**
   * Key inside objects.custom_fields. Stable — persisted, never rename.
   * MUST be namespaced as `${profile.id}.${name}` so two active profiles can
   * never collide, and so values from a deactivated profile stay inert.
   */
  key: string
  label: string
  type: CustomFieldType
  placeholder?: string
  help?: string
  /** Required when type is 'select'. */
  options?: string[]
  /** type 'number' only. */
  unit?: string
  min?: number
  max?: number
  /** Render width in the details grid. Default 'half'. */
  width?: 'half' | 'full'
}

export type CustomFieldValue = string | number | boolean | null

// ── List columns & analytics breakdowns ──────────────────────────────────

export const CERT_COLUMN_KEYS = [
  'cert_authority', 'cert_number', 'cert_grade',
] as const
export type CertColumnKey = typeof CERT_COLUMN_KEYS[number]

/** May point at a plain field, a cert column, or a custom field. */
export type ListColumnKey = ProfileFieldKey | CertColumnKey | `custom:${string}`
export type BreakdownKey = ListColumnKey

// ── App terminology ──────────────────────────────────────────────────────

export interface ProfileNouns {
  item: string
  itemPlural: string
  collection: string
  addItem: string
}

// ── The profile ──────────────────────────────────────────────────────────

export interface CollectionProfile {
  /** Stable slug. Persisted in two tables — never change once shipped. */
  id: string
  label: string
  /** One-line description shown under the label in the picker. */
  blurb: string
  emoji: string
  /** Which COLLECTION_CATEGORIES entry this maps to, for Discover. */
  category: CollectionCategory

  /** Used only when this is the sole active profile — see §6.2. */
  nouns: ProfileNouns

  fields: Partial<Record<ProfileFieldKey, FieldOverride>>

  /** Render order within the Object Information card. */
  fieldOrder?: ProfileFieldKey[]

  vocab: {
    objectTypes?: string[]
    mediums?: string[]
    cultures?: string[]
    emojis?: string[]
    /** Keys MUST be canonical condition grades — invariant B. */
    conditionLabels?: Partial<Record<CanonicalConditionGrade, string>>
    /** Keys MUST be canonical statuses — invariant A. */
    statusLabels?: Partial<Record<CanonicalStatus, string>>
  }

  /** Omit entirely for profiles where grading isn't a thing. */
  certification?: CertificationConfig

  /** Stored in objects.custom_fields. */
  customFields?: CustomFieldDef[]

  /** Objects-list table columns after Title. Max 3. */
  listColumns?: { field: ListColumnKey; label: string }[]

  /** Analytics breakdown cards. Replaces the hardcoded "By Artist / Maker". */
  breakdowns?: { field: BreakdownKey; title: string }[]
}
