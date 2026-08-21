'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import type { CollectionGroupRow } from '@/lib/collectionGroups/types'

/**
 * "Add to set" — the other direction. Given objects already chosen (from the
 * bulk bar, or a single object's record), pick which set they go into, or
 * make a new one on the spot.
 *
 * Rule-based sets are offered too: adding to one writes a pin, which is the
 * documented way to include something the filter misses.
 */

interface Props {
  open: boolean
  objectIds: string[]
  sets: CollectionGroupRow[]
  nouns: { singular: string; plural: string }
  onClose: () => void
  onDone: () => void
}

export default function AddToSetModal({ open, objectIds, sets, nouns, onClose, onDone }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const { toast } = useToast()

  useEffect(() => { if (open) setNewTitle('') }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function addTo(groupId: string, label: string) {
    if (busy) return
    setBusy(groupId)
    const res = await fetch(`/api/collection-groups/${groupId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ add: objectIds }),
    })
    setBusy(null)
    if (!res.ok) { toast('Could not add to that ' + nouns.singular.toLowerCase(), 'error'); return }
    toast(`Added ${objectIds.length} to ${label}`)
    onDone()
    onClose()
  }

  async function createAndAdd() {
    const title = newTitle.trim()
    if (!title || busy) return
    setBusy('new')
    const res = await fetch('/api/collection-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) { setBusy(null); toast('Could not create it', 'error'); return }
    const created = await res.json()
    await addTo(created.id, title)
    setBusy(null)
  }

  const manualSets = sets.filter(s => s.membership === 'manual')
  const ruleSets = sets.filter(s => s.membership === 'rule')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="font-serif italic text-lg text-stone-900 dark:text-stone-100">
            Add {objectIds.length} to a {nouns.singular.toLowerCase()}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sets.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-stone-400 dark:text-stone-500">
              You have no {nouns.plural.toLowerCase()} yet. Name one below.
            </div>
          )}

          {manualSets.map(set => (
            <button
              key={set.id}
              onClick={() => addTo(set.id, set.title)}
              disabled={!!busy}
              className="w-full text-left px-4 py-3 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <div className="text-sm text-stone-900 dark:text-stone-100">{set.title}</div>
              <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">
                {set.status === 'draft' ? 'Draft' : 'Published'}
              </div>
            </button>
          ))}

          {ruleSets.length > 0 && (
            <div className="px-4 pt-4 pb-1 text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500">
              Automatic — adding pins an item the filter missed
            </div>
          )}
          {ruleSets.map(set => (
            <button
              key={set.id}
              onClick={() => addTo(set.id, set.title)}
              disabled={!!busy}
              className="w-full text-left px-4 py-3 border-b border-stone-50 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <div className="text-sm text-stone-900 dark:text-stone-100">{set.title}</div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-stone-100 dark:border-stone-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createAndAdd() }}
              placeholder={`New ${nouns.singular.toLowerCase()}…`}
              className="flex-1 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400"
            />
            <button
              onClick={createAndAdd}
              disabled={!newTitle.trim() || !!busy}
              className="text-xs font-mono px-4 py-2 rounded bg-stone-900 text-white dark:bg-white dark:text-stone-900 disabled:opacity-40 transition-opacity hover:opacity-90 whitespace-nowrap"
            >
              Create &amp; add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
