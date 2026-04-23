import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { authLimiter, rateLimit } from '@/lib/rate-limit'
import { deleteMuseumEverywhere } from '@/lib/delete-museum-data'

export async function POST() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = await rateLimit(authLimiter, user.id)
  if (limited) return limited

  const { data: museum } = await supabase
    .from('museums')
    .select('id, stripe_subscription_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (museum) {
    // Cancel Stripe subscription before deleting museum data
    if (museum.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(museum.stripe_subscription_id)
      } catch {
        // Log but don't block account deletion
        console.error('Failed to cancel Stripe subscription')
      }
    }

    await deleteMuseumEverywhere(admin, museum.id, 'user_requested')
  } else {
    // No museum — just remove the auth user
    await admin.auth.admin.deleteUser(user.id)
  }

  return NextResponse.json({ success: true })
}
