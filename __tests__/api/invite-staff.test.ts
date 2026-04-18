import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (...args: any[]) => mockFrom(...args),
  })),
}))

const mockInviteUserByEmail = vi.fn()
const mockAdminFrom = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { admin: { inviteUserByEmail: mockInviteUserByEmail } },
    from: (...args: any[]) => mockAdminFrom(...args),
  })),
}))

vi.mock('@/lib/rate-limit', () => ({
  authLimiter: {},
  rateLimit: vi.fn(async () => null),
}))

import { POST } from '@/app/api/invite-staff/route'
import { rateLimit } from '@/lib/rate-limit'

const MUSEUM_ID = '11111111-1111-4111-8111-111111111111'
const STAFF_ID = '22222222-2222-4222-8222-222222222222'

function makeRequest(body: any) {
  return new Request('http://localhost/api/invite-staff', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function chainReturning(result: any) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
    update: vi.fn(() => chain),
  }
  return chain
}

describe('POST /api/invite-staff', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockFrom.mockReset()
    mockAdminFrom.mockReset()
    mockInviteUserByEmail.mockReset()
    vi.mocked(rateLimit).mockResolvedValue(null)
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('rejects invalid body (missing email)', async () => {
    const res = await POST(makeRequest({ staffId: STAFF_ID }))
    expect(res.status).toBe(400)
  })

  it('rejects unauthenticated caller', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate-limited', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(rateLimit).mockResolvedValue(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    )
    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(429)
  })

  it('rejects caller who is neither owner nor admin staff', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: null })
      if (table === 'staff_members') return chainReturning({ data: null })
      return chainReturning({ data: null })
    })
    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(403)
  })

  it('rejects when staffId belongs to a different museum', async () => {
    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID } })
      if (table === 'staff_members') {
        callCount++
        // First call: owner lookup -> staff not found for this museum
        return chainReturning({ data: null })
      }
      return chainReturning({ data: null })
    })
    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(403)
    expect(callCount).toBeGreaterThan(0)
  })

  it('sends invite on happy path and records invited_at', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID } })
      if (table === 'staff_members') return chainReturning({ data: { id: STAFF_ID } })
      return chainReturning({ data: null })
    })
    mockInviteUserByEmail.mockResolvedValue({ error: null })
    const updateChain = chainReturning({ data: null })
    mockAdminFrom.mockImplementation(() => updateChain)

    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(mockInviteUserByEmail).toHaveBeenCalledWith('a@b.com', expect.any(Object))
    expect(updateChain.update).toHaveBeenCalled()
  })

  it('treats "already registered" as success but does not overwrite invited_at', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID } })
      if (table === 'staff_members') return chainReturning({ data: { id: STAFF_ID } })
      return chainReturning({ data: null })
    })
    mockInviteUserByEmail.mockResolvedValue({
      error: { message: 'A user with this email has already been registered' },
    })
    const updateChain = chainReturning({ data: null })
    mockAdminFrom.mockImplementation(() => updateChain)

    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(updateChain.update).not.toHaveBeenCalled()
  })

  it('returns 400 when Supabase invite fails unexpectedly', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: { id: MUSEUM_ID } })
      if (table === 'staff_members') return chainReturning({ data: { id: STAFF_ID } })
      return chainReturning({ data: null })
    })
    mockInviteUserByEmail.mockResolvedValue({ error: { message: 'Email rate limit exceeded' } })

    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(400)
  })

  it('allows admin staff member to invite', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'museums') return chainReturning({ data: null })
      if (table === 'staff_members') return chainReturning({ data: { museum_id: MUSEUM_ID, id: STAFF_ID } })
      return chainReturning({ data: null })
    })
    mockInviteUserByEmail.mockResolvedValue({ error: null })
    mockAdminFrom.mockImplementation(() => chainReturning({ data: null }))

    const res = await POST(makeRequest({ staffId: STAFF_ID, email: 'a@b.com' }))
    expect(res.status).toBe(200)
  })
})
