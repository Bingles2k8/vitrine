import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Guards the evidence trail against the deletion path.
 *
 * The billing evidence tables must outlive the museum they describe, because
 * the retention period is six years and an ex-customer is exactly the person
 * most likely to dispute what happened. `deleteMuseumEverywhere` walks a list
 * of tables and empties each one by museum_id; adding an evidence table to that
 * list would destroy the proof precisely when it is most needed.
 *
 * This is a plausible mistake for someone tidying up orphaned rows later, and
 * nothing else would catch it, so it is asserted here.
 */

const root = join(__dirname, '..', '..')
const deleteModule = readFileSync(join(root, 'lib', 'delete-museum-data.ts'), 'utf8')

const EVIDENCE_TABLES = ['cancellation_events', 'subscription_notices', 'refunds', 'deletion_log']

describe('billing evidence outlives account deletion', () => {
  // Isolate the deletion list itself rather than the whole file, so an
  // incidental mention in a comment does not fail the test.
  const listMatch = deleteModule.match(/TABLES_IN_DEPENDENCY_ORDER\s*=\s*\[([\s\S]*?)\]/)

  it('the deletion list is still where this test expects it', () => {
    expect(listMatch).not.toBeNull()
  })

  for (const table of EVIDENCE_TABLES) {
    it(`${table} is not in TABLES_IN_DEPENDENCY_ORDER`, () => {
      expect(listMatch![1]).not.toContain(`'${table}'`)
    })
  }

  it('the operational subscriptions mirror IS deleted with the museum', () => {
    // The mirror is operational state rather than evidence: it carries no
    // statutory proof, and leaving it behind would orphan rows. It has a
    // foreign key with ON DELETE CASCADE, so it goes when the museum row does
    // and does not need to appear in the list.
    const foundations = readFileSync(
      join(root, 'supabase', 'dmcca-billing-foundations.sql'),
      'utf8'
    )
    expect(foundations).toMatch(/museum_id uuid NOT NULL REFERENCES museums\(id\) ON DELETE CASCADE/)
  })
})

describe('the evidence tables are append-only', () => {
  const migrations = {
    cancellation_events: 'dmcca-cancellation-events.sql',
    subscription_notices: 'dmcca-subscription-notices.sql',
    refunds: 'dmcca-refunds.sql',
  }

  for (const [table, file] of Object.entries(migrations)) {
    const sql = readFileSync(join(root, 'supabase', file), 'utf8')

    it(`${table} revokes UPDATE, DELETE and TRUNCATE`, () => {
      // TRUNCATE matters as much as the other two: Supabase grants it by
      // default, and without revoking it the table can be emptied in one
      // statement, which makes the other revocations decorative.
      const revoke = sql.match(/REVOKE[^;]*ON\s+\w+\s+FROM[^;]*;/)
      expect(revoke).not.toBeNull()
      expect(revoke![0]).toContain('UPDATE')
      expect(revoke![0]).toContain('DELETE')
      expect(revoke![0]).toContain('TRUNCATE')
      expect(revoke![0]).toContain('service_role')
    })

    it(`${table} has no foreign key to museums`, () => {
      const create = sql.match(/CREATE TABLE IF NOT EXISTS \w+ \(([\s\S]*?)\n\);/)
      expect(create).not.toBeNull()
      expect(create![1]).not.toMatch(/REFERENCES museums/)
    })
  }
})

describe('the six-year retention is enforced, not just promised', () => {
  const retention = readFileSync(join(root, 'supabase', 'dmcca-evidence-retention.sql'), 'utf8')

  it('a purge function exists', () => {
    expect(retention).toContain('purge_expired_billing_evidence')
  })

  it('it uses a six-year cutoff, matching the privacy policy', () => {
    expect(retention).toMatch(/interval '6 years'/)
  })

  it('it covers every table the privacy policy names', () => {
    for (const table of EVIDENCE_TABLES) {
      expect(retention).toContain(`DELETE FROM ${table}`)
    }
  })

  it('it is SECURITY DEFINER, since DELETE is revoked from the service role', () => {
    expect(retention).toContain('SECURITY DEFINER')
  })

  it('it is not callable by customer-facing roles', () => {
    expect(retention).toMatch(/REVOKE ALL ON FUNCTION purge_expired_billing_evidence\(\) FROM public, anon, authenticated/)
  })

  it('the daily cron actually calls it', () => {
    const cron = readFileSync(
      join(root, 'app', 'api', 'cron', 'subscription-notices', 'route.ts'),
      'utf8'
    )
    expect(cron).toContain('purge_expired_billing_evidence')
  })
})
