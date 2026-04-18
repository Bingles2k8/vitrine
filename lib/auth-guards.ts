import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getMuseumForUser } from '@/lib/get-museum'

/**
 * Shared auth+museum gate for API routes. Returns either a `NextResponse`
 * (401/403) that the caller should return directly, or the authenticated
 * user, their museum, and the server-side Supabase client.
 *
 * Usage:
 *   const gate = await requireAuthedMuseum()
 *   if (gate instanceof NextResponse) return gate
 *   const { user, museum, supabase } = gate
 */
export async function requireAuthedMuseum() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await getMuseumForUser(supabase)
  if (!result) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return {
    user,
    museum: result.museum,
    isOwner: result.isOwner,
    staffAccess: result.staffAccess,
    supabase,
  }
}
