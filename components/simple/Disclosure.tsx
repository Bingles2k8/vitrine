'use client'

import { useState, type ReactNode } from 'react'

/**
 * "More details" — an expander that looks like a control.
 *
 * The old version was a bare text link with a chevron glyph, which read as
 * decoration and hid every optional field behind something nobody clicked.
 * This is a bordered panel with its own header bar, a chevron that turns, and
 * a Show/Hide word, so it is obvious there is more behind it.
 */

interface DisclosureProps {
  title: string
  /** One line naming what is inside, so opening it is an informed choice. */
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}

export default function Disclosure({ title, hint, defaultOpen = false, children }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-stone-300 dark:border-stone-600 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-stone-100 dark:bg-stone-800 text-left hover:bg-stone-150 dark:hover:bg-stone-700/60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-600"
      >
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-stone-700 dark:text-stone-300 flex-shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">{title}</span>
        {hint && (
          <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">— {hint}</span>
        )}
        <span className="ml-auto text-xs font-mono text-stone-500 dark:text-stone-400 flex-shrink-0">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>

      {open && <div className="p-4 bg-white dark:bg-stone-900">{children}</div>}
    </div>
  )
}
