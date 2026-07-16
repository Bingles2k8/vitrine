import { describe, it, expect } from 'vitest'
import { fetchAll } from '@/lib/fetchAll'

/** Serves `total` rows in pages, recording the ranges it was asked for. */
function pagedSource(total: number) {
  const rows = Array.from({ length: total }, (_, i) => ({ id: i }))
  const ranges: Array<[number, number]> = []
  const query = async ({ from, to }: { from: number; to: number }) => {
    ranges.push([from, to])
    return { data: rows.slice(from, to + 1), error: null }
  }
  return { query, ranges }
}

describe('fetchAll', () => {
  it('returns every row when the table fits in one page', async () => {
    const { query, ranges } = pagedSource(10)
    const res = await fetchAll(query, { pageSize: 1000 })
    expect(res.data).toHaveLength(10)
    expect(res.error).toBeNull()
    expect(ranges).toEqual([[0, 999]])
  })

  it('pages past the 1,000-row cap that would otherwise truncate silently', async () => {
    const { query, ranges } = pagedSource(2500)
    const res = await fetchAll(query, { pageSize: 1000 })
    expect(res.data).toHaveLength(2500)
    expect(res.truncated).toBe(false)
    expect(ranges).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
  })

  it('makes one extra request when the total is an exact multiple of the page size', async () => {
    // 2000 rows: the second page is full, so we cannot know we are done until
    // a third, empty page comes back.
    const { query, ranges } = pagedSource(2000)
    const res = await fetchAll(query, { pageSize: 1000 })
    expect(res.data).toHaveLength(2000)
    expect(ranges).toHaveLength(3)
  })

  it('returns an empty array for an empty table', async () => {
    const { query } = pagedSource(0)
    const res = await fetchAll(query, { pageSize: 1000 })
    expect(res.data).toEqual([])
    expect(res.error).toBeNull()
  })

  it('stops and reports the error, keeping rows already fetched', async () => {
    let calls = 0
    const res = await fetchAll(async ({ from }) => {
      calls++
      if (from === 0) return { data: Array.from({ length: 1000 }, (_, i) => ({ id: i })), error: null }
      return { data: null, error: { message: 'boom' } }
    }, { pageSize: 1000 })
    expect(res.error?.message).toBe('boom')
    expect(res.data).toHaveLength(1000)
    expect(calls).toBe(2)
  })

  it('flags truncation rather than paging forever', async () => {
    const { query } = pagedSource(10_000)
    const res = await fetchAll(query, { pageSize: 1000, maxRows: 3000 })
    expect(res.data).toHaveLength(3000)
    expect(res.truncated).toBe(true)
  })

  it('honours a custom page size', async () => {
    const { query, ranges } = pagedSource(5)
    const res = await fetchAll(query, { pageSize: 2 })
    expect(res.data).toHaveLength(5)
    expect(ranges).toEqual([[0, 1], [2, 3], [4, 5]])
  })
})
