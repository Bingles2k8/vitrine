import { NextResponse } from 'next/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Use service role — webhooks have no user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const museumId = subscription.metadata.museum_id
    if (!museumId) return NextResponse.json({ received: true })

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      const priceId = subscription.items.data[0]?.price.id
      const planId = PRICE_TO_PLAN[priceId] ?? subscription.metadata.plan_id

      console.log('[webhook] priceId:', priceId, 'planId:', planId, 'museumId:', museumId)

      if (planId && planId in PLANS) {
        const { error, count } = await supabase
          .from('museums')
          .update({
            plan: planId,
            ui_mode: PLANS[planId as keyof typeof PLANS].fullMode ? 'full' : 'simple',
            stripe_subscription_id: subscription.id,
            pending_downgrade_plan: null,
            pending_downgrade_date: null,
          })
          .eq('id', museumId)

        console.log('[webhook] update result — error:', error, 'count:', count)
      } else {
        console.log('[webhook] planId not valid, skipping update. planId:', planId, 'in PLANS:', planId ? planId in PLANS : false)
      }
    }

    // Check if cancellation at period end is scheduled (downgrade to community)
    if (subscription.cancel_at_period_end && museumId) {
      const cancelDate = subscription.cancel_at
        ?? subscription.items.data[0]?.current_period_end
      await supabase
        .from('museums')
        .update({
          pending_downgrade_plan: 'community',
          pending_downgrade_date: cancelDate
            ? new Date(cancelDate * 1000).toISOString()
            : null,
        })
        .eq('id', museumId)
    }

    // Check if a subscription schedule exists (plan-to-plan downgrade)
    if (subscription.schedule && museumId) {
      try {
        const schedule = await stripe.subscriptionSchedules.retrieve(
          subscription.schedule as string
        )
        const phases = schedule.phases
        if (phases.length > 1) {
          const nextPhase = phases[phases.length - 1]
          const nextPriceId = typeof nextPhase.items[0]?.price === 'string'
            ? nextPhase.items[0].price
            : (nextPhase.items[0]?.price as Stripe.Price)?.id
          const targetPlan = nextPriceId ? PRICE_TO_PLAN[nextPriceId] : undefined
          if (targetPlan) {
            await supabase
              .from('museums')
              .update({
                pending_downgrade_plan: targetPlan,
                pending_downgrade_date: new Date(nextPhase.start_date * 1000).toISOString(),
              })
              .eq('id', museumId)
          }
        }
      } catch {
        console.error('Failed to retrieve subscription schedule')
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const museumId = subscription.metadata.museum_id
    if (museumId) {
      await supabase
        .from('museums')
        .update({
          plan: 'community',
          ui_mode: 'simple',
          stripe_subscription_id: null,
          pending_downgrade_plan: null,
          pending_downgrade_date: null,
        })
        .eq('id', museumId)
    }
  }

  // Handle subscription schedule cancellation/release (user cancelled a pending downgrade)
  if (
    event.type === 'subscription_schedule.canceled' ||
    event.type === 'subscription_schedule.released'
  ) {
    const schedule = event.data.object as Stripe.SubscriptionSchedule
    const subscriptionId = typeof schedule.subscription === 'string'
      ? schedule.subscription
      : schedule.subscription?.id
    if (subscriptionId) {
      await supabase
        .from('museums')
        .update({
          pending_downgrade_plan: null,
          pending_downgrade_date: null,
        })
        .eq('stripe_subscription_id', subscriptionId)
    }
  }

  return NextResponse.json({ received: true })
}
