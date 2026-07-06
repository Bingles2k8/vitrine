'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { getMuseumForUser } from '@/lib/get-museum'
import DashboardShell from '@/components/DashboardShell'
import { Skeleton } from '@/components/Skeleton'

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

interface Attachment { id?: string; url: string; filename: string; mimeType: string; sizeBytes: number }
interface Message {
  id: string
  body: string
  senderName: string
  mine: boolean
  createdAt: string
  attachments: Attachment[]
}
interface Member { userId: string; name: string }
interface Conversation {
  id: string
  subject: string
  direction: 'incoming' | 'outgoing'
  otherMuseum: { id: string; name: string; slug: string } | null
  object: { id: string; title: string; emoji: string | null; image_url: string | null } | null
  startedByName: string
  assignedToUserId: string | null
  assignedToName: string | null
}

function isAllowed(type: string) {
  return type.startsWith('image/') || type === 'application/pdf'
}

export default function ThreadPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string
  const supabase = createClient()

  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [canReply, setCanReply] = useState(false)
  const [isRecipientSide, setIsRecipientSide] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [reply, setReply] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch(`/api/messages/${conversationId}`)
    if (res.status === 404 || res.status === 403) { setNotFound(true); setLoading(false); return }
    if (res.ok) {
      const data = await res.json()
      setConversation(data.conversation)
      setMessages(data.messages)
      setCanReply(data.canReply)
      setIsRecipientSide(data.isRecipientSide)
      setMembers(data.assignableMembers || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      const access = await getMuseumForUser(supabase)
      if (!access) { router.push('/login'); return }
      setMuseum(access.museum)
      setIsOwner(access.isOwner)
      setStaffAccess(access.staffAccess)
      await load()
    })()
  }, [conversationId])

  const onSignOut = async () => { await supabase.auth.signOut(); router.push('/login') }

  function addFiles(list: FileList | null) {
    if (!list) return
    const next = [...files]
    for (const f of Array.from(list)) {
      if (!isAllowed(f.type)) { setError(`${f.name}: only images and PDFs`); continue }
      if (f.size > MAX_ATTACHMENT_BYTES) { setError(`${f.name}: exceeds 10 MB`); continue }
      if (next.length >= MAX_ATTACHMENTS) { setError(`Up to ${MAX_ATTACHMENTS} files`); break }
      next.push(f)
    }
    setFiles(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadOne(file: File): Promise<Attachment> {
    const presign = await fetch('/api/messages/attachment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size }),
    })
    if (!presign.ok) throw new Error('Could not prepare upload')
    const { uploadUrl, publicUrl, filename } = await presign.json()
    const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    if (!put.ok) throw new Error('Upload failed')
    return { url: publicUrl, filename, mimeType: file.type, sizeBytes: file.size }
  }

  async function sendReply() {
    if (!reply.trim()) return
    setSending(true)
    setError(null)
    try {
      const attachments: Attachment[] = []
      for (const f of files) attachments.push(await uploadOne(f))
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: reply.trim(), attachments }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Could not send')
      }
      setReply('')
      setFiles([])
      await load()
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  async function assign(userId: string | null) {
    const res = await fetch(`/api/messages/${conversationId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToUserId: userId }),
    })
    if (res.ok) {
      const { assignedToUserId, assignedToName } = await res.json()
      setConversation(c => c ? { ...c, assignedToUserId, assignedToName } : c)
    }
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/inbox" onSignOut={onSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button onClick={() => router.push('/dashboard/inbox')} className="text-xs font-mono text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 mb-6">
          ← Back to inbox
        </button>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-3/4" />
          </div>
        ) : notFound || !conversation ? (
          <div className="text-center py-24 text-stone-400">
            <p className="text-sm">This conversation isn't available.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border-b border-stone-200 dark:border-stone-800 pb-4 mb-6">
              <h1 className="text-xl font-medium text-stone-900 dark:text-stone-100">{conversation.subject}</h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                <span>{conversation.direction === 'incoming' ? 'From' : 'To'} <span className="font-medium">{conversation.otherMuseum?.name}</span></span>
                {conversation.object && conversation.otherMuseum && (
                  <>
                    <span>·</span>
                    <Link href={`/museum/${conversation.otherMuseum.slug}/object/${conversation.object.id}`} className="text-amber-600 hover:text-amber-500" target="_blank">
                      {conversation.object.emoji || '🖼️'} {conversation.object.title}
                    </Link>
                  </>
                )}
              </div>

              {/* Assignment — recipient side only */}
              {isRecipientSide && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-stone-400">Assigned to:</span>
                  {canReply ? (
                    <select
                      value={conversation.assignedToUserId || ''}
                      onChange={e => assign(e.target.value || null)}
                      className="text-xs font-mono bg-transparent border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-stone-600 dark:text-stone-300"
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.userId} value={m.userId}>{m.name}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-stone-600 dark:text-stone-300">{conversation.assignedToName || 'Unassigned'}</span>
                  )}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    m.mine
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-100'
                  }`}>
                    <div className={`text-[11px] mb-1 ${m.mine ? 'text-amber-100' : 'text-stone-400 dark:text-stone-500'}`}>
                      {m.senderName} · {new Date(m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                    {m.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.attachments.map(a => (
                          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs underline ${m.mine ? 'text-amber-50' : 'text-amber-600 dark:text-amber-400'}`}>
                            📎 {a.filename}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            {canReply ? (
              <div className="mt-6 border-t border-stone-200 dark:border-stone-800 pt-4">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={3}
                  maxLength={10000}
                  placeholder="Write a reply…"
                  className="w-full text-sm bg-transparent border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 resize-none"
                />
                <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" onChange={e => addFiles(e.target.files)} className="hidden" />
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-stone-500">
                        <span className="truncate">📎 {f.name}</span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="ml-2 text-stone-400 hover:text-red-500">remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                <div className="flex items-center justify-between mt-2">
                  <button onClick={() => fileRef.current?.click()} className="text-xs font-mono text-stone-500 hover:text-stone-800 dark:hover:text-stone-200">
                    + Attach
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="text-sm font-mono px-5 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {sending ? 'Sending…' : 'Send reply'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-xs text-stone-400 border-t border-stone-200 dark:border-stone-800 pt-4">
                Your role has read-only access to messages.
              </p>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  )
}
