import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// A museum inside a cooling-off read-only window: cancelled, writes refused.
const readOnlyUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: () => Promise.resolve({ data: { read_only_until: readOnlyUntil, locked_at: null } }),
    }
    return {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'owner-1' } } }) },
      from: () => chain,
    }
  }),
}))

import { middleware } from '@/middleware'

function post(path: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { origin: 'http://localhost', host: 'localhost' },
  })
}

describe('middleware read-only gate', () => {
  beforeEach(() => {
    delete process.env.BETA_PASSWORD
  })

  it('refuses ordinary writes while the account is read-only', async () => {
    const res = await middleware(post('/api/objects'))
    expect(res.status).toBe(403)
  })

  it('lets a read-only customer start a checkout to resubscribe', async () => {
    const res = await middleware(post('/api/stripe/checkout'))
    expect(res.status).not.toBe(403)
  })

  it('lets a read-only customer open the billing portal', async () => {
    const res = await middleware(post('/api/stripe/portal'))
    expect(res.status).not.toBe(403)
  })
})
