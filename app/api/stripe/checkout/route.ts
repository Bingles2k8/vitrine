import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe, STRIPE_PRICE_MAP } from '@/lib/stripe'
import { stripeCheckoutSchema, parseBody } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { normalizeBillingCurrency } from '@/lib/countryCurrency'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const parsed = parseBody(stripeCheckoutSchema, await request.json())
  if (!parsed.success) return parsed.response
  const { planId, trial } = parsed.data
  const priceId = STRIPE_PRICE_MAP[planId]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: museum } = await supabase
    .from('museums')
    .select('id, stripe_customer_id, stripe_subscription_id, owner_id, trial_used_at, ever_paid')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })

  // Already has an active subscription — use the portal to change plans
  if (museum.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'You already have an active subscription. Use Manage Subscription to make changes.' },
      { status: 400 }
    )
  }

  // Trial eligibility: Professional only, one per museum forever, never for
  // ex-customers who already had a paid subscription.
  const wantsTrial = trial === true
  if (wantsTrial) {
    if (planId !== 'professional') {
      return NextResponse.json({ error: 'Trial is only available on Professional' }, { status: 400 })
    }
    if (museum.trial_used_at || museum.ever_paid) {
      return NextResponse.json({ error: 'Trial has already been used on this account' }, { status: 400 })
    }
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

  // Charge in the same currency the plans/onboarding/upgrade pages advertised
  // to this visitor — both read the same vitrine_currency cookie through
  // normalizeBillingCurrency, so display and checkout can't diverge. Every
  // BillingCurrency has a matching currency_options entry on all three live
  // Prices (verified against Stripe), so this is only ever a defensive
  // fallback, not the expected path. GBP is the Price's own default currency,
  // so it's omitted from the request rather than passed explicitly.
  const cookieStore = await cookies()
  const currency = normalizeBillingCurrency(cookieStore.get('vitrine_currency')?.value)
  const stripeCurrency = currency.toLowerCase()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/dashboard/plan?checkout=success`,
    cancel_url: `${siteUrl}/dashboard/plan?checkout=cancelled`,
    subscription_data: {
      metadata: { museum_id: museum.id, plan_id: planId },
      ...(wantsTrial ? { trial_period_days: 30 } : {}),
    },
    // Stripe requires card on file by default; trials auto-convert to paid
    // on day 31 unless cancelled. No payment_method_collection override.
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create(
      stripeCurrency === 'gbp' ? sessionParams : { ...sessionParams, currency: stripeCurrency }
    )
  } catch (err) {
    // Defensive fallback only — e.g. this customer's currency is already
    // locked to something else by a past invoice. Retry in the Price's
    // default currency (GBP) rather than fail the checkout outright.
    if (stripeCurrency === 'gbp') throw err
    session = await stripe.checkout.sessions.create(sessionParams)
  }

  return NextResponse.json({ url: session.url })
}
