import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import { PLANS, type PlanId } from '@/lib/plans'

// enforce_object_limit hard-codes each plan's object limit in SQL. It drifted
// once, capping paying Hobbyist customers at 500 objects when the plan sells
// 1,000. This reads the current definition and checks it against lib/plans.ts.
const sql = readFileSync(
  path.resolve(__dirname, '../../supabase/object-limit-restore-2026-10-29.sql'),
  'utf8'
)

describe('enforce_object_limit trigger', () => {
  const fn = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.enforce_object_limit'))
  const limits = new Map<string, number>()
  for (const m of fn.matchAll(/WHEN '(\w+)'\s+THEN (\d+)/g)) limits.set(m[1], Number(m[2]))

  it.each(Object.keys(PLANS) as PlanId[])('matches lib/plans.ts for %s', plan => {
    const expected = PLANS[plan].objects
    if (expected === null) {
      expect(limits.has(plan)).toBe(false) // falls through to ELSE NULL, unlimited
    } else {
      expect(limits.get(plan)).toBe(expected)
    }
  })

  it('counts only objects that are not in the bin, like insert_object_if_quota_ok', () => {
    expect(fn).toMatch(/deleted_at IS NULL/)
  })

  it('also runs when an object is restored from the bin', () => {
    expect(fn).toMatch(/BEFORE INSERT OR UPDATE OF deleted_at ON public\.objects/)
    expect(fn).toMatch(/OLD\.deleted_at IS NOT NULL AND NEW\.deleted_at IS NULL/)
  })
})
