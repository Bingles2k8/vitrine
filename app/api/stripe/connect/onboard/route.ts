import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { getPlan } from '@/lib/plans'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  // Resolve museum for owner or Admin staff
  let museum: { id: string; owner_id: string; stripe_connect_id: string | null; stripe_connect_onboarded: boolean; plan: string } | null = null

  const { data: owned } = await supabase
    .from('museums')
    .select('id, owner_id, stripe_connect_id, stripe_connect_onboarded, plan')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (owned) {
    museum = owned
  } else {
    const { data: staffRecord } = await supabase
      .from('staff_members')
      .select('museum_id')
      .eq('user_id', user.id)
      .eq('access', 'Admin')
      .maybeSingle()
    if (staffRecord) {
      const { data: staffMuseum } = await supabase
        .from('museums')
        .select('id, owner_id, stripe_connect_id, stripe_connect_onboarded, plan')
        .eq('id', staffRecord.museum_id)
        .maybeSingle()
      museum = staffMuseum
    }
  }

  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })

  if (!getPlan(museum.plan).ticketing) {
    return NextResponse.json({ error: 'Ticketing not available on your plan' }, { status: 403 })
  }

  if (museum.stripe_connect_onboarded) {
    return NextResponse.json({ error: 'Already onboarded' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  // Create or retrieve the connected account
  let connectId = museum.stripe_connect_id
  if (!connectId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { museum_id: museum.id },
    })
    connectId = account.id

    await supabase
      .from('museums')
      .update({ stripe_connect_id: connectId })
      .eq('id', museum.id)
  }

  // Create an account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: connectId,
    refresh_url: `${siteUrl}/dashboard/events?connect=refresh`,
    return_url: `${siteUrl}/dashboard/events?connect=success`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
