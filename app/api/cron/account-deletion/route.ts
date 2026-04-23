import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { deleteMuseumEverywhere } from '@/lib/delete-museum-data'

// Daily cron: permanently deletes museums whose scheduled_deletion_at has
// passed. Sends a final "your account has been deleted" email immediately
// before each deletion (last chance to recover is gone at this point).
//
// Batched to 50/run to stay under Vercel's 5-minute invocation cap — if the
// queue exceeds 50, tomorrow's run picks up the rest.

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

  const { data: due, error } = await service
    .from('museums')
    .select('id, name, owner_id, lock_reason')
    .lte('scheduled_deletion_at', new Date().toISOString())
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!due || due.length === 0) return NextResponse.json({ deleted: 0 })

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const m of due) {
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

  return NextResponse.json({
    deleted: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  })
}
