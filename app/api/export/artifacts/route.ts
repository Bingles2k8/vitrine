import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find the museum — owner or Admin/Editor staff
  let museumId: string | null = null

  const { data: ownedMuseum } = await supabase
    .from('museums')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (ownedMuseum) {
    museumId = ownedMuseum.id
  } else {
    const { data: staffRecord } = await supabase
      .from('staff_members')
      .select('museum_id, access')
      .eq('user_id', user.id)
      .in('access', ['Admin', 'Editor'])
      .maybeSingle()
    if (staffRecord) museumId = staffRecord.museum_id
  }

  if (!museumId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: artifacts } = await supabase
    .from('artifacts')
    .select([
      'accession_no', 'title', 'artist', 'year', 'medium', 'culture', 'object_type',
      'status', 'current_location', 'acquisition_date', 'acquisition_method',
      'acquisition_source', 'acquisition_authorised_by', 'accession_register_confirmed',
      'condition_grade', 'condition_date', 'condition_assessor',
      'last_inventoried', 'inventoried_by',
      'copyright_status', 'rights_holder',
      'provenance', 'inscription', 'marks', 'dimensions', 'description',
    ].join(', '))
    .eq('museum_id', museumId)
    .order('accession_no')

  const HEADERS = [
    'Accession No', 'Title', 'Artist', 'Year', 'Medium', 'Culture', 'Object Type',
    'Status', 'Current Location', 'Acquisition Date', 'Acquisition Method',
    'Acquisition Source', 'Acquisition Authorised By', 'Accession Register Confirmed',
    'Condition Grade', 'Condition Date', 'Condition Assessor',
    'Last Inventoried', 'Inventoried By',
    'Copyright Status', 'Rights Holder',
    'Provenance', 'Inscription', 'Marks', 'Dimensions', 'Description',
  ]

  const FIELDS: string[] = [
    'accession_no', 'title', 'artist', 'year', 'medium', 'culture', 'object_type',
    'status', 'current_location', 'acquisition_date', 'acquisition_method',
    'acquisition_source', 'acquisition_authorised_by', 'accession_register_confirmed',
    'condition_grade', 'condition_date', 'condition_assessor',
    'last_inventoried', 'inventoried_by',
    'copyright_status', 'rights_holder',
    'provenance', 'inscription', 'marks', 'dimensions', 'description',
  ]

  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const rows = (artifacts || []).map(a =>
    FIELDS.map(f => escape((a as any)[f])).join(',')
  )

  const csv = [HEADERS.map(h => `"${h}"`).join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="collection-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
