import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { getPlan } from '@/lib/plans'
import { csvImportRowSchema } from '@/lib/validations'
import { rateLimit, apiLimiter } from '@/lib/rate-limit'

const VALID_STATUSES = ['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration', 'Deaccessioned']

export async function POST(request: Request) {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  // Find museum — owner or Admin/Editor staff
  let museumId: string | null = null
  let ownerId: string | null = null
  let plan: string = 'community'

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id, owner_id, plan')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museumId = ownedMuseum.id
    ownerId = ownedMuseum.owner_id
    plan = ownedMuseum.plan
  } else {
    const { data: staffRecord } = await supabase
      .from('staff_members')
      .select('museum_id, access, museums(owner_id, plan)')
      .eq('user_id', user.id)
      .in('access', ['Admin', 'Editor'])
      .maybeSingle()
    if (staffRecord) {
      museumId = staffRecord.museum_id
      const m = staffRecord.museums as any
      ownerId = m?.owner_id
      plan = m?.plan ?? 'community'
    }
  }

  if (!museumId || !ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { rows } = body
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 })
  }

  // Check plan gating — CSV import is Professional+
  const planInfo = getPlan(plan)
  if (!planInfo.fullMode) {
    return NextResponse.json({ error: 'Bulk CSV import requires a Professional plan or above. Upgrade to use this feature.' }, { status: 403 })
  }

  // Check plan object limit
  if (planInfo.objects !== null) {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count } = await serviceClient
      .from('objects')
      .select('*', { count: 'exact', head: true })
      .eq('museum_id', museumId)
      .is('deleted_at', null)

    const existing = count ?? 0
    if (existing + rows.length > planInfo.objects) {
      return NextResponse.json({
        error: `Import would exceed your plan limit of ${planInfo.objects} objects. You have ${existing} objects and are trying to import ${rows.length}. Upgrade your plan or import fewer rows.`
      }, { status: 400 })
    }
  }

  // Validate each row against the schema
  const validationErrors: number[] = []
  for (let i = 0; i < rows.length; i++) {
    const result = csvImportRowSchema.safeParse(rows[i])
    if (!result.success) validationErrors.push(i + 1)
  }
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: `Rows have invalid data: ${validationErrors.slice(0, 10).join(', ')}${validationErrors.length > 10 ? '...' : ''}` },
      { status: 400 }
    )
  }

  // Build insert records
  const insertRows = rows.map((row: any) => ({
    museum_id: museumId,
    owner_id: ownerId,
    created_by: user.id,
    updated_by: user.id,
    title: String(row.title || '').trim() || 'Untitled',
    artist: String(row.artist || '').trim() || null,
    year: String(row.year || '').trim() || null,
    medium: String(row.medium || '').trim() || null,
    dimensions: String(row.dimensions || '').trim() || null,
    description: String(row.description || '').trim() || null,
    accession_no: String(row.accession_no || '').trim() || null,
    acquisition_method: String(row.acquisition_method || '').trim() || null,
    acquisition_date: String(row.acquisition_date || '').trim() || null,
    acquisition_source: String(row.acquisition_source || '').trim() || null,
    status: VALID_STATUSES.includes(row.status) ? row.status : 'Entry',
    show_on_site: false,
    emoji: '🖼️',
  }))

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: inserted, error } = await serviceClient
    .from('objects')
    .insert(insertRows)
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ imported: inserted?.length ?? rows.length })
}
