import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every table created by the SQL in supabase/ must grant Data API access.
 *
 * From 30 October 2026 Supabase no longer grants it automatically to new
 * tables in "public". A table created without grants works in nobody's
 * browser: supabase-js gets "permission denied" even where RLS would allow
 * the row. Existing tables are recorded in explicit-grants-2026-10-20.sql;
 * anything new needs its grants in the file that creates it.
 */

const dir = join(__dirname, '..', '..', 'supabase')
const files = readdirSync(dir).filter(f => f.endsWith('.sql'))

/** Tables some old file created that no longer exist, so need no grants. */
const RETIRED: Record<string, string> = {
  inventory_exercises: 'superseded by audit_exercises (schema-reconciliation-2026-07-06.sql)',
}

function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '')
}

function bareName(raw: string): { schema: string; name: string } {
  const cleaned = raw.trim().replace(/"/g, '').toLowerCase()
  const [a, b] = cleaned.split('.')
  return b ? { schema: a, name: b } : { schema: 'public', name: a }
}

const created = new Map<string, string>() // table -> first file that creates it
const grantedTo = new Map<string, Set<string>>() // table -> roles

for (const file of files) {
  const sql = stripComments(readFileSync(join(dir, file), 'utf8'))

  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)/gi)) {
    const { schema, name } = bareName(m[1])
    if (schema === 'public' && !created.has(name)) created.set(name, file)
  }

  for (const m of sql.matchAll(/grant\s+[^;]*?\s+on\s+(?!function|all\s+functions|sequence|schema)(?:table\s+)?([^;]*?)\s+to\s+([^;]+);/gi)) {
    const roles = m[2].split(',').map(r => r.trim().toLowerCase())
    for (const target of m[1].split(',')) {
      const { schema, name } = bareName(target)
      if (schema !== 'public') continue
      const set = grantedTo.get(name) ?? new Set<string>()
      roles.forEach(r => set.add(r))
      grantedTo.set(name, set)
    }
  }
}

describe('Data API grants for tables in public', () => {
  it('found the SQL it is meant to check', () => {
    // A broken regex finding nothing would make the next test pass vacuously.
    expect(files.length).toBeGreaterThan(50)
    expect(created.size).toBeGreaterThan(50)
    expect(grantedTo.size).toBeGreaterThan(50)
  })

  it('every table created in supabase/*.sql grants authenticated and service_role', () => {
    const missing = [...created.entries()]
      .filter(([name]) => !(name in RETIRED))
      .filter(([name]) => {
        const roles = grantedTo.get(name)
        return !roles || !roles.has('authenticated') || !roles.has('service_role')
      })
      .map(([name, file]) => `${name} (created in ${file})`)

    expect(
      missing,
      'Add GRANT statements in the same file that creates the table. See the header of supabase/explicit-grants-2026-10-20.sql.'
    ).toEqual([])
  })

  it('a retired table really is gone from the recorded grants', () => {
    for (const name of Object.keys(RETIRED)) {
      expect(grantedTo.has(name), `${name} is listed as retired but still has grants`).toBe(false)
    }
  })
})
