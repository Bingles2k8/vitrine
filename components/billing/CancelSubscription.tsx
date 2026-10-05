'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatBillingDate, coolingOffDaysRemaining, isWithinCoolingOff } from '@/lib/billing/coolingOff'
import BalancedChoice from '@/components/billing/BalancedChoice'

/**
 * Cancellation control and confirmation dialogue.
 *
 * Built to the DMCCA easy-exit rules, which are stricter than ordinary product
 * instinct and are deliberately not negotiable in this component:
 *
 *  - Two clicks from the dashboard. "Plan & Billing" in the sidebar, then the
 *    button below. Nothing may be inserted between them.
 *  - No exit survey, of any kind, skippable or otherwise.
 *  - No save offer. If one is ever added it gets a single screen with exactly
 *    one offer, and the continue-to-cancel control must keep equal weight.
 *  - Exactly one "are you sure", which is this dialogue. No second confirmation.
 *  - The keep and cancel buttons are the same size, the same shape and the same
 *    contrast. No confirmshaming copy anywhere.
 *
 * There is an end-to-end assertion on the click depth in
 * __tests__/lib/cancelClickDepth.test.ts so a future redesign cannot quietly
 * regress it.
 */

type MirrorRow = {
  cooling_off_started_at: string | null
  cooling_off_ends_at: string | null
  current_period_end: string | null
  unit_amount: number | null
  currency: string | null
}

type Props = {
  museumId: string
  /** Called after a successful cancellation so the page can refresh. */
  onCancelled?: () => void
  /** Trigger text. The Community card uses "Downgrade to Community". */
  triggerLabel?: string
}

/** From /api/subscription/downgrade-preview. */
type Preview = {
  /** What is over Community's limits. Null if it could not be measured. */
  lines: string[] | null
  /** Community's limits in one line, for when `lines` is null. */
  limits: string
  retentionDays: number
}

export default function CancelSubscription({ museumId, onCancelled, triggerLabel = 'Cancel subscription' }: Props) {
  const [open, setOpen] = useState(false)
  const [mirror, setMirror] = useState<MirrorRow | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [mode, setMode] = useState<'period_end' | 'immediate'>('period_end')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ effectiveAt: string; mode: string } | null>(null)

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase
      .from('subscriptions')
      .select('cooling_off_started_at, cooling_off_ends_at, current_period_end, unit_amount, currency')
      .eq('museum_id', museumId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setMirror(data as MirrorRow | null))
    fetch('/api/subscription/downgrade-preview')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setPreview(data as Preview | null))
      .catch(() => setPreview(null))
  }, [open, museumId])

  const window_ =
    mirror?.cooling_off_started_at && mirror?.cooling_off_ends_at
      ? { startsAt: mirror.cooling_off_started_at, endsAt: mirror.cooling_off_ends_at }
      : null
  const inCoolingOff = isWithinCoolingOff(window_)
  const daysLeft = coolingOffDaysRemaining(window_)

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }
      setDone({ effectiveAt: json.effectiveAt, mode: json.mode })
      onCancelled?.()
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded border border-stone-200 dark:border-stone-700 p-4 text-sm">
        <p className="text-stone-700 dark:text-stone-300">
          {done.mode === 'immediate'
            ? 'Your subscription has been cancelled and your museum is now on the free Community plan.'
            : `Your subscription has been cancelled. You keep full access until ${formatBillingDate(done.effectiveAt)}, then move to the free Community plan.`}
        </p>
        <p className="text-stone-500 dark:text-stone-400 mt-2">
          We have emailed you a confirmation, including what is over Community&apos;s limits and how
          to download a copy of your collection. Nothing has been deleted.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Click two of two. Plain, findable, not hidden behind a menu. */}
      <button
        onClick={() => setOpen(true)}
        data-testid="cancel-subscription-trigger"
        className="w-full text-xs font-mono py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="bg-white dark:bg-stone-900 rounded-lg max-w-md w-full p-6 shadow-lg max-h-full overflow-y-auto">
            <h2
              id="cancel-dialog-title"
              className="text-base font-medium text-stone-900 dark:text-stone-100"
            >
              Cancel your subscription?
            </h2>

            {inCoolingOff ? (
              <>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                  You are within your 14 day cooling-off period, with {daysLeft}{' '}
                  {daysLeft === 1 ? 'day' : 'days'} left. You can choose either option below.
                </p>

                {/* Two genuine choices, presented identically. Period end is
                    preselected because it is the option that surprises nobody. */}
                <div className="mt-4 space-y-2">
                  <ChoiceCard
                    selected={mode === 'period_end'}
                    onSelect={() => setMode('period_end')}
                    title="Cancel at the end of the period"
                    body={
                      mirror?.current_period_end
                        ? `You keep full access until ${formatBillingDate(mirror.current_period_end)} and are not charged again. No refund, because you keep the time you paid for.`
                        : 'You keep full access until the end of the period you have paid for, and are not charged again.'
                    }
                  />
                  <ChoiceCard
                    selected={mode === 'immediate'}
                    onSelect={() => setMode('immediate')}
                    title="Cancel now and get a refund"
                    body="Your paid plan ends today and your museum moves to the free Community plan. We refund the part of this period you have not used, to the card you paid with."
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                {mirror?.current_period_end
                  ? `You keep full access until ${formatBillingDate(mirror.current_period_end)}, which is the end of the period you have already paid for. You will not be charged again.`
                  : 'You keep full access until the end of the period you have already paid for. You will not be charged again.'}
              </p>
            )}

            <DowngradeNotice preview={preview} />

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-4" role="alert">
                {error}
              </p>
            )}

            {/* Equal visual weight, as required. Same padding, same border, same
                font size, same contrast. Neither is a bare text link, and
                neither carries language designed to shame the other choice. */}
            <BalancedChoice
              disabled={submitting}
              keep={{ label: 'Keep my subscription', onClick: () => setOpen(false), testId: 'cancel-subscription-keep' }}
              proceed={{
                label: submitting ? 'Cancelling…' : 'Cancel subscription',
                onClick: submit,
                testId: 'cancel-subscription-confirm',
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  body: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left p-3 rounded border transition-colors ${
        selected
          ? 'border-stone-400 dark:border-stone-500 bg-stone-50 dark:bg-stone-800'
          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60'
      }`}
    >
      <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">{title}</span>
      <span className="block text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
        {body}
      </span>
    </button>
  )
}

/**
 * What happens to the collection when the plan ends. Specific when the
 * overage could be measured, the general limits when it could not. Stated as
 * plain facts: this is information the customer is owed before cancelling,
 * not a reason to stay.
 */
function DowngradeNotice({ preview }: { preview: Preview | null }) {
  const days = preview?.retentionDays ?? 180
  const lines = preview?.lines

  return (
    <div className="text-sm text-stone-600 dark:text-stone-400 mt-4 space-y-2">
      <p>
        When your plan ends, your museum moves to the free Community plan. Your dashboard and
        public site stay online.
      </p>
      {lines && lines.length === 0 ? (
        <p>Everything you have fits within Community&apos;s limits, so nothing will be deleted.</p>
      ) : (
        <>
          {lines ? (
            <>
              <p>This is over Community&apos;s limits:</p>
              <ul className="list-disc pl-5 space-y-0.5" data-testid="downgrade-overage">
                {lines.map(line => <li key={line}>{line}</li>)}
              </ul>
            </>
          ) : (
            <p>{preview?.limits ?? 'Community has lower limits than your current plan.'}</p>
          )}
          <p>
            Anything still over those limits {days} days after your plan ends is permanently deleted,
            most recently added first. Resubscribe before then and nothing is deleted.
          </p>
        </>
      )}
      <p className="text-stone-500 dark:text-stone-400">
        You can download a full copy of your collection at any time from Settings. We will email you
        a confirmation.
      </p>
    </div>
  )
}
