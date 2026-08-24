'use client'

import type { ReactNode } from 'react'

/**
 * Search, filters and a result count, pinned above a scrolling list.
 *
 * Sticky is the point: the header has to stay put while the list moves under
 * it, so you never lose track of what a column means or which filters are on.
 * The shadow appears only once content is behind it.
 */

export interface ActiveFilter {
  key: string
  label: string
  onClear: () => void
}

interface FilterBarProps {
  search: string
  onSearchChange: (next: string) => void
  searchPlaceholder?: string
  /** Filter controls — usually Select or chip buttons. */
  controls?: ReactNode
  active?: ActiveFilter[]
  onClearAll?: () => void
  /** e.g. "22 of 48 records". */
  count?: string
  /** Right-aligned slot on the count row, for sort or a select-many toggle. */
  countAside?: ReactNode
  /** Sticky offset in px, matching whatever chrome sits above. */
  stickyTop?: number
}

export default function FilterBar({
  search, onSearchChange, searchPlaceholder = 'Search…', controls,
  active = [], onClearAll, count, countAside, stickyTop = 0,
}: FilterBarProps) {
  return (
    <div
      className="sticky z-20 bg-stone-50 dark:bg-stone-950 pb-3 shadow-[0_8px_14px_-10px_rgba(28,25,23,0.35)] dark:shadow-[0_8px_14px_-10px_rgba(0,0,0,0.8)]"
      style={{ top: stickyTop }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
          />
        </div>
        {controls}
      </div>

      {active.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
          {active.map(f => (
            <button
              key={f.key}
              type="button"
              onClick={f.onClear}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              {f.label}
              <span aria-hidden className="text-amber-600 dark:text-amber-400">✕</span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-mono text-amber-700 dark:text-amber-500 hover:underline px-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {(count || countAside) && (
        <div className="flex items-center justify-between gap-3 mt-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500">
            {count}
          </span>
          {countAside}
        </div>
      )}
    </div>
  )
}
