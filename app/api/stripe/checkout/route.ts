import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe, STRIPE_PRICE_MAP } from '@/lib/stripe'
import { stripeCheckoutSchema, parseBody } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const parsed = parseBody(stripeCheckoutSchema, await request.json())
  if (!parsed.success) return parsed.response
  const { planId } = parsed.data
  const priceId = STRIPE_PRICE_MAP[planId]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: museum } = await supabase
    .from('museums')
    .select('id, stripe_customer_id, stripe_subscription_id, owner_id')
    .eq('owner_id', user.id)
    .single()

  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })

  // Already has an active subscription — use the portal to change plans
  if (museum.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'You already have an active subscription. Use Manage Subscription to make changes.' },
      { status: 400 }
    )
  }

  // Get or create Stripe customer
  let customerId = museum.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { museum_id: museum.id, supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('museums')
      .update({ stripe_customer_id: customerId })
      .eq('id', museum.id)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard/plan?checkout=success`,
    cancel_url: `${siteUrl}/dashboard/plan?checkout=cancelled`,
    subscription_data: {
      metadata: { museum_id: museum.id, plan_id: planId },
    },
  })

  return NextResponse.json({ url: session.url })
}
