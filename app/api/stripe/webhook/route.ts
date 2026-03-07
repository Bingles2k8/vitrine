import { NextResponse } from 'next/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { createClient } from '@supabase/supabase-js'
import { generateTicketCode } from '@/lib/ticket-utils'
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

      if (planId && planId in PLANS) {
        await supabase
          .from('museums')
          .update({
            plan: planId,
            ui_mode: PLANS[planId as keyof typeof PLANS].fullMode ? 'full' : 'simple',
            stripe_subscription_id: subscription.id,
            pending_downgrade_plan: null,
            pending_downgrade_date: null,
          })
          .eq('id', museumId)
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

  // Handle ticket purchase completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    const museumId = session.metadata?.museum_id

    if (orderId && museumId) {
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

      // Fetch order details for ticket generation
      const { data: order } = await supabase
        .from('ticket_orders')
        .select('id, quantity, slot_id, event_id, buyer_name, status')
        .eq('id', orderId)
        .single()

      if (order) {
        // Idempotency guard — skip if tickets were already generated (Stripe can retry webhooks)
        const { count: existingCount } = await supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', order.id)

        if (existingCount && existingCount > 0) {
          // Ensure the order is marked completed even if a previous run completed tickets but
          // crashed before updating the status
          await supabase
            .from('ticket_orders')
            .update({ status: 'completed', stripe_payment_intent_id: paymentIntentId })
            .eq('id', order.id)
          return NextResponse.json({ received: true })
        }

        // Atomically increment slot bookings — abort if slot is now full.
        // Do this BEFORE marking the order completed so the state transition is always
        // pending → completed or pending → cancelled (never completed → cancelled).
        const { data: slotSuccess } = await supabase.rpc('increment_slot_bookings', {
          slot_uuid: order.slot_id,
          qty: order.quantity,
        })

        if (!slotSuccess) {
          await supabase
            .from('ticket_orders')
            .update({ status: 'cancelled' })
            .eq('id', order.id)
          return NextResponse.json({ received: true })
        }

        // Generate ticket records
        const tickets = Array.from({ length: order.quantity }, () => ({
          order_id: order.id,
          ticket_code: generateTicketCode(),
          status: 'valid',
        }))
        const { error: ticketError } = await supabase.from('tickets').insert(tickets)

        if (ticketError) {
          // Release the capacity we just incremented before returning 500 for Stripe to retry
          await supabase.rpc('decrement_slot_bookings', { slot_uuid: order.slot_id, qty: order.quantity })
          console.error('[webhook] Failed to insert tickets for order', order.id, ticketError)
          return NextResponse.json({ error: 'Ticket generation failed' }, { status: 500 })
        }

        // Tickets exist — now mark order completed
        await supabase
          .from('ticket_orders')
          .update({ status: 'completed', stripe_payment_intent_id: paymentIntentId })
          .eq('id', order.id)

        // Fetch event title for activity log
        const { data: evt } = await supabase
          .from('events')
          .select('title')
          .eq('id', order.event_id)
          .single()

        await supabase.from('activity_log').insert({
          museum_id: museumId,
          action_type: 'ticket_sold',
          description: `${order.quantity} ticket(s) sold for "${evt?.title ?? 'event'}" — ${order.buyer_name}`,
        })
      }
    }
  }

  // Handle Stripe Connect account status changes
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const onboarded = !!(account.details_submitted && account.charges_enabled)
    await supabase
      .from('museums')
      .update({ stripe_connect_onboarded: onboarded })
      .eq('stripe_connect_id', account.id)
  }

  // Handle refunds — only act on full refunds to avoid partial-refund complexity
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge

    // Ignore partial refunds — only cancel order and release capacity on full refund
    if (charge.amount_refunded < charge.amount) {
      return NextResponse.json({ received: true })
    }

    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id

    if (paymentIntentId) {
      const { data: order } = await supabase
        .from('ticket_orders')
        .select('id, slot_id, quantity')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single()

      if (order) {
        await supabase.from('ticket_orders').update({ status: 'cancelled' }).eq('id', order.id)
        await supabase.from('tickets').update({ status: 'refunded' }).eq('order_id', order.id)
        // Release the capacity — decrement booked_count, clamped to 0
        await supabase.rpc('decrement_slot_bookings', {
          slot_uuid: order.slot_id,
          qty: order.quantity,
        })
      }
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
