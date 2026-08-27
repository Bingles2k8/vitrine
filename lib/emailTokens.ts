import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Signed tokens for one-click email actions (currently re-engagement
 * unsubscribe). The recipient must be able to act straight from the email, so
 * the link cannot require a login — the signature is what proves the link came
 * from us and names a subject the sender chose, not one the reader typed.
 *
 * Keyed off SUPABASE_SERVICE_ROLE_KEY rather than a bespoke secret: it is
 * server-only, always present wherever these emails are sent, and needs no new
 * environment variable. (CRON_SECRET going unset for months is precisely the
 * failure this avoids.)
 *
 * No expiry: an unsubscribe link must keep working for as long as the email
 * exists in someone's inbox.
 *
 * Three purposes, because there are three different things to unsubscribe from
 * and they are stored in three ways:
 *
 *   reengage-unsubscribe   museums.reengage_opt_out — an owner, "come back"
 *   account-unsubscribe    account_email_opt_outs   — an abandoned signup
 *   reminders-unsubscribe  museums.reminder_opt_out — an owner, "this is overdue"
 *
 * The purpose string is inside the signature, so a token issued for one can
 * never be replayed as a token for another even though all three payloads are
 * uuids and two of them name the very same museum. Without it, unsubscribing
 * from re-engagement mail would also silently switch off overdue-loan alerts.
 */

const MUSEUM_PURPOSE = 'reengage-unsubscribe'
const USER_PURPOSE = 'account-unsubscribe'
const REMINDER_PURPOSE = 'reminders-unsubscribe'

function key(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to sign email tokens')
  return secret
}

function b64url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function sign(purpose: string, payload: string): string {
  return createHmac('sha256', key()).update(`${purpose}:${payload}`).digest('base64url')
}

/** `<base64url(id)>.<hmac>` */
function signToken(purpose: string, id: string): string {
  const payload = b64url(id)
  return `${payload}.${sign(purpose, payload)}`
}

/** Returns the id, or null if the token is missing, malformed or forged. */
function verifyToken(purpose: string, token: string | null | undefined): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, signature] = parts
  if (!payload || !signature) return null

  let expected: Buffer
  let actual: Buffer
  try {
    expected = Buffer.from(sign(purpose, payload), 'utf8')
    actual = Buffer.from(signature, 'utf8')
  } catch {
    return null
  }
  if (expected.length !== actual.length) return null
  if (!timingSafeEqual(expected, actual)) return null

  try {
    const id = Buffer.from(payload, 'base64url').toString('utf8')
    return id || null
  } catch {
    return null
  }
}

/** Unsubscribe token naming a museum, whose owner's opt-out is a column on it. */
export function signUnsubscribeToken(museumId: string): string {
  return signToken(MUSEUM_PURPOSE, museumId)
}

/** Returns the museum id, or null if the token is missing, malformed or forged. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  return verifyToken(MUSEUM_PURPOSE, token)
}

/**
 * Unsubscribe token naming a user directly, for a recipient with no museum
 * row. Distinct purpose, so this is not interchangeable with the museum token.
 */
export function signUserUnsubscribeToken(userId: string): string {
  return signToken(USER_PURPOSE, userId)
}

/** Returns the user id, or null if the token is missing, malformed or forged. */
export function verifyUserUnsubscribeToken(token: string | null | undefined): string | null {
  return verifyToken(USER_PURPOSE, token)
}

/**
 * Unsubscribe token for the reminder emails (compliance digest, overdue loans),
 * whose opt-out is `museums.reminder_opt_out`.
 */
export function signReminderUnsubscribeToken(museumId: string): string {
  return signToken(REMINDER_PURPOSE, museumId)
}

/** Returns the museum id, or null if the token is missing, malformed or forged. */
export function verifyReminderUnsubscribeToken(token: string | null | undefined): string | null {
  return verifyToken(REMINDER_PURPOSE, token)
}
