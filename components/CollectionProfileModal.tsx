'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import CollectionProfilePicker from '@/components/CollectionProfilePicker'

interface Props {
  open: boolean
  onClose: () => void
  value: string[]
  onChange: (next: string[]) => void
  usageCount?: Record<string, number>
}

/**
 * "What do you collect?" as a centred modal.
 *
 * The picker used to render inline in the settings dropdown, where 21 cards
 * made the panel far taller than the viewport and pushed Discover, Plan and
 * Account off the bottom of the screen. A modal gives the grid room to breathe
 * and keeps the settings panel short.
 *
 * Portalled to document.body so it escapes the sidebar's stacking context
 * (the aside is z-40, and the panel clips its overflow).
 */
export default function CollectionProfileModal({
  open, onClose, value, onChange, usageCount,
}: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Don't let the page scroll behind the modal.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="What do you collect?"
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h2 className="font-serif text-lg italic text-stone-900 dark:text-stone-100">
              What do you collect<span className="text-amber-600">?</span>
            </h2>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
              Vitrine will use the right words for your collection. Pick as many as you like.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 text-sm leading-none shrink-0 mt-1"
          >
            ✕
          </button>
        </div>

        {/* Only this scrolls — the header and footer stay put. */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <CollectionProfilePicker
            value={value}
            onChange={onChange}
            usageCount={usageCount}
          />
        </div>

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-stone-200 dark:border-stone-800">
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
            {value.length === 0
              ? 'Nothing picked — standard wording'
              : `${value.length} selected`}
          </span>
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white text-xs font-mono px-5 py-2.5 rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
