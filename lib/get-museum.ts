import type { SupabaseClient } from '@supabase/supabase-js'

export async function getMuseumForUser(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try as owner — use limit(1) to avoid .single() failing if duplicates exist
  const { data: ownedList } = await supabase
    .from('museums')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1)
  const owned = ownedList?.[0] ?? null
  if (owned) return { museum: owned, isOwner: true, staffAccess: null as string | null }

  // Try as staff member
  const { data: staffList } = await supabase
    .from('staff_members')
    .select('access, museum_id')
    .eq('user_id', user.id)
    .limit(1)
  const staffRecord = staffList?.[0] ?? null
  if (staffRecord) {
    const { data: museumList } = await supabase
      .from('museums')
      .select('*')
      .eq('id', staffRecord.museum_id)
      .limit(1)
    const m = museumList?.[0] ?? null
    if (m) return { museum: m, isOwner: false, staffAccess: staffRecord.access as string }
  }

  return null
}
