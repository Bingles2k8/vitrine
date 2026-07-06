'use client'

import { useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

interface Props {
  recipientMuseumId: string
  recipientMuseumName: string
  objectId?: string | null
  objectTitle?: string | null
  accent?: string
  label?: string
}

function isAllowed(type: string) {
  return type.startsWith('image/') || type === 'application/pdf'
}

export default function ContactMuseumButton({
  recipientMuseumId,
  recipientMuseumName,
  objectId = null,
  objectTitle = null,
  accent = '#b45309',
  label,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(
    objectTitle ? `Enquiry about ${objectTitle}` : `Message to ${recipientMuseumName}`
  )
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const buttonLabel = label ?? (objectTitle ? 'Contact about this item' : `Message ${recipientMuseumName}`)

  async function handleOpen() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/login?next=${encodeURIComponent(pathname || '/discover')}`)
      return
    }
    setError(null)
    setOpen(true)
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const incoming = Array.from(list)
    const next: File[] = [...files]
    for (const f of incoming) {
      if (!isAllowed(f.type)) { setError(`${f.name}: only images and PDFs are allowed`); continue }
      if (f.size > MAX_ATTACHMENT_BYTES) { setError(`${f.name}: exceeds 10 MB`); continue }
      if (next.length >= MAX_ATTACHMENTS) { setError(`Up to ${MAX_ATTACHMENTS} files`); break }
      next.push(f)
    }
    setFiles(next)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function uploadOne(file: File) {
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

  async function handleSend() {
    if (!body.trim() || !subject.trim()) { setError('Subject and message are required'); return }
    setSending(true)
    setError(null)
    try {
      const attachments = []
      for (const f of files) attachments.push(await uploadOne(f))

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientMuseumId,
          objectId,
          subject: subject.trim(),
          body: body.trim(),
          attachments,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Could not send message')
      }
      const { conversationId } = await res.json()
      router.push(`/dashboard/inbox/${conversationId}`)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 text-sm font-mono px-5 py-2.5 rounded text-white transition-opacity hover:opacity-90"
        style={{ background: accent }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !sending && setOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800">
              <div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Message {recipientMuseumName}</div>
                {objectTitle && <div className="text-xs text-stone-400 mt-0.5">About: {objectTitle}</div>}
              </div>
              <button onClick={() => !sending && setOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-lg leading-none">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-stone-400 mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={200}
                  className="w-full text-sm bg-transparent border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-stone-400 mb-1">Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={5}
                  maxLength={10000}
                  placeholder="Ask a question, or request this item for an exhibition or loan…"
                  className="w-full text-sm bg-transparent border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 resize-none"
                />
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={e => addFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-xs font-mono text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 border border-dashed border-stone-300 dark:border-stone-700 rounded px-3 py-2 w-full transition-colors"
                >
                  + Attach images or PDFs (up to {MAX_ATTACHMENTS}, 10 MB each)
                </button>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                        <span className="truncate">{f.name}</span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="ml-2 text-stone-400 hover:text-red-500">remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-200 dark:border-stone-800">
              <button onClick={() => !sending && setOpen(false)} className="text-sm font-mono text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 px-4 py-2">Cancel</button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="text-sm font-mono px-5 py-2 rounded text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: accent }}
              >
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
