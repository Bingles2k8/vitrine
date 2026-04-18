import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/stripe/webhook/route'
import { stripe } from '@/lib/stripe'

// ── Module mocks ────────────────────────────────────────────────────────────

// Mock our stripe module so we can control constructEvent without real signatures
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptionSchedules: {
      retrieve: vi.fn().mockResolvedValue({ phases: [] }),
    },
  },
  PRICE_TO_PLAN: {}, // empty — tests use metadata.plan_id as fallback
}))

// vi.hoisted ensures mockEmailSend is available both in the mock factory
// and in test assertions (vi.mock factories run before top-level code)
const { mockEmailSend } = vi.hoisted(() => ({
  mockEmailSend: vi.fn().mockResolvedValue({ id: 'email-1' }),
}))

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockEmailSend }
  },
}))

// Mock the Supabase client — configured per-test via mockSupabaseClient
let mockSupabaseClient: ReturnType<typeof makeMockClient>
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// ── Mock helpers ─────────────────────────────────────────────────────────────

interface MockClientOpts {
  /** Queued return values for .maybySingle() calls, in order */
  maybySingleResults?: Array<{ data: any; error: null }>
  /** Value returned for the tickets count query (default 0 = no existing tickets) */
  ticketCount?: number
  /** Return value for supabase.rpc() — controls slot capacity check (default true = capacity available) */
  rpcResult?: boolean
  /** If set, tickets.insert() resolves with this error instead of succeeding */
  ticketInsertError?: any
}

/**
 * Creates a mock Supabase client that:
 * - Tracks all .update() and .insert() calls (accessible via .getUpdatesFor / .getInsertsFor)
 * - Returns queued results for .maybySingle() in call order
 * - Exposes chain.count for count queries (used by the tickets idempotency check)
 */
function makeMockClient(
  maybySingleResults: Array<{ data: any; error: null }> = [],
  opts: MockClientOpts = {}
) {
  const { ticketCount = 0, rpcResult = true, ticketInsertError } = opts
  const updates: Array<{ table: string; data: any }> = []
  const inserts: Array<{ table: string; data: any }> = []
  let callIndex = 0

  function makeChain(table: string) {
    const chain: any = {}
    // Expose count as a plain property so `await chain` resolves with it.
    // Used by the tickets idempotency check: const { count } = await supabase.from('tickets')...
    chain.count = table === 'tickets' ? ticketCount : undefined
    chain.error = null
    chain.select = vi.fn(() => chain)
    chain.update = vi.fn((data: any) => { updates.push({ table, data }); return chain })
    chain.insert = vi.fn((data: any) => {
      if (table === 'tickets' && ticketInsertError) {
        // Return a plain object with an error so the handler's destructure picks it up
        return { error: ticketInsertError }
      }
      inserts.push({ table, data })
      return chain
    })
    chain.delete = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.neq = vi.fn(() => chain)
    chain.is = vi.fn(() => chain)
    chain.in = vi.fn(() => chain)
    chain.order = vi.fn(() => chain)
    chain.maybeSingle = vi.fn(() =>
      Promise.resolve(maybySingleResults[callIndex++] ?? { data: null, error: null })
    )
    chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }))
    return chain
  }

  const client = {
    from: vi.fn((table: string) => makeChain(table)),
    rpc: vi.fn().mockResolvedValue({ data: rpcResult, error: null }),
    getUpdatesFor: (table: string) =>
      updates.filter(u => u.table === table).map(u => u.data),
    getInsertsFor: (table: string) =>
      inserts.filter(i => i.table === table).map(i => i.data),
  }
  return client
}

/** Builds a fake Request with a stripe-signature header */
function makeRequest(event: object) {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-sig' },
    body: JSON.stringify(event),
  })
}

/** Builds a fake Stripe subscription object */
function makeSub(overrides: any = {}) {
  return {
    id: 'sub_test',
    customer: 'cus_test',
    status: 'active',
    cancel_at_period_end: false,
    schedule: null,
    cancel_at: null,
    metadata: { museum_id: 'museum-uuid', plan_id: 'professional' },
    items: {
      data: [{ price: { id: 'price_pro' }, current_period_end: 9999999999 }],
    },
    ...overrides,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/stripe/webhook', () => {
  const constructEvent = vi.mocked(stripe.webhooks.constructEvent)

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseClient = makeMockClient()
  })

  // ── Signature validation ──────────────────────────────────────────────────

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature verification fails', async () => {
    constructEvent.mockImplementation(() => { throw new Error('Bad signature') })
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  // ── subscription.updated / created ───────────────────────────────────────

  it('activates the correct plan when subscription becomes active', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { id: 'museum-uuid' }, error: null }, // museum verification passes
    ])
    constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: makeSub() },
    } as any)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(200)
    const updates = mockSupabaseClient.getUpdatesFor('museums')
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ plan: 'professional', ui_mode: 'full' })
  })

  it('clears any pending downgrade when subscription activates', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { id: 'museum-uuid' }, error: null },
    ])
    constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: makeSub() },
    } as any)

    await POST(makeRequest({}))

    const updates = mockSupabaseClient.getUpdatesFor('museums')
    expect(updates[0]).toMatchObject({
      pending_downgrade_plan: null,
      pending_downgrade_date: null,
    })
  })

  it('does nothing when museum_id is missing from subscription metadata', async () => {
    constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: makeSub({ metadata: {} }) },
    } as any)

    await POST(makeRequest({}))

    expect(mockSupabaseClient.getUpdatesFor('museums')).toHaveLength(0)
  })

  it('does not update plan when stripe_customer_id does not match (prevents metadata spoofing)', async () => {
    // Verification query returns null — museum ID exists but customer ID doesn't match
    mockSupabaseClient = makeMockClient([
      { data: null, error: null },
    ])
    constructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: { object: makeSub() },
    } as any)

    await POST(makeRequest({}))

    expect(mockSupabaseClient.getUpdatesFor('museums')).toHaveLength(0)
  })

  // ── subscription.deleted ─────────────────────────────────────────────────

  it('downgrades museum to community when subscription is deleted', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { id: 'museum-uuid' }, error: null },
    ])
    constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: makeSub() },
    } as any)

    await POST(makeRequest({}))

    const updates = mockSupabaseClient.getUpdatesFor('museums')
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({
      plan: 'community',
      ui_mode: 'simple',
      stripe_subscription_id: null,
      payment_past_due: false,
    })
  })

  // ── invoice.payment_failed ───────────────────────────────────────────────

  it('marks payment past due and sends email on first failed payment', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { payment_past_due: false }, error: null }, // idempotency check
    ])
    constructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_test',
          customer_email: 'owner@museum.com',
        },
      },
    } as any)

    await POST(makeRequest({}))

    const updates = mockSupabaseClient.getUpdatesFor('museums')
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ payment_past_due: true })
    expect(mockEmailSend).toHaveBeenCalledOnce()
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'owner@museum.com' })
    )
  })

  it('does not send a duplicate email if payment is already marked past due', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { payment_past_due: true }, error: null }, // already flagged
    ])
    constructEvent.mockReturnValue({
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_test',
          customer_email: 'owner@museum.com',
        },
      },
    } as any)

    await POST(makeRequest({}))

    expect(mockSupabaseClient.getUpdatesFor('museums')).toHaveLength(0)
    expect(mockEmailSend).not.toHaveBeenCalled()
  })

  // ── invoice.payment_succeeded ────────────────────────────────────────────

  it('clears payment_past_due flag when payment succeeds', async () => {
    constructEvent.mockReturnValue({
      type: 'invoice.payment_succeeded',
      data: { object: { customer: 'cus_test' } },
    } as any)

    await POST(makeRequest({}))

    const updates = mockSupabaseClient.getUpdatesFor('museums')
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({ payment_past_due: false })
  })

  // ── checkout.session.completed — ticket orders ────────────────────────────

  const baseOrder = {
    id: 'order-uuid',
    quantity: 2,
    slot_id: 'slot-uuid',
    event_id: 'event-uuid',
    buyer_name: 'Jane Smith',
    buyer_email: 'jane@museum.com',
    status: 'pending',
  }

  function makeTicketSession(overrides: any = {}) {
    return {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test',
          mode: 'payment',
          payment_intent: 'pi_test',
          customer: null,
          subscription: null,
          metadata: { order_id: 'order-uuid', museum_id: 'museum-uuid' },
          ...overrides,
        },
      },
    }
  }

  it('generates the correct number of tickets and marks order completed', async () => {
    // maybySingle queue: order fetch, then 3 Promise.all queries (events/slots/museums)
    mockSupabaseClient = makeMockClient(
      [
        { data: baseOrder, error: null },
        { data: null, error: null }, // events
        { data: null, error: null }, // event_time_slots
        { data: null, error: null }, // museums
      ],
      { ticketCount: 0, rpcResult: true }
    )
    constructEvent.mockReturnValue(makeTicketSession() as any)

    await POST(makeRequest({}))

    // One insert call with an array of quantity=2 ticket records
    const ticketInserts = mockSupabaseClient.getInsertsFor('tickets')
    expect(ticketInserts).toHaveLength(1)
    expect(ticketInserts[0]).toHaveLength(2)
    expect(ticketInserts[0][0]).toMatchObject({ order_id: 'order-uuid', status: 'valid' })

    // Order marked completed
    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'completed')
    ).toBe(true)
  })

  it('sends a confirmation email when event title is available', async () => {
    mockSupabaseClient = makeMockClient(
      [
        { data: baseOrder, error: null },
        { data: { title: 'Summer Exhibition' }, error: null }, // events
        { data: null, error: null },                           // event_time_slots
        { data: null, error: null },                           // museums
      ],
      { ticketCount: 0, rpcResult: true }
    )
    constructEvent.mockReturnValue(makeTicketSession() as any)

    await POST(makeRequest({}))

    expect(mockEmailSend).toHaveBeenCalledOnce()
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@museum.com',
        subject: 'Your tickets for Summer Exhibition',
      })
    )
  })

  it('skips ticket generation and marks order completed when tickets already exist (idempotency guard)', async () => {
    mockSupabaseClient = makeMockClient(
      [{ data: baseOrder, error: null }],
      { ticketCount: 2 } // already generated on a previous webhook delivery
    )
    constructEvent.mockReturnValue(makeTicketSession() as any)

    await POST(makeRequest({}))

    expect(mockSupabaseClient.getInsertsFor('tickets')).toHaveLength(0)
    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'completed')
    ).toBe(true)
  })

  it('cancels order when slot is at capacity', async () => {
    mockSupabaseClient = makeMockClient(
      [{ data: baseOrder, error: null }],
      { ticketCount: 0, rpcResult: false } // increment_slot_bookings returns false
    )
    constructEvent.mockReturnValue(makeTicketSession() as any)

    await POST(makeRequest({}))

    expect(mockSupabaseClient.getInsertsFor('tickets')).toHaveLength(0)
    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'cancelled')
    ).toBe(true)
  })

  it('releases slot capacity and returns 500 when ticket insert fails (so Stripe retries)', async () => {
    mockSupabaseClient = makeMockClient(
      [{ data: baseOrder, error: null }],
      { ticketCount: 0, rpcResult: true, ticketInsertError: { message: 'DB error' } }
    )
    constructEvent.mockReturnValue(makeTicketSession() as any)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(500)
    // rpc called twice: increment (before insert) then decrement (capacity rollback)
    expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2)
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'decrement_slot_bookings',
      expect.objectContaining({ slot_uuid: 'slot-uuid', qty: 2 })
    )
  })

  // ── charge.refunded ───────────────────────────────────────────────────────

  it('cancels order, marks tickets refunded, and releases slot capacity on full refund', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { id: 'order-uuid', slot_id: 'slot-uuid', quantity: 2 }, error: null },
    ])
    constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: {
        object: {
          amount: 2000,
          amount_refunded: 2000,
          payment_intent: 'pi_test',
        },
      },
    } as any)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(200)
    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'cancelled')
    ).toBe(true)
    expect(
      mockSupabaseClient.getUpdatesFor('tickets').some(u => u.status === 'refunded')
    ).toBe(true)
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'decrement_slot_bookings',
      { slot_uuid: 'slot-uuid', qty: 2 }
    )
  })

  it('rejects refund when charge.on_behalf_of does not match the order museum', async () => {
    mockSupabaseClient = makeMockClient([
      // first maybeSingle: ticket_orders lookup → order found
      { data: { id: 'order-uuid', slot_id: 'slot-uuid', quantity: 2, museum_id: 'museum-uuid' }, error: null },
      // second maybeSingle: museums cross-check → null (mismatch)
      { data: null, error: null },
    ])
    constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: {
        object: {
          amount: 2000,
          amount_refunded: 2000,
          payment_intent: 'pi_test',
          on_behalf_of: 'acct_foreign',
        },
      },
    } as any)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(200)
    // No state changes should have occurred
    expect(mockSupabaseClient.getUpdatesFor('ticket_orders')).toHaveLength(0)
    expect(mockSupabaseClient.getUpdatesFor('tickets')).toHaveLength(0)
    expect(mockSupabaseClient.rpc).not.toHaveBeenCalled()
  })

  it('proceeds with refund when charge.on_behalf_of matches the order museum', async () => {
    mockSupabaseClient = makeMockClient([
      { data: { id: 'order-uuid', slot_id: 'slot-uuid', quantity: 2, museum_id: 'museum-uuid' }, error: null },
      { data: { id: 'museum-uuid' }, error: null }, // cross-check passes
    ])
    constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: {
        object: {
          amount: 2000,
          amount_refunded: 2000,
          payment_intent: 'pi_test',
          on_behalf_of: 'acct_ours',
        },
      },
    } as any)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(200)
    expect(
      mockSupabaseClient.getUpdatesFor('ticket_orders').some(u => u.status === 'cancelled')
    ).toBe(true)
    expect(
      mockSupabaseClient.getUpdatesFor('tickets').some(u => u.status === 'refunded')
    ).toBe(true)
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'decrement_slot_bookings',
      { slot_uuid: 'slot-uuid', qty: 2 }
    )
  })

  it('ignores partial refunds', async () => {
    constructEvent.mockReturnValue({
      type: 'charge.refunded',
      data: {
        object: {
          amount: 2000,
          amount_refunded: 1000, // partial
          payment_intent: 'pi_test',
        },
      },
    } as any)

    const res = await POST(makeRequest({}))

    expect(res.status).toBe(200)
    expect(mockSupabaseClient.getUpdatesFor('ticket_orders')).toHaveLength(0)
  })
})
