import { NextResponse } from 'next/server'
import { requireAuthedMuseum } from '@/lib/auth-guards'
import { parseBody } from '@/lib/validations'
import { apiLimiter, rateLimit } from '@/lib/rate-limit'
import {
  serviceClient,
  createConversationSchema,
  canSend,
  resolveSenderName,
  markRead,
} from '@/lib/messaging'

// GET /api/messages — list conversations for the current user's museum
// (both sides of the shared inbox), newest activity first.
export async function GET() {
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return gate
  const { user, museum } = gate
  const service = serviceClient()
  const museumId = museum.id

  const { data: convs } = await service
    .from('conversations')
    .select(
      'id, subject, object_id, recipient_museum_id, sender_museum_id, started_by_name, assigned_to_user_id, assigned_to_name, last_message_at'
    )
    .or(`recipient_museum_id.eq.${museumId},sender_museum_id.eq.${museumId}`)
    .order('last_message_at', { ascending: false })
    .limit(200)

  const conversations = convs || []
  if (conversations.length === 0) return NextResponse.json({ conversations: [] })

  const ids = conversations.map(c => c.id)
  const otherMuseumIds = [
    ...new Set(
      conversations.map(c =>
        c.recipient_museum_id === museumId ? c.sender_museum_id : c.recipient_museum_id
      )
    ),
  ]
  const objectIds = [...new Set(conversations.map(c => c.object_id).filter(Boolean))] as string[]

  const [{ data: museums }, { data: objects }, { data: reads }, { data: lastMsgs }] =
    await Promise.all([
      service.from('museums').select('id, name, slug').in('id', otherMuseumIds),
      objectIds.length
        ? service.from('objects').select('id, title, emoji, image_url').in('id', objectIds)
        : Promise.resolve({ data: [] as any[] }),
      service
        .from('conversation_reads')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)
        .in('conversation_id', ids),
      // Latest activity preview: pull recent messages for these conversations and
      // keep the first (newest) seen per conversation.
      service
        .from('messages')
        .select('conversation_id, body, sender_museum_id, created_at')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })
        .limit(600),
    ])

  const museumMap = new Map((museums || []).map(m => [m.id, m]))
  const objectMap = new Map((objects || []).map(o => [o.id, o]))
  const readMap = new Map((reads || []).map(r => [r.conversation_id, r.last_read_at]))
  const previewMap = new Map<string, { body: string; sender_museum_id: string }>()
  for (const m of lastMsgs || []) {
    if (!previewMap.has(m.conversation_id)) {
      previewMap.set(m.conversation_id, { body: m.body, sender_museum_id: m.sender_museum_id })
    }
  }

  const result = conversations.map(c => {
    const otherId = c.recipient_museum_id === museumId ? c.sender_museum_id : c.recipient_museum_id
    const other = museumMap.get(otherId)
    const obj = c.object_id ? objectMap.get(c.object_id) : null
    const readAt = readMap.get(c.id)
    const preview = previewMap.get(c.id)
    return {
      id: c.id,
      subject: c.subject,
      direction: c.recipient_museum_id === museumId ? 'incoming' : 'outgoing',
      otherMuseum: other ? { id: other.id, name: other.name, slug: other.slug } : null,
      object: obj ? { id: obj.id, title: obj.title, emoji: obj.emoji, image_url: obj.image_url } : null,
      startedByName: c.started_by_name,
      assignedToUserId: c.assigned_to_user_id,
      assignedToName: c.assigned_to_name,
      lastMessageAt: c.last_message_at,
      preview: preview ? preview.body.slice(0, 140) : '',
      unread: !readAt || new Date(readAt) < new Date(c.last_message_at),
    }
  })

  return NextResponse.json({ conversations: result })
}

// POST /api/messages — start a new conversation with a museum.
export async function POST(request: Request) {
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return gate
  const { user, museum } = gate

  if (!canSend(gate)) {
    return NextResponse.json({ error: 'Your role cannot send messages' }, { status: 403 })
  }

  const limited = await rateLimit(apiLimiter, `msg-create:${user.id}`)
  if (limited) return limited

  const parsed = parseBody(createConversationSchema, await request.json().catch(() => null))
  if (!parsed.success) return parsed.response
  const { recipientMuseumId, objectId, subject, body, attachments } = parsed.data

  if (recipientMuseumId === museum.id) {
    return NextResponse.json({ error: "You can't message your own museum" }, { status: 400 })
  }

  const service = serviceClient()

  const { data: recipRows } = await service
    .from('museums')
    .select('id, accept_messages')
    .eq('id', recipientMuseumId)
    .limit(1)
  const recipient = recipRows?.[0]
  if (!recipient) return NextResponse.json({ error: 'Museum not found' }, { status: 404 })
  if (!recipient.accept_messages) {
    return NextResponse.json({ error: 'This museum is not accepting new messages' }, { status: 403 })
  }

  if (objectId) {
    const { data: objRows } = await service
      .from('objects')
      .select('id')
      .eq('id', objectId)
      .eq('museum_id', recipientMuseumId)
      .eq('show_on_site', true)
      .is('deleted_at', null)
      .limit(1)
    if (!objRows?.[0]) {
      return NextResponse.json({ error: 'Object not found for this museum' }, { status: 400 })
    }
  }

  const senderName = await resolveSenderName(service, gate)
  const now = new Date().toISOString()

  const { data: convRows, error: convErr } = await service
    .from('conversations')
    .insert({
      recipient_museum_id: recipientMuseumId,
      sender_museum_id: museum.id,
      started_by_user_id: user.id,
      started_by_name: senderName,
      object_id: objectId ?? null,
      subject,
      last_message_at: now,
      created_at: now,
    })
    .select('id')
    .limit(1)
  if (convErr || !convRows?.[0]) {
    return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 })
  }
  const conversationId = convRows[0].id

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

  await markRead(service, conversationId, user.id)

  return NextResponse.json({ conversationId })
}
