import { NextResponse } from 'next/server'
import { requireAuthedMuseum } from '@/lib/auth-guards'
import { serviceClient, unreadCount } from '@/lib/messaging'

// GET /api/messages/unread — unread conversation count for the sidebar badge.
export async function GET() {
  const gate = await requireAuthedMuseum()
  if (gate instanceof NextResponse) return NextResponse.json({ count: 0 })
  const service = serviceClient()
  const count = await unreadCount(service, gate.museum.id, gate.user.id)
  return NextResponse.json({ count })
}
