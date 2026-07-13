'use client'

import { useState, useEffect } from 'react'
import { WHATS_NEW, latestWhatsNewId } from '@/lib/whatsNew'

const SEEN_KEY = 'vitrine_whatsnew_seen'

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default function WhatsNewButton() {
  const [open, setOpen] = useState(false)
  const [hasUnseen, setHasUnseen] = useState(false)

  // Determine unseen state on mount (client-only; avoids hydration mismatch)
  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY)
      setHasUnseen(seen !== latestWhatsNewId)
    } catch {
      setHasUnseen(true)
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function openPanel() {
    setOpen(true)
    setHasUnseen(false)
    try { localStorage.setItem(SEEN_KEY, latestWhatsNewId) } catch { /* ignore */ }
  }

  return (
    <>
      <button
        onClick={openPanel}
        className="w-full px-5 py-3 text-left text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors flex items-center gap-2 border-t border-stone-200 dark:border-stone-800"
      >
        <span>✦</span>
        <span>What&apos;s new</span>
        {hasUnseen && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            New
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="What's new in Vitrine"
        >
          <div
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur">
              <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">
                What&apos;s new<span className="text-amber-600">.</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300 text-sm leading-none"
              >
                ✕
              </button>
            </div>

            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {WHATS_NEW.map(entry => (
                <li key={entry.id} className="px-6 py-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span className="text-base leading-none">{entry.emoji}</span>
                      {entry.title}
                    </h3>
                    <time className="text-[11px] font-mono text-stone-400 dark:text-stone-500 flex-shrink-0">
                      {formatDate(entry.date)}
                    </time>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">{entry.body}</p>
                  {entry.link && (
                    <a
                      href={entry.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs font-mono text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors"
                    >
                      {entry.link.label} →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
