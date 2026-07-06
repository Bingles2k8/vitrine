import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

// =============================================================
// Messaging / Inbox — shared helpers
// =============================================================
// Authorisation for the inbox is enforced here + in the /api/messages routes
// using the service-role client (RLS is a deny-by-default backstop). A user
// belongs to exactly one museum (owner OR one staff row), so a conversation is
// visible to them when their museum is on either side.
// =============================================================

// Attachments reuse the existing public-read `object-documents` R2 bucket, so
// they don't require new infra and don't count against document-storage quota.
export const ATTACHMENT_BUCKET = 'object-documents' as const
export const MAX_ATTACHMENTS = 5
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB

export function isAllowedAttachmentType(mime: string): boolean {
  return mime.startsWith('image/') || mime === 'application/pdf'
}

// Service-role client — bypasses RLS. Server-only; never expose to the browser.
export function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// --- Validation schemas ---

const attachmentSchema = z.object({
  url: z.string().url().max(2000),
  filename: z.string().min(1).max(300),
  mimeType: z.string().min(1).max(200).refine(isAllowedAttachmentType, 'Unsupported file type'),
  sizeBytes: z.number().int().min(1).max(MAX_ATTACHMENT_BYTES),
})

export const createConversationSchema = z.object({
  recipientMuseumId: z.string().uuid(),
  objectId: z.string().uuid().nullable().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional(),
})

export const replySchema = z.object({
  body: z.string().min(1).max(10000),
  attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional(),
})

export const assignSchema = z.object({
  // null = unassign
  assignedToUserId: z.string().uuid().nullable(),
})

// --- Auth helpers ---

type Gate = {
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> | null }
  museum: { id: string; name: string }
  isOwner: boolean
  staffAccess: string | null
}

// Whether this member may send/reply/assign. Reading is open to all members;
// Viewers are read-only (mirrors the rest of the app's RLS philosophy).
export function canSend(gate: Pick<Gate, 'isOwner' | 'staffAccess'>): boolean {
  return gate.isOwner || gate.staffAccess === 'Admin' || gate.staffAccess === 'Editor'
}

// Person display name for "show both" identity. Denormalised onto rows at write
// time so the inbox never resolves auth users at render. Owners have no
// staff_members row, so fall back to auth metadata / email.
export async function resolveSenderName(service: SupabaseClient, gate: Gate): Promise<string> {
  if (!gate.isOwner) {
    const { data } = await service
      .from('staff_members')
      .select('name')
      .eq('user_id', gate.user.id)
      .eq('museum_id', gate.museum.id)
      .limit(1)
    const name = data?.[0]?.name
    if (name) return name
  }
  const meta = gate.user.user_metadata || {}
  return meta.full_name || meta.name || gate.user.email?.split('@')[0] || 'Someone'
}

// Look up the display name of an assignable recipient-side member (owner or
// staff) by their auth user id, scoped to the recipient museum.
export async function resolveMemberName(
  service: SupabaseClient,
  museumId: string,
  userId: string
): Promise<string | null> {
  const { data: owned } = await service
    .from('museums')
    .select('name, owner_id')
    .eq('id', museumId)
    .limit(1)
  const museum = owned?.[0]
  if (museum?.owner_id === userId) {
    const { data: u } = await service.auth.admin.getUserById(userId)
    const meta = u?.user?.user_metadata || {}
    return meta.full_name || meta.name || u?.user?.email?.split('@')[0] || 'Owner'
  }
  const { data: staff } = await service
    .from('staff_members')
    .select('name')
    .eq('user_id', userId)
    .eq('museum_id', museumId)
    .limit(1)
  return staff?.[0]?.name ?? null
}

// Members of a museum who can be assigned a conversation (owner + staff with a
// linked account). Returns [{ userId, name }].
export async function assignableMembers(
  service: SupabaseClient,
  museumId: string
): Promise<{ userId: string; name: string }[]> {
  const members: { userId: string; name: string }[] = []

  const { data: museumRows } = await service
    .from('museums')
    .select('name, owner_id')
    .eq('id', museumId)
    .limit(1)
  const museum = museumRows?.[0]
  if (museum?.owner_id) {
    const { data: u } = await service.auth.admin.getUserById(museum.owner_id)
    const meta = u?.user?.user_metadata || {}
    members.push({
      userId: museum.owner_id,
      name: meta.full_name || meta.name || u?.user?.email?.split('@')[0] || 'Owner',
    })
  }

  const { data: staff } = await service
    .from('staff_members')
    .select('user_id, name')
    .eq('museum_id', museumId)
    .not('user_id', 'is', null)
  for (const s of staff || []) {
    if (s.user_id) members.push({ userId: s.user_id, name: s.name || 'Staff' })
  }
  return members
}

// --- Read state ---

// Mark a conversation read for a user (upsert last_read_at = now).
export async function markRead(service: SupabaseClient, conversationId: string, userId: string) {
  await service
    .from('conversation_reads')
    .upsert(
      { conversation_id: conversationId, user_id: userId, last_read_at: new Date().toISOString() },
      { onConflict: 'conversation_id,user_id' }
    )
}

// Count unread conversations for a user's museum. A conversation is unread when
// there's no read row or last_read_at < last_message_at. We keep last_read_at in
// sync on open AND on send, so a conversation you last replied to isn't unread.
export async function unreadCount(
  service: SupabaseClient,
  museumId: string,
  userId: string
): Promise<number> {
  const { data: convs } = await service
    .from('conversations')
    .select('id, last_message_at')
    .or(`recipient_museum_id.eq.${museumId},sender_museum_id.eq.${museumId}`)
    .order('last_message_at', { ascending: false })
    .limit(500)
  if (!convs || convs.length === 0) return 0

  const ids = convs.map(c => c.id)
  const { data: reads } = await service
    .from('conversation_reads')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId)
    .in('conversation_id', ids)

  const readMap = new Map<string, string>()
  for (const r of reads || []) readMap.set(r.conversation_id, r.last_read_at)

  let count = 0
  for (const c of convs) {
    const readAt = readMap.get(c.id)
    if (!readAt || new Date(readAt) < new Date(c.last_message_at)) count++
  }
  return count
}
