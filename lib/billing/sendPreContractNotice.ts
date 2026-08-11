/**
 * Send the key contract information after a subscription is created, and
 * record it as evidence.
 *
 * Separated from the webhook so the webhook stays readable and so this can be
 * tested without constructing a Stripe event.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { PRICE_TO_PLAN } from '@/lib/stripe'
import { PLANS, type PlanId } from '@/lib/plans'
import { normalizeBillingCurrency } from '@/lib/countryCurrency'
import { buildKeyContractInfo, KEY_CONTRACT_INFO_VERSION } from './keyContractInfo'
import { renderPreContractEmail } from './preContractEmail'
import { sendAndRecordNotice } from './notices'

export async function sendPreContractNotice(args: {
  supabase: SupabaseClient
  museumId: string
  subscription: Stripe.Subscription
}): Promise<void> {
  const { supabase, museumId, subscription } = args

  const { data: museum } = await supabase
    .from('museums')
    .select('id, name, owner_id, contact_email')
    .eq('id', museumId)
    .maybeSingle()
  if (!museum) return

  // The contract is with the account owner, so the record goes to them rather
  // than to the museum's public contact address.
  let to: string | null = museum.contact_email ?? null
  if (museum.owner_id) {
    try {
      const { data } = await supabase.auth.admin.getUserById(museum.owner_id)
      to = data?.user?.email ?? to
    } catch {
      // Fall back to contact_email.
    }
  }
  if (!to) {
    console.error(`[preContract] no recipient for museum ${museumId}`)
    return
  }

  const priceId = subscription.items.data[0]?.price?.id
  const planId = (priceId ? PRICE_TO_PLAN[priceId] : null) ?? (subscription.metadata.plan_id as PlanId | undefined)
  if (!planId || !(planId in PLANS)) {
    console.error(`[preContract] could not resolve plan for subscription ${subscription.id}`)
    return
  }

  const trialDays =
    subscription.trial_start && subscription.trial_end
      ? Math.round((subscription.trial_end - subscription.trial_start) / 86400)
      : null

  // The subscription's own currency is what the customer is actually charged
  // in, which is the figure the notice has to state.
  const currency = normalizeBillingCurrency(subscription.currency)

  const startsAt = subscription.start_date
    ? new Date(subscription.start_date * 1000)
    : new Date()

  const info = buildKeyContractInfo({
    planId: planId as PlanId,
    currency,
    startsAt,
    trialDays,
  })

  const { subject, html } = renderPreContractEmail({
    info,
    museumName: museum.name ?? null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com',
  })

  await sendAndRecordNotice({
    supabase,
    museumId,
    stripeSubscriptionId: subscription.id,
    noticeType: 'pre_contract',
    to,
    subject,
    html,
    contentVersion: KEY_CONTRACT_INFO_VERSION,
  })
}
