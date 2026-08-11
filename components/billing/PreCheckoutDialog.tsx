'use client'

import { useMemo } from 'react'
import KeyContractInformation from './KeyContractInformation'
import { buildKeyContractInfo } from '@/lib/billing/keyContractInfo'
import type { PlanId } from '@/lib/plans'
import type { BillingCurrency } from '@/lib/countryCurrency'

/**
 * The gate between choosing a plan and paying for it.
 *
 * DMCCA requires the key contract information to be given "before the customer
 * is bound". Sending someone straight from an upgrade button to Stripe Checkout
 * does not do that, because by the time they see a price they are already on
 * the payment page.
 *
 * So this sits in between: the full panel, then a single button to continue.
 * It is deliberately a step in the funnel, and it will cost some conversion.
 * That is the requirement rather than a design choice.
 *
 * The dismiss control is a plain "Go back", not a dark pattern. Nothing here
 * pressures the customer to continue.
 */
export default function PreCheckoutDialog({
  planId,
  currency,
  trialDays,
  onConfirm,
  onDismiss,
  submitting,
}: {
  planId: PlanId
  currency: BillingCurrency
  trialDays: number | null
  onConfirm: () => void
  onDismiss: () => void
  submitting: boolean
}) {
  const info = useMemo(
    () => buildKeyContractInfo({ planId, currency, trialDays }),
    [planId, currency, trialDays]
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="key-contract-info-heading"
    >
      <div className="bg-white dark:bg-stone-900 rounded-lg max-w-lg w-full shadow-lg max-h-full overflow-y-auto">
        <KeyContractInformation info={info} className="border-0" />

        <div className="flex gap-2 p-4 pt-0">
          <button
            onClick={onDismiss}
            disabled={submitting}
            className="flex-1 text-sm py-2.5 rounded border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Go back
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            data-testid="continue-to-payment"
            className="flex-1 text-sm py-2.5 rounded bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Redirecting…' : trialDays ? 'Start free trial' : 'Continue to payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
