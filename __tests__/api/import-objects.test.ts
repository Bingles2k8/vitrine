import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (...args: any[]) => mockFrom(...args),
  })),
}))

const mockServiceFrom = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (...args: any[]) => mockServiceFrom(...args),
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {},
  rateLimit: vi.fn(async () => null),
}))

import { POST } from '@/app/api/import/objects/route'

const MUSEUM_ID = '11111111-1111-4111-8111-111111111111'

function makeRequest(body: any) {
  return new Request('http://localhost/api/import/objects', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function chainMaybeSingle(result: any) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    is: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
  }
  return chain
}

function chainCount(count: number) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    // terminal
    then: undefined,
  }
  chain.is = vi.fn(() => Promise.resolve({ count }))
  return chain
}

function chainInsertSuccess(insertedCount: number) {
  const chain: any = {
    insert: vi.fn(() => chain),
    select: vi.fn(async () => ({
      data: Array.from({ length: insertedCount }, (_, i) => ({ id: `obj-${i}` })),
      error: null,
    })),
  }
  return chain
}

describe('POST /api/import/objects', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
    mockServiceFrom.mockReset()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('rejects unauthenticated callers', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ rows: [{ title: 'A' }] }))
    expect(res.status).toBe(401)
  })

  it('rejects callers with no museum', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: null })
      if (table === 'staff_members') return chainMaybeSingle({ data: null })
      return chainMaybeSingle({ data: null })
    })
    const res = await POST(makeRequest({ rows: [{ title: 'A' }] }))
    expect(res.status).toBe(403)
  })

  it('rejects empty rows array', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: { id: MUSEUM_ID, owner_id: 'user-1', plan: 'hobbyist' } })
      return chainMaybeSingle({ data: null })
    })
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
  })

  it('rejects more than 500 rows', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: { id: MUSEUM_ID, owner_id: 'user-1', plan: 'hobbyist' } })
      return chainMaybeSingle({ data: null })
    })
    const rows = Array.from({ length: 501 }, () => ({ title: 'A' }))
    const res = await POST(makeRequest({ rows }))
    expect(res.status).toBe(400)
  })

  it('rejects when plan lacks the analytics feature (community)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: { id: MUSEUM_ID, owner_id: 'user-1', plan: 'community' } })
      return chainMaybeSingle({ data: null })
    })
    const res = await POST(makeRequest({ rows: [{ title: 'A' }] }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/Hobbyist/i)
  })

  it('rejects when import would exceed plan object limit', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: { id: MUSEUM_ID, owner_id: 'user-1', plan: 'hobbyist' } })
      return chainMaybeSingle({ data: null })
    })
    // hobbyist plan has 1000 object limit — simulate 999 existing + 2 new
    mockServiceFrom.mockImplementation(() => chainCount(999))
    const res = await POST(makeRequest({ rows: [{ title: 'A' }, { title: 'B' }] }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/limit/i)
  })

  it('rejects invalid row schema (title too long)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: { id: MUSEUM_ID, owner_id: 'user-1', plan: 'hobbyist' } })
      return chainMaybeSingle({ data: null })
    })
    mockServiceFrom.mockImplementation(() => chainCount(0))
    const tooLong = 'x'.repeat(501)
    const res = await POST(makeRequest({ rows: [{ title: tooLong }] }))
    expect(res.status).toBe(400)
  })

  it('imports successfully on happy path', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainMaybeSingle({ data: { id: MUSEUM_ID, owner_id: 'user-1', plan: 'hobbyist' } })
      return chainMaybeSingle({ data: null })
    })
    // first service call: count; second: insert
    let call = 0
    mockServiceFrom.mockImplementation(() => {
      call++
      if (call === 1) return chainCount(5)
      return chainInsertSuccess(2)
    })
    const res = await POST(makeRequest({ rows: [{ title: 'A' }, { title: 'B' }] }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.imported).toBe(2)
  })
})
