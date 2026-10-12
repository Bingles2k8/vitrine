import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { describeOverage, measureOverage } from '@/lib/billing/downgrade'
import { renderPurgeWarningEmail } from '@/lib/billing/downgradeEmail'
import { sendComplianceEmail } from '@/lib/email/send'

// Daily cron: sends 30-day and 7-day deletion warning emails to locked
// museums. Idempotent via `deletion_warning_30d_sent_at` /
// `deletion_warning_7d_sent_at` flags — running the cron twice on the same
// day is a no-op.
//
// The final "your account has been deleted" email is sent inline by the
// account-deletion cron (see ../account-deletion/route.ts) immediately
// before each deletion.
//
// Also sends the 30 and 7 day reminders before data over Community's limits is
// deleted from a museum that dropped to Community (over_limit_purge_at), via
// purge_warning_30d_sent_at / purge_warning_7d_sent_at. Each reminder
// re-measures, so it lists what is over on the day, and is skipped if the
// owner has already brought the museum within the limits.

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function daysBetween(futureIso: string): number {
  return Math.ceil((new Date(futureIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

type LockReason = 'trial_expired' | 'subscription_ended' | null

function copy(reason: LockReason, days: number, museumName: string, deleteAtIso: string) {
  const trigger = reason === 'trial_expired' ? 'Your trial ended' : 'Your subscription ended'
  const deleteAt = new Date(deleteAtIso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const subject = days <= 7
    ? `Final reminder: ${museumName} will be deleted in ${days} day${days === 1 ? '' : 's'}`
    : `${museumName} will be deleted in ${days} days`

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
      <h2 style="font-style:italic;margin:0 0 12px">${esc(trigger)} — ${days} day${days === 1 ? '' : 's'} until deletion</h2>
      <p>Your Vitrine museum <strong>${esc(museumName)}</strong> is scheduled for permanent deletion on <strong>${esc(deleteAt)}</strong>.</p>
      <p>All objects, images, documents, and history will be removed from our systems and cannot be recovered.</p>
      <p><strong>To keep your collection:</strong> resubscribe from your dashboard — everything will be restored immediately and your public site put back online.</p>
      <p style="margin:24px 0"><a href="https://vitrinecms.com/dashboard/plan" style="display:inline-block;background:#1a1a1a;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px">Resubscribe now →</a></p>
      <p>If you don't want to resubscribe but would like to keep your data, you can export a full ZIP archive (CSVs + all images/documents):</p>
      <p><a href="https://vitrinecms.com/api/account/export" style="color:#b45309">Download all my data →</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
      <p style="font-size:12px;color:#888">Vitrine</p>
    </div>
  `
  return { subject, html }
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

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  const now = Date.now()
  const in31d = new Date(now + 31 * 86400 * 1000).toISOString()
  const in29d = new Date(now + 29 * 86400 * 1000).toISOString()
  const in8d = new Date(now + 8 * 86400 * 1000).toISOString()
  const in6d = new Date(now + 6 * 86400 * 1000).toISOString()

  // 30-day warning pass
  const { data: due30 } = await service
    .from('museums')
    .select('id, name, owner_id, lock_reason, scheduled_deletion_at')
    .is('deletion_warning_30d_sent_at', null)
    .not('scheduled_deletion_at', 'is', null)
    .gte('scheduled_deletion_at', in29d)
    .lte('scheduled_deletion_at', in31d)
    .limit(500)

  // 7-day warning pass
  const { data: due7 } = await service
    .from('museums')
    .select('id, name, owner_id, lock_reason, scheduled_deletion_at')
    .is('deletion_warning_7d_sent_at', null)
    .not('scheduled_deletion_at', 'is', null)
    .gte('scheduled_deletion_at', in6d)
    .lte('scheduled_deletion_at', in8d)
    .limit(500)

  let sent30 = 0
  let sent7 = 0

  async function sendFor(
    museums: typeof due30,
    flagColumn: 'deletion_warning_30d_sent_at' | 'deletion_warning_7d_sent_at',
  ): Promise<number> {
    if (!museums || museums.length === 0) return 0
    let count = 0
    for (const m of museums) {
      if (!resend || !m.owner_id || !m.scheduled_deletion_at) continue
      try {
        const { data: owner } = await service.auth.admin.getUserById(m.owner_id)
        const email = owner?.user?.email
        if (!email) continue
        const days = daysBetween(m.scheduled_deletion_at as string)
        const { subject, html } = copy(
          m.lock_reason as LockReason,
          days,
          m.name,
          m.scheduled_deletion_at as string,
        )
        await resend.emails.send({
          from: 'Vitrine <noreply@contact.vitrinecms.com>',
          to: email,
          subject,
          html,
        })
        await service
          .from('museums')
          .update({ [flagColumn]: new Date().toISOString() })
          .eq('id', m.id)
        count++
      } catch (err) {
        console.error(`[deletion-warnings] ${flagColumn} ${m.id}:`, err)
      }
    }
    return count
  }

  sent30 = await sendFor(due30, 'deletion_warning_30d_sent_at')
  sent7 = await sendFor(due7, 'deletion_warning_7d_sent_at')

  // ---- Over-limit purge reminders, 30 and 7 days out --------------------
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com'

  async function sendPurgeWarnings(
    flagColumn: 'purge_warning_30d_sent_at' | 'purge_warning_7d_sent_at',
    from: string,
    to: string,
  ): Promise<{ checked: number; sent: number }> {
    const { data: museums } = await service
      .from('museums')
      .select('id, name, owner_id, over_limit_purge_at')
      .is(flagColumn, null)
      .not('over_limit_purge_at', 'is', null)
      .gte('over_limit_purge_at', from)
      .lte('over_limit_purge_at', to)
      .limit(500)

    let sent = 0
    for (const m of museums ?? []) {
      if (!m.owner_id || !m.over_limit_purge_at) continue
      try {
        const lines = describeOverage(await measureOverage(service, m.id))
        // Already within the limits: nothing will be deleted, so no warning.
        if (lines.length === 0) continue

        const { data: owner } = await service.auth.admin.getUserById(m.owner_id)
        const email = owner?.user?.email
        if (!email) continue

        const { subject, html } = renderPurgeWarningEmail({
          museumName: m.name,
          overageLines: lines,
          purgeAt: m.over_limit_purge_at as string,
          daysLeft: daysBetween(m.over_limit_purge_at as string),
          siteUrl,
        })
        const result = await sendComplianceEmail({ to: email, subject, html })
        if (result.error) {
          console.error(`[deletion-warnings] ${flagColumn} ${m.id}:`, result.error)
          continue
        }
        await service
          .from('museums')
          .update({ [flagColumn]: new Date().toISOString() })
          .eq('id', m.id)
        sent++
      } catch (err) {
        console.error(`[deletion-warnings] ${flagColumn} ${m.id}:`, err)
      }
    }
    return { checked: museums?.length ?? 0, sent }
  }

  const purge30 = await sendPurgeWarnings('purge_warning_30d_sent_at', in29d, in31d)
  const purge7 = await sendPurgeWarnings('purge_warning_7d_sent_at', in6d, in8d)

  return NextResponse.json({
    sent_30d: sent30,
    sent_7d: sent7,
    checked_30d: due30?.length ?? 0,
    checked_7d: due7?.length ?? 0,
    purge_sent_30d: purge30.sent,
    purge_sent_7d: purge7.sent,
    purge_checked_30d: purge30.checked,
    purge_checked_7d: purge7.checked,
  })
}
