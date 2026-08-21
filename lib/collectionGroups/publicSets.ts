import type { SupabaseClient } from '@supabase/supabase-js'
import { toGridObject, type GridObject } from '@/components/collection/types'
import { formatGroupDates, groupPhase, type GroupPhase } from './index'
import { matchesRule, parseRule, resolveAllMembers, resolveMembers } from './rules'
import type { CollectionGroupItemRow, CollectionGroupRow, RuleObject } from './types'

/**
 * Everything `toGridObject` reads, plus the fields a rule may test.
 *
 * The object page uses this rather than `select('*')`: it needs enough to
 * resolve a rule set and draw a grid, and nothing more. Valuations, purchase
 * prices and donor details have no business being fetched to work out which
 * set an item is in.
 */
export const SET_OBJECT_COLUMNS = [
  'id', 'title', 'artist', 'year', 'medium', 'culture', 'status', 'emoji',
  'image_url', 'condition_grade', 'rarity', 'description', 'production_date',
  'category', 'object_type', 'origin_country', 'collection_profile',
  'cert_authority', 'cert_grade_numeric', 'created_at',
].join(', ')

/**
 * Server-side loading of a museum's published sets.
 *
 * Every public surface — homepage sections, the index, a set page, the object
 * page's set chips, the sitemap — goes through here, so membership is resolved
 * once, one way (invariant S).
 *
 * Callers pass the objects they have already fetched. The public pages load
 * every visible object anyway, so resolving sets costs one pass over an array
 * that is in memory either way, and never a second round trip.
 */

export interface PublicSet {
  group: CollectionGroupRow
  /** Visible members, in the set's resolved order, with notes attached. */
  members: GridObject[]
  count: number
  dateLabel: string | null
  phase: GroupPhase
}

/**
 * Objects must already be filtered to `show_on_site = true` and not
 * soft-deleted — invariant R. This does not re-check: on the public site that
 * belongs in the query, and re-checking here would quietly cover for a caller
 * that forgot to.
 */
export async function loadPublicSets(
  supabase: SupabaseClient,
  museumId: string,
  visibleObjects: Record<string, unknown>[],
): Promise<PublicSet[]> {
  const { data: groupRows } = await supabase
    .from('collection_groups')
    .select('*')
    .eq('museum_id', museumId)
    .eq('status', 'published')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const groups = (groupRows ?? []) as CollectionGroupRow[]
  if (groups.length === 0) return []

  const { data: itemRows } = await supabase
    .from('collection_group_items')
    .select('id, group_id, object_id, museum_id, role, sort_order, note')
    .in('group_id', groups.map(g => g.id))
    .order('sort_order', { ascending: true, nullsFirst: false })

  const items = (itemRows ?? []) as CollectionGroupItemRow[]
  const resolved = resolveAllMembers(
    groups.map(g => ({ id: g.id, membership: g.membership, rule: g.rule, sort_by: g.sort_by })),
    visibleObjects.map(o => ({ ...o, id: String(o.id) })),
    items,
  )

  // note is per (group, object), so it is looked up per set rather than
  // stamped onto the shared object rows.
  const noteFor = new Map<string, string>()
  for (const item of items) {
    if (item.note) noteFor.set(`${item.group_id}:${item.object_id}`, item.note)
  }

  const out: PublicSet[] = []
  for (const group of groups) {
    const raw = resolved.get(group.id) ?? []
    const members = raw.map(o => {
      const grid = toGridObject(o as Record<string, unknown>)
      const note = noteFor.get(`${group.id}:${grid.id}`)
      return note ? { ...grid, note } : grid
    })

    // Invariant U — a set with nothing visible in it does not exist publicly.
    if (members.length === 0) continue

    out.push({
      group,
      members,
      count: members.length,
      dateLabel: formatGroupDates(group),
      phase: groupPhase(group),
    })
  }

  return out
}

/** Which published sets each object belongs to — drives chips and cross-links. */
export function setsByObject(sets: PublicSet[]): Map<string, PublicSet[]> {
  const out = new Map<string, PublicSet[]>()
  for (const set of sets) {
    for (const member of set.members) {
      const list = out.get(member.id)
      if (list) list.push(set)
      else out.set(member.id, [set])
    }
  }
  return out
}

/**
 * Index ordering: dated sets lead, grouped by phase, with undated sets in an
 * untitled block at the top. A set with no dates is not "Past" — it is
 * timeless, which is what a collector's set usually is.
 */
export const PHASE_ORDER: GroupPhase[] = ['undated', 'current', 'upcoming', 'past']

export function groupSetsByPhase(sets: PublicSet[]): { phase: GroupPhase; sets: PublicSet[] }[] {
  const buckets = new Map<GroupPhase, PublicSet[]>()
  for (const set of sets) {
    const list = buckets.get(set.phase)
    if (list) list.push(set)
    else buckets.set(set.phase, [set])
  }
  return PHASE_ORDER
    .filter(p => buckets.has(p))
    .map(phase => ({ phase, sets: buckets.get(phase)! }))
}

/** True when at least one set carries dates, so the index should section itself. */
export function hasDatedSets(sets: PublicSet[]): boolean {
  return sets.some(s => s.phase !== 'undated')
}

// ── Object-page loaders ──────────────────────────────────────────────────
// The object page must not pay for a whole-collection fetch just to say which
// sets an item is in. These two split that work: membership is answered from
// the item's own row, and the expensive walk only happens when the visitor
// actually arrived through a set.

/**
 * Which published sets contain this one object.
 *
 * Two small queries, no collection-wide fetch: manual membership comes from
 * the item's own junction rows, and a rule is evaluated against this single
 * object — the same evaluator the rest of the app uses (invariant S), just
 * with an array of one.
 */
export async function loadObjectSets(
  supabase: SupabaseClient,
  museumId: string,
  object: RuleObject,
): Promise<CollectionGroupRow[]> {
  const { data: groupRows } = await supabase
    .from('collection_groups')
    .select('*')
    .eq('museum_id', museumId)
    .eq('status', 'published')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  const groups = (groupRows ?? []) as CollectionGroupRow[]
  if (groups.length === 0) return []

  const { data: itemRows } = await supabase
    .from('collection_group_items')
    .select('id, group_id, object_id, museum_id, role, sort_order, note')
    .eq('object_id', object.id)
    .in('group_id', groups.map(g => g.id))

  const items = (itemRows ?? []) as CollectionGroupItemRow[]
  const pinned = new Set(items.filter(i => i.role === 'include').map(i => i.group_id))
  const excluded = new Set(items.filter(i => i.role === 'exclude').map(i => i.group_id))

  return groups.filter(group => {
    if (excluded.has(group.id)) return false
    if (pinned.has(group.id)) return true
    if (group.membership !== 'rule') return false
    return matchesRule(parseRule(group.rule), object)
  })
}

export interface SetWalk {
  group: CollectionGroupRow
  members: GridObject[]
  index: number
  previous: GridObject | null
  next: GridObject | null
  note: string | null
}

/**
 * The ordered members of one set, positioned around a given object.
 *
 * Returns null when the object is not actually in the set — which is what
 * enforces invariant W. A `?set=` naming a set the item does not belong to
 * must render nothing, or a crafted URL makes any item appear to belong to
 * any set.
 *
 * Hidden and soft-deleted members are absent from the walk, so the position
 * marker counts what a visitor can actually reach (invariant R).
 */
export async function loadSetWalk(
  supabase: SupabaseClient,
  museumId: string,
  groupSlug: string,
  objectId: string,
): Promise<SetWalk | null> {
  const { data: groupRow } = await supabase
    .from('collection_groups')
    .select('*')
    .eq('museum_id', museumId)
    .eq('slug', groupSlug)
    .eq('status', 'published')
    .maybeSingle()

  if (!groupRow) return null
  const group = groupRow as CollectionGroupRow

  const [{ data: objectRows }, { data: itemRows }] = await Promise.all([
    supabase
      .from('objects')
      .select(SET_OBJECT_COLUMNS)
      .eq('museum_id', museumId)
      .eq('show_on_site', true)
      .is('deleted_at', null),
    supabase
      .from('collection_group_items')
      .select('id, group_id, object_id, museum_id, role, sort_order, note')
      .eq('group_id', group.id)
      .order('sort_order', { ascending: true, nullsFirst: false }),
  ])

  const items = (itemRows ?? []) as CollectionGroupItemRow[]
  const resolved = resolveMembers(
    { id: group.id, membership: group.membership, rule: group.rule, sort_by: group.sort_by },
    ((objectRows ?? []) as unknown as Record<string, unknown>[]).map(o => ({ ...o, id: String(o.id) })),
    items,
  )

  const index = resolved.findIndex(o => o.id === objectId)
  if (index === -1) return null

  const members = resolved.map(o => toGridObject(o as Record<string, unknown>))
  const note = items.find(i => i.object_id === objectId && i.role === 'include')?.note ?? null

  return {
    group,
    members,
    index,
    previous: index > 0 ? members[index - 1] : null,
    next: index < members.length - 1 ? members[index + 1] : null,
    note,
  }
}
