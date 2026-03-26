'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { COLLECTION_CATEGORIES } from '@/lib/categories'

export default function DiscoverMobileFilters({ selectedCategories, query }: {
  selectedCategories: string[]
  query: string
}) {
  const [open, setOpen] = useState(false)
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
    setOpen(false)
  }

  return (
    <>
      {/* Search + filter button row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            defaultValue={query}
            onChange={handleSearch}
            placeholder="Search collections…"
            className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-stone-100 placeholder:text-stone-500 outline-none focus:border-white/20 transition-colors font-mono"
          />
        </div>
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-mono transition-colors flex-shrink-0 ${
            selectedCategories.length > 0
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-white/5 border-white/10 text-stone-400'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filters
          {selectedCategories.length > 0 && (
            <span className="bg-amber-500 text-stone-950 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
              {selectedCategories.length}
            </span>
          )}
        </button>
      </div>

      {/* Bottom sheet */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900 border-t border-white/10 rounded-t-2xl max-h-[75vh] flex flex-col">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-10 h-1 bg-white/20 rounded-full" />
              <span className="text-sm font-mono text-stone-300">Categories</span>
              <div className="flex items-center gap-3">
                {selectedCategories.length > 0 && (
                  <button onClick={clearAll} className="text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors">
                    Clear all
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-300 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Category list */}
            <div className="overflow-y-auto px-4 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid grid-cols-2 gap-1.5">
                {COLLECTION_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      selectedCategories.includes(cat)
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-stone-400 hover:text-stone-200 bg-white/5 border border-transparent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
