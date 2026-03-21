import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const body = await request.json()
  const { order_id } = body
  if (!order_id || typeof order_id !== 'string') {
    return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
  }

  // Resolve museum — owner or Admin staff only (not Editor; refunds are financial actions)
  let museumId: string | null = null

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museumId = ownedMuseum.id
  } else {
    const { data: adminStaff } = await supabase
      .from('staff_members')
      .select('museum_id')
      .eq('user_id', user.id)
      .eq('access', 'Admin')
      .maybeSingle()
    if (adminStaff) museumId = adminStaff.museum_id
  }

  if (!museumId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch the order and verify it belongs to this museum
  const { data: order } = await supabase
    .from('ticket_orders')
    .select('id, museum_id, slot_id, quantity, amount_cents, status, stripe_payment_intent_id')
    .eq('id', order_id)
    .eq('museum_id', museumId)
    .maybeSingle()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status !== 'completed') {
    return NextResponse.json({ error: 'Order is not eligible for refund' }, { status: 409 })
  }

  // Issue Stripe refund for paid orders (ticket price only — booking fee is non-refundable)
  if (order.stripe_payment_intent_id) {
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: order.amount_cents,
    })
  }

  // Update DB: cancel order, mark tickets refunded, release slot capacity
  await supabase.from('ticket_orders').update({ status: 'cancelled' }).eq('id', order.id)
  await supabase.from('tickets').update({ status: 'refunded' }).eq('order_id', order.id)
  await supabase.rpc('decrement_slot_bookings', {
    slot_uuid: order.slot_id,
    qty: order.quantity,
  })

  return NextResponse.json({ success: true })
}
