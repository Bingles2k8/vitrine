import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { signReminderUnsubscribeToken } from '@/lib/emailTokens'

// Daily cron that emails museum owners when a personal loan is overdue.
// Triggered via vercel.json cron; protected by CRON_SECRET.
// One email per loan — flagged by reminder_sent_at so we don't re-send.
//
// Carries an unsubscribe link and honours museums.reminder_opt_out. This is a
// reminder the recipient never asked for per-send, so it is not the kind of
// essential account mail that may go out without a way to stop it. The opt-out
// is its own column rather than the re-engagement one: someone who wants no
// more "come back to Vitrine" mail may still want to know an object they lent
// out has not come home.

export const dynamic = 'force-dynamic'

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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().slice(0, 10)

  // Opted-out museums are excluded HERE rather than after the fetch.
  //
  // Their loans can never be marked `reminder_sent_at`, because nothing is
  // sent — so filtering later leaves them in this query permanently, and the
  // 500-row cap is then shared with a set that only ever grows. Enough of them
  // and a museum that does want its reminders stops getting them, which is a
  // silent failure nobody would think to look for.
  const { data: optedOut } = await service
    .from('museums')
    .select('id')
    .eq('reminder_opt_out', true)
  const optedOutIds = (optedOut ?? []).map(m => m.id)

  let dueQuery = service
    .from('personal_loans')
    .select('id, museum_id, object_id, borrower_name, lent_on, due_back, note, objects(title, emoji, accession_no)')
    .is('returned_on', null)
    .is('reminder_sent_at', null)
    .lt('due_back', today)

  // Only applied when there is something to exclude. An empty `in.()` is
  // accepted by PostgREST and excludes nothing, so this is for clarity rather
  // than correctness — the clause would simply be dead weight on every run.
  if (optedOutIds.length > 0) {
    dueQuery = dueQuery.not('museum_id', 'in', `(${optedOutIds.join(',')})`)
  }

  const { data: due, error } = await dueQuery.limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due || due.length === 0) return NextResponse.json({ sent: 0 })

  const museumIds = Array.from(new Set(due.map(l => l.museum_id)))
  const { data: museums } = await service
    .from('museums')
    .select('id, name, owner_id')
    .in('id', museumIds)
    // Belt and braces: the loans of an opted-out museum are already excluded
    // above, so this only matters if someone opts out mid-run.
    .eq('reminder_opt_out', false)
  const museumMap = new Map((museums ?? []).map(m => [m.id, m]))

  const ownerIds = Array.from(new Set((museums ?? []).map(m => m.owner_id).filter(Boolean)))
  const ownerEmails = new Map<string, string>()
  for (const uid of ownerIds) {
    const { data } = await service.auth.admin.getUserById(uid)
    if (data?.user?.email) ownerEmails.set(uid, data.user.email)
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com'
  let sent = 0
  const reminderIds: string[] = []

  for (const loan of due) {
    const museum = museumMap.get(loan.museum_id)
    if (!museum) continue
    const email = ownerEmails.get(museum.owner_id)
    if (!email) continue
    const obj = loan.objects as unknown as { title: string | null; emoji: string | null; accession_no: string | null } | null
    const title = obj?.title || 'your object'
    const unsubscribeUrl = `${siteUrl}/api/reengagement/unsubscribe?token=${signReminderUnsubscribeToken(museum.id)}`
    const subject = `${obj?.emoji ? `${obj.emoji} ` : ''}${title} is overdue: lent to ${loan.borrower_name}`
    const html = `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
        <h2 style="font-style:italic;margin:0 0 12px">Overdue loan reminder</h2>
        <p>You lent <strong>${esc(title)}</strong>${obj?.accession_no ? ` (${esc(obj.accession_no)})` : ''} to <strong>${esc(loan.borrower_name)}</strong> on ${esc(loan.lent_on)}.</p>
        <p>It was due back on <strong>${esc(loan.due_back)}</strong>.</p>
        ${loan.note ? `<p style="color:#555"><em>${esc(loan.note)}</em></p>` : ''}
        <p style="margin-top:20px"><a href="https://vitrinecms.com/dashboard/on-loan" style="color:#b45309">Open your loan tracker →</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
        <p style="font-size:12px;color:#888">
          Vitrine &middot; ${esc(museum.name)}<br>
          <a href="${unsubscribeUrl}" style="color:#888">Unsubscribe from reminder emails</a>.
          This will not affect billing or security notices.
        </p>
      </div>
    `
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Vitrine <noreply@contact.vitrinecms.com>',
          to: email,
          subject,
          html,
          headers: {
            // Lets mail clients surface a native Unsubscribe control.
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
        sent++
        reminderIds.push(loan.id)
      } catch {
        // continue with other loans
      }
    }
  }

  if (reminderIds.length > 0) {
    await service
      .from('personal_loans')
      .update({ reminder_sent_at: new Date().toISOString() })
      .in('id', reminderIds)
  }

  return NextResponse.json({ sent, checked: due.length })
}
