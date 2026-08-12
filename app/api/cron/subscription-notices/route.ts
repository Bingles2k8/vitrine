import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { PLANS, type PlanId } from '@/lib/plans'
import { formatPlanAmount } from '@/lib/planPricing'
import { normalizeBillingCurrency } from '@/lib/countryCurrency'
import { dueNotices, type ScheduleSubject } from '@/lib/billing/noticeSchedule'
import { renderReminderEmail, REMINDER_CONTENT_VERSION } from '@/lib/billing/reminderEmail'
import { sendAndRecordNotice, noticeAlreadySent } from '@/lib/billing/notices'
import { syncSubscriptionToMirror } from '@/lib/billing/syncSubscription'

// Daily cron: statutory subscription notices, plus reconciliation.
//
// Two jobs in one route deliberately. Vercel is on the hobby plan, where crons
// run once a day and the project already declares seven, so adding two more
// would be pushing it. Statutory notices are day-granular anyway: a "7 days
// before renewal" notice does not care which hour it lands in. Anything with a
// one-hour deadline (the cancellation confirmation, the pre-contract email) is
// sent inline from the request and never comes near this route.
//
// PASS 1, dispatch. Walks the subscriptions mirror, asks lib/billing/
// noticeSchedule which notices are due, and sends the ones not already sent.
//
// PASS 2, reconcile. Walks Stripe's own list of subscriptions and re-syncs any
// that differ from the mirror. A dropped webhook otherwise turns into a missed
// statutory notice, silently, which is the failure mode this whole exercise
// exists to avoid. Reconciliation is what makes the webhooks non-load-bearing.
//
// SAFETY: ?dryRun=1 computes and reports without sending. Unlike the
// reengagement cron there is no environment kill switch, because a statutory
// notice pipeline should not have a convenient off switch.

export const dynamic = 'force-dynamic'
export const maxDuration = 300

type Report = {
  dryRun: boolean
  considered: number
  due: Array<{ subscription: string; type: string; scheduledAt: string }>
  sent: number
  skipped: number
  failed: Array<{ subscription: string; type: string; error: string }>
  reconciled: string[]
  reconcileError?: string
}

export async function GET(request: Request) {
  const authz = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authz !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1'
  const now = new Date()

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const report: Report = {
    dryRun,
    considered: 0,
    due: [],
    sent: 0,
    skipped: 0,
    failed: [],
    reconciled: [],
  }

  // ---- Pass 1: dispatch --------------------------------------------------

  const { data: subs } = await service
    .from('subscriptions')
    .select(
      'museum_id, stripe_subscription_id, status, billing_interval, billing_interval_count, current_period_start, current_period_end, trial_start, trial_end, cancel_at_period_end, created_at, plan, currency, unit_amount'
    )
    .in('status', ['active', 'trialing'])

  report.considered = subs?.length ?? 0

  for (const sub of subs ?? []) {
    const notices = dueNotices(sub as ScheduleSubject, now)
    if (notices.length === 0) continue

    for (const notice of notices) {
      report.due.push({
        subscription: sub.stripe_subscription_id,
        type: notice.type,
        scheduledAt: notice.scheduledAt,
      })

      if (dryRun) continue

      // The unique index prevents a duplicate row, but the send happens before
      // the insert, so this check is what prevents a duplicate email.
      const already = await noticeAlreadySent({
        supabase: service,
        stripeSubscriptionId: sub.stripe_subscription_id,
        noticeType: notice.type,
        scheduledAt: notice.scheduledAt,
      })
      if (already) {
        report.skipped++
        continue
      }

      const recipient = await ownerEmail(service, sub.museum_id)
      if (!recipient) {
        report.failed.push({
          subscription: sub.stripe_subscription_id,
          type: notice.type,
          error: 'no recipient',
        })
        continue
      }

      const { data: museum } = await service
        .from('museums')
        .select('name')
        .eq('id', sub.museum_id)
        .maybeSingle()

      const planId = (sub.plan ?? 'professional') as PlanId
      const { subject, html } = renderReminderEmail({
        noticeType: notice.type,
        museumName: museum?.name ?? null,
        planLabel: PLANS[planId]?.label ?? planId,
        amount: formatPlanAmount(planId, normalizeBillingCurrency(sub.currency)),
        eventAt: notice.eventAt,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com',
      })

      const result = await sendAndRecordNotice({
        supabase: service,
        museumId: sub.museum_id,
        stripeSubscriptionId: sub.stripe_subscription_id,
        noticeType: notice.type,
        to: recipient,
        subject,
        html,
        contentVersion: REMINDER_CONTENT_VERSION,
        scheduledAt: notice.scheduledAt,
      })

      if (result.sent) report.sent++
      else
        report.failed.push({
          subscription: sub.stripe_subscription_id,
          type: notice.type,
          error: result.error ?? 'unknown',
        })
    }
  }

  // ---- Pass 2: reconcile against Stripe ----------------------------------
  // Deliberately after dispatch, so a subscription pulled in by reconciliation
  // gets its notices on the next run rather than being sent a backlog the
  // instant it appears.

  if (!dryRun) {
    try {
      const mirrorById = new Map((subs ?? []).map((s) => [s.stripe_subscription_id, s]))

      for await (const stripeSub of stripe.subscriptions.list({
        status: 'all',
        limit: 100,
        expand: ['data.items'],
      })) {
        const museumId = stripeSub.metadata?.museum_id
        if (!museumId) continue

        const mirror = mirrorById.get(stripeSub.id)
        const item = stripeSub.items.data[0]
        const stripeEnd = item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null

        const drifted =
          !mirror ||
          mirror.status !== stripeSub.status ||
          mirror.current_period_end !== stripeEnd ||
          (mirror.cancel_at_period_end ?? false) !== (stripeSub.cancel_at_period_end ?? false)

        if (drifted) {
          await syncSubscriptionToMirror({
            supabase: service,
            museumId,
            subscription: stripeSub,
          })
          report.reconciled.push(stripeSub.id)
        }
      }
    } catch (err) {
      // Reconciliation failing must not lose the dispatch results above.
      report.reconcileError = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json(report)
}

async function ownerEmail(service: SupabaseClient, museumId: string): Promise<string | null> {
  const { data: museum } = await service
    .from('museums')
    .select('owner_id, contact_email')
    .eq('id', museumId)
    .maybeSingle()
  if (!museum) return null

  if (museum.owner_id) {
    try {
      const { data } = await service.auth.admin.getUserById(museum.owner_id)
      if (data?.user?.email) return data.user.email
    } catch {
      // Fall through to the contact address.
    }
  }
  return museum.contact_email ?? null
}
