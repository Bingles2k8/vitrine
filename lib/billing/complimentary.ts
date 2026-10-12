/**
 * Complimentary plans: a paid plan an admin gives a museum for free, with no
 * end date. Demo and test accounts, partners, friends.
 *
 * museums.plan stays the one thing every gate reads. complimentary_plan only
 * records that the plan is a gift, so nothing offers to manage or cancel a
 * subscription that does not exist, MRR does not count it, and a Stripe
 * subscription ending cannot drop the museum below it.
 *
 * Server-only: imports the downgrade module, which talks to R2.
 */

import { getPlan, type PlanId } from '@/lib/plans'
import { CANCEL_PURGE_FIELDS, downgradeUpdate, retentionDays } from './downgrade'

export const COMPLIMENTARY_PLANS = ['hobbyist', 'professional', 'institution', 'enterprise'] as const
export type ComplimentaryPlan = (typeof COMPLIMENTARY_PLANS)[number]

export function isComplimentaryPlan(value: unknown): value is ComplimentaryPlan {
  return typeof value === 'string' && (COMPLIMENTARY_PLANS as readonly string[]).includes(value)
}

/**
 * Taking a complimentary plan away is treated like a paid subscription ending:
 * the museum moves to Community and anything over the limit gets the longer,
 * ever-paid window before it is deleted.
 */
export const COMPLIMENTARY_RETENTION_DAYS = retentionDays(true)

/** The museums columns written when a complimentary plan is granted. */
export function grantComplimentaryUpdate(planId: ComplimentaryPlan): Record<string, unknown> {
  return {
    plan: planId,
    ui_mode: getPlan(planId as PlanId).fullMode ? 'full' : 'simple',
    complimentary_plan: planId,
    pending_downgrade_plan: null,
    pending_downgrade_date: null,
    payment_past_due: false,
    locked_at: null,
    lock_reason: null,
    read_only_until: null,
    scheduled_deletion_at: null,
    deletion_warning_30d_sent_at: null,
    deletion_warning_7d_sent_at: null,
    // On a paid plan again, so nothing over Community's limits is deleted.
    ...CANCEL_PURGE_FIELDS,
  }
}

/** The museums columns written when a complimentary plan is taken away. */
export function revokeComplimentaryUpdate(args: {
  now: Date
  /** Null when nothing is over Community's limits. */
  purgeAt: Date | null
}): Record<string, unknown> {
  return {
    ...downgradeUpdate({ now: args.now, purgeAt: args.purgeAt, retentionDays: COMPLIMENTARY_RETENTION_DAYS }),
    complimentary_plan: null,
  }
}
