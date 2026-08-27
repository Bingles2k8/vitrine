import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { signUnsubscribeToken, signUserUnsubscribeToken } from '@/lib/emailTokens'
import { dueOrphanStage, ORPHAN_KIND, type OrphanStage } from '@/lib/email/reengagementStages'

// Daily cron: re-engagement emails to museum owners, in two tracks keyed off
// the owner's auth account.
//
//   Track A — signed up, never came back (last sign-in within ~24h of signup):
//     day 3 / day 7 / day 30 after signup   (a3 / a7 / a30)
//
//   Track B — came back at least once, then went quiet:
//     30 days / 180 days after last sign-in  (b30 / b180), then never again
//
//   Track C — signed up but never completed onboarding, so has no museum:
//     day 3 / day 7 / day 30 after signup   (c3 / c7 / c30)
//
// An owner is either "returned" or not, so at most one email is due per run.
// Idempotency via reengage_*_sent_at flags on museums (see
// supabase/reengagement-emails.sql). Each stage has a 2-day catch window so a
// missed cron day still fires; the flag stops a second send within the window.
//
// Track C is the same shape but keyed to a person rather than a museum, because
// its recipients have no museum row — that absence is what selects them. Until
// it existed they received nothing from us at all, since every query in this
// file started from `museums` and they are in none of them. Its idempotency
// comes from the account_emails rows the send writes (kind = 'reengage_c3'),
// which is the same log the admin nudge button uses, so a hand-sent nudge and
// the automated track can see each other and neither doubles up on the other.
//
// SAFETY: sending is gated behind REENGAGEMENT_ENABLED === 'true'. Without it
// (or with ?dryRun=1) the cron computes and returns who *would* be emailed but
// sends nothing and sets no flags — so deploying this does not blast anyone.

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DAY = 86_400_000
const WINDOW = 2 // days; catch window so a missed cron day still fires

type OwnerStage = 'a3' | 'a7' | 'a30' | 'b30' | 'b180'
type Stage = OwnerStage | OrphanStage

const FLAG: Record<OwnerStage, string> = {
  a3: 'reengage_a3_sent_at',
  a7: 'reengage_a7_sent_at',
  a30: 'reengage_a30_sent_at',
  b30: 'reengage_b30_sent_at',
  b180: 'reengage_b180_sent_at',
}

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inWindow(days: number, threshold: number): boolean {
  return days >= threshold && days < threshold + WINDOW
}

type OwnerRow = {
  reengage_a3_sent_at: string | null
  reengage_a7_sent_at: string | null
  reengage_a30_sent_at: string | null
  reengage_b30_sent_at: string | null
  reengage_b180_sent_at: string | null
}

// Which single email (if any) is due for this owner today.
function dueStage(createdAt: string, lastSignInAt: string | null, m: OwnerRow): Stage | null {
  const now = Date.now()
  const createdMs = Date.parse(createdAt)
  const lastMs = lastSignInAt ? Date.parse(lastSignInAt) : null

  // A same-day (< 24h after signup) session is just the signup auto-login and
  // does not count as "coming back".
  const returned = lastMs != null && lastMs - createdMs >= DAY

  if (!returned) {
    const age = (now - createdMs) / DAY
    if (inWindow(age, 30) && !m.reengage_a30_sent_at) return 'a30'
    if (inWindow(age, 7) && !m.reengage_a7_sent_at) return 'a7'
    if (inWindow(age, 3) && !m.reengage_a3_sent_at) return 'a3'
    return null
  }

  const quiet = (now - (lastMs as number)) / DAY
  if (inWindow(quiet, 180) && !m.reengage_b180_sent_at) return 'b180'
  if (inWindow(quiet, 30) && !m.reengage_b30_sent_at) return 'b30'
  return null
}

function copy(stage: Stage, museumName: string | null, siteUrl: string, unsubscribeUrl: string): { subject: string; html: string } {
  const dash = '/dashboard'
  const newObject = `${siteUrl}/dashboard/objects/new`
  const dashboard = `${siteUrl}${dash}`
  const name = esc(museumName || 'your museum')

  // Track C never created a museum — that is the whole reason they are being
  // written to — so the footer cannot tell them they did.
  const reason = stage.startsWith('c')
    ? 'You are receiving this because you created a Vitrine account.'
    : 'You are receiving this because you created a museum on Vitrine.'

  const shell = (subject: string, headline: string, body: string, ctaHref: string, ctaLabel: string) => ({
    subject,
    html: `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="font-style:italic;margin:0 0 16px">${headline}</h2>
      <p>Hi,</p>
      ${body}
      <p style="margin:24px 0"><a href="${ctaHref}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">${ctaLabel}</a></p>
      <p>The Vitrine team</p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
      <p style="font-size:12px;color:#888">
        Vitrine &middot; <a href="${unsubscribeUrl}" style="color:#888">Unsubscribe from these emails</a><br>
        ${reason} This is not an essential account email.
        Unsubscribing will not affect billing or security notices.
      </p>
    </div>`,
  })

  switch (stage) {
    case 'a3':
      return shell(
        'Your Vitrine museum is ready when you are',
        'Ready to add your first object?',
        `<p>You set up a museum on Vitrine a few days ago. It's ready for its first object whenever you are.</p>
         <p>Adding one is quick. Give it a title, a photo, and any details you have. You can edit everything later.</p>`,
        newObject,
        'Add your first object',
      )
    case 'a7':
      return shell(
        'Your Vitrine museum is still empty',
        'A minute is all it takes',
        `<p>It's been a week since you created your museum, and it's still waiting for its first object.</p>
         <p>Most people start with one piece. Add a title and a photo, then build from there when you have time.</p>`,
        newObject,
        'Add your first object',
      )
    case 'a30':
      return shell(
        'Your Vitrine museum is still here',
        "We've kept your place",
        `<p>You created a museum on Vitrine a month ago. It's still set up and ready whenever you want to start adding your collection.</p>
         <p>If now isn't a good time, no problem. Your account will be here when it is.</p>`,
        dashboard,
        'Pick up where you left off',
      )
    case 'b30':
      return shell(
        "Your collection's waiting on Vitrine",
        "It's been a little while",
        `<p>We haven't seen you at <strong>${name}</strong> for about a month. Your collection is just as you left it.</p>
         <p>Got a new acquisition to catalogue, or want to look back over what's there? It's all there when you want it.</p>`,
        dashboard,
        'Open your museum',
      )
    // Track C: account exists, museum never created. Nothing here may claim
    // they have a museum, a collection, or anything waiting for them, because
    // they can click through and see that they do not.
    case 'c3':
      return shell(
        'Your museum is one step away',
        'Give your collection a museum of its own',
        `<p>You started a Vitrine account a few days ago. The good part is next: name your museum and tell us what you collect.</p>
         <p>From there you get a proper catalogue of everything you own, and a page you can send to anyone who asks about it.</p>`,
        dashboard,
        'Name your museum',
      )
    case 'c7':
      return shell(
        'What are you collecting?',
        'Tell us what you collect',
        `<p>It is the only question left, and Vitrine shapes itself around the answer: coins, ceramics, watches, records, or something nobody else has thought to catalogue.</p>
         <p>Name your museum, say what goes in it, and it is yours.</p>`,
        dashboard,
        'Name your museum',
      )
    case 'c30':
      return shell(
        'Still worth cataloguing',
        "Whatever you collect, it's worth keeping properly",
        `<p>You started a Vitrine account a month ago. Whatever is on your shelves is still worth a proper record of what it is, where it came from, and what it's worth now.</p>
         <p>Your account is here when you want it. This is the last email we'll send about it.</p>`,
        dashboard,
        'Name your museum',
      )
    case 'b180':
      return shell(
        'Checking in one last time',
        'Your collection is safe with us',
        `<p>It's been six months since you last visited <strong>${name}</strong>. This is just a quick check-in, and the last email we'll send about it.</p>
         <p>Your collection is still here. Log back in any time and it'll be waiting.</p>
         <p>Thanks for trying Vitrine.</p>`,
        dashboard,
        'Return to your museum',
      )
  }
}

export async function GET(request: Request) {
  const authz = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authz !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1' || process.env.REENGAGEMENT_ENABLED !== 'true'

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com'

  // Owner auth accounts: id -> { email, created_at, last_sign_in_at }.
  // Paginate listUsers so we don't silently cap at one page.
  const owners = new Map<string, {
    email: string | null
    created_at: string
    last_sign_in_at: string | null
    email_confirmed: boolean
  }>()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    for (const u of data.users) {
      owners.set(u.id, {
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed: !!u.email_confirmed_at,
      })
    }
    if (data.users.length < 1000) break
  }

  // Candidate museums: skip past-due, scheduled-for-deletion, and test accounts.
  const { data: museums } = await service
    .from('museums')
    .select('id, name, owner_id, reengage_a3_sent_at, reengage_a7_sent_at, reengage_a30_sent_at, reengage_b30_sent_at, reengage_b180_sent_at')
    .eq('payment_past_due', false)
    .is('scheduled_deletion_at', null)
    .eq('is_test_account', false)
    .eq('reengage_opt_out', false)
    .limit(5000)

  const counts: Record<Stage, number> = { a3: 0, a7: 0, a30: 0, b30: 0, b180: 0, c3: 0, c7: 0, c30: 0 }
  const preview: Array<{ stage: Stage; email: string; museum: string | null }> = []

  for (const m of museums ?? []) {
    if (!m.owner_id) continue
    const owner = owners.get(m.owner_id)
    if (!owner?.email || !owner.created_at) continue

    const stage = dueStage(owner.created_at, owner.last_sign_in_at, m)
    if (!stage) continue

    if (dryRun) {
      counts[stage]++
      if (preview.length < 100) preview.push({ stage, email: owner.email, museum: m.name })
      continue
    }

    if (!resend) continue
    try {
      const unsubscribeUrl = `${siteUrl}/api/reengagement/unsubscribe?token=${signUnsubscribeToken(m.id)}`
      const { subject, html } = copy(stage, m.name, siteUrl, unsubscribeUrl)
      await resend.emails.send({
        from: 'Vitrine <noreply@contact.vitrinecms.com>',
        to: owner.email,
        subject,
        html,
        headers: {
          // Lets mail clients surface a native Unsubscribe control.
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      await service
        .from('museums')
        .update({ [FLAG[stage as OwnerStage]]: new Date().toISOString() })
        .eq('id', m.id)
      counts[stage]++
    } catch (err) {
      console.error(`[reengagement] ${stage} ${m.id}:`, err instanceof Error ? err.message : err)
    }
  }

  // ── Track C: signed up, never completed onboarding ──────────────────────
  //
  // Membership is decided by the absence of a museum, so it needs the FULL set
  // of owners and staff — not the filtered `museums` query above, which drops
  // past-due, test and opted-out museums. Using that set would classify their
  // owners as having no museum and send them the wrong email entirely.
  const [{ data: allOwners }, { data: allStaff }] = await Promise.all([
    service.from('museums').select('owner_id').limit(20000),
    service.from('staff_members').select('user_id').limit(20000),
  ])
  const hasMuseum = new Set<string>()
  for (const m of allOwners ?? []) if (m.owner_id) hasMuseum.add(m.owner_id)
  for (const st of allStaff ?? []) if (st.user_id) hasMuseum.add(st.user_id)

  const { data: orphanOptOuts } = await service
    .from('account_email_opt_outs')
    .select('user_id')
    .limit(20000)
  const orphanOptedOut = new Set((orphanOptOuts ?? []).map(o => o.user_id))

  // Every email already sent to a user, of any kind. Two things are read off
  // it: which stages they have had, and when they were last written to at all.
  // The second is what stops the cron piling on top of a nudge an admin sent by
  // hand, which the stage flags alone cannot see. Failed attempts (error not
  // null) are excluded so a Resend outage does not permanently skip a stage.
  const { data: orphanLog } = await service
    .from('account_emails')
    .select('user_id, kind, sent_at')
    .is('error', null)
    .not('user_id', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(20000)
  const sentStages = new Map<string, Set<string>>()
  const lastEmailed = new Map<string, string>()
  const orphanKinds = new Set(Object.values(ORPHAN_KIND))
  for (const row of orphanLog ?? []) {
    if (!row.user_id) continue
    // Rows arrive newest-first, so the first seen per user is the latest.
    if (!lastEmailed.has(row.user_id)) lastEmailed.set(row.user_id, row.sent_at)
    if (!orphanKinds.has(row.kind)) continue
    const set = sentStages.get(row.user_id) ?? new Set<string>()
    set.add(row.kind)
    sentStages.set(row.user_id, set)
  }

  for (const [userId, u] of owners) {
    if (hasMuseum.has(userId) || orphanOptedOut.has(userId)) continue
    if (!u.email || !u.created_at) continue

    // Never-confirmed addresses are excluded from the automated track. An
    // unconfirmed address is one nobody has proved they control, so it may be a
    // typo of a real address belonging to someone who never signed up — and
    // sending them a scheduled series is both unsolicited mail and a
    // deliverability risk we take on every run. Tracks A and B cannot hit this
    // case, since owning a museum means having confirmed. These accounts are
    // still reachable by hand from /admin, where the confirm dialog says so.
    if (!u.email_confirmed) continue

    const stage = dueOrphanStage(
      u.created_at,
      sentStages.get(userId) ?? new Set(),
      lastEmailed.get(userId) ?? null,
    )
    if (!stage) continue

    if (dryRun) {
      counts[stage]++
      if (preview.length < 100) preview.push({ stage, email: u.email, museum: null })
      continue
    }

    if (!resend) continue

    const unsubscribeUrl = `${siteUrl}/api/reengagement/unsubscribe?token=${signUserUnsubscribeToken(userId)}`
    const { subject, html } = copy(stage, null, siteUrl, unsubscribeUrl)

    let messageId: string | null = null
    let sendError: string | null = null
    try {
      const { data, error } = await resend.emails.send({
        from: 'Vitrine <noreply@contact.vitrinecms.com>',
        to: u.email,
        subject,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })
      messageId = data?.id ?? null
      sendError = error ? (error.message ?? String(error)) : null
    } catch (err) {
      sendError = err instanceof Error ? err.message : String(err)
    }

    // The log row IS the idempotency record for this track, so it is written
    // whatever happened. A row carrying an error does not count as sent, which
    // is what lets the stage be retried tomorrow inside its catch window.
    const { error: logError } = await service.from('account_emails').insert({
      museum_id: null,
      user_id: userId,
      recipient: u.email,
      kind: ORPHAN_KIND[stage],
      subject,
      message_id: messageId,
      error: sendError,
      sent_by: null,
    })
    if (logError) console.error(`[reengagement] ${stage} log ${userId}:`, logError.message)

    if (sendError) {
      console.error(`[reengagement] ${stage} ${userId}:`, sendError)
      continue
    }
    counts[stage]++
  }

  return NextResponse.json({
    dryRun,
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    ...(dryRun ? { preview } : {}),
  })
}
