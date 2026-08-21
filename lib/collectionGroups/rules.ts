import { isRuleField, opAllowed, ruleField } from './fields'
import {
  EMPTY_RULE, MAX_RULE_CONDITIONS,
  type CollectionGroupItemRow, type GroupCondition, type GroupRule,
  type GroupSort, type RuleObject,
} from './types'

/**
 * The one rule evaluator — invariant S.
 *
 * Membership must come out identical in the dashboard preview and on the
 * public site. The tempting implementation is JS on the client and a Supabase
 * query on the server, and that is exactly the shape of the G2 bug recorded in
 * the collection-profiles work: two resolution paths that agree in every unit
 * test and diverge silently in production once an edge case appears.
 *
 * So a rule is never compiled to SQL. The public page already loads every
 * visible object for the museum, so evaluating here costs one pass over an
 * array that is in memory either way.
 */

// ── Rule parsing ─────────────────────────────────────────────────────────

/**
 * Coerce whatever came out of the JSONB column into a rule we can trust.
 *
 * Conditions naming a field outside RULE_FIELDS, or pairing a field with an
 * operator its type does not allow, are dropped rather than throwing — a rule
 * saved before the registry changed should degrade, not break the page.
 */
export function parseRule(raw: unknown): GroupRule {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return EMPTY_RULE

  const obj = raw as Record<string, unknown>
  const match = obj.match === 'any' ? 'any' : 'all'
  const rawConditions = Array.isArray(obj.conditions) ? obj.conditions : []

  const conditions: GroupCondition[] = []
  for (const entry of rawConditions.slice(0, MAX_RULE_CONDITIONS)) {
    if (!entry || typeof entry !== 'object') continue
    const c = entry as Record<string, unknown>
    const field = typeof c.field === 'string' ? c.field : ''
    const op = typeof c.op === 'string' ? c.op : ''
    if (!isRuleField(field)) continue
    if (!opAllowed(field, op as GroupCondition['op'])) continue
    conditions.push({
      field,
      op: op as GroupCondition['op'],
      value: typeof c.value === 'string' ? c.value : String(c.value ?? ''),
    })
  }

  return { match, conditions }
}

// ── Condition evaluation ─────────────────────────────────────────────────

function readValue(object: RuleObject, key: string): unknown {
  return object[key]
}

function asText(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

/** Leading four-digit year out of a free-text date: "c. 1897–1901" → 1897. */
export function yearNumber(v: unknown): number | null {
  const match = asText(v).match(/-?\d{1,4}/)
  if (!match) return null
  const n = Number(match[0])
  return Number.isFinite(n) ? n : null
}

function asNumber(v: unknown, type: string): number | null {
  if (type === 'year') return yearNumber(v)
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = Number(asText(v))
  return Number.isFinite(n) && asText(v) !== '' ? n : null
}

function matchesCondition(condition: GroupCondition, object: RuleObject): boolean {
  const field = ruleField(condition.field)
  if (!field) return false

  const raw = readValue(object, condition.field)
  const text = asText(raw)

  switch (condition.op) {
    case 'is_set':
      return text !== ''
    case 'is_not_set':
      return text === ''
    case 'is':
      return text.toLowerCase() === condition.value.trim().toLowerCase()
    case 'is_not':
      // An empty field is genuinely "not Silver", so this stays true for blanks.
      return text.toLowerCase() !== condition.value.trim().toLowerCase()
    case 'contains':
      return condition.value.trim() !== '' &&
        text.toLowerCase().includes(condition.value.trim().toLowerCase())
    case 'gte': {
      const a = asNumber(raw, field.type)
      const b = asNumber(condition.value, field.type)
      return a !== null && b !== null && a >= b
    }
    case 'lte': {
      const a = asNumber(raw, field.type)
      const b = asNumber(condition.value, field.type)
      return a !== null && b !== null && a <= b
    }
    default:
      return false
  }
}

/**
 * Does this object satisfy the rule?
 *
 * A rule with no conditions matches nothing. The alternative — matching
 * everything — turns a half-built set into the entire collection the moment
 * it is published, which is the more expensive mistake.
 */
export function matchesRule(rule: GroupRule, object: RuleObject): boolean {
  if (rule.conditions.length === 0) return false
  return rule.match === 'any'
    ? rule.conditions.some(c => matchesCondition(c, object))
    : rule.conditions.every(c => matchesCondition(c, object))
}

// ── Sorting ──────────────────────────────────────────────────────────────

function gradeOf(o: RuleObject): number {
  const v = o.cert_grade_numeric
  return typeof v === 'number' && Number.isFinite(v) ? v : -Infinity
}

function madeYear(o: RuleObject): number {
  return yearNumber(o.year) ?? yearNumber(o.production_date) ?? -Infinity
}

function addedAt(o: RuleObject): number {
  const t = o.created_at ? Date.parse(String(o.created_at)) : NaN
  return Number.isNaN(t) ? 0 : t
}

function comparator<T extends RuleObject>(sort: GroupSort): (a: T, b: T) => number {
  switch (sort) {
    case 'alpha':
      return (a, b) => asText(a.title).localeCompare(asText(b.title), undefined, { sensitivity: 'base' })
    case 'date_made':
      return (a, b) => madeYear(a) - madeYear(b)
    case 'grade':
      return (a, b) => gradeOf(b) - gradeOf(a)
    case 'date_added':
    case 'manual':
    default:
      return (a, b) => addedAt(b) - addedAt(a)
  }
}

// ── Membership resolution ────────────────────────────────────────────────

export interface GroupLike {
  id: string
  membership: string
  rule: unknown
  sort_by: GroupSort
}

const LAST = Number.MAX_SAFE_INTEGER

/**
 * The members of a set, in the order they should render.
 *
 * `objects` must already be the *visible* set — `show_on_site` true and not
 * soft-deleted (invariant R). This function does not re-check, because on the
 * public site that filter belongs in the query, and re-checking here would
 * quietly paper over a caller that forgot.
 *
 * Manual sets: the include rows are the membership.
 * Rule sets:   rule matches, plus include rows as pins, minus exclude rows.
 *              Pins always sort first, in their own order.
 */
export function resolveMembers<T extends RuleObject>(
  group: GroupLike,
  objects: T[],
  items: CollectionGroupItemRow[],
): T[] {
  const pins = new Map<string, number>()
  const excluded = new Set<string>()

  for (const item of items) {
    if (item.group_id !== group.id) continue
    if (item.role === 'exclude') excluded.add(item.object_id)
    else pins.set(item.object_id, item.sort_order ?? LAST)
  }

  const byOrder = comparator<T>(group.sort_by)

  if (group.membership === 'manual') {
    const members = objects.filter(o => pins.has(o.id) && !excluded.has(o.id))
    return group.sort_by === 'manual'
      ? members.sort((a, b) => (pins.get(a.id)! - pins.get(b.id)!) || byOrder(a, b))
      : members.sort(byOrder)
  }

  const rule = parseRule(group.rule)
  const pinned: T[] = []
  const matched: T[] = []

  for (const o of objects) {
    if (excluded.has(o.id)) continue
    if (pins.has(o.id)) pinned.push(o)
    else if (matchesRule(rule, o)) matched.push(o)
  }

  pinned.sort((a, b) => (pins.get(a.id)! - pins.get(b.id)!) || byOrder(a, b))
  matched.sort(byOrder)
  return [...pinned, ...matched]
}

/**
 * Resolve every set at once — one pass per set over the shared object array.
 * Used by the homepage, the index and the sitemap, all of which need counts
 * for many sets from a single fetch.
 */
export function resolveAllMembers<T extends RuleObject>(
  groups: GroupLike[],
  objects: T[],
  items: CollectionGroupItemRow[],
): Map<string, T[]> {
  const byGroup = new Map<string, CollectionGroupItemRow[]>()
  for (const item of items) {
    const list = byGroup.get(item.group_id)
    if (list) list.push(item)
    else byGroup.set(item.group_id, [item])
  }

  const out = new Map<string, T[]>()
  for (const group of groups) {
    out.set(group.id, resolveMembers(group, objects, byGroup.get(group.id) ?? []))
  }
  return out
}
