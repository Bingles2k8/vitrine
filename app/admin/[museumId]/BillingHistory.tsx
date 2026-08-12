import { createClient } from '@supabase/supabase-js'

/**
 * The compliance evidence for one customer, on one screen.
 *
 * DMCCA workstream 6: if a regulator or a customer asks what we did, this is
 * the answer. Every notice sent, every cancellation interaction with its
 * timestamps, and every refund, in one place and in time order.
 *
 * Server component reading through the service role, because the evidence
 * tables have no foreign key to museums and deliberately outlive the account,
 * so an admin must be able to read records for a museum that no longer exists.
 */

type Props = { museumId: string }

const NOTICE_LABELS: Record<string, string> = {
  pre_contract: 'Key contract information',
  trial_ending_7d: 'Trial ending, 7 days',
  trial_ending_2d: 'Trial ending, 2 days',
  trial_ending_mid: 'Trial ending, midpoint',
  trial_ending_24h: 'Trial ending, 24 hours',
  renewal_30d: 'Renewal reminder, 30 days',
  renewal_7d: 'Renewal reminder, 7 days',
  periodic_6m: 'Six monthly reminder',
  price_change_30d: 'Price change, 30 days',
}

const CANCEL_LABELS: Record<string, string> = {
  requested: 'Cancellation requested',
  scheduled_at_period_end: 'Cancelled at period end',
  cancelled_immediately: 'Cancelled immediately',
  reversed: 'Cancellation reversed',
  failed: 'Cancellation failed',
}

function fmt(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

function money(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return '—'
  const code = (currency ?? 'gbp').toUpperCase()
  const value = ['ISK', 'JPY', 'KRW'].includes(code) ? amount : amount / 100
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: code }).format(value)
  } catch {
    return `${value} ${code}`
  }
}

export default async function BillingHistory({ museumId }: Props) {
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [notices, cancellations, refunds, subscriptions] = await Promise.all([
    service
      .from('subscription_notices')
      .select('*')
      .eq('museum_id', museumId)
      .order('created_at', { ascending: false }),
    service
      .from('cancellation_events')
      .select('*')
      .eq('museum_id', museumId)
      .order('created_at', { ascending: false }),
    service
      .from('refunds')
      .select('*')
      .eq('museum_id', museumId)
      .order('created_at', { ascending: false }),
    service
      .from('subscriptions')
      .select('*')
      .eq('museum_id', museumId)
      .order('created_at', { ascending: false }),
  ])

  const nothing =
    (notices.data?.length ?? 0) === 0 &&
    (cancellations.data?.length ?? 0) === 0 &&
    (refunds.data?.length ?? 0) === 0 &&
    (subscriptions.data?.length ?? 0) === 0

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500">
        Billing compliance record
      </h2>
      <p className="text-xs text-gray-400 mt-1">
        Retained for six years and kept even if the account is deleted. Append-only: these rows
        cannot be edited or removed.
      </p>

      {nothing && (
        <p className="text-sm text-gray-400 mt-4">
          Nothing recorded. This museum has never had a subscription.
        </p>
      )}

      {(subscriptions.data?.length ?? 0) > 0 && (
        <Table
          title="Subscriptions"
          head={['Started', 'Status', 'Plan', 'Amount', 'Period ends', 'Cooling-off ends']}
          rows={(subscriptions.data ?? []).map((s) => [
            fmt(s.created_at),
            s.status ?? '—',
            s.plan ?? '—',
            money(s.unit_amount, s.currency),
            fmt(s.current_period_end),
            fmt(s.cooling_off_ends_at),
          ])}
        />
      )}

      {(cancellations.data?.length ?? 0) > 0 && (
        <Table
          title="Cancellations"
          head={['When', 'What happened', 'Who asked', 'Takes effect', 'In cooling-off', 'Refund']}
          rows={(cancellations.data ?? []).map((c) => [
            fmt(c.created_at),
            CANCEL_LABELS[c.event] ?? c.event,
            c.initiated_by === 'support'
              ? `Support (${c.actor_email ?? 'unknown'})`
              : c.initiated_by === 'stripe_portal'
                ? 'Customer, via Stripe portal'
                : 'Customer, in app',
            fmt(c.effective_at),
            c.cooling_off_active ? 'Yes' : 'No',
            money(c.refund_amount, c.currency),
          ])}
        />
      )}

      {(refunds.data?.length ?? 0) > 0 && (
        <Table
          title="Refunds"
          head={['When', 'State', 'Amount', 'Reason', 'Stripe refund', 'Note']}
          rows={(refunds.data ?? []).map((r) => [
            fmt(r.created_at),
            r.event,
            money(r.amount, r.currency),
            r.reason ?? '—',
            r.stripe_refund_id ?? '—',
            r.error ?? '—',
          ])}
        />
      )}

      {(notices.data?.length ?? 0) > 0 && (
        <Table
          title="Notices sent"
          head={['When', 'Notice', 'Sent to', 'Delivered', 'Message id', 'Content hash']}
          rows={(notices.data ?? []).map((n) => [
            fmt(n.created_at),
            NOTICE_LABELS[n.notice_type] ?? n.notice_type,
            n.recipient_email ?? '—',
            n.sent_at ? fmt(n.sent_at) : `Failed: ${n.error ?? 'unknown'}`,
            n.provider_message_id ?? '—',
            n.content_hash ? `${n.content_hash.slice(0, 12)}…` : '—',
          ])}
        />
      )}
    </section>
  )
}

function Table({
  title,
  head,
  rows,
}: {
  title: string
  head: string[]
  rows: (string | number | null)[][]
}) {
  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-gray-600 mb-2">{title}</h3>
      <div className="overflow-x-auto border border-gray-200 rounded">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {head.map((h) => (
                <th key={h} className="text-left font-medium text-gray-500 px-3 py-2 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {cell ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
