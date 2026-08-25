/**
 * Copy for the manual nudge email sent from /admin.
 *
 * Kept apart from the action that sends it so the wording can be read and
 * tested without a Resend key or a database, the same split
 * `lib/billing/cancellationEmail.ts` uses.
 *
 * Two variants, chosen by whether the owner ever came back after signing up.
 * The distinction matters: telling someone their collection is waiting for them
 * when they never added anything reads as a mailmerge failure, and asking a
 * long-standing user why they never got started is worse.
 *
 * The voice is deliberately flat. This is a reminder that an account exists,
 * not an attempt to start a conversation, so it does not ask for a reply and
 * does not editorialise about how much we would love to see them. Two short
 * sentences and a link is the whole of it. Reply-to still points at a real
 * inbox, but that is for the person who chooses to answer, not an invitation.
 */

import { esc } from './send'

export type NudgeVariant = 'never_returned' | 'dormant'

/** A same-day session is the signup auto-login, so it is not "coming back". */
const DAY = 86_400_000

/**
 * Which of the two emails suits this owner.
 *
 * Matches the `returned` test in the reengagement cron so the manual nudge and
 * the automated track never disagree about who is who.
 */
export function nudgeVariant(createdAt: string, lastSignInAt: string | null): NudgeVariant {
  const createdMs = Date.parse(createdAt)
  const lastMs = lastSignInAt ? Date.parse(lastSignInAt) : null
  if (lastMs == null || Number.isNaN(createdMs)) return 'never_returned'
  return lastMs - createdMs >= DAY ? 'dormant' : 'never_returned'
}

/**
 * A rough spoken duration, because "it has been 97 days" is not how anyone
 * describes a gap and the precision is false anyway.
 */
export function describeGap(days: number): string {
  if (days < 10) return 'a few days'
  if (days < 21) return 'a couple of weeks'
  if (days < 45) return 'about a month'
  if (days < 330) return `about ${Math.round(days / 30)} months`
  if (days < 550) return 'about a year'
  return `about ${Math.round(days / 365)} years`
}

function daysSince(iso: string | null, now: number): number {
  if (!iso) return 0
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) return 0
  return Math.max(0, Math.floor((now - ms) / DAY))
}

export type NudgeInput = {
  variant: NudgeVariant
  museumName: string | null
  /** Owner's signup date, used by the never-returned variant. */
  createdAt: string
  /** Owner's last sign-in, used by the dormant variant. */
  lastSignInAt: string | null
  siteUrl: string
  unsubscribeUrl: string
  now?: number
}

export function renderNudgeEmail(input: NudgeInput): { subject: string; html: string; text: string } {
  const now = input.now ?? Date.now()
  const name = input.museumName?.trim() || null
  const dashboard = `${input.siteUrl}/dashboard`

  const { subject, paragraphs, cta } =
    input.variant === 'never_returned'
      ? neverReturned(describeGap(daysSince(input.createdAt, now)))
      : dormant(describeGap(daysSince(input.lastSignInAt, now)), name)

  const html = `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a;font-size:16px;line-height:1.6">
      <p>Hi,</p>
      ${paragraphs.map(p => `<p>${p.html}</p>`).join('\n      ')}
      <p style="margin:24px 0"><a href="${dashboard}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">${esc(cta)}</a></p>
      <p style="margin-bottom:0">Matt</p>
      <p style="margin-top:4px;color:#666">Vitrine</p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
      <p style="font-size:12px;color:#888">
        You are receiving this because you have a Vitrine account.
        <a href="${input.unsubscribeUrl}" style="color:#888">Unsubscribe from emails like this one</a>.
        Billing and security notices are sent separately and are not affected.
      </p>
    </div>`

  const text = [
    'Hi,',
    ...paragraphs.map(p => p.text),
    `${cta}: ${dashboard}`,
    'Matt',
    'Vitrine',
    '',
    `Unsubscribe from emails like this one: ${input.unsubscribeUrl}`,
  ].join('\n\n')

  return { subject, html, text }
}

type Para = { html: string; text: string }
const plain = (s: string): Para => ({ html: esc(s), text: s })

function neverReturned(gap: string) {
  return {
    subject: 'Your Vitrine museum',
    cta: 'Open your museum',
    paragraphs: [
      plain(`You set up a museum on Vitrine ${gap} ago and haven't been back since.`),
      plain("It's still set up. You can log back in whenever you want to."),
    ] as Para[],
  }
}

function dormant(gap: string, museumName: string | null) {
  const opener = museumName
    ? {
        html: `It's been ${esc(gap)} since you last opened <strong>${esc(museumName)}</strong>.`,
        text: `It's been ${gap} since you last opened ${museumName}.`,
      }
    : plain(`It's been ${gap} since you were last on Vitrine.`)

  return {
    subject: museumName ? `${museumName} on Vitrine` : 'Your Vitrine museum',
    cta: 'Open your museum',
    paragraphs: [
      opener,
      plain('Your collection is still there, exactly as you left it.'),
    ] as Para[],
  }
}
