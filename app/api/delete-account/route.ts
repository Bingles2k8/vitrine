import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { authLimiter, rateLimit } from '@/lib/rate-limit'

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
    .single()

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

    const mid = museum.id
    // Delete in dependency order (children before parents)
    for (const table of [
      'activity_log',
      'artifact_images',
      'reproduction_requests',
      'valuations',
      'risk_register',
      'damage_reports',
      'location_history',
      'condition_assessments',
      'conservation_treatments',
      'audit_records',
      'object_exits',
      'loans',
      'entry_records',
      'insurance_policies',
      'emergency_plans',
      'documentation_plans',
      'staff_members',
      'artifacts',
    ]) {
      await supabase.from(table).delete().eq('museum_id', mid)
    }
    await supabase.from('museums').delete().eq('id', mid)
  }

  // Delete the auth user — requires service role key
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  await admin.auth.admin.deleteUser(user.id)

  return NextResponse.json({ success: true })
}
