import { NextResponse } from 'next/server'
import { requireAuthedMuseum } from '@/lib/auth-guards'
import { parseBody } from '@/lib/validations'
import { serviceClient, assignSchema, canSend, assignableMembers } from '@/lib/messaging'

type Ctx = { params: Promise<{ conversationId: string }> }

// POST /api/messages/:id/assign — assign (or unassign) a conversation to a
// recipient-side member. Only the recipient museum owns assignment.
export async function POST(request: Request, { params }: Ctx) {
  const { conversationId } = await params
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return gate
  const { museum } = gate

  if (!canSend(gate)) {
    return NextResponse.json({ error: 'Your role cannot assign conversations' }, { status: 403 })
  }

  const parsed = parseBody(assignSchema, await request.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { assignedToUserId } = parsed.data

  const service = serviceClient()
  const { data: convRows } = await service
    .from('conversations')
    .select('id, recipient_museum_id')
    .eq('id', conversationId)
    .limit(1)
  const conv = convRows?.[0]
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conv.recipient_museum_id !== museum.id) {
    return NextResponse.json({ error: 'Only the recipient museum can assign' }, { status: 403 })
  }

  let assignedName: string | null = null
  if (assignedToUserId) {
    const members = await assignableMembers(service, museum.id)
    const match = members.find(m => m.userId === assignedToUserId)
    if (!match) {
      return NextResponse.json({ error: 'Assignee is not a member of this museum' }, { status: 400 })
    }
    assignedName = match.name
  }

  await service
    .from('conversations')
    .update({ assigned_to_user_id: assignedToUserId, assigned_to_name: assignedName })
    .eq('id', conversationId)

  return NextResponse.json({ ok: true, assignedToUserId, assignedToName: assignedName })
}
