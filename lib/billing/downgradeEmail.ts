/**
 * Emails for a museum that has dropped to Community.
 *
 * Two of them: the notice sent the moment the paid plan ends, and the
 * reminders sent 30 and 7 days before anything over Community's limits is
 * deleted. Both state exactly what will go, when, and the two ways to keep
 * it: resubscribe, or download a copy.
 *
 * Pure renderers, kept apart from the send path so the content can be tested.
 */

import { esc } from '@/lib/email/send'
import { formatBillingDate } from './coolingOff'

type Common = {
  museumName: string | null
  /** From describeOverage. Empty when everything fits within Community. */
  overageLines: string[]
  /** When the over-limit data is deleted. Null when nothing is over. */
  purgeAt: string | null
  siteUrl: string
}

const WRAP_OPEN = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#292524;max-width:560px">`
const WRAP_CLOSE = `<p style="margin:24px 0 0;color:#78716c;font-size:13px">Vitrine</p>
</div>`

function list(lines: string[]): string {
  return `<ul style="margin:0 0 16px;padding-left:20px">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`
}

function button(href: string, label: string): string {
  return `<p style="margin:0 0 24px"><a href="${esc(href)}" style="display:inline-block;background:#292524;color:#fafaf9;padding:10px 18px;border-radius:6px;text-decoration:none">${esc(label)}</a></p>`
}

/** Sent when the subscription or trial ends and the museum moves to Community. */
export function renderDowngradeEmail(input: Common & {
  /** True if the museum only ever trialled. */
  trialOnly: boolean
}): { subject: string; html: string } {
  const name = input.museumName ?? 'your museum'
  const planUrl = `${input.siteUrl}/dashboard/plan`
  const exportUrl = `${input.siteUrl}/api/account/export`
  const over = input.overageLines.length > 0 && input.purgeAt

  const subject = over
    ? `${input.museumName ?? 'Your museum'} is now on Community: some data will be deleted on ${formatBillingDate(input.purgeAt!)}`
    : `${input.museumName ?? 'Your museum'} is now on the free Community plan`

  const opening = input.trialOnly
    ? `Your free trial for <strong>${esc(name)}</strong> has ended without a subscription, so your museum has moved to the free Community plan.`
    : `Your Vitrine subscription for <strong>${esc(name)}</strong> has ended, so your museum has moved to the free Community plan.`

  const body = over
    ? `<p style="margin:0 0 16px">Community has lower limits than your previous plan. This is over them:</p>
  ${list(input.overageLines)}
  <p style="margin:0 0 16px">Nothing has been deleted yet. Unless you resubscribe, it will be <strong>permanently deleted on ${esc(formatBillingDate(input.purgeAt!))}</strong>, starting with what was added most recently. Everything within Community's limits stays.</p>
  <p style="margin:0 0 16px">We will remind you ${input.trialOnly ? '7 days' : '30 days and again 7 days'} before.</p>`
    : `<p style="margin:0 0 16px">Everything you have fits within Community's limits, so nothing will be deleted.</p>`

  const html = `${WRAP_OPEN}
  <p style="margin:0 0 16px">Hello,</p>
  <p style="margin:0 0 16px">${opening} Your dashboard and public site stay online with Community's features.</p>
  ${body}
  ${button(planUrl, input.trialOnly ? 'Choose a plan' : 'Resubscribe')}
  <p style="margin:0 0 16px">If you would rather keep a copy yourself, you can <a href="${esc(exportUrl)}" style="color:#b45309">download your whole collection</a> at any time, including every image and document.</p>
  <p style="margin:0 0 16px">If any of this is wrong, just reply to this email.</p>
  ${WRAP_CLOSE}`

  return { subject, html }
}

/** Sent 30 and 7 days before over-limit data is deleted. */
export function renderPurgeWarningEmail(input: Common & {
  daysLeft: number
}): { subject: string; html: string } {
  const name = input.museumName ?? 'your museum'
  const date = formatBillingDate(input.purgeAt!)
  const planUrl = `${input.siteUrl}/dashboard/plan`
  const exportUrl = `${input.siteUrl}/api/account/export`
  const days = `${input.daysLeft} day${input.daysLeft === 1 ? '' : 's'}`

  const subject = input.daysLeft <= 7
    ? `Final reminder: some of ${input.museumName ?? 'your museum'}'s data will be deleted in ${days}`
    : `Some of ${input.museumName ?? 'your museum'}'s data will be deleted in ${days}`

  const html = `${WRAP_OPEN}
  <p style="margin:0 0 16px">Hello,</p>
  <p style="margin:0 0 16px"><strong>${esc(name)}</strong> is on the free Community plan, and this is still over its limits:</p>
  ${list(input.overageLines)}
  <p style="margin:0 0 16px">It will be <strong>permanently deleted on ${esc(date)}</strong>, in ${esc(days)}, starting with what was added most recently. It cannot be recovered afterwards. Everything within Community's limits stays.</p>
  <p style="margin:0 0 16px">To keep it, resubscribe before then and nothing is deleted:</p>
  ${button(planUrl, 'Resubscribe')}
  <p style="margin:0 0 16px">Or <a href="${esc(exportUrl)}" style="color:#b45309">download your whole collection</a> first, including every image and document.</p>
  ${WRAP_CLOSE}`

  return { subject, html }
}
