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

/**
 * Creates a mock Supabase client that:
 * - Tracks all .update() calls (accessible via .getUpdatesFor(table))
 * - Returns queued results for .maybySingle() in call order
 */
function makeMockClient(maybySingleResults: Array<{ data: any; error: null }> = []) {
  const updates: Array<{ table: string; data: any }> = []
  let callIndex = 0

  function makeChain(table: string) {
    const chain: any = {}
    chain.select = vi.fn(() => chain)
    chain.update = vi.fn((data: any) => { updates.push({ table, data }); return chain })
    chain.insert = vi.fn(() => chain)
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

  return {
    from: vi.fn((table: string) => makeChain(table)),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    getUpdatesFor: (table: string) =>
      updates.filter(u => u.table === table).map(u => u.data),
  }
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
})
