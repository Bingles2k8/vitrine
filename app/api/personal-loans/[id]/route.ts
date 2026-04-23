import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { parseBody, personalLoanUpdateSchema } from '@/lib/validations'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase.from('museums').select('id').eq('owner_id', userId).maybeSingle()
  if (owned) return { museumId: owned.id as string, canEdit: true }
  const { data: staff } = await supabase.from('staff_members').select('museum_id, access').eq('user_id', userId).maybeSingle()
  if (!staff) return null
  return { museumId: staff.museum_id as string, canEdit: staff.access === 'Admin' || staff.access === 'Editor' }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const resolved = await resolveMuseum(supabase, user.id)
  if (!resolved || !resolved.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = parseBody(personalLoanUpdateSchema, body)
  if (!parsed.success) return parsed.response

  const { data, error } = await supabase.from('personal_loans')
    .update(parsed.data)
    .eq('id', id)
    .eq('museum_id', resolved.museumId)
    .select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ loan: data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = await resolveMuseum(supabase, user.id)
  if (!resolved || !resolved.canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('personal_loans').delete().eq('id', id).eq('museum_id', resolved.museumId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
