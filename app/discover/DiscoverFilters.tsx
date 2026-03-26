'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { COLLECTION_CATEGORIES } from '@/lib/categories'

export default function DiscoverFilters({ selectedCategories, query, hideSearch = false, hideCategories = false }: {
  selectedCategories: string[]
  query: string
  hideSearch?: boolean
  hideCategories?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function updateParams(updates: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','))
      } else {
        params.set(key, value)
      }
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    updateParams({ q: e.target.value || null })
  }

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat]
    updateParams({ categories: next.length ? next : null })
  }

  function clearAll() {
    startTransition(() => router.push(pathname))
  }

  const hasFilters = query || selectedCategories.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      {!hideSearch && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            defaultValue={query}
            onChange={handleSearch}
            placeholder="Search the Vitrine collection…"
            className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 outline-none focus:border-white/20 transition-colors font-mono"
          />
        </div>
      )}

      {/* Active filters summary + clear */}
      {!hideSearch && hasFilters && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-stone-500">
            {selectedCategories.length > 0 && `${selectedCategories.length} categor${selectedCategories.length === 1 ? 'y' : 'ies'}`}
            {selectedCategories.length > 0 && query && ' · '}
            {query && `"${query}"`}
          </span>
          <button onClick={clearAll} className="text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* Category list */}
      {!hideCategories && (
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-500 mb-3">Categories</div>
          <div className="space-y-1">
            {COLLECTION_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedCategories.includes(cat)
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
