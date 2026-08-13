import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getMuseumForUser } from '@/lib/get-museum'
import { profilesEnabled, resolveAppNouns, activeProfiles } from '@/lib/collectionProfiles'

/**
 * The signed-in collection's profile state, for VitrineCapture.
 * See docs/collection-profiles-plan.md §12.
 *
 * Returns the raw inputs to the three resolvers plus the resolved answers, so
 * Capture can either port the resolvers or trust these directly — and can
 * verify its own port matches.
 */
export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await getMuseumForUser(supabase)
  if (!result) return NextResponse.json({ error: 'No collection found' }, { status: 404 })

  const { museum } = result
  const shape = {
    plan: museum.plan,
    collection_profiles: museum.collection_profiles ?? [],
  }

  return NextResponse.json({
    museum_id: museum.id,
    plan: museum.plan,
    ui_mode: museum.ui_mode,
    collection_profiles: shape.collection_profiles,
    collection_category: museum.collection_category ?? null,
    // Resolved server-side so a Capture build can cross-check its own port.
    resolved: {
      profilesEnabled: profilesEnabled(museum.plan),
      primaryProfile: activeProfiles(shape)[0]?.id ?? null,
      nouns: resolveAppNouns(shape),
    },
  })
}
