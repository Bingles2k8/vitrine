/**
 * Thin shared send path for compliance email.
 *
 * The rest of the codebase constructs `new Resend(...)` inline at nine call
 * sites, writes HTML as template literals, and discards the return value. That
 * is fine for a best-effort notification and not fine for a statutory notice,
 * where we may later have to prove what was sent, when, and to whom.
 *
 * So this module exists to give the compliance emails three things the existing
 * call sites do not have: the provider's message id, a stable hash of the
 * rendered content, and a single place to change the sender.
 *
 * Deliberately NOT a migration of the existing twenty-odd send calls. Rewriting
 * those is unrelated to DMCCA and would bloat the diff. Two paths coexist for
 * now; new compliance email uses this one.
 */

import { createHash } from 'node:crypto'
import { Resend } from 'resend'

/**
 * Sender for compliance email.
 *
 * Currently the same address the rest of the product sends from. There is an
 * argument for a distinct billing@ address so that a customer filtering
 * marketing cannot accidentally filter a statutory notice, but that needs its
 * own Resend domain verification and is not worth splitting until asked.
 */
export const COMPLIANCE_FROM = 'Vitrine <noreply@contact.vitrinecms.com>'

export type SendResult = {
  /** Resend's message id, retained as evidence of dispatch. Null on failure. */
  messageId: string | null
  /** SHA-256 of the exact HTML sent, so the content can be proven later. */
  contentHash: string
  error: string | null
}

/**
 * Escape untrusted text for interpolation into an HTML email.
 *
 * Same implementation as the copies scattered across the cron routes, hoisted
 * so new code has one to import rather than a tenth copy to maintain.
 */
export function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Stable hash of rendered content, used as the evidence fingerprint. */
export function hashContent(html: string): string {
  return createHash('sha256').update(html, 'utf8').digest('hex')
}

/**
 * Send a compliance email and report enough to log it.
 *
 * Never throws. A statutory notice failing to send must be recorded as failed
 * rather than taking down the request that triggered it, because the caller
 * still needs to complete (a cancellation must not fail because an email did).
 * The caller is responsible for writing the outcome to the evidence table and
 * for deciding whether to retry.
 */
export async function sendComplianceEmail(args: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<SendResult> {
  const contentHash = hashContent(args.html)

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { messageId: null, contentHash, error: 'RESEND_API_KEY is not set' }
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: COMPLIANCE_FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    })

    if (error) {
      return { messageId: null, contentHash, error: error.message ?? String(error) }
    }
    return { messageId: data?.id ?? null, contentHash, error: null }
  } catch (err) {
    return {
      messageId: null,
      contentHash,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
