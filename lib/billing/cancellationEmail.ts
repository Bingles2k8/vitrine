/**
 * Cancellation confirmation email.
 *
 * DMCCA requires a confirmation within one hour of a cancellation, stating when
 * it takes effect, what happens to the customer's data, and how to get it out.
 * It is sent inline from the cancel request rather than queued to a cron, so
 * the one-hour requirement is met by construction rather than by scheduling.
 *
 * Kept separate from the send path so the rendered content can be unit tested
 * without touching Resend.
 */

import { esc } from '@/lib/email/send'
import { formatBillingDate } from './coolingOff'

export type CancellationEmailInput = {
  museumName: string | null
  /** When service actually ends. */
  effectiveAt: string
  mode: 'period_end' | 'immediate'
  /** Days the collection is retained after service ends. */
  retentionDays: number
  /** Smallest currency unit. Zero when no refund is due. */
  refundAmount?: number
  currency?: string | null
  /** Who asked. Support-initiated cancellations say so, so a customer who did
   *  not ask for it can spot it immediately. */
  initiatedBy: 'self_serve' | 'support' | 'stripe_portal'
  siteUrl: string
}

export function renderCancellationEmail(input: CancellationEmailInput): {
  subject: string
  html: string
} {
  const name = input.museumName ?? 'your museum'
  const date = formatBillingDate(input.effectiveAt)
  const exportUrl = `${input.siteUrl}/api/account/export`
  const planUrl = `${input.siteUrl}/dashboard/plan`

  const subject =
    input.mode === 'immediate'
      ? `Your Vitrine subscription has been cancelled`
      : `Your Vitrine subscription will end on ${date}`

  const opening =
    input.mode === 'immediate'
      ? `Your subscription has been cancelled and access ended on ${esc(date)}.`
      : `Your subscription has been cancelled. You keep full access until ${esc(date)}, which is the end of the period you have already paid for. You will not be charged again.`

  const refundLine =
    input.refundAmount && input.refundAmount > 0
      ? `<p style="margin:0 0 16px">A refund of ${esc(formatMoney(input.refundAmount, input.currency))} is on its way back to the card you paid with. Refunds usually take five to ten working days to appear, depending on your bank.</p>`
      : ''

  const supportLine =
    input.initiatedBy === 'support'
      ? `<p style="margin:0 0 16px">This cancellation was actioned by the Vitrine team following a request. If you did not ask for it, reply to this email and we will reverse it.</p>`
      : ''

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#292524;max-width:560px">
  <p style="margin:0 0 16px">Hello,</p>

  <p style="margin:0 0 16px">${opening}</p>

  ${refundLine}
  ${supportLine}

  <h2 style="font-size:16px;margin:24px 0 8px">What happens to your collection</h2>

  <p style="margin:0 0 16px">Nothing is deleted when your subscription ends. The records for ${esc(name)} are kept for <strong>${input.retentionDays} days</strong> after ${esc(date)}, including every image and document you have uploaded. Your public site stops being visible during that time, and you will not be able to add or edit records, but nothing is lost.</p>

  <p style="margin:0 0 16px">We will email you before anything is removed, twice: 30 days before and again 7 days before. If you resubscribe at any point in that window, everything comes back exactly as you left it.</p>

  <h2 style="font-size:16px;margin:24px 0 8px">Taking your data with you</h2>

  <p style="margin:0 0 16px">You can download a complete copy at any time, now or during the retention window. It is a single ZIP file containing every record as a spreadsheet, plus all of your images and documents in their original quality.</p>

  <p style="margin:0 0 24px"><a href="${esc(exportUrl)}" style="display:inline-block;background:#292524;color:#fafaf9;padding:10px 18px;border-radius:6px;text-decoration:none">Download your collection</a></p>

  <p style="margin:0 0 16px">If you would like to restart your subscription, you can do that from <a href="${esc(planUrl)}" style="color:#b45309">your plan page</a>.</p>

  <p style="margin:0 0 16px">If any of this is wrong, or you cancelled by mistake, just reply to this email and we will sort it out.</p>

  <p style="margin:24px 0 0;color:#78716c;font-size:13px">Vitrine</p>
</div>`

  return { subject, html }
}

/** Format a Stripe minor-unit amount for display. */
function formatMoney(minorUnits: number, currency: string | null | undefined): string {
  const code = (currency ?? 'gbp').toUpperCase()
  // Stripe reports zero-decimal currencies in whole units already.
  const zeroDecimal = ['ISK', 'JPY', 'KRW']
  const value = zeroDecimal.includes(code) ? minorUnits : minorUnits / 100
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }).format(value)
  } catch {
    return `${value} ${code}`
  }
}
