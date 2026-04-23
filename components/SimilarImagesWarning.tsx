'use client'

import Link from 'next/link'

export type SimilarMatch = {
  object_id: string
  url: string
  distance: number
  title: string | null
  accession_no: string | null
  emoji: string | null
}

interface Props {
  matches: SimilarMatch[]
  onContinue: () => void
  onCancel: () => void
}

export default function SimilarImagesWarning({ matches, onContinue, onCancel }: Props) {
  if (matches.length === 0) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg max-w-xl w-full p-6 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Possible duplicate</div>
          <h2 className="font-serif text-xl italic text-stone-900 dark:text-stone-100">
            You may already have {matches.length === 1 ? 'this item' : 'similar items'}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            One of your new photos looks similar to {matches.length === 1 ? 'an existing object' : 'existing objects'} in your collection.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto">
          {matches.map(m => (
            <Link
              key={m.object_id}
              href={`/dashboard/objects/${m.object_id}`}
              target="_blank"
              className="flex items-center gap-3 p-2 border border-stone-200 dark:border-stone-700 rounded hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              <img src={m.url} alt="" className="w-14 h-14 object-cover rounded bg-stone-100 dark:bg-stone-800" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {m.emoji ? `${m.emoji} ` : ''}{m.title || 'Untitled'}
                </div>
                <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                  {m.accession_no || '—'} · similarity {Math.max(0, 100 - Math.round((m.distance / 64) * 100))}%
                </div>
              </div>
              <span className="text-xs font-mono text-stone-400 dark:text-stone-500">Open →</span>
            </Link>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="text-sm font-mono border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel upload
          </button>
          <button
            onClick={onContinue}
            className="text-sm font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded px-4 py-2 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
          >
            Add anyway
          </button>
        </div>
      </div>
    </div>
  )
}
