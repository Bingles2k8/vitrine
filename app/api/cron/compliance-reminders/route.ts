import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Daily cron that emails each museum owner a digest of upcoming/overdue
// compliance dates (condition checks, valuation reviews, insurance renewals,
// risk reviews). Triggered via vercel.json cron; protected by CRON_SECRET.
//
// Unlike the personal-loan cron there is no per-row reminder_sent_at flag, so
// to avoid daily spam we only send a museum's digest when it contains at least
// one item that is due within 7 days or already overdue. Because most dates
// sit in the 8–30 day band on any given day, a roughly monthly cadence emerges
// naturally as items cross the 7-day threshold. Adding a per-row
// reminder_sent_at flag (as the loan cron has) is a future improvement.

export const dynamic = 'force-dynamic'

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

type ObjRef = { title: string | null; emoji: string | null; accession_no: string | null } | null

type DueItem = {
  museumId: string
  type: string
  dateStr: string
  emoji: string | null
  objectTitle: string | null
  accession: string | null
  detail: string | null
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

  // Window: anything due on or before today + 30 days, including overdue rows
  // (dates in the past). "today" is treated as UTC midnight.
  const todayDate = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  const horizon = new Date(todayDate.getTime() + 30 * 86400000).toISOString().slice(0, 10)

  function daysUntil(dateStr: string): number {
    const d = new Date(dateStr + 'T00:00:00Z')
    return Math.round((d.getTime() - todayDate.getTime()) / 86400000)
  }

  const items: DueItem[] = []

  // NOTE: For condition assessments and valuations we include ANY row whose
  // date falls in the window, without checking whether a newer assessment /
  // valuation supersedes it. This can over-alert on historical rows; a proper
  // "latest per object" filter is a future improvement. Kept simple here.

  // Condition checks — condition_assessments.next_check_date (object_id NOT NULL)
  const { data: cond } = await service
    .from('condition_assessments')
    .select('id, museum_id, next_check_date, objects(title, emoji, accession_no)')
    .not('next_check_date', 'is', null)
    .lte('next_check_date', horizon)
    .limit(1000)
  for (const r of cond ?? []) {
    const obj = r.objects as unknown as ObjRef
    items.push({
      museumId: r.museum_id,
      type: 'Condition check due',
      dateStr: r.next_check_date as string,
      emoji: obj?.emoji ?? null,
      objectTitle: obj?.title ?? null,
      accession: obj?.accession_no ?? null,
      detail: null,
    })
  }

  // Valuation reviews — valuations.validity_date (object_id NOT NULL)
  const { data: vals } = await service
    .from('valuations')
    .select('id, museum_id, validity_date, objects(title, emoji, accession_no)')
    .not('validity_date', 'is', null)
    .lte('validity_date', horizon)
    .limit(1000)
  for (const r of vals ?? []) {
    const obj = r.objects as unknown as ObjRef
    items.push({
      museumId: r.museum_id,
      type: 'Valuation review due',
      dateStr: r.validity_date as string,
      emoji: obj?.emoji ?? null,
      objectTitle: obj?.title ?? null,
      accession: obj?.accession_no ?? null,
      detail: null,
    })
  }

  // Insurance renewals — insurance_policies.renewal_date (Active only, no object)
  const { data: ins } = await service
    .from('insurance_policies')
    .select('id, museum_id, renewal_date, provider, policy_number')
    .eq('status', 'Active')
    .not('renewal_date', 'is', null)
    .lte('renewal_date', horizon)
    .limit(1000)
  for (const r of ins ?? []) {
    const detailParts = [r.provider, r.policy_number].filter(Boolean) as string[]
    items.push({
      museumId: r.museum_id,
      type: 'Insurance renewal due',
      dateStr: r.renewal_date as string,
      emoji: null,
      objectTitle: null,
      accession: null,
      detail: detailParts.length ? detailParts.join(' · ') : null,
    })
  }

  // Risk reviews — risk_register.review_date (not Closed/Mitigated, object optional)
  const { data: risks } = await service
    .from('risk_register')
    .select('id, museum_id, review_date, risk_type, description, objects(title, emoji, accession_no)')
    .not('review_date', 'is', null)
    .lte('review_date', horizon)
    .not('status', 'in', '("Closed","Mitigated")')
    .limit(1000)
  for (const r of risks ?? []) {
    const obj = r.objects as unknown as ObjRef
    items.push({
      museumId: r.museum_id,
      type: 'Risk review due',
      dateStr: r.review_date as string,
      emoji: obj?.emoji ?? null,
      objectTitle: obj?.title ?? null,
      accession: obj?.accession_no ?? null,
      detail: (r.risk_type as string | null) || (r.description as string | null) || null,
    })
  }

  if (items.length === 0) return NextResponse.json({ museums: 0, itemsSent: 0 })

  // Resolve museums and owner emails (same approach as the loan cron).
  const museumIds = Array.from(new Set(items.map(i => i.museumId)))
  const { data: museums } = await service
    .from('museums')
    .select('id, name, owner_id')
    .in('id', museumIds)
  const museumMap = new Map((museums ?? []).map(m => [m.id, m]))

  const ownerIds = Array.from(new Set((museums ?? []).map(m => m.owner_id).filter(Boolean)))
  const ownerEmails = new Map<string, string>()
  for (const uid of ownerIds) {
    const { data } = await service.auth.admin.getUserById(uid)
    if (data?.user?.email) ownerEmails.set(uid, data.user.email)
  }

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

  let museumsSent = 0
  let itemsSent = 0

  for (const museumId of museumIds) {
    try {
      const museum = museumMap.get(museumId)
      if (!museum) continue
      const email = ownerEmails.get(museum.owner_id)
      if (!email) continue

      const museumItems = items.filter(i => i.museumId === museumId)
      if (museumItems.length === 0) continue

      // Only email when something is urgent (due within 7 days or overdue),
      // otherwise hold off so digests don't go out every single day.
      const hasUrgent = museumItems.some(i => daysUntil(i.dateStr) <= 7)
      if (!hasUrgent) continue

      museumItems.sort((a, b) => (a.dateStr < b.dateStr ? -1 : a.dateStr > b.dateStr ? 1 : 0))

      const rows = museumItems.map(i => {
        const d = daysUntil(i.dateStr)
        const when = d < 0
          ? `${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} overdue`
          : d === 0
            ? 'due today'
            : `due in ${d} day${d === 1 ? '' : 's'}`
        const color = d <= 0 ? '#b91c1c' : d <= 7 ? '#b45309' : '#555'
        const subjectBits: string[] = []
        if (i.objectTitle) subjectBits.push(`${i.emoji ? `${esc(i.emoji)} ` : ''}${esc(i.objectTitle)}`)
        if (i.accession) subjectBits.push(`(${esc(i.accession)})`)
        if (i.detail) subjectBits.push(esc(i.detail))
        const context = subjectBits.length ? ` — ${subjectBits.join(' ')}` : ''
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee">
              <strong>${esc(i.type)}</strong>${context}
            </td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:nowrap">${esc(i.dateStr)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:nowrap;color:${color}">${when}</td>
          </tr>`
      }).join('')

      const subject = `${museumItems.length} upcoming compliance date${museumItems.length === 1 ? '' : 's'} — ${museum.name}`
      const html = `
        <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;color:#1a1a1a">
          <h2 style="font-style:italic;margin:0 0 12px">Compliance reminders</h2>
          <p>These review and renewal dates for <strong>${esc(museum.name)}</strong> are coming up or overdue:</p>
          <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #ddd">Item</th>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #ddd">Date</th>
                <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #ddd">Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:20px"><a href="https://vitrinecms.com/dashboard/collections-review" style="color:#b45309">Open your compliance dashboard →</a></p>
          <hr style="border:none;border-top:1px solid #eee;margin-top:28px">
          <p style="font-size:12px;color:#888">Vitrine — ${esc(museum.name)}</p>
        </div>
      `

      if (resend) {
        await resend.emails.send({
          from: 'Vitrine <noreply@contact.vitrinecms.com>',
          to: email,
          subject,
          html,
        })
        museumsSent++
        itemsSent += museumItems.length
      }
    } catch {
      // Never let one museum break the loop; continue with the rest.
    }
  }

  return NextResponse.json({ museums: museumsSent, itemsSent })
}
