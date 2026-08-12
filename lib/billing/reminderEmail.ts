/**
 * Renewal, trial and price-change reminder emails.
 *
 * Every one of these must state the date, the amount, and give a direct route
 * to cancel. That last point is the one most easily lost in a redesign: a
 * reminder that tells you that you are about to be charged but makes you hunt
 * for the way out is not what the regime asks for.
 *
 * Content version is stamped on each so a notice can be traced back to the
 * exact wording used, even after the template changes.
 */

import { esc } from '@/lib/email/send'
import { formatBillingDate } from './coolingOff'
import type { NoticeType } from './notices'

export const REMINDER_CONTENT_VERSION = '2026-08-11.1'

export type ReminderInput = {
  noticeType: NoticeType
  museumName: string | null
  planLabel: string
  /** Formatted for display, for example "£79.00". */
  amount: string
  /** The renewal or trial conversion this notice is about. */
  eventAt: string
  siteUrl: string
  /** Price change notices only. */
  priceChange?: {
    oldAmount: string
    newAmount: string
    effectiveAt: string
  }
}

export function renderReminderEmail(input: ReminderInput): { subject: string; html: string } {
  const date = formatBillingDate(input.eventAt)
  const cancelUrl = `${input.siteUrl}/dashboard/plan`
  const name = input.museumName ?? 'your museum'

  const { subject, lead } = copyFor(input, date, name)

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#292524;max-width:560px">
  <p style="margin:0 0 16px">Hello,</p>

  <p style="margin:0 0 20px">${lead}</p>

  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#fafaf9;border:1px solid #e7e5e4;border-radius:6px;margin:0 0 20px">
    <tr>
      <td style="padding:12px 16px 4px 16px;color:#78716c;font-size:13px">Plan</td>
      <td style="padding:12px 16px 4px 0;font-size:13px">${esc(input.planLabel)}</td>
    </tr>
    <tr>
      <td style="padding:4px 16px;color:#78716c;font-size:13px">Amount</td>
      <td style="padding:4px 16px 4px 0;font-size:13px">${esc(input.amount)}</td>
    </tr>
    <tr>
      <td style="padding:4px 16px 12px 16px;color:#78716c;font-size:13px">${input.priceChange ? 'Takes effect' : 'Date'}</td>
      <td style="padding:4px 16px 12px 0;font-size:13px">${esc(input.priceChange ? formatBillingDate(input.priceChange.effectiveAt) : date)}</td>
    </tr>
  </table>

  <p style="margin:0 0 8px">If you do not want to continue, you can cancel in two clicks and you will not be charged again.</p>

  <p style="margin:0 0 20px"><a href="${esc(cancelUrl)}" style="display:inline-block;background:#292524;color:#fafaf9;padding:10px 18px;border-radius:6px;text-decoration:none">Manage or cancel your subscription</a></p>

  <p style="margin:0 0 16px">You do not need to contact us to cancel, but you can reply to this email if you would rather we did it for you.</p>

  <p style="margin:24px 0 0;color:#78716c;font-size:13px">Vitrine<br>Reference: ${esc(REMINDER_CONTENT_VERSION)}</p>
</div>`

  return { subject, html }
}

function copyFor(
  input: ReminderInput,
  date: string,
  name: string
): { subject: string; lead: string } {
  const amount = esc(input.amount)
  const safeDate = esc(date)

  switch (input.noticeType) {
    case 'trial_ending_7d':
    case 'trial_ending_mid':
      return {
        subject: `Your Vitrine trial ends on ${date}`,
        lead: `Your free trial for ${esc(name)} ends on ${safeDate}. Unless you cancel before then, your subscription will start automatically and you will be charged ${amount}.`,
      }

    case 'trial_ending_2d':
    case 'trial_ending_24h':
      return {
        subject: `Your Vitrine trial ends on ${date}, and you will be charged`,
        lead: `This is a final reminder that your free trial ends on ${safeDate}. Unless you cancel before then, you will be charged ${amount} and your subscription will continue every month after that.`,
      }

    case 'renewal_30d':
      return {
        subject: `Your Vitrine subscription renews on ${date}`,
        lead: `Your subscription for ${esc(name)} renews automatically on ${safeDate}, and you will be charged ${amount}. We are letting you know 30 days in advance so you have time to decide.`,
      }

    case 'renewal_7d':
      return {
        subject: `Your Vitrine subscription renews on ${date}`,
        lead: `Your subscription for ${esc(name)} renews automatically on ${safeDate}, and you will be charged ${amount}.`,
      }

    case 'periodic_6m':
      return {
        subject: `A reminder about your Vitrine subscription`,
        lead: `This is a routine reminder that you have an active Vitrine subscription for ${esc(name)}. It renews automatically every month, and the next payment of ${amount} is due on ${safeDate}. We send this every six months so an ongoing subscription never goes unnoticed.`,
      }

    case 'price_change_30d': {
      const pc = input.priceChange
      return {
        subject: `The price of your Vitrine subscription is changing`,
        lead: pc
          ? `The price of your Vitrine subscription is changing. You currently pay ${esc(pc.oldAmount)} a month. From ${esc(formatBillingDate(pc.effectiveAt))} the price will be ${esc(pc.newAmount)} a month. We are telling you at least 30 days beforehand, so you can decide whether to continue before the new price is charged.`
          : `The price of your Vitrine subscription is changing from ${safeDate}.`,
      }
    }

    default:
      return {
        subject: `About your Vitrine subscription`,
        lead: `Your subscription for ${esc(name)} renews on ${safeDate}, and you will be charged ${amount}.`,
      }
  }
}
