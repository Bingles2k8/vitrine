/**
 * Collection Groups ("Sets") — type definitions.
 * See docs/collection-groups-plan.md.
 *
 * A set is an editorial object: a named, ordered, described selection from the
 * collection with a public page of its own. Membership is either hand-picked
 * or derived from a saved filter, and both live in one model.
 */

export const GROUP_STATUSES = ['draft', 'published'] as const
export type GroupStatus = typeof GROUP_STATUSES[number]

export const GROUP_MEMBERSHIP_MODES = ['manual', 'rule'] as const
export type GroupMembership = typeof GROUP_MEMBERSHIP_MODES[number]

/**
 * Sort options offered for a set's members.
 *
 * `insured_value` and `estimated_value` are deliberately absent: the dashboard
 * offers them internally, but ordering a public page by worth publishes the
 * ranking even though no figure is rendered. See plan §5.2.
 */
export const GROUP_SORTS = ['manual', 'alpha', 'date_added', 'date_made', 'grade'] as const
export type GroupSort = typeof GROUP_SORTS[number]

/** How visitors move through the items on a set's page. See navStyles.ts. */
export const SET_NAV_STYLES = [
  'grid', 'coverflow', 'carousel', 'filmstrip',
  'shelf', 'contact-sheet', 'timeline', 'reel',
] as const
export type SetNavStyle = typeof SET_NAV_STYLES[number]

export const GROUP_ITEM_ROLES = ['include', 'exclude'] as const
export type GroupItemRole = typeof GROUP_ITEM_ROLES[number]

// ── Rules ────────────────────────────────────────────────────────────────

export const RULE_MATCH_MODES = ['all', 'any'] as const
export type RuleMatchMode = typeof RULE_MATCH_MODES[number]

export const RULE_OPS = [
  'is', 'is_not', 'contains', 'gte', 'lte', 'is_set', 'is_not_set',
] as const
export type RuleOp = typeof RULE_OPS[number]

export interface GroupCondition {
  field: string
  op: RuleOp
  value: string
}

export interface GroupRule {
  match: RuleMatchMode
  conditions: GroupCondition[]
}

export const EMPTY_RULE: GroupRule = { match: 'all', conditions: [] }

/** Deliberately flat — no nested condition groups. See plan §5.3. */
export const MAX_RULE_CONDITIONS = 8

// ── Rows ─────────────────────────────────────────────────────────────────

export interface CollectionGroupRow {
  id: string
  museum_id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  cover_image_url: string | null
  cover_object_id: string | null
  status: GroupStatus
  membership: GroupMembership
  rule: unknown
  sort_by: GroupSort
  nav_style: SetNavStyle
  show_as_section: boolean
  show_as_chip: boolean
  display_order: number | null
  date_start: string | null
  date_end: string | null
  created_at?: string
  updated_at?: string
}

export interface CollectionGroupItemRow {
  id: string
  group_id: string
  object_id: string
  museum_id: string
  role: GroupItemRole
  sort_order: number | null
  note: string | null
}

/**
 * The object shape the rule evaluator reads.
 *
 * Every field here is already public on the object page — that is invariant P,
 * enforced by RULE_FIELDS in fields.ts. A rule leaks through its membership
 * even when the field itself is never rendered, so the whitelist is the
 * security boundary, not the picker UI.
 */
export interface RuleObject {
  id: string
  title?: string | null
  artist?: string | null
  medium?: string | null
  culture?: string | null
  category?: string | null
  object_type?: string | null
  rarity?: string | null
  status?: string | null
  condition_grade?: string | null
  origin_country?: string | null
  collection_profile?: string | null
  cert_authority?: string | null
  cert_grade_numeric?: number | null
  year?: string | null
  production_date?: string | null
  created_at?: string | null
  [key: string]: unknown
}
