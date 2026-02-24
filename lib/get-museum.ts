import type { SupabaseClient } from '@supabase/supabase-js'

export async function getMuseumForUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try as owner
  const { data: owned } = await supabase
    .from('museums')
    .select('*')
    .eq('owner_id', user.id)
    .single()
  if (owned) return { museum: owned, isOwner: true, staffAccess: null as string | null }

  // Try as staff member
  const { data: staffRecord } = await supabase
    .from('staff_members')
    .select('access, museum_id')
    .eq('user_id', user.id)
    .single()
  if (staffRecord) {
    const { data: m } = await supabase
      .from('museums')
      .select('*')
      .eq('id', staffRecord.museum_id)
      .single()
    if (m) return { museum: m, isOwner: false, staffAccess: staffRecord.access as string }
  }

  return null
}
