import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const { data: museum } = await supabase
    .from('museums')
    .select('stripe_customer_id, owner_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!museum?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const session = await stripe.billingPortal.sessions.create({
    customer: museum.stripe_customer_id,
    return_url: `${siteUrl}/dashboard/plan`,
  })

  return NextResponse.json({ url: session.url })
}
