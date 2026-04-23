import { NextResponse } from 'next/server'
import { stripe, PRICE_TO_PLAN } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'
import { createClient } from '@supabase/supabase-js'
import { generateTicketCode } from '@/lib/ticket-utils'
import { Resend } from 'resend'
import type Stripe from 'stripe'

function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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

    // Verify the museum actually belongs to this Stripe customer — prevents metadata spoofing
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    const { data: verifiedMuseum } = await supabase
      .from('museums')
      .select('id')
      .eq('id', museumId)
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (!verifiedMuseum) return NextResponse.json({ received: true })

    if (subscription.status === 'active' || subscription.status === 'trialing') {
      const priceId = subscription.items.data[0]?.price.id
      const planId = PRICE_TO_PLAN[priceId] ?? subscription.metadata.plan_id

      if (planId && planId in PLANS) {
        const update: Record<string, unknown> = {
          plan: planId,
          ui_mode: PLANS[planId as keyof typeof PLANS].fullMode ? 'full' : 'simple',
          stripe_subscription_id: subscription.id,
          pending_downgrade_plan: null,
          pending_downgrade_date: null,
          // Clear any lockout state — they've (re)subscribed
          locked_at: null,
          lock_reason: null,
          scheduled_deletion_at: null,
          deletion_warning_30d_sent_at: null,
          deletion_warning_7d_sent_at: null,
        }
        // Record trial usage once, on the first trialing subscription.
        if (subscription.status === 'trialing' && subscription.trial_end) {
          update.trial_used_at = new Date(subscription.trial_end * 1000).toISOString()
        }
        await supabase.from('museums').update(update).eq('id', museumId)
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
      } catch (err) {
        console.error('[webhook] subscription schedule fetch failed:', err instanceof Error ? err.message : 'unknown')
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const museumId = subscription.metadata.museum_id
    const deletedCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
    if (!museumId || !deletedCustomerId) return NextResponse.json({ received: true })

    const { data: verifiedDeletedMuseum } = await supabase
      .from('museums')
      .select('id, name, slug, owner_id, ever_paid')
      .eq('id', museumId)
      .eq('stripe_customer_id', deletedCustomerId)
      .maybeSingle()
    if (!verifiedDeletedMuseum) return NextResponse.json({ received: true })

    // Determine deletion window: ex-customers get 180 days; trial-only users
    // who never converted get 30 days.
    const everPaid = verifiedDeletedMuseum.ever_paid === true
    const windowDays = everPaid ? 180 : 30
    const lockReason: 'subscription_ended' | 'trial_expired' =
      everPaid ? 'subscription_ended' : 'trial_expired'
    const now = new Date()
    const deleteAt = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000)

    await supabase
      .from('museums')
      .update({
        locked_at: now.toISOString(),
        lock_reason: lockReason,
        scheduled_deletion_at: deleteAt.toISOString(),
        stripe_subscription_id: null,
        pending_downgrade_plan: null,
        pending_downgrade_date: null,
        payment_past_due: false,
        deletion_warning_30d_sent_at: null,
        deletion_warning_7d_sent_at: null,
      })
      .eq('id', museumId)

    await supabase.from('activity_log').insert({
      museum_id: museumId,
      action_type: 'account_locked',
      description: `Account locked (${lockReason}). Scheduled for deletion on ${deleteAt.toISOString().slice(0, 10)}.`,
    })

    // Notify owner that they're in the lockout window
    let ownerEmail: string | null = null
    if (verifiedDeletedMuseum.owner_id) {
      const { data: ownerUser } = await supabase.auth.admin.getUserById(verifiedDeletedMuseum.owner_id)
      ownerEmail = ownerUser?.user?.email ?? null
    }
    if (ownerEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com'
      const museumName = verifiedDeletedMuseum.name ?? 'Your museum'
      const deleteAtFormatted = deleteAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      const headline = everPaid
        ? `Your Vitrine subscription has ended`
        : `Your Vitrine trial has ended`
      const body = everPaid
        ? `<p>Your subscription for <strong>${esc(museumName)}</strong> has been cancelled. Your public site is now offline and your dashboard is locked.</p>
           <p>You have <strong>180 days</strong> to resubscribe before your collection is permanently deleted. If you don't resubscribe, all your data will be removed on <strong>${esc(deleteAtFormatted)}</strong>.</p>`
        : `<p>Your trial for <strong>${esc(museumName)}</strong> has ended without a subscription. Your public site is now offline and your dashboard is locked.</p>
           <p>You have <strong>30 days</strong> to subscribe before your collection is permanently deleted. If you don't, all your data will be removed on <strong>${esc(deleteAtFormatted)}</strong>.</p>`
      await resend.emails.send({
        from: 'Vitrine <noreply@contact.vitrinecms.com>',
        to: ownerEmail,
        subject: `${museumName}: account locked — ${everPaid ? 'resubscribe' : 'subscribe'} to restore access`,
        html: `
          <p>Hi,</p>
          <h2 style="font-style:italic">${headline}</h2>
          ${body}
          <p style="margin-top:24px">
            <a href="${siteUrl}/dashboard/plan" style="background:#000;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px">Resubscribe now →</a>
          </p>
          <p style="color:#666;font-size:13px;margin-top:16px">You can also <a href="${siteUrl}/dashboard/billing-required" style="color:#666">export your data</a> at any time before deletion.</p>
          <p>— The Vitrine team</p>
        `,
      }).catch(err => console.error('[webhook] lockout email failed:', err instanceof Error ? err.message : err))
    }
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    if (customerId) {
      // Idempotency: only update DB and send email if not already marked past_due.
      // Stripe retries failed payment webhooks — without this we'd send duplicate emails.
      const { data: museum } = await supabase
        .from('museums')
        .select('payment_past_due')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (!museum?.payment_past_due) {
        await supabase
          .from('museums')
          .update({ payment_past_due: true })
          .eq('stripe_customer_id', customerId)

        const customerEmail = invoice.customer_email
        if (customerEmail) {
          const resend = new Resend(process.env.RESEND_API_KEY)
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrine.museum'
          await resend.emails.send({
            from: 'Vitrine <noreply@contact.vitrinecms.com>',
            to: customerEmail,
            subject: 'Action required: your Vitrine payment failed',
            html: `
              <p>Hi,</p>
              <p>We weren't able to process your Vitrine subscription payment. Stripe will automatically retry the charge over the coming days.</p>
              <p>To avoid any disruption to your plan, please update your payment method now:</p>
              <p><a href="${siteUrl}/dashboard/plan">Update billing details →</a></p>
              <p>If you have any questions, just reply to this email.</p>
              <p>— The Vitrine team</p>
            `,
          })
        }
      }
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    if (customerId) {
      // Only flag ever_paid when money actually changed hands. Stripe fires
      // invoice.payment_succeeded for £0 trial invoices too; those don't count.
      const update: Record<string, unknown> = { payment_past_due: false }
      if (invoice.amount_paid > 0) {
        update.ever_paid = true
      }
      await supabase
        .from('museums')
        .update(update)
        .eq('stripe_customer_id', customerId)
    }
  }

  // Handle checkout session completion
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    const museumId = session.metadata?.museum_id

    // Handle subscription checkout plan activation — acts as an immediate fallback
    // alongside customer.subscription.created, which may arrive with a delay.
    if (session.mode === 'subscription' && !orderId) {
      const planId = session.metadata?.plan_id
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription)?.id
      const customerId = typeof session.customer === 'string'
        ? session.customer
        : (session.customer as Stripe.Customer)?.id

      if (planId && planId in PLANS && subscriptionId && customerId && museumId) {
        await supabase
          .from('museums')
          .update({
            plan: planId,
            ui_mode: PLANS[planId as keyof typeof PLANS].fullMode ? 'full' : 'simple',
            stripe_subscription_id: subscriptionId,
            pending_downgrade_plan: null,
            pending_downgrade_date: null,
            // Clear any lockout state — checkout completion unlocks
            locked_at: null,
            lock_reason: null,
            scheduled_deletion_at: null,
            deletion_warning_30d_sent_at: null,
            deletion_warning_7d_sent_at: null,
          })
          .eq('id', museumId)
          .eq('stripe_customer_id', customerId)
      }
    }

    if (orderId && museumId) {
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null

      // Fetch order details for ticket generation
      const { data: order } = await supabase
        .from('ticket_orders')
        .select('id, quantity, slot_id, event_id, buyer_name, buyer_email, status')
        .eq('id', orderId)
        .maybeSingle()

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
        const { data: slotSuccess, error: rpcError } = await supabase.rpc('increment_slot_bookings', {
          slot_uuid: order.slot_id,
          qty: order.quantity,
        })

        if (rpcError) console.error('[webhook] increment_slot_bookings failed:', rpcError.message)
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
          console.error('[webhook] ticket insert failed for order', order.id, ticketError.message)
          return NextResponse.json({ error: 'Ticket generation failed' }, { status: 500 })
        }

        // Tickets exist — now mark order completed
        await supabase
          .from('ticket_orders')
          .update({ status: 'completed', stripe_payment_intent_id: paymentIntentId })
          .eq('id', order.id)

        // Fetch event and slot details for activity log + confirmation email
        const [{ data: evt }, { data: slot }, { data: emailMuseum }] = await Promise.all([
          supabase.from('events').select('title').eq('id', order.event_id).maybeSingle(),
          supabase.from('event_time_slots').select('start_time, end_time').eq('id', order.slot_id).maybeSingle(),
          supabase.from('museums').select('name, slug').eq('id', museumId).maybeSingle(),
        ])

        await supabase.from('activity_log').insert({
          museum_id: museumId,
          action_type: 'ticket_sold',
          description: `${order.quantity} ticket(s) sold for "${evt?.title ?? 'event'}" — ${order.buyer_name}`,
        })

        // Send confirmation email to buyer
        if (order.buyer_email && evt?.title) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrine.museum'
          const slotLine = slot
            ? `<p style="color:#666;margin:0 0 16px">${new Date(slot.start_time).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${new Date(slot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>`
            : ''
          const ticketLines = tickets
            .map(t => `<p style="margin:0 0 8px;font-family:monospace"><a href="${siteUrl}/verify/${t.ticket_code}" style="color:#000">${t.ticket_code}</a></p>`)
            .join('')
          const sessionLine = session.id
            ? `<p style="margin:24px 0 0"><a href="${siteUrl}/museum/${emailMuseum?.slug}/events/${order.event_id}/checkout/success?session_id=${session.id}" style="color:#666;font-size:13px">View your booking →</a></p>`
            : ''
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: 'Vitrine <noreply@contact.vitrinecms.com>',
            to: order.buyer_email,
            subject: `Your tickets for ${esc(evt.title)}`,
            html: `
              <p>Hi ${esc(order.buyer_name)},</p>
              <p>Your booking is confirmed! Here are your tickets for <strong>${esc(evt.title)}</strong>.</p>
              ${slotLine}
              <div style="margin:16px 0">${ticketLines}</div>
              <p style="color:#666;font-size:13px">Scan these codes at the door. Each link shows the full ticket details.</p>
              ${sessionLine}
              <p style="margin-top:24px">See you there!<br>— ${esc(emailMuseum?.name ?? 'The Vitrine team')}</p>
            `,
          }).catch(err => console.error('[webhook] ticket confirmation email failed:', err instanceof Error ? err.message : 'unknown'))
        }
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
    const connectAccountId = typeof charge.on_behalf_of === 'string'
      ? charge.on_behalf_of
      : charge.on_behalf_of?.id ?? null

    if (paymentIntentId) {
      const { data: order } = await supabase
        .from('ticket_orders')
        .select('id, slot_id, quantity, museum_id')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (order) {
        // Cross-check: the order's museum must own the Stripe Connect account the charge was
        // made on behalf of. Prevents a spoofed refund event from cancelling a foreign
        // museum's order (tickets use destination charges via on_behalf_of).
        if (connectAccountId) {
          const { data: museumForCharge } = await supabase
            .from('museums')
            .select('id')
            .eq('id', order.museum_id)
            .eq('stripe_connect_id', connectAccountId)
            .maybeSingle()
          if (!museumForCharge) {
            console.error('[webhook] charge.refunded museum/connect-account mismatch', { orderId: order.id })
            return NextResponse.json({ received: true })
          }
        }

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
