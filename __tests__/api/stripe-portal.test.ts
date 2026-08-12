import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Regression cover for the billing portal route.
 *
 * Reported symptom: clicking "Manage subscription" produced a bare
 * "Something went wrong". Cause: the museum held a Stripe customer id from a
 * different Stripe account, Stripe threw "No such customer", and the route had
 * no try/catch. Next returned an HTML 500, the client's res.json() threw, and
 * the real cause never reached anyone.
 *
 * These assert the route now answers with JSON and a useful message on every
 * path, so a Stripe failure can never again surface as an unparseable 500.
 */

// vi.mock is hoisted above ordinary declarations, so the mocks its factories
// close over have to be hoisted too.
const { portalCreate, getUser, maybeSingle } = vi.hoisted(() => ({
  portalCreate: vi.fn(),
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: { billingPortal: { sessions: { create: portalCreate } } },
}))

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {},
  rateLimit: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/supabase-server', () => ({
  createServerSideClient: vi.fn().mockResolvedValue({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}))

import { POST } from '@/app/api/stripe/portal/route'

describe('POST /api/stripe/portal', () => {
  beforeEach(() => {
    portalCreate.mockReset()
    getUser.mockReset()
    maybeSingle.mockReset()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    maybeSingle.mockResolvedValue({ data: { stripe_customer_id: 'cus_x', owner_id: 'user-1' } })
  })

  it('returns the portal url when Stripe accepts', async () => {
    portalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/session/abc' })

    const res = await POST()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ url: 'https://billing.stripe.com/session/abc' })
  })

  it('rejects an unauthenticated caller', async () => {
    getUser.mockResolvedValue({ data: { user: null } })

    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('explains plainly when there is no billing account yet', async () => {
    maybeSingle.mockResolvedValue({ data: { stripe_customer_id: null, owner_id: 'user-1' } })

    const res = await POST()
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: 'No billing account found' })
  })

  it('does not throw when Stripe does not recognise the customer', async () => {
    // The exact production failure. It must return parseable JSON, not a 500.
    portalCreate.mockRejectedValue(new Error("No such customer: 'cus_x'"))

    const res = await POST()
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.error).toMatch(/out of date/i)
    // Says whose fault it is, so nobody wastes time retrying.
    expect(body.error).toMatch(/our side/i)
    expect(body.error).not.toMatch(/something went wrong/i)
  })

  it('degrades gracefully on any other Stripe failure', async () => {
    portalCreate.mockRejectedValue(new Error('Stripe is having a bad day'))

    const res = await POST()
    expect(res.status).toBe(502)

    const body = await res.json()
    expect(body.error).toMatch(/try again/i)
    // Never leak Stripe's internals to a customer.
    expect(body.error).not.toMatch(/bad day/i)
  })

  it('always answers with JSON, whatever Stripe does', async () => {
    for (const failure of [
      new Error("No such customer: 'cus_x'"),
      new Error('rate limited'),
      'a thrown string',
    ]) {
      portalCreate.mockRejectedValue(failure)
      const res = await POST()
      await expect(res.json()).resolves.toHaveProperty('error')
    }
  })
})
