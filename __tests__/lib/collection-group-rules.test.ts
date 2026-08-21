import { describe, expect, it } from 'vitest'
import {
  matchesRule, parseRule, resolveAllMembers, resolveMembers, yearNumber,
} from '@/lib/collectionGroups/rules'
import type {
  CollectionGroupItemRow, GroupRule, GroupSort, RuleObject,
} from '@/lib/collectionGroups/types'

function obj(id: string, fields: Partial<RuleObject> = {}): RuleObject {
  return { id, title: id, ...fields }
}

function rule(conditions: GroupRule['conditions'], match: 'all' | 'any' = 'all'): GroupRule {
  return { match, conditions }
}

function item(
  groupId: string, objectId: string,
  extra: Partial<CollectionGroupItemRow> = {},
): CollectionGroupItemRow {
  return {
    id: `${groupId}-${objectId}`,
    group_id: groupId,
    object_id: objectId,
    museum_id: 'm1',
    role: 'include',
    sort_order: null,
    note: null,
    ...extra,
  }
}

const group = (over: Partial<{ membership: string; rule: unknown; sort_by: GroupSort }> = {}) => ({
  id: 'g1',
  membership: 'manual',
  rule: {},
  sort_by: 'manual' as GroupSort,
  ...over,
})

describe('parseRule', () => {
  it('returns an empty rule for junk', () => {
    expect(parseRule(null).conditions).toEqual([])
    expect(parseRule('nope').conditions).toEqual([])
    expect(parseRule([]).conditions).toEqual([])
  })

  it('drops conditions naming a field outside the whitelist', () => {
    const parsed = parseRule({
      match: 'all',
      conditions: [
        { field: 'medium', op: 'is', value: 'Silver' },
        { field: 'estimated_value', op: 'gte', value: '10000' },
        { field: 'acquisition_source', op: 'is', value: 'Sotheby’s' },
      ],
    })
    expect(parsed.conditions).toHaveLength(1)
    expect(parsed.conditions[0].field).toBe('medium')
  })

  it('drops an operator the field type does not allow', () => {
    const parsed = parseRule({
      match: 'all',
      conditions: [{ field: 'medium', op: 'gte', value: '5' }],
    })
    expect(parsed.conditions).toEqual([])
  })

  it('caps conditions at the documented maximum', () => {
    const parsed = parseRule({
      match: 'any',
      conditions: Array.from({ length: 20 }, () => ({ field: 'medium', op: 'is', value: 'x' })),
    })
    expect(parsed.conditions.length).toBeLessThanOrEqual(8)
  })
})

describe('matchesRule', () => {
  const silver = obj('a', { medium: 'Silver', year: '1890', cert_grade_numeric: 9 })

  it('matches nothing when there are no conditions', () => {
    // A half-built set must not publish the entire collection.
    expect(matchesRule(rule([]), silver)).toBe(false)
  })

  it('is / is_not are case-insensitive', () => {
    expect(matchesRule(rule([{ field: 'medium', op: 'is', value: 'silver' }]), silver)).toBe(true)
    expect(matchesRule(rule([{ field: 'medium', op: 'is_not', value: 'SILVER' }]), silver)).toBe(false)
  })

  it('treats an empty field as "is not" anything', () => {
    expect(matchesRule(rule([{ field: 'medium', op: 'is_not', value: 'Silver' }]), obj('b'))).toBe(true)
  })

  it('contains needs a non-empty needle', () => {
    expect(matchesRule(rule([{ field: 'medium', op: 'contains', value: 'ilve' }]), silver)).toBe(true)
    expect(matchesRule(rule([{ field: 'medium', op: 'contains', value: '  ' }]), silver)).toBe(false)
  })

  it('is_set / is_not_set read presence', () => {
    expect(matchesRule(rule([{ field: 'medium', op: 'is_set', value: '' }]), silver)).toBe(true)
    expect(matchesRule(rule([{ field: 'medium', op: 'is_not_set', value: '' }]), obj('b'))).toBe(true)
  })

  it('compares years numerically, not as strings', () => {
    expect(matchesRule(rule([{ field: 'year', op: 'lte', value: '1900' }]), silver)).toBe(true)
    expect(matchesRule(rule([{ field: 'year', op: 'gte', value: '1900' }]), silver)).toBe(false)
  })

  it('pulls a year out of a messy date', () => {
    expect(yearNumber('c. 1897–1901')).toBe(1897)
    expect(yearNumber('')).toBeNull()
    expect(yearNumber(null)).toBeNull()
  })

  it('honours all vs any', () => {
    const conditions = [
      { field: 'medium', op: 'is' as const, value: 'Silver' },
      { field: 'year', op: 'gte' as const, value: '1990' },
    ]
    expect(matchesRule(rule(conditions, 'all'), silver)).toBe(false)
    expect(matchesRule(rule(conditions, 'any'), silver)).toBe(true)
  })
})

describe('resolveMembers — manual sets', () => {
  const objects = [obj('a'), obj('b'), obj('c')]

  it('uses the item rows as the membership', () => {
    const members = resolveMembers(group(), objects, [item('g1', 'c'), item('g1', 'a')])
    expect(members.map(m => m.id).sort()).toEqual(['a', 'c'])
  })

  it('respects sort_order when the set is manually ordered', () => {
    const members = resolveMembers(group(), objects, [
      item('g1', 'c', { sort_order: 0 }),
      item('g1', 'a', { sort_order: 1 }),
      item('g1', 'b', { sort_order: 2 }),
    ])
    expect(members.map(m => m.id)).toEqual(['c', 'a', 'b'])
  })

  it('overrides the manual order when another sort is chosen', () => {
    const members = resolveMembers(
      group({ sort_by: 'alpha' }),
      [obj('a', { title: 'Zebra' }), obj('b', { title: 'Aardvark' })],
      [item('g1', 'a', { sort_order: 0 }), item('g1', 'b', { sort_order: 1 })],
    )
    expect(members.map(m => m.title)).toEqual(['Aardvark', 'Zebra'])
  })

  it('ignores item rows belonging to another set', () => {
    const members = resolveMembers(group(), objects, [item('g2', 'a'), item('g1', 'b')])
    expect(members.map(m => m.id)).toEqual(['b'])
  })
})

describe('resolveMembers — rule sets', () => {
  const objects = [
    obj('a', { medium: 'Silver' }),
    obj('b', { medium: 'Gold' }),
    obj('c', { medium: 'Silver' }),
  ]
  const silverRule = group({
    membership: 'rule',
    rule: { match: 'all', conditions: [{ field: 'medium', op: 'is', value: 'Silver' }] },
    sort_by: 'alpha',
  })

  it('returns the rule matches', () => {
    const members = resolveMembers(silverRule, objects, [])
    expect(members.map(m => m.id)).toEqual(['a', 'c'])
  })

  it('an exclude row removes a match', () => {
    const members = resolveMembers(silverRule, objects, [item('g1', 'a', { role: 'exclude' })])
    expect(members.map(m => m.id)).toEqual(['c'])
  })

  it('an include row pins an item the rule missed, and pins sort first', () => {
    const members = resolveMembers(silverRule, objects, [item('g1', 'b', { sort_order: 0 })])
    expect(members.map(m => m.id)).toEqual(['b', 'a', 'c'])
  })

  it('exclude beats include', () => {
    const members = resolveMembers(silverRule, objects, [
      item('g1', 'b', { sort_order: 0 }),
      item('g1', 'b', { role: 'exclude' }),
    ])
    expect(members.map(m => m.id)).not.toContain('b')
  })

  it('an empty rule yields nothing rather than everything', () => {
    const members = resolveMembers(group({ membership: 'rule', rule: {} }), objects, [])
    expect(members).toEqual([])
  })
})

describe('sorting', () => {
  const objects = [
    obj('a', { title: 'Beta', year: '1900', cert_grade_numeric: 8, created_at: '2020-01-01' }),
    obj('b', { title: 'Alpha', year: '1800', cert_grade_numeric: 10, created_at: '2024-01-01' }),
  ]
  const all = [item('g1', 'a'), item('g1', 'b')]

  it('alpha sorts by title', () => {
    expect(resolveMembers(group({ sort_by: 'alpha' }), objects, all).map(m => m.title))
      .toEqual(['Alpha', 'Beta'])
  })

  it('date_made sorts oldest first', () => {
    expect(resolveMembers(group({ sort_by: 'date_made' }), objects, all).map(m => m.id))
      .toEqual(['b', 'a'])
  })

  it('grade sorts highest first', () => {
    expect(resolveMembers(group({ sort_by: 'grade' }), objects, all).map(m => m.id))
      .toEqual(['b', 'a'])
  })

  it('date_added sorts newest first', () => {
    expect(resolveMembers(group({ sort_by: 'date_added' }), objects, all).map(m => m.id))
      .toEqual(['b', 'a'])
  })

  it('leaves ungraded items last rather than first', () => {
    const mixed = [obj('x', { cert_grade_numeric: 5 }), obj('y')]
    const members = resolveMembers(
      group({ sort_by: 'grade' }), mixed, [item('g1', 'x'), item('g1', 'y')],
    )
    expect(members.map(m => m.id)).toEqual(['x', 'y'])
  })
})

describe('resolveAllMembers', () => {
  it('resolves each set against the shared object array', () => {
    const objects = [obj('a', { medium: 'Silver' }), obj('b', { medium: 'Gold' })]
    const groups = [
      { id: 'g1', membership: 'manual', rule: {}, sort_by: 'manual' as GroupSort },
      {
        id: 'g2',
        membership: 'rule',
        rule: { match: 'all', conditions: [{ field: 'medium', op: 'is', value: 'Gold' }] },
        sort_by: 'alpha' as GroupSort,
      },
    ]
    const resolved = resolveAllMembers(groups, objects, [item('g1', 'a')])
    expect(resolved.get('g1')!.map(m => m.id)).toEqual(['a'])
    expect(resolved.get('g2')!.map(m => m.id)).toEqual(['b'])
  })
})
