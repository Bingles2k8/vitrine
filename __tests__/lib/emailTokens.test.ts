import { describe, it, expect, beforeAll } from 'vitest'
import { signUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/emailTokens'

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
