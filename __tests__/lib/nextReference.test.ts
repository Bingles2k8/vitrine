import { describe, it, expect } from 'vitest'
import {
  bumpReference,
  formatReference,
  referencePrefixFor,
  highestSequence,
  nextReference,
  insertWithReference,
} from '@/lib/nextReference'

const SPEC = { table: 'object_exits', column: 'exit_number', prefix: 'OE', museumId: 'm1' }

/**
 * Minimal Supabase query-builder stub. `rows` is what the select chain resolves
 * to; `onInsert` decides what each insert returns, so tests can simulate the
 * unique-violation the DB raises when two writers race for a reference.
 */
function fakeSupabase(rows: Record<string, unknown>[], onInsert?: (row: Record<string, unknown>) => { data: unknown; error: unknown }) {
  const inserted: Record<string, unknown>[] = []
  const client = {
    inserted,
    from() {
      const builder: Record<string, unknown> = {}
      const chain = () => builder
      builder.select = chain
      builder.eq = chain
      builder.like = chain
      builder.then = (resolve: (v: unknown) => unknown) => resolve({ data: rows, error: null })
      builder.insert = (row: Record<string, unknown>) => ({
        select: () => ({
          single: async () => {
            inserted.push(row)
            return onInsert ? onInsert(row) : { data: { id: 'new' }, error: null }
          },
        }),
      })
      return builder
    },
  }
  return client as never
}

describe('reference formatting', () => {
  it('builds a museum-and-year scoped prefix', () => {
    expect(referencePrefixFor({ prefix: 'OE' }, 2026)).toBe('OE-2026-')
  })

  it('pads sequence numbers to three digits', () => {
    expect(formatReference('OE-2026-', 1)).toBe('OE-2026-001')
    expect(formatReference('OE-2026-', 42)).toBe('OE-2026-042')
  })

  it('does not truncate sequences past three digits', () => {
    expect(formatReference('OE-2026-', 1000)).toBe('OE-2026-1000')
  })

  it('bumps the trailing sequence, preserving the prefix', () => {
    expect(bumpReference('OE-2026-001')).toBe('OE-2026-002')
    expect(bumpReference('OE-2026-009')).toBe('OE-2026-010')
    expect(bumpReference('OE-2026-999')).toBe('OE-2026-1000')
  })

  it('leaves a malformed reference alone rather than corrupting it', () => {
    expect(bumpReference('not-a-reference')).toBe('not-a-reference')
  })
})

describe('highestSequence', () => {
  it('is 0 when the register is empty for that year', async () => {
    expect(await highestSequence(fakeSupabase([]), SPEC, 2026)).toBe(0)
  })

  it('takes the numeric maximum, not the lexicographic one', async () => {
    // Lexicographically '999' > '1000'; the max must still be 1000.
    const rows = [{ exit_number: 'OE-2026-999' }, { exit_number: 'OE-2026-1000' }]
    expect(await highestSequence(fakeSupabase(rows), SPEC, 2026)).toBe(1000)
  })

  it('ignores rows whose reference does not parse', async () => {
    const rows = [{ exit_number: 'OE-2026-003' }, { exit_number: null }, { exit_number: 'OE-2026-' }]
    expect(await highestSequence(fakeSupabase(rows), SPEC, 2026)).toBe(3)
  })
})

describe('nextReference', () => {
  it('starts at 001 for an empty register', async () => {
    expect(await nextReference(fakeSupabase([]), SPEC, 2026)).toBe('OE-2026-001')
  })

  it('continues from the museum-wide high-water mark', async () => {
    const rows = [{ exit_number: 'OE-2026-001' }, { exit_number: 'OE-2026-007' }]
    expect(await nextReference(fakeSupabase(rows), SPEC, 2026)).toBe('OE-2026-008')
  })

  it('does not reuse a number after an earlier row is deleted', async () => {
    // Only 002 survives; a count-based scheme would wrongly hand out 002 again.
    expect(await nextReference(fakeSupabase([{ exit_number: 'OE-2026-002' }]), SPEC, 2026)).toBe('OE-2026-003')
  })
})

describe('insertWithReference', () => {
  it('allocates the next reference and inserts once when uncontended', async () => {
    const supabase = fakeSupabase([{ exit_number: 'OE-2026-001' }])
    const res = await insertWithReference(supabase, SPEC, ref => ({ exit_number: ref, museum_id: 'm1' }))
    expect(res.error).toBeNull()
    expect(res.reference).toBe('OE-2026-002')
    expect((supabase as unknown as { inserted: unknown[] }).inserted).toHaveLength(1)
  })

  it('retries with the next number when another writer took the reference', async () => {
    let first = true
    const supabase = fakeSupabase([], () => {
      if (first) {
        first = false
        return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "object_exits_museum_id_exit_number_key"' } }
      }
      return { data: { id: 'new' }, error: null }
    })
    const res = await insertWithReference(supabase, SPEC, ref => ({ exit_number: ref }))
    expect(res.error).toBeNull()
    expect(res.reference).toBe('OE-2026-002')
    const rows = (supabase as unknown as { inserted: Record<string, string>[] }).inserted
    expect(rows.map(r => r.exit_number)).toEqual(['OE-2026-001', 'OE-2026-002'])
  })

  it('surfaces a unique violation on a different column instead of retrying', async () => {
    const supabase = fakeSupabase([], () => ({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "objects_accession_no_key"' },
    }))
    const res = await insertWithReference(supabase, SPEC, ref => ({ exit_number: ref }))
    expect(res.error?.code).toBe('23505')
    expect((supabase as unknown as { inserted: unknown[] }).inserted).toHaveLength(1)
  })

  it('surfaces non-conflict errors immediately', async () => {
    const supabase = fakeSupabase([], () => ({ data: null, error: { code: '23502', message: 'null value in column "exit_date"' } }))
    const res = await insertWithReference(supabase, SPEC, ref => ({ exit_number: ref }))
    expect(res.error?.code).toBe('23502')
    expect((supabase as unknown as { inserted: unknown[] }).inserted).toHaveLength(1)
  })

  it('gives up after maxAttempts rather than looping forever', async () => {
    const supabase = fakeSupabase([], () => ({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint "object_exits_museum_id_exit_number_key"' },
    }))
    const res = await insertWithReference(supabase, SPEC, ref => ({ exit_number: ref }), 'id', 3)
    expect(res.data).toBeNull()
    expect(res.error).not.toBeNull()
    expect((supabase as unknown as { inserted: unknown[] }).inserted).toHaveLength(3)
  })
})
