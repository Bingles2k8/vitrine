import { NextResponse } from 'next/server'
import { requireAuthedMuseum } from '@/lib/auth-guards'
import { parseBody } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import {
  serviceClient,
  replySchema,
  canSend,
  resolveSenderName,
  markRead,
  assignableMembers,
} from '@/lib/messaging'

type Ctx = { params: Promise<{ conversationId: string }> }

// GET /api/messages/:id — full thread. Authorises that the caller's museum is on
// one side, marks the conversation read, and (for the recipient side) returns
// the list of members who can be assigned.
export async function GET(_req: Request, { params }: Ctx) {
  const { conversationId } = await params
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return gate
  const { user, museum } = gate
  const service = serviceClient()

  const { data: convRows } = await service
    .from('conversations')
    .select(
      'id, subject, object_id, recipient_museum_id, sender_museum_id, started_by_name, assigned_to_user_id, assigned_to_name, last_message_at, created_at'
    )
    .eq('id', conversationId)
    .limit(1)
  const conv = convRows?.[0]
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isRecipientSide = conv.recipient_museum_id === museum.id
  const isSenderSide = conv.sender_museum_id === museum.id
  if (!isRecipientSide && !isSenderSide) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const otherId = isRecipientSide ? conv.sender_museum_id : conv.recipient_museum_id

  const [{ data: msgs }, { data: atts }, { data: museums }, object] = await Promise.all([
    service
      .from('messages')
      .select('id, sender_user_id, sender_museum_id, sender_name, body, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
    service
      .from('message_attachments')
      .select('id, message_id, url, filename, mime_type, size_bytes'),
    service.from('museums').select('id, name, slug').in('id', [otherId, museum.id]),
    conv.object_id
      ? service
          .from('objects')
          .select('id, title, emoji, image_url')
          .eq('id', conv.object_id)
          .limit(1)
          .then(r => r.data?.[0] ?? null)
      : Promise.resolve(null),
  ])

  // Group attachments (fetched broadly, then filtered to this thread's messages).
  const msgIds = new Set((msgs || []).map(m => m.id))
  const attByMsg = new Map<string, any[]>()
  for (const a of atts || []) {
    if (!msgIds.has(a.message_id)) continue
    const list = attByMsg.get(a.message_id) || []
    list.push({ id: a.id, url: a.url, filename: a.filename, mimeType: a.mime_type, sizeBytes: a.size_bytes })
    attByMsg.set(a.message_id, list)
  }

  const museumMap = new Map((museums || []).map(m => [m.id, m]))
  const other = museumMap.get(otherId)

  const messages = (msgs || []).map(m => ({
    id: m.id,
    body: m.body,
    senderName: m.sender_name,
    senderMuseumId: m.sender_museum_id,
    mine: m.sender_museum_id === museum.id,
    createdAt: m.created_at,
    attachments: attByMsg.get(m.id) || [],
  }))

  await markRead(service, conversationId, user.id)

  return NextResponse.json({
    conversation: {
      id: conv.id,
      subject: conv.subject,
      direction: isRecipientSide ? 'incoming' : 'outgoing',
      otherMuseum: other ? { id: other.id, name: other.name, slug: other.slug } : null,
      object,
      startedByName: conv.started_by_name,
      assignedToUserId: conv.assigned_to_user_id,
      assignedToName: conv.assigned_to_name,
      createdAt: conv.created_at,
    },
    messages,
    canReply: canSend(gate),
    isRecipientSide,
    assignableMembers: isRecipientSide ? await assignableMembers(service, museum.id) : [],
  })
}

// POST /api/messages/:id — reply to a conversation.
export async function POST(request: Request, { params }: Ctx) {
  const { conversationId } = await params
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return gate
  const { user, museum } = gate

  if (!canSend(gate)) {
    return NextResponse.json({ error: 'Your role cannot send messages' }, { status: 403 })
  }

  const limited = await rateLimit(apiLimiter, `msg-reply:${user.id}`)
  if (limited) return limited

  const parsed = parseBody(replySchema, await request.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { body, attachments } = parsed.data

  const service = serviceClient()
  const { data: convRows } = await service
    .from('conversations')
    .select('id, recipient_museum_id, sender_museum_id')
    .eq('id', conversationId)
    .limit(1)
  const conv = convRows?.[0]
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (conv.recipient_museum_id !== museum.id && conv.sender_museum_id !== museum.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const senderName = await resolveSenderName(service, gate)
  const now = new Date().toISOString()

  const { data: msgRows, error: msgErr } = await service
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_user_id: user.id,
      sender_museum_id: museum.id,
      sender_name: senderName,
      body,
      created_at: now,
    })
    .select('id')
    .limit(1)
  if (msgErr || !msgRows?.[0]) {
    return NextResponse.json({ error: 'Could not send message' }, { status: 500 })
  }

  if (attachments?.length) {
    await service.from('message_attachments').insert(
      attachments.map(a => ({
        message_id: msgRows[0].id,
        url: a.url,
        filename: a.filename,
        mime_type: a.mimeType,
        size_bytes: a.sizeBytes,
      }))
    )
  }

  await service.from('conversations').update({ last_message_at: now }).eq('id', conversationId)
  await markRead(service, conversationId, user.id)

  return NextResponse.json({ ok: true })
}
