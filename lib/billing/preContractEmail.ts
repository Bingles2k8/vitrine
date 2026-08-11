/**
 * Pre-contract information email.
 *
 * DMCCA requires the key contract information to be given in a durable form the
 * customer can keep, within one hour of subscribing. This renders the same
 * `KeyContractInfo` object that the on-screen panel renders, so the email and
 * the screen cannot say different things.
 *
 * Sent inline from the checkout webhook rather than queued to a cron, so the
 * one-hour deadline is met by construction. Vercel is on the hobby plan and
 * crons there run once a day, which would not meet it.
 */

import { esc } from '@/lib/email/send'
import type { KeyContractInfo, KeyContractTerm } from './keyContractInfo'

export function renderPreContractEmail(args: {
  info: KeyContractInfo
  museumName: string | null
  siteUrl: string
}): { subject: string; html: string } {
  const { info } = args
  const planUrl = `${args.siteUrl}/dashboard/plan`

  const subject = info.trial
    ? `Your Vitrine free trial has started, and what happens next`
    : `Your Vitrine subscription: the details, for your records`

  const opening = info.trial
    ? `Your free trial of the ${esc(info.planLabel)} plan has started. This email sets out the terms, including exactly when your trial ends and what you will be charged. Please keep it.`
    : `Thank you for subscribing to the ${esc(info.planLabel)} plan. This email sets out the terms of your subscription. Please keep it for your records.`

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#292524;max-width:600px">
  <p style="margin:0 0 16px">Hello,</p>

  <p style="margin:0 0 20px">${opening}</p>

  ${info.trial ? termBlock('Your free trial', info.trial, true) : ''}
  ${info.introductoryPrice ? termBlock('Introductory price', info.introductoryPrice, true) : ''}
  ${termBlock('Your subscription', info.terms, false)}

  ${
    info.provides.length > 0
      ? `<h2 style="font-size:15px;margin:24px 0 8px">What the ${esc(info.planLabel)} plan includes</h2>
  <ul style="margin:0 0 16px;padding-left:20px">
    ${info.provides.map((f) => `<li style="margin:0 0 4px">${esc(f)}</li>`).join('\n    ')}
  </ul>`
      : ''
  }

  <p style="margin:24px 0 16px"><a href="${esc(planUrl)}" style="display:inline-block;background:#292524;color:#fafaf9;padding:10px 18px;border-radius:6px;text-decoration:none">Manage your subscription</a></p>

  <p style="margin:0 0 16px">If anything here is not what you expected, reply to this email and we will sort it out.</p>

  <p style="margin:24px 0 0;color:#78716c;font-size:13px">Vitrine<br>Reference: ${esc(info.version)}</p>
</div>`

  return { subject, html }
}

/**
 * A labelled block of terms.
 *
 * `emphasis` shades the block. Used for the trial and introductory-price
 * blocks, which the rules require to be at least as prominent as the offer
 * itself, so they must not read as small print at the bottom.
 */
function termBlock(heading: string, terms: KeyContractTerm[], emphasis: boolean): string {
  const wrapper = emphasis
    ? 'background:#fafaf9;border:1px solid #e7e5e4;border-radius:6px;padding:12px 16px;margin:0 0 20px'
    : 'margin:0 0 20px'

  return `<div style="${wrapper}">
    <h2 style="font-size:15px;margin:0 0 10px">${esc(heading)}</h2>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      ${terms
        .map(
          (t) => `<tr>
        <td style="padding:5px 12px 5px 0;vertical-align:top;color:#78716c;font-size:13px;width:38%">${esc(t.label)}</td>
        <td style="padding:5px 0;vertical-align:top;font-size:13px">${esc(t.value)}</td>
      </tr>`
        )
        .join('\n      ')}
    </table>
  </div>`
}
