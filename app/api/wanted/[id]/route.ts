import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase-server'
import { getPlan } from '@/lib/plans'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import { parseBody, wantedItemSchema } from '@/lib/validations'

async function resolveMuseum(supabase: any, userId: string) {
  const { data: owned } = await supabase
    .from('museums').select('id, plan').eq('owner_id', userId).maybeSingle()
  if (owned) return owned

  const { data: staff } = await supabase
    .from('staff_members').select('museum_id, access')
    .eq('user_id', userId).in('access', ['Admin', 'Editor']).maybeSingle()
  if (!staff) return null

  const { data: museum } = await supabase
    .from('museums').select('id, plan').eq('id', staff.museum_id).maybeSingle()
  return museum ?? null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!getPlan(museum.plan).wishlist) return NextResponse.json({ error: 'Not available on this plan' }, { status: 403 })

  const raw = await request.json().catch(() => null)
  const parsed = parseBody(wantedItemSchema.partial(), raw)
  if (!parsed.success) return parsed.response
  const { title, year, medium, notes, priority } = parsed.data

  const { data, error } = await supabase
    .from('wanted_items')
    .update({
      ...(title !== undefined && { title: title.trim() }),
      ...(year !== undefined && { year: year || null }),
      ...(medium !== undefined && { medium: medium || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(priority !== undefined && { priority }),
    })
    .eq('id', id).eq('museum_id', museum.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, user.id)
  if (limited) return limited

  const museum = await resolveMuseum(supabase, user.id)
  if (!museum) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase
    .from('wanted_items').delete().eq('id', id).eq('museum_id', museum.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
