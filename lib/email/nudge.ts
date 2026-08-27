/**
 * Copy for the manual nudge email sent from /admin.
 *
 * Kept apart from the action that sends it so the wording can be read and
 * tested without a Resend key or a database, the same split
 * `lib/billing/cancellationEmail.ts` uses.
 *
 * Three variants. Two are chosen by whether the owner ever came back after
 * signing up; the third is for someone who never completed onboarding and so
 * has no museum at all. The distinctions matter: telling someone their
 * collection is waiting for them when they never added anything reads as a
 * mailmerge failure, asking a long-standing user why they never got started is
 * worse, and promising a museum to someone who never made one is worst of the
 * three, because they can check.
 *
 * The voice is deliberately flat. This is a reminder that an account exists,
 * not an attempt to start a conversation, so it does not ask for a reply, does
 * not editorialise, and carries no sign-off. Two short sentences and a button
 * is the whole of it, and the button is the only thing being asked for.
 *
 * Styled to the public site rather than to the plain-text house style the older
 * transactional mail uses: the stone-950 band and amber accent are the same
 * ones PublicNav renders, and the wordmark is the same serif italic with an
 * amber full stop. The dark ground is confined to the header band because a
 * fully dark email is at the mercy of whatever each client does with dark mode,
 * whereas one dark band over a white body renders the same everywhere.
 */

import { esc } from './send'

export type NudgeVariant = 'never_returned' | 'dormant' | 'no_museum'

/** A same-day session is the signup auto-login, so it is not "coming back". */
const DAY = 86_400_000

/**
 * Which of the two owner emails suits this owner.
 *
 * Matches the `returned` test in the reengagement cron so the manual nudge and
 * the automated track never disagree about who is who.
 *
 * Owners only. `no_museum` is not reachable from here because it is decided by
 * the absence of a museum row, not by any date on the account.
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
  /** Null for `no_museum`, where there is no museum to name. */
  museumName: string | null
  /** Signup date, used by the never-returned and no-museum variants. */
  createdAt: string
  /** Owner's last sign-in, used by the dormant variant. */
  lastSignInAt: string | null
  siteUrl: string
  unsubscribeUrl: string
  now?: number
}

/**
 * Brand tokens, copied from the Tailwind palette the site is built in so the
 * mail matches it exactly. Email clients get no stylesheet and no CSS
 * variables, so every one of these has to be inlined as a literal.
 */
const C = {
  ink: '#0c0a09', // stone-950, the site's ground
  body: '#292524', // stone-800
  muted: '#78716c', // stone-500
  faint: '#a8a29e', // stone-400
  rule: '#e7e5e4', // stone-200
  page: '#f5f5f4', // stone-100
  card: '#ffffff',
  wordmark: '#fafaf9', // stone-50
  accent: '#f59e0b', // amber-500
} as const

/** Geist and DM Sans will not load in mail, so fall through to system faces. */
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
/** The wordmark is serif italic on the site; Georgia is the closest safe face. */
const SERIF = "Georgia, 'Times New Roman', Times, serif"

export function renderNudgeEmail(input: NudgeInput): { subject: string; html: string; text: string } {
  const now = input.now ?? Date.now()
  const name = input.museumName?.trim() || null
  const dashboard = `${input.siteUrl}/dashboard`

  const { subject, paragraphs, cta } =
    input.variant === 'never_returned'
      ? neverReturned(describeGap(daysSince(input.createdAt, now)))
      : input.variant === 'no_museum'
        ? noMuseum(describeGap(daysSince(input.createdAt, now)))
        : dormant(describeGap(daysSince(input.lastSignInAt, now)), name)

  const para = (p: Para) =>
    `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.body}">${p.html}</p>`

  // Tables rather than divs: Outlook's rendering engine does not lay divs out
  // reliably, and this is the one layout that has to survive every client.
  const html = `<!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif !important}</style><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};margin:0;padding:24px 12px">
  <tr>
    <td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${C.card};border-radius:8px;overflow:hidden">
        <tr>
          <td style="background:${C.ink};padding:20px 32px">
            <span style="font-family:${SERIF};font-style:italic;font-size:20px;color:${C.wordmark};letter-spacing:0.2px">Vitrine<span style="color:${C.accent}">.</span></span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px">
            ${para(plain('Hi,'))}
            ${paragraphs.map(para).join('\n            ')}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px">
              <tr>
                <td style="background:${C.accent};border-radius:4px">
                  <a href="${dashboard}" style="display:inline-block;padding:12px 24px;font-family:${SANS};font-size:15px;font-weight:600;color:${C.ink};text-decoration:none">${esc(cta)}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid ${C.rule}">
            <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted}">
              You are receiving this because you have a Vitrine account.
              <a href="${input.unsubscribeUrl}" style="color:${C.muted}">Unsubscribe from emails like this one</a>.
              Billing and security notices are sent separately and are not affected.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

  const text = [
    'Hi,',
    ...paragraphs.map(p => p.text),
    `${cta}: ${dashboard}`,
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

/**
 * Signed up, never finished onboarding.
 *
 * Names no museum and claims no collection, because there is neither. The link
 * is still /dashboard rather than /onboarding: dashboard is behind the
 * middleware auth gate, so a logged-out reader is sent to log in first and is
 * then forwarded to onboarding by the dashboard itself. /onboarding is not
 * gated, and a logged-out reader landing there would fill the form in and only
 * discover at the last step that it could not save.
 */
function noMuseum(gap: string) {
  return {
    subject: 'Your Vitrine account',
    cta: 'Finish setting up',
    paragraphs: [
      plain(`You created a Vitrine account ${gap} ago but never finished setting your museum up.`),
      plain('The account is still there. Finishing takes a minute, and nothing you enter is final.'),
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
