import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: museum } = await supabase
    .from('museums')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (museum) {
    const mid = museum.id
    // Delete in dependency order (children before parents)
    for (const table of [
      'location_history',
      'condition_assessments',
      'conservation_treatments',
      'audit_records',
      'object_exits',
      'loans',
      'entry_records',
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
