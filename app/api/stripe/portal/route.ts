import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

/**
 * Opens the Stripe billing portal.
 *
 * With `{ flow: 'update' }` it opens straight on the portal's change-plan
 * screen, for the plan page's Upgrade and Downgrade buttons. If the portal
 * configuration does not have plan changes enabled, Stripe rejects that flow;
 * the route then falls back to the portal's home page rather than failing,
 * so the buttons keep working whichever way round the Stripe setting and this
 * code are deployed.
 */
export async function POST(request?: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const { data: museum } = await supabase
    .from('museums')
    .select('stripe_customer_id, stripe_subscription_id, owner_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!museum?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  // Stripe can reject this for reasons the customer cannot act on: a customer
  // id belonging to a different Stripe account, or no portal configuration on
  // the account. Both used to throw straight out of the route, which returned
  // an HTML 500. The client then failed to parse it as JSON and showed a bare
  // "Something went wrong", which told nobody anything and hid the real cause.
  let flow: string | undefined
  try {
    flow = (await request?.json())?.flow
  } catch {
    // No body: the plain portal.
  }

  if (flow === 'update' && museum.stripe_subscription_id) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: museum.stripe_customer_id,
        return_url: `${siteUrl}/dashboard/plan`,
        flow_data: {
          type: 'subscription_update',
          subscription_update: { subscription: museum.stripe_subscription_id },
          after_completion: { type: 'redirect', redirect: { return_url: `${siteUrl}/dashboard/plan` } },
        },
      })
      return NextResponse.json({ url: session.url })
    } catch (err) {
      console.warn(
        `[stripe/portal] change-plan flow unavailable, falling back to the portal home: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: museum.stripe_customer_id,
      return_url: `${siteUrl}/dashboard/plan`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(
      `[stripe/portal] failed for museum owner ${user.id}, customer ${museum.stripe_customer_id}: ${message}`
    )

    // A customer id that Stripe does not recognise means the record points at
    // a different Stripe account. That is a data problem on our side, not
    // something the customer can fix by trying again, so say so plainly.
    if (/No such customer/i.test(message)) {
      return NextResponse.json(
        {
          error:
            'We could not open your billing portal because your billing record is out of date. This is a problem on our side, not yours. Please contact us and we will sort it out.',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'We could not open the billing portal just now. Please try again in a moment.' },
      { status: 502 }
    )
  }
}
