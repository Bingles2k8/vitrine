import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Museum-wide reference allocation for the documentation registers.
 *
 * References look like `OE-2026-001`: a per-register prefix, the year, and a
 * sequence number. The sequence is scoped to (museum, register, year) — NOT to
 * a single object. Counting an object's own rows (the pre-2026-07 behaviour)
 * gave every object's first record the same number.
 *
 * Allocation is best-effort: `nextReference` reads the current high-water mark,
 * and `insertWithReference` retries on the unique-violation the DB raises if two
 * users allocate the same number concurrently. The UNIQUE (museum_id, <column>)
 * indexes in supabase/reference-uniqueness-2026-07-16.sql are what make that
 * race detectable rather than silent.
 */

export interface ReferenceSpec {
  /** Table holding the register's rows, e.g. `object_exits`. */
  table: string
  /** Reference column on that table, e.g. `exit_number`. */
  column: string
  /** Reference prefix, e.g. `OE`. */
  prefix: string
  museumId: string
}

export function referencePrefixFor(spec: Pick<ReferenceSpec, 'prefix'>, year = new Date().getFullYear()): string {
  return `${spec.prefix}-${year}-`
}

export function formatReference(pattern: string, n: number): string {
  return `${pattern}${String(n).padStart(3, '0')}`
}

/** `OE-2026-007` -> `OE-2026-008`. Preserves at least 3-digit padding. */
export function bumpReference(reference: string): string {
  const m = reference.match(/^(.*-)(\d+)$/)
  if (!m) return reference
  return formatReference(m[1], parseInt(m[2], 10) + 1)
}

/** Highest sequence number already used for (museum, register, year); 0 if none. */
export async function highestSequence(supabase: SupabaseClient, spec: ReferenceSpec, year = new Date().getFullYear()): Promise<number> {
  const pattern = referencePrefixFor(spec, year)
  const { data, error } = await supabase
    .from(spec.table)
    .select(spec.column)
    .eq('museum_id', spec.museumId)
    .like(spec.column, `${pattern}%`)
  if (error || !data) return 0
  let max = 0
  for (const row of data as unknown as Record<string, unknown>[]) {
    const value = row?.[spec.column]
    if (typeof value !== 'string') continue
    const m = value.slice(pattern.length).match(/^(\d+)/)
    if (!m) continue
    const n = parseInt(m[1], 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return max
}

/** Next free reference for (museum, register, year), e.g. `OE-2026-004`. */
export async function nextReference(supabase: SupabaseClient, spec: ReferenceSpec, year = new Date().getFullYear()): Promise<string> {
  const next = (await highestSequence(supabase, spec, year)) + 1
  return formatReference(referencePrefixFor(spec, year), next)
}

function isReferenceConflict(error: { code?: string; message?: string } | null, spec: ReferenceSpec): boolean {
  if (!error || error.code !== '23505') return false
  // Only retry when the violated constraint is this register's reference index;
  // any other unique violation is a real error the caller must see.
  return (error.message || '').includes(spec.column)
}

export interface InsertWithReferenceResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
  reference: string | null
}

/**
 * Allocates a reference and inserts the row, retrying with the next number if
 * another writer took it first. `buildRow` receives the reference to embed.
 */
export async function insertWithReference<T = { id: string }>(
  supabase: SupabaseClient,
  spec: ReferenceSpec,
  buildRow: (reference: string) => Record<string, unknown>,
  select = 'id',
  maxAttempts = 5
): Promise<InsertWithReferenceResult<T>> {
  let reference = await nextReference(supabase, spec)
  let lastError: { message: string; code?: string } | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from(spec.table)
      .insert(buildRow(reference))
      .select(select)
      .single()

    if (!error) return { data: data as T, error: null, reference }
    lastError = error
    if (!isReferenceConflict(error, spec)) return { data: null, error, reference }
    reference = bumpReference(reference)
  }

  return {
    data: null,
    error: lastError ?? { message: `Could not allocate a free ${spec.column} after ${maxAttempts} attempts` },
    reference,
  }
}
