/**
 * Key contract information.
 *
 * DMCCA requires that certain facts are given to the customer before they are
 * bound, in a form they can keep, and that we can later show what they were
 * shown. This module is the single source for those facts. The on-screen panel
 * and the confirmation email both render from the same object, so the two
 * cannot drift.
 *
 * Two rules the callers must honour and this module cannot enforce:
 *
 *  - The panel goes immediately before the customer is sent to Checkout, not
 *    after, and not on a page they might skip.
 *  - None of it may sit behind an accordion, a tooltip, or a link to the terms.
 *    All of it is visible at once or it does not count as having been given.
 */

import { PLANS, type PlanId } from '@/lib/plans'
import { formatPlanAmount } from '@/lib/planPricing'
import { type BillingCurrency } from '@/lib/countryCurrency'
import { COOLING_OFF_DAYS, VAT_REGISTERED } from './config'
import { formatBillingDate } from './coolingOff'

/**
 * Bump whenever the wording or the set of facts changes.
 *
 * Stored against every subscription and every pre-contract notice, so that if a
 * customer disputes what they were told we can identify the exact version they
 * saw rather than guessing from the current code.
 */
export const KEY_CONTRACT_INFO_VERSION = '2026-08-11.1'

export type KeyContractTerm = {
  label: string
  value: string
}

export type KeyContractInfo = {
  version: string
  planLabel: string
  /** What the subscription actually provides. */
  provides: string[]
  terms: KeyContractTerm[]
  /** Present only where a trial applies. Rendered at least as prominently as
   *  the trial offer itself, which is the caller's responsibility. */
  trial: KeyContractTerm[] | null
  /** Present only where a discount or introductory price applies. */
  introductoryPrice: KeyContractTerm[] | null
}

export function buildKeyContractInfo(args: {
  planId: PlanId
  currency: BillingCurrency
  /** When the subscription starts. Defaults to now. */
  startsAt?: Date
  /** Trial length in days, if one applies. */
  trialDays?: number | null
  /**
   * An introductory or discounted price, if one applies. Vitrine uses none
   * today; the shape exists so that adding one cannot skip the disclosure.
   */
  introductory?: {
    amount: string
    months: number
    thenAmount: string
  } | null
}): KeyContractInfo {
  const plan = PLANS[args.planId]
  const startsAt = args.startsAt ?? new Date()
  const amount = formatPlanAmount(args.planId, args.currency)
  const trialDays = args.trialDays ?? null

  // With a trial, the first charge is deferred to the end of it. Without one,
  // the customer is charged on the day they subscribe.
  const firstChargeAt = trialDays
    ? new Date(startsAt.getTime() + trialDays * 24 * 60 * 60 * 1000)
    : startsAt
  const renewalAt = addMonths(firstChargeAt, 1)

  // While unregistered for VAT there is no VAT in the price, and saying there
  // is would be a false statement about tax. See VAT_REGISTERED.
  const priceValue = VAT_REGISTERED ? `${amount} per month, including VAT` : `${amount} per month`

  const terms: KeyContractTerm[] = [
    { label: 'Price', value: priceValue },
    { label: 'Billing frequency', value: 'Every month, on the same date each month' },
    {
      label: 'First charge',
      value: trialDays
        ? `${amount} on ${formatBillingDate(firstChargeAt)}, when your free trial ends`
        : `${amount} today, ${formatBillingDate(firstChargeAt)}`,
    },
    {
      label: 'First renewal',
      value: `${amount} on ${formatBillingDate(renewalAt)}`,
    },
    {
      label: 'Does it renew automatically?',
      value: 'Yes. It renews every month until you cancel it.',
    },
    {
      label: 'Minimum term',
      value: 'None. There is no minimum term and no cancellation fee.',
    },
    {
      label: 'How to cancel',
      value:
        'Go to Plan and Billing in your dashboard and press Cancel subscription. It takes two clicks and you do not need to contact us. You can also reply to any email from us and we will do it for you.',
    },
    {
      label: 'Your right to change your mind',
      value: `You have ${COOLING_OFF_DAYS} days to cancel and get your money back. This applies when you first subscribe, again when a free trial converts to a paid subscription, and again after every renewal. If you cancel within those ${COOLING_OFF_DAYS} days we refund the part of the period you have not used.`,
    },
    {
      label: 'What happens to your collection if you cancel',
      value:
        'Nothing is deleted. Your account becomes read-only and you can download a full copy at any time. Records are kept for 180 days if you have paid, or 30 days if you only used a free trial, and we email you before anything is removed.',
    },
  ]

  const trial: KeyContractTerm[] | null = trialDays
    ? [
        { label: 'Free trial', value: `${trialDays} days, free` },
        { label: 'Your trial ends', value: formatBillingDate(firstChargeAt) },
        {
          label: 'What you are charged then',
          value: `${amount}, automatically, unless you cancel first`,
        },
        {
          label: 'Cancelling before you are charged',
          value: `Cancel any time before ${formatBillingDate(firstChargeAt)} and you will not be charged at all. Go to Plan and Billing and press Cancel subscription. We will also email you ${trialDays >= 7 ? '7 days and 2 days' : 'partway through and 24 hours'} before the trial ends.`,
        },
      ]
    : null

  const introductoryPrice: KeyContractTerm[] | null = args.introductory
    ? [
        {
          label: 'Introductory price',
          value: `${args.introductory.amount} per month for the first ${args.introductory.months} ${args.introductory.months === 1 ? 'month' : 'months'}`,
        },
        {
          label: 'Price after that',
          value: `${args.introductory.thenAmount} per month, from month ${args.introductory.months + 1} onwards`,
        },
      ]
    : null

  return {
    version: KEY_CONTRACT_INFO_VERSION,
    planLabel: plan.label,
    provides: plan.features ?? [],
    terms,
    trial,
    introductoryPrice,
  }
}

/**
 * Add whole months, clamping to the end of a shorter month.
 *
 * 31 January plus one month is 28 February, not 3 March. Stripe anchors billing
 * the same way, so this keeps the date we show in line with the date the
 * customer is actually charged.
 */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime())
  const targetMonth = d.getUTCMonth() + months
  const dayOfMonth = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(targetMonth)
  const daysInTargetMonth = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
  ).getUTCDate()
  d.setUTCDate(Math.min(dayOfMonth, daysInTargetMonth))
  return d
}

/** Flattened text, used for hashing and for the plain-text email fallback. */
export function keyContractInfoAsText(info: KeyContractInfo): string {
  const lines: string[] = [`${info.planLabel} plan`, '']
  if (info.trial) {
    for (const t of info.trial) lines.push(`${t.label}: ${t.value}`)
    lines.push('')
  }
  if (info.introductoryPrice) {
    for (const t of info.introductoryPrice) lines.push(`${t.label}: ${t.value}`)
    lines.push('')
  }
  for (const t of info.terms) lines.push(`${t.label}: ${t.value}`)
  return lines.join('\n')
}
