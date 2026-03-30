'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/Toast'

interface DuplicateSearchModalProps {
  objectId: string
  museumId: string
  existingDuplicateIds: string[]  // already-linked object IDs to exclude
  onClose: () => void
  onLinked: (linked: { id: string; title: string; emoji: string }) => void
}

export default function DuplicateSearchModal({ objectId, museumId, existingDuplicateIds, onClose, onLinked }: DuplicateSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState(false)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/objects/search?q=${encodeURIComponent(query)}&museum_id=${museumId}`)
        if (res.ok) {
          const data = await res.json()
          // exclude current object and already-linked duplicates
          const excluded = new Set([objectId, ...existingDuplicateIds])
          setResults((data || []).filter((o: any) => !excluded.has(o.id)))
        }
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  async function handleSelect(target: any) {
    if (linking) return
    setLinking(true)
    try {
      const res = await fetch(`/api/objects/${objectId}/duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicate_of_id: target.id, museum_id: museumId }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast(err.error || 'Failed to link', 'error')
        return
      }
      toast(`Linked as duplicate of "${target.title}"`)
      onLinked({ id: target.id, title: target.title, emoji: target.emoji || '🖼️' })
    } catch {
      toast('Something went wrong', 'error')
    } finally {
      setLinking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100">Link as duplicate of…</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-lg leading-none">✕</button>
        </div>

        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by title…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
          />
        </div>

        <div className="max-h-72 overflow-y-auto border-t border-stone-100 dark:border-stone-800">
          {query.length < 2 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-8">Type at least 2 characters to search</p>
          )}
          {query.length >= 2 && searching && (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-8">Searching…</p>
          )}
          {query.length >= 2 && !searching && results.length === 0 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-8">No matching objects found</p>
          )}
          {results.map((obj, idx) => (
            <button
              key={obj.id}
              onClick={() => handleSelect(obj)}
              disabled={linking}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors disabled:opacity-50 ${idx < results.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
            >
              <span className="text-xl flex-shrink-0">{obj.emoji || '🖼️'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-900 dark:text-stone-100 truncate">{obj.title}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500">
                  {[obj.year, obj.medium].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Both objects will be soft-linked — no data will be deleted or merged.
          </p>
        </div>
      </div>
    </div>
  )
}
