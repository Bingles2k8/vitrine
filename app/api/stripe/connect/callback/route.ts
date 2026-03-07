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
    .select('id, stripe_connect_id, stripe_connect_onboarded')
    .eq('owner_id', user.id)
    .single()

  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })
  if (!museum.stripe_connect_id) {
    return NextResponse.json({ error: 'No Connect account found' }, { status: 400 })
  }

  const account = await stripe.accounts.retrieve(museum.stripe_connect_id)
  const onboarded = !!(account.details_submitted && account.charges_enabled)
  const details_submitted = !!account.details_submitted

  if (onboarded && !museum.stripe_connect_onboarded) {
    await supabase
      .from('museums')
      .update({ stripe_connect_onboarded: true })
      .eq('id', museum.id)
  }

  return NextResponse.json({ onboarded, details_submitted })
}
