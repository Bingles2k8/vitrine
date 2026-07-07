import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuthedMuseum } from '@/lib/auth-guards'
import { parseBody, updateStaffMemberSchema } from '@/lib/validations'

type Ctx = { params: Promise<{ id: string }> }

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Authorize the caller (owner or Admin staff) and load the target staff row,
// ensuring it belongs to the caller's museum. Returns a NextResponse on failure.
async function authorize(id: string) {
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return { error: gate }
  const { user, museum, isOwner, staffAccess } = gate

  if (!isOwner && staffAccess !== 'Admin') {
    return { error: NextResponse.json({ error: 'Only owners and Admins can manage staff' }, { status: 403 }) }
  }

  const service = serviceClient()
  const { data: target } = await service
    .from('staff_members')
    .select('id, museum_id, user_id, access, email')
    .eq('id', id)
    .maybeSingle()

  if (!target || target.museum_id !== museum.id) {
    return { error: NextResponse.json({ error: 'Staff member not found' }, { status: 404 }) }
  }

  return { user, isOwner, target, service }
}

// PATCH /api/staff-members/:id — edit a staff member (owner or Admin).
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params
  const auth = await authorize(id)
  if ('error' in auth) return auth.error
  const { user, isOwner, target, service } = auth

  const parsed = parseBody(updateStaffMemberSchema, await request.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { name, email, role, department, access } = parsed.data

  // Guardrail: an Admin editing their own record can't change their own access
  // level (prevents self-lockout / self-escalation confusion). Owners are never
  // in staff_members, so this only applies to Admins.
  if (!isOwner && target.user_id === user.id && access !== target.access) {
    return NextResponse.json({ error: "You can't change your own access level" }, { status: 400 })
  }

  const update: Record<string, unknown> = { name, role, department, access }
  // Only apply email changes for members who haven't linked an account yet —
  // once linked, the login email lives in auth.users, not this row.
  if (!target.user_id) update.email = email

  const { error } = await service.from('staff_members').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/staff-members/:id — remove a staff member (owner or Admin).
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params
  const auth = await authorize(id)
  if ('error' in auth) return auth.error
  const { user, target, service } = auth

  // Guardrail: can't remove yourself (avoids an Admin accidentally revoking
  // their own access).
  if (target.user_id === user.id) {
    return NextResponse.json({ error: "You can't remove yourself" }, { status: 400 })
  }

  const { error } = await service.from('staff_members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
