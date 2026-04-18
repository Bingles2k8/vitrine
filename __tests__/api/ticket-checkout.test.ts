import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({ get: (_: string) => '127.0.0.1' })),
}))

const mockFrom = vi.fn()
const mockRpc = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
  })),
}))

const mockCreateCheckoutSession = vi.fn()
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: { create: (...args: any[]) => mockCreateCheckoutSession(...args) },
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  publicLimiter: {},
  rateLimit: vi.fn(async () => null),
}))

vi.mock('@/lib/ticket-utils', () => ({
  generateTicketCode: vi.fn(() => 'TEST-CODE-' + Math.random().toString(36).slice(2, 8)),
}))

const mockEmailSend = vi.fn(async () => ({}))
vi.mock('resend', () => ({
  Resend: class { emails = { send: mockEmailSend } },
}))

import { POST } from '@/app/api/ticket-checkout/route'
import { rateLimit } from '@/lib/rate-limit'

const EVENT_ID = '11111111-1111-4111-8111-111111111111'
const SLOT_ID = '22222222-2222-4222-8222-222222222222'
const MUSEUM_ID = '33333333-3333-4333-8333-333333333333'

function makeRequest(body: any) {
  return new Request('http://localhost/api/ticket-checkout', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

function chain(result: any) {
  const c: any = {
    select: vi.fn(() => c),
    insert: vi.fn(() => c),
    update: vi.fn(() => c),
    eq: vi.fn(() => c),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  }
  return c
}

const validBody = {
  eventId: EVENT_ID,
  slotId: SLOT_ID,
  quantity: 2,
  buyerName: 'Ada',
  buyerEmail: 'ada@example.com',
}

function mockHappyPathFree() {
  const futureStart = new Date(Date.now() + 3600_000).toISOString()
  const futureEnd = new Date(Date.now() + 7200_000).toISOString()
  const orderChain = chain({ data: { id: 'order-1' }, error: null })
  let called = { tickets: 0, activity: 0, orderUpdate: 0 }
  mockFrom.mockImplementation((table: string) => {
    if (table === 'events') return chain({ data: {
      id: EVENT_ID, museum_id: MUSEUM_ID, title: 'Tour', price_cents: 0,
      currency: 'gbp', status: 'published',
    }})
    if (table === 'event_time_slots') return chain({ data: {
      id: SLOT_ID, event_id: EVENT_ID, capacity: 10, booked_count: 0,
      start_time: futureStart, end_time: futureEnd, open_entry: false,
    }})
    if (table === 'museums') return chain({ data: {
      id: MUSEUM_ID, name: 'MoMA', slug: 'moma',
      plan: 'institution', stripe_connect_id: 'acct_x', stripe_connect_onboarded: true,
    }})
    if (table === 'ticket_orders') return orderChain
    if (table === 'tickets') {
      called.tickets++
      return { insert: vi.fn(async () => ({ error: null })) }
    }
    if (table === 'activity_log') {
      called.activity++
      return { insert: vi.fn(async () => ({ error: null })) }
    }
    return chain({ data: null })
  })
  mockRpc.mockResolvedValue({ data: true, error: null })
  return { orderChain, called }
}

describe('POST /api/ticket-checkout', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockRpc.mockReset()
    mockCreateCheckoutSession.mockReset()
    mockEmailSend.mockReset()
    vi.mocked(rateLimit).mockResolvedValue(null)
  })

  it('returns 429 when rate-limited', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(rateLimit).mockResolvedValue(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    )
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(429)
  })

  it('rejects invalid body', async () => {
    const res = await POST(makeRequest({ ...validBody, quantity: 0 }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when event is not published', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'events') return chain({ data: null })
      return chain({ data: null })
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 404 when slot does not belong to the event', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'events') return chain({ data: {
        id: EVENT_ID, museum_id: MUSEUM_ID, title: 'Tour', price_cents: 1000,
        currency: 'gbp', status: 'published',
      }})
      if (table === 'event_time_slots') return chain({ data: null })
      return chain({ data: null })
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 403 when museum plan lacks ticketing feature', async () => {
    const futureStart = new Date(Date.now() + 3600_000).toISOString()
    const futureEnd = new Date(Date.now() + 7200_000).toISOString()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'events') return chain({ data: {
        id: EVENT_ID, museum_id: MUSEUM_ID, title: 'Tour', price_cents: 1000,
        currency: 'gbp', status: 'published',
      }})
      if (table === 'event_time_slots') return chain({ data: {
        id: SLOT_ID, event_id: EVENT_ID, capacity: 10, booked_count: 0,
        start_time: futureStart, end_time: futureEnd, open_entry: false,
      }})
      if (table === 'museums') return chain({ data: {
        id: MUSEUM_ID, name: 'M', slug: 'm',
        plan: 'hobbyist', stripe_connect_id: null, stripe_connect_onboarded: false,
      }})
      return chain({ data: null })
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(403)
  })

  it('rejects paid checkout when museum is not Stripe-onboarded', async () => {
    const futureStart = new Date(Date.now() + 3600_000).toISOString()
    const futureEnd = new Date(Date.now() + 7200_000).toISOString()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'events') return chain({ data: {
        id: EVENT_ID, museum_id: MUSEUM_ID, title: 'Tour', price_cents: 1000,
        currency: 'gbp', status: 'published',
      }})
      if (table === 'event_time_slots') return chain({ data: {
        id: SLOT_ID, event_id: EVENT_ID, capacity: 10, booked_count: 0,
        start_time: futureStart, end_time: futureEnd, open_entry: false,
      }})
      if (table === 'museums') return chain({ data: {
        id: MUSEUM_ID, name: 'M', slug: 'm',
        plan: 'institution', stripe_connect_id: null, stripe_connect_onboarded: false,
      }})
      return chain({ data: null })
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
  })

  it('rejects when slot has already ended', async () => {
    const pastStart = new Date(Date.now() - 7200_000).toISOString()
    const pastEnd = new Date(Date.now() - 3600_000).toISOString()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'events') return chain({ data: {
        id: EVENT_ID, museum_id: MUSEUM_ID, title: 'Tour', price_cents: 0,
        currency: 'gbp', status: 'published',
      }})
      if (table === 'event_time_slots') return chain({ data: {
        id: SLOT_ID, event_id: EVENT_ID, capacity: 10, booked_count: 0,
        start_time: pastStart, end_time: pastEnd, open_entry: false,
      }})
      return chain({ data: null })
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
  })

  it('creates free-event order and generates tickets on happy path', async () => {
    mockHappyPathFree()
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.tickets).toHaveLength(2)
    expect(mockRpc).toHaveBeenCalledWith('increment_slot_bookings', { slot_uuid: SLOT_ID, qty: 2 })
  })

  it('creates Stripe Checkout session for paid events', async () => {
    const futureStart = new Date(Date.now() + 3600_000).toISOString()
    const futureEnd = new Date(Date.now() + 7200_000).toISOString()
    mockFrom.mockImplementation((table: string) => {
      if (table === 'events') return chain({ data: {
        id: EVENT_ID, museum_id: MUSEUM_ID, title: 'Tour', price_cents: 1000,
        currency: 'gbp', status: 'published',
      }})
      if (table === 'event_time_slots') return chain({ data: {
        id: SLOT_ID, event_id: EVENT_ID, capacity: 10, booked_count: 0,
        start_time: futureStart, end_time: futureEnd, open_entry: false,
      }})
      if (table === 'museums') return chain({ data: {
        id: MUSEUM_ID, name: 'M', slug: 'm',
        plan: 'institution', stripe_connect_id: 'acct_x', stripe_connect_onboarded: true,
      }})
      if (table === 'ticket_orders') return chain({ data: { id: 'order-1' }, error: null })
      return chain({ data: null })
    })
    mockCreateCheckoutSession.mockResolvedValue({ id: 'cs_test_1', url: 'https://stripe.example/cs_test_1' })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toBe('https://stripe.example/cs_test_1')
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: expect.objectContaining({
          on_behalf_of: 'acct_x',
          transfer_data: { destination: 'acct_x' },
        }),
      }),
    )
  })
})
