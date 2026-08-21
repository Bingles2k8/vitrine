import type { RuleOp } from './types'

/**
 * The rule field whitelist — invariant P.
 *
 * A rule leaks through its *membership*, not only through what it renders. A
 * set built on `estimated_value >= 10000` publishes the sentence "these are the
 * expensive ones" to anyone who opens the page, and on a museum with
 * `hide_money_values` set that breaks a promise the app already makes.
 *
 * So the rule vocabulary is exactly the fields that are already public on an
 * object page. Money, donor, location, provenance and disposal columns are not
 * merely hidden from the picker — they are absent from this registry, and the
 * Zod schema validates against it on write. Widening this list is a decision
 * about what a public page may imply, not a UI convenience.
 *
 * `__tests__/lib/collection-group-fields.test.ts` asserts the exclusions hold.
 */

export type RuleFieldType = 'text' | 'number' | 'year'

export interface RuleField {
  /** Column on `objects`. Persisted inside the rule JSON — never rename. */
  key: string
  /** Fallback label. The profile vocabulary overrides this where it has one. */
  label: string
  type: RuleFieldType
  /**
   * Which PublicLabels key relabels this field for the collection's profile,
   * so a coin collector's rule builder says "Mint" rather than "Maker".
   */
  labelKey?: 'maker' | 'medium' | 'origin' | 'type' | 'rarity' | 'date' | 'condition'
  /** Offer the distinct values already in the collection as suggestions. */
  suggest?: boolean
}

export const RULE_FIELDS: RuleField[] = [
  { key: 'medium',             label: 'Medium',       type: 'text',   labelKey: 'medium',    suggest: true },
  { key: 'culture',            label: 'Origin',       type: 'text',   labelKey: 'origin',    suggest: true },
  { key: 'object_type',        label: 'Type',         type: 'text',   labelKey: 'type',      suggest: true },
  { key: 'artist',             label: 'Maker',        type: 'text',   labelKey: 'maker',     suggest: true },
  { key: 'category',           label: 'Category',     type: 'text',   suggest: true },
  { key: 'title',              label: 'Title',        type: 'text' },
  { key: 'year',               label: 'Year',         type: 'year' },
  { key: 'production_date',    label: 'Date',         type: 'text',   labelKey: 'date' },
  { key: 'status',             label: 'Status',       type: 'text',   suggest: true },
  { key: 'condition_grade',    label: 'Condition',    type: 'text',   labelKey: 'condition', suggest: true },
  { key: 'rarity',             label: 'Rarity',       type: 'text',   labelKey: 'rarity',    suggest: true },
  { key: 'origin_country',     label: 'Country',      type: 'text',   suggest: true },
  { key: 'collection_profile', label: 'Item type',    type: 'text',   suggest: true },
  { key: 'cert_authority',     label: 'Graded by',    type: 'text',   suggest: true },
  { key: 'cert_grade_numeric', label: 'Grade',        type: 'number' },
]

const BY_KEY = new Map(RULE_FIELDS.map(f => [f.key, f]))

export function ruleField(key: string): RuleField | null {
  return BY_KEY.get(key) ?? null
}

export function isRuleField(key: string): boolean {
  return BY_KEY.has(key)
}

/**
 * Which operators make sense for a field's type.
 *
 * Validated on write as well as filtered in the picker, so a rule cannot be
 * saved in a state that silently matches nothing — `gte` on a free-text medium
 * would parse fine and return nothing forever.
 */
const TEXT_OPS: RuleOp[] = ['is', 'is_not', 'contains', 'is_set', 'is_not_set']
const NUMERIC_OPS: RuleOp[] = ['is', 'is_not', 'gte', 'lte', 'is_set', 'is_not_set']

export function opsForField(key: string): RuleOp[] {
  const field = ruleField(key)
  if (!field) return []
  return field.type === 'text' ? TEXT_OPS : NUMERIC_OPS
}

export function opAllowed(key: string, op: RuleOp): boolean {
  return opsForField(key).includes(op)
}

/** Operators that ignore `value`, so the builder hides the value input. */
export const VALUELESS_OPS: RuleOp[] = ['is_set', 'is_not_set']

export const OP_LABELS: Record<RuleOp, string> = {
  is: 'is',
  is_not: 'is not',
  contains: 'contains',
  gte: 'is at least',
  lte: 'is at most',
  is_set: 'has any value',
  is_not_set: 'is empty',
}
