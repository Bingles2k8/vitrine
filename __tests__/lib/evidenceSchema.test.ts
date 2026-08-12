import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guards against the silent-failure class: code writing a column the table does
 * not have.
 *
 * The evidence writes all swallow their errors on purpose, because losing an
 * audit row must never fail a customer's cancellation or refund. The cost of
 * that choice is that a mistyped or renamed column produces no visible symptom
 * at all: the refund happens, the log line goes to stderr, and the evidence
 * trail quietly has a hole in it.
 *
 * Nothing else would catch that. The unit tests stub the database, and the
 * integration suite stubs it too, because there is no non-production database
 * to write to. So this compares the column names the code inserts against the
 * columns the migration creates.
 *
 * Verified once by hand against the live schema with BEGIN/ROLLBACK on
 * 12 August 2026; this keeps it true.
 */

const root = join(__dirname, '..', '..')
const read = (p: string) => readFileSync(join(root, p), 'utf8')

/** Column names from the CREATE TABLE block for `table` in a migration file. */
function columnsOf(sql: string, table: string): string[] {
  const match = sql.match(
    new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\n\\);`)
  )
  if (!match) throw new Error(`no CREATE TABLE found for ${table}`)
  return match[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('--'))
    .map((line) => line.split(/\s+/)[0])
    .filter((name) => /^[a-z_]+$/.test(name))
}

/**
 * Keys of every object literal written to an evidence table in a file.
 *
 * Covers both direct `.insert({...})` / `.upsert({...})` calls and the two
 * local helpers that wrap them, `record(supabase, {...})` in refund.ts and
 * `writeEvent(supabase, {...})` in cancel.ts. Missing the helpers is exactly
 * how this test first passed vacuously.
 */
function insertedKeys(source: string): string[] {
  const keys = new Set<string>()
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  const patterns = [
    /\.(?:insert|upsert)\(\s*\{([\s\S]*?)\n\s*\}/g,
    /\b(?:record|writeEvent)\([^,]*,\s*\{([\s\S]*?)\n\s*\}/g,
  ]

  for (const pattern of patterns) {
    for (const m of stripped.matchAll(pattern)) {
      for (const k of m[1].matchAll(/^\s*([a-z_]+)\s*:/gm)) keys.add(k[1])
    }
  }
  return [...keys]
}

const schemas = {
  refunds: columnsOf(read('supabase/dmcca-refunds.sql'), 'refunds'),
  cancellation_events: columnsOf(
    read('supabase/dmcca-cancellation-events.sql'),
    'cancellation_events'
  ),
  subscription_notices: columnsOf(
    read('supabase/dmcca-subscription-notices.sql'),
    'subscription_notices'
  ),
  subscriptions: columnsOf(read('supabase/dmcca-billing-foundations.sql'), 'subscriptions'),
}

describe('the migrations define the columns this test expects', () => {
  it('refunds has its key columns', () => {
    expect(schemas.refunds).toContain('idempotency_key')
    expect(schemas.refunds).toContain('stripe_refund_id')
    expect(schemas.refunds).toContain('refund_mode')
  })

  it('cancellation_events has its key columns', () => {
    expect(schemas.cancellation_events).toContain('initiated_by')
    expect(schemas.cancellation_events).toContain('cooling_off_active')
  })

  it('subscription_notices has its key columns', () => {
    expect(schemas.subscription_notices).toContain('content_hash')
    expect(schemas.subscription_notices).toContain('provider_message_id')
  })
})

describe('every column the code writes exists in the table', () => {
  const cases: Array<{ file: string; table: keyof typeof schemas }> = [
    { file: 'lib/billing/refund.ts', table: 'refunds' },
    { file: 'lib/billing/reconcileRefund.ts', table: 'refunds' },
    { file: 'lib/billing/cancel.ts', table: 'cancellation_events' },
    { file: 'lib/billing/notices.ts', table: 'subscription_notices' },
  ]

  for (const { file, table } of cases) {
    it(`${file} writes only real ${table} columns`, () => {
      const written = insertedKeys(read(file))
      expect(written.length).toBeGreaterThan(0)
      const unknown = written.filter((k) => !schemas[table].includes(k))
      expect(unknown, `not columns of ${table}: ${unknown.join(', ')}`).toEqual([])
    })
  }

  it('syncSubscription writes only real subscriptions columns', () => {
    // Built as a `row` object rather than inline in the upsert call, so it is
    // extracted separately.
    const source = read('lib/billing/syncSubscription.ts')
    const block = source.match(/const row: Record<string, unknown> = \{([\s\S]*?)\n  \}/)
    expect(block).not.toBeNull()

    const written = [...block![1].matchAll(/^\s*([a-z_]+)\s*:/gm)].map((m) => m[1])
    // Assigned conditionally after the literal.
    written.push('cooling_off_started_at', 'cooling_off_ends_at', 'cooling_off_reason')

    const unknown = written.filter((k) => !schemas.subscriptions.includes(k))
    expect(unknown, `not columns of subscriptions: ${unknown.join(', ')}`).toEqual([])
  })
})

describe('the refunds double-issue guard is defined', () => {
  const sql = read('supabase/dmcca-refunds.sql')

  it('a unique index constrains issued rows by idempotency key', () => {
    // The database-level backstop against a double refund. Verified live on
    // 12 August 2026: a second issued row with the same key is rejected, while
    // failed and confirmed rows with that key are still accepted.
    expect(sql).toMatch(/CREATE UNIQUE INDEX[\s\S]*?ON refunds \(idempotency_key\)/)
    expect(sql).toMatch(/WHERE event = 'issued' AND idempotency_key IS NOT NULL/)
  })
})
