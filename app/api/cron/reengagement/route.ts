import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Daily cron: re-engagement emails to museum owners, in two tracks keyed off
// the owner's auth account.
//
//   Track A — signed up, never came back (last sign-in within ~24h of signup):
//     day 3 / day 7 / day 30 after signup   (a3 / a7 / a30)
//
//   Track B — came back at least once, then went quiet:
//     30 days / 180 days after last sign-in  (b30 / b180), then never again
//
// An owner is either "returned" or not, so at most one email is due per run.
// Idempotency via reengage_*_sent_at flags on museums (see
// supabase/reengagement-emails.sql). Each stage has a 2-day catch window so a
// missed cron day still fires; the flag stops a second send within the window.
//
// SAFETY: sending is gated behind REENGAGEMENT_ENABLED === 'true'. Without it
// (or with ?dryRun=1) the cron computes and returns who *would* be emailed but
// sends nothing and sets no flags — so deploying this does not blast anyone.

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DAY = 86_400_000
const WINDOW = 2 // days; catch window so a missed cron day still fires

type Stage = 'a3' | 'a7' | 'a30' | 'b30' | 'b180'

const FLAG: Record<Stage, string> = {
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

function copy(stage: Stage, museumName: string | null, siteUrl: string): { subject: string; html: string } {
  const dash = '/dashboard'
  const newObject = `${siteUrl}/dashboard/objects/new`
  const dashboard = `${siteUrl}${dash}`
  const name = esc(museumName || 'your museum')

  const shell = (subject: string, headline: string, body: string, ctaHref: string, ctaLabel: string) => ({
    subject,
    html: `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="font-style:italic;margin:0 0 16px">${headline}</h2>
      <p>Hi,</p>
      ${body}
      <p style="margin:24px 0"><a href="${ctaHref}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">${ctaLabel}</a></p>
      <p>— The Vitrine team</p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
      <p style="font-size:12px;color:#888">Vitrine</p>
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
  const owners = new Map<string, { email: string | null; created_at: string; last_sign_in_at: string | null }>()
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (error || !data?.users?.length) break
    for (const u of data.users) {
      owners.set(u.id, {
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
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
    .limit(5000)

  const counts: Record<Stage, number> = { a3: 0, a7: 0, a30: 0, b30: 0, b180: 0 }
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
      const { subject, html } = copy(stage, m.name, siteUrl)
      await resend.emails.send({
        from: 'Vitrine <noreply@contact.vitrinecms.com>',
        to: owner.email,
        subject,
        html,
      })
      await service
        .from('museums')
        .update({ [FLAG[stage]]: new Date().toISOString() })
        .eq('id', m.id)
      counts[stage]++
    } catch (err) {
      console.error(`[reengagement] ${stage} ${m.id}:`, err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({
    dryRun,
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    ...(dryRun ? { preview } : {}),
  })
}
