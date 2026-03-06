'use client'

import { useState, useEffect } from 'react'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Search objects & pages' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['N'], description: 'New entry record' },
  { keys: ['G', 'O'], description: 'Go to Objects' },
  { keys: ['G', 'E'], description: 'Go to Entry' },
  { keys: ['G', 'L'], description: 'Go to Loans' },
  { keys: ['G', 'S'], description: 'Go to Staff' },
  { keys: ['G', 'B'], description: 'Go to Site Builder' },
  { keys: ['G', 'P'], description: 'Go to Plan & Billing' },
]

export default function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <span className="text-sm font-mono text-stone-900 dark:text-stone-100">Keyboard Shortcuts</span>
          <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l8 8M12 4L4 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-3 space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-stone-600 dark:text-stone-400">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="min-w-[24px] text-center text-xs font-mono text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded px-1.5 py-0.5">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-stone-200 dark:border-stone-700">
          <p className="text-[10px] font-mono text-stone-400">Press <kbd className="border border-stone-200 dark:border-stone-700 rounded px-1">?</kbd> to toggle</p>
        </div>
      </div>
    </div>
  )
}
