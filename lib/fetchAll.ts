/**
 * Paged fetch for queries that must return every row.
 *
 * PostgREST caps any single response at `db.max_rows` (1,000 by default, and
 * the 16 July 2026 audit confirmed no override is set on this project). A plain
 * `.select()` therefore stops at 1,000 rows *silently* — no error, just a short
 * array. Anything derived from it (compliance denominators, object-id Sets,
 * exports) is then quietly wrong for exactly the large collections that matter.
 *
 * `fetchAll` walks the result with `.range()` until a short page arrives.
 *
 *   const { data, error } = await fetchAll(r =>
 *     supabase.from('objects').select('*').eq('museum_id', id).range(r.from, r.to))
 *
 * The callback must apply `.range()` — everything else about the query is the
 * caller's business.
 */

export interface PageRange {
  from: number
  to: number
}

export interface FetchAllResult<T> {
  data: T[]
  error: { message: string } | null
  /** True if we stopped at maxRows before exhausting the table. */
  truncated: boolean
}

export const DEFAULT_PAGE_SIZE = 1000

/** Hard ceiling so a runaway query can't page forever. */
export const DEFAULT_MAX_ROWS = 50_000

export async function fetchAll<T>(
  query: (range: PageRange) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  opts: { pageSize?: number; maxRows?: number } = {}
): Promise<FetchAllResult<T>> {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE
  const maxRows = opts.maxRows ?? DEFAULT_MAX_ROWS
  const all: T[] = []

  for (let from = 0; from < maxRows; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await query({ from, to })
    if (error) return { data: all, error, truncated: false }
    const page = data || []
    all.push(...page)
    // A short page means we've reached the end.
    if (page.length < pageSize) return { data: all, error: null, truncated: false }
  }

  return { data: all, error: null, truncated: true }
}
