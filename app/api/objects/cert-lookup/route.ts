import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Duplicate-certificate check.
 * See docs/collection-profiles-plan.md §7.11.
 *
 * A certificate number is a globally unique identifier, which makes it a far
 * stronger duplicate signal than the fuzzy title match used elsewhere. Backed
 * by the partial index objects_cert_number_idx, so this is a single index hit.
 */

async function resolveMuseum(supabase: SupabaseClient, userId: string) {
  const { data: owned } = await supabase
    .from('museums').select('id').eq('owner_id', userId).maybeSingle()
  if (owned) return owned

  const { data: staff } = await supabase
    .from('staff_members').select('museum_id')
    .eq('user_id', userId).maybeSingle()
  if (!staff) return null

  return { id: staff.museum_id }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const museumId = searchParams.get('museum_id')?.trim()
  const authority = searchParams.get('cert_authority')?.trim()
  const number = searchParams.get('cert_number')?.trim()
  const exclude = searchParams.get('exclude')?.trim()

  if (!museumId || !authority || !number) {
    return NextResponse.json({ match: null })
  }

  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Never trust the museum_id from the query string — resolve the caller's own
  // museum and check it matches.
  const museum = await resolveMuseum(supabase, user.id)
  if (!museum || museum.id !== museumId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let query = supabase
    .from('objects')
    .select('id, title, emoji')
    .eq('museum_id', museum.id)
    .eq('cert_authority', authority)
    .eq('cert_number', number)
    .is('deleted_at', null)
    .limit(1)

  if (exclude) query = query.neq('id', exclude)

  const { data, error } = await query.maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ match: data ?? null })
}
