import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed tokens for one-click email actions (currently re-engagement
 * unsubscribe). The recipient must be able to act straight from the email, so
 * the link cannot require a login — the signature is what proves the link came
 * from us and names a museum the sender chose, not one the reader typed.
 *
 * Keyed off SUPABASE_SERVICE_ROLE_KEY rather than a bespoke secret: it is
 * server-only, always present wherever these emails are sent, and needs no new
 * environment variable. (CRON_SECRET going unset for months is precisely the
 * failure this avoids.)
 *
 * No expiry: an unsubscribe link must keep working for as long as the email
 * exists in someone's inbox.
 */

const PURPOSE = 'reengage-unsubscribe'

function key(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to sign email tokens')
  return secret
}

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function sign(payload: string): string {
  return createHmac('sha256', key()).update(`${PURPOSE}:${payload}`).digest('base64url')
}

/** `<base64url(museumId)>.<hmac>` */
export function signUnsubscribeToken(museumId: string): string {
  const payload = b64url(museumId)
  return `${payload}.${sign(payload)}`
}

/** Returns the museum id, or null if the token is missing, malformed or forged. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  if (!payload || !signature) return null

  let expected: Buffer
  let actual: Buffer
  try {
    expected = Buffer.from(sign(payload), 'utf8')
    actual = Buffer.from(signature, 'utf8')
  } catch {
    return null
  }
  if (expected.length !== actual.length) return null
  if (!timingSafeEqual(expected, actual)) return null

  try {
    const museumId = Buffer.from(payload, 'base64url').toString('utf8')
    return museumId || null
  } catch {
    return null
  }
}
