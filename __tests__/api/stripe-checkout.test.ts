import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Checkout must not start a subscription on a museum we already give a paid
 * plan to free. The owner would be charged for what they get for nothing.
 */

const { getUser, maybeSingle, customersCreate, sessionsCreate } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
  customersCreate: vi.fn(),
  sessionsCreate: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: { create: customersCreate },
    checkout: { sessions: { create: sessionsCreate } },
  },
  STRIPE_PRICE_MAP: { hobbyist: 'price_hob', professional: 'price_pro', institution: 'price_inst' },
}))

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {},
  rateLimit: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => undefined }),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn().mockResolvedValue({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))

import { POST } from '@/app/api/stripe/checkout/route'

function request(body: object) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/stripe/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'owner@example.org' } } })
  })

  it('refuses a museum on a complimentary plan, before touching Stripe', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: 'museum-1',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        owner_id: 'user-1',
        trial_used_at: null,
        ever_paid: false,
        complimentary_plan: 'hobbyist',
      },
    })

    const res = await POST(request({ planId: 'professional' }))

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringMatching(/complimentary/) })
    expect(customersCreate).not.toHaveBeenCalled()
    expect(sessionsCreate).not.toHaveBeenCalled()
  })
})
