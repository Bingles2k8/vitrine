import { describe, it, expect, beforeAll } from 'vitest'
import {
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  signUserUnsubscribeToken,
  verifyUserUnsubscribeToken,
  signReminderUnsubscribeToken,
  verifyReminderUnsubscribeToken,
} from '@/lib/emailTokens'

const MUSEUM = 'cff7a5a0-4f1c-4c7a-9062-7ac3df604c5d'

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
})

describe('unsubscribe tokens', () => {
  it('round-trips the museum id', () => {
    expect(verifyUnsubscribeToken(signUnsubscribeToken(MUSEUM))).toBe(MUSEUM)
  })

  it('is stable, so a link keeps working for as long as the email exists', () => {
    expect(signUnsubscribeToken(MUSEUM)).toBe(signUnsubscribeToken(MUSEUM))
  })

  it('gives each museum a distinct token', () => {
    expect(signUnsubscribeToken('museum-a')).not.toBe(signUnsubscribeToken('museum-b'))
  })

  it('produces a URL-safe token', () => {
    expect(signUnsubscribeToken(MUSEUM)).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
  })

  it('rejects a token whose payload was swapped for another museum', () => {
    // The attack: take a valid token, substitute someone else's museum id.
    const victim = Buffer.from('another-museum', 'utf8').toString('base64url')
    const signature = signUnsubscribeToken(MUSEUM).split('.')[1]
    expect(verifyUnsubscribeToken(`${victim}.${signature}`)).toBeNull()
  })

  it('rejects a tampered signature', () => {
    const [payload] = signUnsubscribeToken(MUSEUM).split('.')
    expect(verifyUnsubscribeToken(`${payload}.deadbeef`)).toBeNull()
  })

  it('rejects unsigned, malformed and empty tokens', () => {
    expect(verifyUnsubscribeToken(Buffer.from(MUSEUM).toString('base64url'))).toBeNull()
    expect(verifyUnsubscribeToken('not.a.real.token')).toBeNull()
    expect(verifyUnsubscribeToken('')).toBeNull()
    expect(verifyUnsubscribeToken(null)).toBeNull()
    expect(verifyUnsubscribeToken(undefined)).toBeNull()
  })

  it('rejects a token signed with a different key', () => {
    const token = signUnsubscribeToken(MUSEUM)
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'a-different-key'
    try {
      expect(verifyUnsubscribeToken(token)).toBeNull()
    } finally {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    }
  })
})

describe('user unsubscribe tokens', () => {
  const USER = '8e3f1c22-91b7-4a10-bd5e-2c9a4f0d6b31'

  it('round-trips the user id', () => {
    expect(verifyUserUnsubscribeToken(signUserUnsubscribeToken(USER))).toBe(USER)
  })

  it('is stable, so a link keeps working for as long as the email exists', () => {
    expect(signUserUnsubscribeToken(USER)).toBe(signUserUnsubscribeToken(USER))
  })

  // The reason the two purposes are signed separately. A museum id and a user
  // id are both uuids, so without the purpose in the HMAC a token issued to
  // unsubscribe a museum would verify as one naming the user of the same id.
  it('does not verify a museum token as a user token, or the reverse', () => {
    expect(verifyUserUnsubscribeToken(signUnsubscribeToken(USER))).toBeNull()
    expect(verifyUnsubscribeToken(signUserUnsubscribeToken(USER))).toBeNull()
  })

  it('gives the same id a different token under each purpose', () => {
    expect(signUserUnsubscribeToken(USER)).not.toBe(signUnsubscribeToken(USER))
  })

  it('rejects a tampered signature', () => {
    const [payload] = signUserUnsubscribeToken(USER).split('.')
    expect(verifyUserUnsubscribeToken(`${payload}.deadbeef`)).toBeNull()
  })
})

describe('reminder unsubscribe tokens', () => {
  it('round-trips the museum id', () => {
    expect(verifyReminderUnsubscribeToken(signReminderUnsubscribeToken(MUSEUM))).toBe(MUSEUM)
  })

  it('is stable, so a link keeps working for as long as the email exists', () => {
    expect(signReminderUnsubscribeToken(MUSEUM)).toBe(signReminderUnsubscribeToken(MUSEUM))
  })

  it('rejects a tampered signature', () => {
    const [payload] = signReminderUnsubscribeToken(MUSEUM).split('.')
    expect(verifyReminderUnsubscribeToken(`${payload}.deadbeef`)).toBeNull()
  })
})

// The property the whole three-purpose design exists for. Every payload is a
// uuid and two of the three name the SAME museum, so without the purpose inside
// the HMAC these tokens would be interchangeable — and unsubscribing from "come
// back to Vitrine" mail would also silently switch off the overdue-loan alerts
// that tell someone an object never came home.
describe('the three purposes are not interchangeable', () => {
  const USER = '8e3f1c22-91b7-4a10-bd5e-2c9a4f0d6b31'

  const issued = {
    reengage: signUnsubscribeToken(MUSEUM),
    reminders: signReminderUnsubscribeToken(MUSEUM),
    account: signUserUnsubscribeToken(MUSEUM),
  }

  const verifiers = {
    reengage: verifyUnsubscribeToken,
    reminders: verifyReminderUnsubscribeToken,
    account: verifyUserUnsubscribeToken,
  }

  for (const [issuedAs, token] of Object.entries(issued)) {
    for (const [verifiedAs, verify] of Object.entries(verifiers)) {
      const shouldPass = issuedAs === verifiedAs
      it(`a ${issuedAs} token ${shouldPass ? 'verifies' : 'does not verify'} as ${verifiedAs}`, () => {
        expect(verify(token)).toBe(shouldPass ? MUSEUM : null)
      })
    }
  }

  it('gives the same id three different tokens', () => {
    const all = new Set([
      signUnsubscribeToken(USER),
      signReminderUnsubscribeToken(USER),
      signUserUnsubscribeToken(USER),
    ])
    expect(all.size).toBe(3)
  })
})
