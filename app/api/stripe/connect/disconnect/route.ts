import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'

export async function POST() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  // Only the museum owner can disconnect — use owner_id check
  const { data: museum } = await supabase
    .from('museums')
    .select('id, stripe_connect_id, stripe_connect_onboarded')
    .eq('owner_id', user.id)
    .single()

  if (!museum) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })
  if (!museum.stripe_connect_id) {
    return NextResponse.json({ error: 'No Stripe account connected' }, { status: 400 })
  }

  await supabase
    .from('museums')
    .update({ stripe_connect_id: null, stripe_connect_onboarded: false })
    .eq('id', museum.id)

  return NextResponse.json({ success: true })
}
