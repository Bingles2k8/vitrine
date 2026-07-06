'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getMuseumForUser } from '@/lib/get-museum'
import DashboardShell from '@/components/DashboardShell'
import { TableSkeleton } from '@/components/Skeleton'

interface ConversationRow {
  id: string
  subject: string
  direction: 'incoming' | 'outgoing'
  otherMuseum: { id: string; name: string; slug: string } | null
  object: { id: string; title: string; emoji: string | null; image_url: string | null } | null
  startedByName: string
  assignedToName: string | null
  lastMessageAt: string
  preview: string
  unread: boolean
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const router = useRouter()
  const supabase = createClient()
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const access = await getMuseumForUser(supabase)
      if (!access) { router.push('/login'); return }
      setMuseum(access.museum)
      setIsOwner(access.isOwner)
      setStaffAccess(access.staffAccess)
      const res = await fetch('/api/messages')
      if (res.ok) {
        const { conversations } = await res.json()
        setConversations(conversations)
      }
      setLoading(false)
    })()
  }, [])

  const onSignOut = async () => { await supabase.auth.signOut(); router.push('/login') }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/inbox" onSignOut={onSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-serif italic text-stone-900 dark:text-stone-100">Inbox</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Enquiries about your collection, and conversations you've started.
          </p>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : conversations.length === 0 ? (
          <div className="text-center py-24 text-stone-400 dark:text-stone-500">
            <div className="text-5xl mb-4">✉️</div>
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">When someone contacts you about an object, it will appear here.</p>
          </div>
        ) : (
          <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/inbox/${c.id}`)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/60 ${
                  c.unread ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''
                }`}
              >
                <div className="w-10 h-10 flex-shrink-0 rounded bg-stone-100 dark:bg-stone-800 overflow-hidden flex items-center justify-center text-lg">
                  {c.object?.image_url
                    ? <img src={c.object.image_url} alt="" className="w-full h-full object-cover" />
                    : (c.object?.emoji || '🏛️')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {c.unread && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                    <span className={`text-sm truncate ${c.unread ? 'font-semibold text-stone-900 dark:text-stone-100' : 'text-stone-700 dark:text-stone-300'}`}>
                      {c.otherMuseum?.name || 'Unknown museum'}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${
                      c.direction === 'incoming'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                    }`}>
                      {c.direction === 'incoming' ? 'received' : 'sent'}
                    </span>
                    <span className="ml-auto text-[11px] text-stone-400 flex-shrink-0">{relativeTime(c.lastMessageAt)}</span>
                  </div>
                  <div className="text-sm text-stone-800 dark:text-stone-200 truncate mt-0.5">{c.subject}</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">
                    {c.object ? <span className="text-stone-500 dark:text-stone-400">Re: {c.object.title} — </span> : null}
                    {c.preview}
                  </div>
                  {c.assignedToName && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-500 mt-1">Assigned to {c.assignedToName}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
