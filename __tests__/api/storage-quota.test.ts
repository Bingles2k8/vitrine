import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkStorageQuota } from '@/lib/storageUsage'

function makeSupabaseWithUsage(usedBytes: number): any {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { storage_used_bytes: usedBytes } }),
        }),
      }),
    }),
  }
}

describe('checkStorageQuota', () => {
  it('returns true for unlimited plans (null documentStorageMb)', async () => {
    const supabase = makeSupabaseWithUsage(999_999_999)
    // enterprise plan has unlimited document storage (null limit)
    const ok = await checkStorageQuota(supabase, 'm', 'enterprise', 1_000_000)
    expect(ok).toBe(true)
  })

  it('accepts upload under the limit', async () => {
    const supabase = makeSupabaseWithUsage(10 * 1024 * 1024) // 10 MB used
    // hobbyist has 100 MB
    const ok = await checkStorageQuota(supabase, 'm', 'hobbyist', 5 * 1024 * 1024)
    expect(ok).toBe(true)
  })

  it('rejects upload that would push over the limit', async () => {
    const supabase = makeSupabaseWithUsage(95 * 1024 * 1024) // 95 MB used
    const ok = await checkStorageQuota(supabase, 'm', 'hobbyist', 10 * 1024 * 1024)
    expect(ok).toBe(false)
  })

  it('treats missing storage_used_bytes as 0', async () => {
    const supabase: any = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null }),
          }),
        }),
      }),
    }
    const ok = await checkStorageQuota(supabase, 'm', 'hobbyist', 50 * 1024 * 1024)
    expect(ok).toBe(true)
  })

  it('rejects exactly at-limit boundary is allowed but one byte over is not', async () => {
    const limit = 100 * 1024 * 1024
    const supabaseEq = makeSupabaseWithUsage(limit)
    expect(await checkStorageQuota(supabaseEq, 'm', 'hobbyist', 0)).toBe(true)
    const supabaseOver = makeSupabaseWithUsage(limit)
    expect(await checkStorageQuota(supabaseOver, 'm', 'hobbyist', 1)).toBe(false)
  })
})

// Integration: /api/objects/[id]/documents relies on the `insert_document_if_quota_ok`
// RPC for atomic quota+insert. Verify the route surfaces a 403 when the RPC
// returns `storage_limit_exceeded`.

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {},
  rateLimit: vi.fn(async () => null),
}))

import { POST } from '@/app/api/objects/[id]/documents/route'

const MUSEUM_ID = '11111111-1111-4111-8111-111111111111'
const OBJECT_ID = '33333333-3333-4333-8333-333333333333'

function chainReturning(result: any) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
  }
  return chain
}

function makeRequest(body: any) {
  return new Request(`http://localhost/api/objects/${OBJECT_ID}/documents`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const validBody = {
  related_to_type: 'general',
  related_to_id: null,
  label: 'My doc',
  file_url: 'https://example.com/doc.pdf',
  file_name: 'doc.pdf',
  file_size: 1024,
  mime_type: 'application/pdf',
}

describe('POST /api/objects/[id]/documents — quota integration', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
    mockRpc.mockReset()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns 403 when RPC reports storage_limit_exceeded', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID, plan: 'hobbyist' } })
      if (table === 'objects') return chainReturning({ data: { id: OBJECT_ID } })
      return chainReturning({ data: null })
    })
    mockRpc.mockResolvedValue({ data: null, error: { message: 'storage_limit_exceeded' } })

    const res = await POST(makeRequest(validBody), { params: Promise.resolve({ id: OBJECT_ID }) })
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/storage limit/i)
  })

  it('returns 200 with the inserted doc when under quota', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID, plan: 'hobbyist' } })
      if (table === 'objects') return chainReturning({ data: { id: OBJECT_ID } })
      return chainReturning({ data: null })
    })
    mockRpc.mockResolvedValue({ data: { id: 'doc-1', file_url: validBody.file_url }, error: null })

    const res = await POST(makeRequest(validBody), { params: Promise.resolve({ id: OBJECT_ID }) })
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith(
      'insert_document_if_quota_ok',
      expect.objectContaining({ p_museum_id: MUSEUM_ID, p_object_id: OBJECT_ID }),
    )
  })

  it('passes p_limit_bytes=null for unlimited plans (enterprise)', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID, plan: 'enterprise' } })
      if (table === 'objects') return chainReturning({ data: { id: OBJECT_ID } })
      return chainReturning({ data: null })
    })
    mockRpc.mockResolvedValue({ data: { id: 'doc-1' }, error: null })

    await POST(makeRequest(validBody), { params: Promise.resolve({ id: OBJECT_ID }) })
    expect(mockRpc).toHaveBeenCalledWith(
      'insert_document_if_quota_ok',
      expect.objectContaining({ p_limit_bytes: null }),
    )
  })

  it('rejects unauthenticated caller', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest(validBody), { params: Promise.resolve({ id: OBJECT_ID }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when object is not in caller museum', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID, plan: 'hobbyist' } })
      if (table === 'objects') return chainReturning({ data: null })
      return chainReturning({ data: null })
    })
    const res = await POST(makeRequest(validBody), { params: Promise.resolve({ id: OBJECT_ID }) })
    expect(res.status).toBe(404)
  })
})
