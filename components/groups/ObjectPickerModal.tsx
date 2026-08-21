'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Pick objects to add to a set. Search over the collection, multi-select, add.
 * Items already in the set are shown as already-in rather than hidden, so the
 * list does not shift under the cursor as you work.
 */

export interface PickableObject {
  id: string
  title: string
  emoji?: string | null
  image_url?: string | null
  artist?: string | null
  year?: string | null
  medium?: string | null
}

interface Props {
  open: boolean
  objects: PickableObject[]
  alreadyIn: Set<string>
  itemPlural: string
  onClose: () => void
  onAdd: (ids: string[]) => Promise<void> | void
}

export default function ObjectPickerModal({
  open, objects, alreadyIn, itemPlural, onClose, onAdd,
}: Props) {
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setQuery(''); setPicked(new Set()) }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return objects.slice(0, 200)
    return objects
      .filter(o => [o.title, o.artist, o.medium, o.year]
        .some(f => f?.toLowerCase().includes(q)))
      .slice(0, 200)
  }, [objects, query])

  if (!open) return null

  function toggle(id: string) {
    setPicked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (picked.size === 0 || saving) return
    setSaving(true)
    await onAdd(Array.from(picked))
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Add ${itemPlural.toLowerCase()}`}
      >
        <div className="p-4 border-b border-stone-100 dark:border-stone-800">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search your ${itemPlural.toLowerCase()}…`}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {results.length === 0 ? (
            <div className="text-center py-16 text-sm text-stone-400 dark:text-stone-500">
              Nothing matches that.
            </div>
          ) : results.map(object => {
            const inSet = alreadyIn.has(object.id)
            const checked = picked.has(object.id)
            return (
              <button
                key={object.id}
                type="button"
                onClick={() => !inSet && toggle(object.id)}
                disabled={inSet}
                className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-stone-50 dark:border-stone-800 text-left transition-colors ${
                  inSet ? 'opacity-40 cursor-default' : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                } ${checked ? 'bg-stone-50 dark:bg-stone-800' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={checked || inSet}
                  readOnly
                  disabled={inSet}
                  className="rounded border-stone-300 dark:border-stone-600 pointer-events-none"
                />
                <div className="w-9 h-9 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                  {object.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={object.image_url} alt="" className="w-full h-full object-cover" />
                    : (object.emoji || '🖼️')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-stone-900 dark:text-stone-100 truncate">{object.title}</div>
                  <div className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">
                    {[object.artist, object.year, object.medium].filter(Boolean).join(' · ')}
                  </div>
                </div>
                {inSet && (
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500 shrink-0">Already in</span>
                )}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
            {picked.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs font-mono px-4 py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={picked.size === 0 || saving}
              className="text-xs font-mono px-4 py-2 rounded bg-stone-900 text-white dark:bg-white dark:text-stone-900 disabled:opacity-40 transition-opacity hover:opacity-90"
            >
              {saving ? 'Adding…' : `Add ${picked.size || ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
