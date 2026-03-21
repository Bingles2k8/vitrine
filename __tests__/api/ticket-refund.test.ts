import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/ticket-refund/route'
import { stripe } from '@/lib/stripe'

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/stripe', () => ({
  stripe: {
    refunds: {
      create: vi.fn().mockResolvedValue({ id: 're_test' }),
    },
    paymentIntents: {
      retrieve: vi.fn().mockResolvedValue({
        latest_charge: {
          balance_transaction: { fee: 36 }, // £0.36 Stripe processing fee
        },
      }),
    },
  },
}))

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {},
  rateLimit: vi.fn().mockResolvedValue(null), // null = not rate-limited
}))

// Mock server-side Supabase client — configured per-test via mockSupabaseClient
let mockSupabaseClient: ReturnType<typeof makeMockClient>
vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}))

// ── Mock helpers ──────────────────────────────────────────────────────────────

interface MockClientOpts {
  user?: { id: string } | null
  ownedMuseum?: { id: string } | null
  adminStaff?: { museum_id: string } | null
  order?: object | null
}

/**
 * Builds a mock Supabase client that returns the provided data for each
 * .maybeSingle() call in order, and tracks .update() calls.
 */
function makeMockClient(opts: MockClientOpts = {}) {
  const {
    user = { id: 'user-uuid' },
    ownedMuseum = { id: 'museum-uuid' },
    adminStaff = null,
    order = null,
  } = opts

  const updates: Array<{ table: string; data: any }> = []
  let maybySingleQueue: Array<{ data: any; error: null }>

  function buildQueue() {
    // Queue order: auth.getUser, museums (owner check), staff_members (if no owned museum), ticket_orders
    if (ownedMuseum) {
      return [
        { data: ownedMuseum, error: null },     // museums owner check
        { data: order, error: null },            // ticket_orders
      ]
    }
    return [
      { data: null, error: null },              // museums owner check (not owner)
      { data: adminStaff, error: null },        // staff_members Admin check
      { data: order, error: null },             // ticket_orders
    ]
  }

  maybySingleQueue = buildQueue()
  let callIndex = 0

  function makeChain(table: string) {
    const chain: any = {}
    chain.select = vi.fn(() => chain)
    chain.update = vi.fn((data: any) => { updates.push({ table, data }); return chain })
    chain.eq = vi.fn(() => chain)
    chain.maybeSingle = vi.fn(() => Promise.resolve(maybySingleQueue[callIndex++] ?? { data: null, error: null }))
    return chain
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn((table: string) => makeChain(table)),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    getUpdatesFor: (table: string) => updates.filter(u => u.table === table).map(u => u.data),
  }
}

function makeRequest(body: object) {
  return new Request('http://localhost/api/ticket-refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const baseOrder = {
  id: 'order-uuid',
  museum_id: 'museum-uuid',
  slot_id: 'slot-uuid',
  quantity: 2,
  amount_cents: 1000,
  platform_fee_cents: 60,
  status: 'completed',
  stripe_payment_intent_id: 'pi_test',
}

const freeOrder = {
  ...baseOrder,
  amount_cents: 0,
  platform_fee_cents: 0,
  stripe_payment_intent_id: null,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/ticket-refund', () => {
  const stripeRefundsCreate = vi.mocked(stripe.refunds.create)

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = makeMockClient({ order: baseOrder })
  })

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    mockSupabaseClient = makeMockClient({ user: null, order: baseOrder })
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is Editor-level staff (not owner or Admin)', async () => {
    mockSupabaseClient = makeMockClient({
      ownedMuseum: null,
      adminStaff: null, // no Admin access either
      order: baseOrder,
    })
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))
    expect(res.status).toBe(403)
  })

  it('allows Admin-level staff to issue a refund', async () => {
    mockSupabaseClient = makeMockClient({
      ownedMuseum: null,
      adminStaff: { museum_id: 'museum-uuid' },
      order: baseOrder,
    })
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))
    expect(res.status).toBe(200)
  })

  // ── Input validation ──────────────────────────────────────────────────────

  it('returns 400 when order_id is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  // ── Order guards ──────────────────────────────────────────────────────────

  it('returns 404 when order is not found', async () => {
    mockSupabaseClient = makeMockClient({ order: null })
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))
    expect(res.status).toBe(404)
  })

  it('returns 409 when order is already cancelled', async () => {
    mockSupabaseClient = makeMockClient({ order: { ...baseOrder, status: 'cancelled' } })
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))
    expect(res.status).toBe(409)
  })

  // ── Paid order refund ─────────────────────────────────────────────────────

  it('issues a Stripe refund for amount_cents minus platform_fee_cents minus Stripe processing fee', async () => {
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))

    expect(res.status).toBe(200)
    expect(stripeRefundsCreate).toHaveBeenCalledOnce()
    expect(stripeRefundsCreate).toHaveBeenCalledWith({
      payment_intent: 'pi_test',
      amount: 904, // 1000 (ticket price) - 60 (platform fee) - 36 (Stripe fee) = 904
    })
  })

  it('cancels the order and marks tickets as refunded', async () => {
    await POST(makeRequest({ order_id: 'order-uuid' }))

    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'cancelled')
    ).toBe(true)
    expect(
      mockSupabaseClient.getUpdatesFor('tickets').some(u => u.status === 'refunded')
    ).toBe(true)
  })

  it('releases slot capacity via decrement_slot_bookings RPC', async () => {
    await POST(makeRequest({ order_id: 'order-uuid' }))

    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'decrement_slot_bookings',
      { slot_uuid: 'slot-uuid', qty: 2 }
    )
  })

  // ── Free order cancellation ───────────────────────────────────────────────

  it('skips Stripe for free orders and still cancels + releases slot', async () => {
    mockSupabaseClient = makeMockClient({ order: freeOrder })
    const res = await POST(makeRequest({ order_id: 'order-uuid' }))

    expect(res.status).toBe(200)
    expect(stripeRefundsCreate).not.toHaveBeenCalled()
    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'cancelled')
    ).toBe(true)
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'decrement_slot_bookings',
      { slot_uuid: 'slot-uuid', qty: 2 }
    )
  })
})
