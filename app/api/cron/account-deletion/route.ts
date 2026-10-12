import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { deleteMuseumEverywhere } from '@/lib/delete-museum-data'
import { CANCEL_PURGE_FIELDS, DOWNGRADE_PLAN, purgeOverLimit, type PurgeReport } from '@/lib/billing/downgrade'

// Daily cron, two passes:
//
//  1. Permanently deletes museums whose scheduled_deletion_at has passed,
//     sending a final "your account has been deleted" email immediately before
//     each. Subscription end no longer schedules this (it moves the museum to
//     Community instead), so it only acts on rows scheduled under the old
//     policy.
//  2. For museums that dropped to Community, deletes whatever is still over
//     Community's limits once over_limit_purge_at has passed, most recently
//     added first. See lib/billing/downgrade.ts.
//
// ?dryRun=1 reports what each pass would do and changes nothing.
//
// Batched (50 deletions, 25 purges per run) to stay under Vercel's 5-minute
// invocation cap. Anything left over is picked up tomorrow.

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function GET(request: Request) {
  const authz = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authz !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1'
  const nowIso = new Date().toISOString()

  const { data: due, error } = await service
    .from('museums')
    .select('id, name, owner_id, lock_reason')
    .lte('scheduled_deletion_at', nowIso)
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const m of dryRun ? [] : due ?? []) {
    // Last-chance email BEFORE deletion — after deleteMuseumEverywhere runs
    // the auth user is gone and we can't resolve their address.
    if (resend && m.owner_id) {
      try {
        const { data: owner } = await service.auth.admin.getUserById(m.owner_id)
        const email = owner?.user?.email
        if (email) {
          await resend.emails.send({
            from: 'Vitrine <noreply@contact.vitrinecms.com>',
            to: email,
            subject: `Your Vitrine account has been deleted`,
            html: `
              <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
                <h2 style="font-style:italic;margin:0 0 12px">Your account has been deleted</h2>
                <p>As scheduled, your Vitrine museum <strong>${esc(m.name)}</strong> and all associated data (objects, images, documents) have been permanently removed from our systems.</p>
                <p>This deletion is final and cannot be reversed.</p>
                <p>If this was a mistake or you'd like to start a new museum, you're always welcome back — just sign up at <a href="https://vitrinecms.com/signup" style="color:#b45309">vitrinecms.com</a>.</p>
                <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
                <p style="font-size:12px;color:#888">Vitrine</p>
              </div>
            `,
          })
        }
      } catch (err) {
        console.error(`[account-deletion] email failed for ${m.id}:`, err)
      }
    }

    const reason = m.lock_reason === 'trial_expired' ? 'trial_expired' : 'subscription_ended'
    try {
      await deleteMuseumEverywhere(service, m.id, reason)
      results.push({ id: m.id, ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[account-deletion] failed for ${m.id}:`, msg)
      results.push({ id: m.id, ok: false, error: msg })
    }
  }

  // ---- Pass 2: over-limit purge after a downgrade to Community ----------
  const { data: purgeDue, error: purgeError } = await service
    .from('museums')
    .select('id, plan, stripe_subscription_id')
    .lte('over_limit_purge_at', nowIso)
    .limit(25)

  const purges: Array<PurgeReport | { museumId: string; skipped: string }> = []
  for (const m of purgeDue ?? []) {
    // Paying again, or moved by hand: nothing is over a limit they no longer
    // have. The webhook normally clears this already; this is the backstop.
    if (m.plan !== DOWNGRADE_PLAN || m.stripe_subscription_id) {
      if (!dryRun) await service.from('museums').update(CANCEL_PURGE_FIELDS).eq('id', m.id)
      purges.push({ museumId: m.id, skipped: 'no longer on Community' })
      continue
    }

    let report: PurgeReport
    try {
      report = await purgeOverLimit(service, m.id, { dryRun })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[account-deletion] purge failed for ${m.id}:`, msg)
      purges.push({ museumId: m.id, skipped: msg })
      continue
    }
    purges.push(report)
    if (dryRun) continue

    const removed = [
      report.objects && `${report.objects} objects`,
      report.images && `${report.images} photos`,
      report.files && `${report.files} documents`,
      report.staff && `${report.staff} staff accounts`,
      report.shareLinks && `${report.shareLinks} share links`,
    ].filter(Boolean).join(', ')
    await service.from('activity_log').insert({
      museum_id: m.id,
      action_type: 'over_limit_purged',
      description: `Removed data over Community's limits: ${removed || 'nothing was still over'}.`
        + (report.protectedObjects ? ` Kept ${report.protectedObjects} objects with disposal records.` : '')
        + (report.errors.length ? ` ${report.errors.length} items could not be removed and will be retried.` : ''),
    })

    // Leave the date in place on a partial failure so tomorrow's run retries.
    // A re-run plans from what is left, so it never removes more than it should.
    if (report.errors.length === 0) {
      await service.from('museums').update(CANCEL_PURGE_FIELDS).eq('id', m.id)
    } else {
      console.error(`[account-deletion] purge for ${m.id} partly failed:`, report.errors)
    }
  }

  return NextResponse.json({
    dryRun,
    deleted: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
    ...(dryRun ? { wouldDelete: (due ?? []).map(m => m.id) } : {}),
    purged: purges,
    ...(purgeError ? { purgeError: purgeError.message } : {}),
  })
}
