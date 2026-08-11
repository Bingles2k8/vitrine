/**
 * Recording statutory subscription notices.
 *
 * Every notice we send is written to `subscription_notices`, including failed
 * attempts. A failed send is evidence too: it shows we tried, when, and why it
 * did not arrive, which is a far better position than a silent gap.
 *
 * The table is append-only at the database level, so nothing here updates a
 * row. Scheduling and sending are separate inserts.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { sendComplianceEmail } from '@/lib/email/send'

export type NoticeType =
  | 'pre_contract'
  | 'trial_ending_7d'
  | 'trial_ending_2d'
  | 'trial_ending_mid'
  | 'trial_ending_24h'
  | 'renewal_30d'
  | 'renewal_7d'
  | 'periodic_6m'
  | 'price_change_30d'

/**
 * Send a notice and record the outcome.
 *
 * Never throws. A notice failing must not fail the operation that triggered it:
 * a subscription should not be rejected because a confirmation email bounced.
 * The row records the failure for the reconciliation job to retry.
 */
export async function sendAndRecordNotice(args: {
  supabase: SupabaseClient
  museumId: string
  stripeSubscriptionId: string | null
  noticeType: NoticeType
  to: string
  subject: string
  html: string
  contentVersion: string
  /** When this notice was due. Null for one sent immediately on an event. */
  scheduledAt?: string | null
}): Promise<{ sent: boolean; error: string | null }> {
  const result = await sendComplianceEmail({
    to: args.to,
    subject: args.subject,
    html: args.html,
  })

  const { error: insertError } = await args.supabase.from('subscription_notices').insert({
    museum_id: args.museumId,
    stripe_subscription_id: args.stripeSubscriptionId,
    notice_type: args.noticeType,
    scheduled_at: args.scheduledAt ?? null,
    sent_at: result.error ? null : new Date().toISOString(),
    recipient_email: args.to,
    provider_message_id: result.messageId,
    content_hash: result.contentHash,
    content_version: args.contentVersion,
    error: result.error,
  })

  if (insertError) {
    // The notice may well have gone out; we have simply failed to record it.
    // Worth shouting about, because it undermines the evidence trail.
    console.error(
      `[notices] sent ${args.noticeType} but could not record it: ${insertError.message}`
    )
  }

  return { sent: !result.error, error: result.error }
}

/**
 * Has this notice already been sent for this subscription and due date?
 *
 * Belt and braces alongside the unique index. The index prevents a duplicate
 * row; this prevents a duplicate email, which the index cannot do because the
 * send happens before the insert.
 */
export async function noticeAlreadySent(args: {
  supabase: SupabaseClient
  stripeSubscriptionId: string
  noticeType: NoticeType
  scheduledAt: string
}): Promise<boolean> {
  const { data } = await args.supabase
    .from('subscription_notices')
    .select('id')
    .eq('stripe_subscription_id', args.stripeSubscriptionId)
    .eq('notice_type', args.noticeType)
    .eq('scheduled_at', args.scheduledAt)
    .not('sent_at', 'is', null)
    .limit(1)

  return (data?.length ?? 0) > 0
}
