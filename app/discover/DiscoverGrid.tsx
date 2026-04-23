'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export type DiscoverItem = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  emoji: string | null
  museum_slug: string
  museum_name: string
  effective_category: string | null
}

type ViewMode = 'list' | 'large' | 'compact'
const STORAGE_KEY = 'vitrine.discover.view'

export default function DiscoverGrid({
  items,
  query,
  selectedCategories,
  museumQuery,
}: {
  items: DiscoverItem[]
  query: string
  selectedCategories: string[]
  museumQuery: string
}) {
  const [view, setView] = useState<ViewMode>('large')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'list' || saved === 'large' || saved === 'compact') {
      setView(saved)
    }
  }, [])

  function selectView(v: ViewMode) {
    setView(v)
    try { localStorage.setItem(STORAGE_KEY, v) } catch {}
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="text-xs font-mono text-stone-500">
          {items.length === 0
            ? 'No objects found'
            : `${items.length} object${items.length === 1 ? '' : 's'}`}
          {selectedCategories.length > 0 && ` in ${selectedCategories.join(', ')}`}
          {query && ` matching "${query}"`}
          {museumQuery && ` from museums matching "${museumQuery}"`}
        </div>

        <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/3 p-0.5">
          <ToggleButton active={view === 'list'} onClick={() => selectView('list')} label="List view">
            <IconList />
          </ToggleButton>
          <ToggleButton active={view === 'large'} onClick={() => selectView('large')} label="Large grid">
            <IconLarge />
          </ToggleButton>
          <ToggleButton active={view === 'compact'} onClick={() => selectView('compact')} label="Compact grid">
            <IconCompact />
          </ToggleButton>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div className="text-stone-400 text-sm font-mono mb-2">No objects found</div>
          <div className="text-stone-600 text-xs max-w-xs">
            {query || selectedCategories.length > 0
              ? 'Try adjusting your search or removing some category filters.'
              : 'No public collections are available yet. Check back soon.'}
          </div>
        </div>
      ) : view === 'list' ? (
        <ListView items={items} />
      ) : view === 'compact' ? (
        <CompactGrid items={items} />
      ) : (
        <LargeGrid items={items} />
      )}
    </>
  )
}

function ToggleButton({
  active, onClick, label, children,
}: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        active ? 'bg-white/10 text-stone-100' : 'text-stone-500 hover:text-stone-300'
      }`}
    >
      {children}
    </button>
  )
}

function LargeGrid({ items }: { items: DiscoverItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(obj => (
        <Link
          key={obj.id}
          href={`/museum/${obj.museum_slug}/object/${obj.id}`}
          className="group bg-white/3 border border-white/8 rounded-xl overflow-hidden hover:border-white/15 hover:bg-white/5 transition-all"
        >
          <div className="relative pb-[100%] bg-stone-900 overflow-hidden">
            {obj.image_url ? (
              <img
                src={obj.image_url}
                alt={obj.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-4xl text-stone-700">
                {obj.emoji || '🏛️'}
              </div>
            )}
          </div>
          <div className="p-3">
            <div className="text-sm font-medium text-stone-100 leading-snug mb-1 line-clamp-2">
              {obj.title}
            </div>
            {obj.description && (
              <div className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-2">
                {obj.description}
              </div>
            )}
            <div className="text-xs font-mono text-stone-600 truncate">
              {obj.museum_name}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function CompactGrid({ items }: { items: DiscoverItem[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3">
      {items.map(obj => (
        <Link
          key={obj.id}
          href={`/museum/${obj.museum_slug}/object/${obj.id}`}
          className="group bg-white/3 border border-white/8 rounded-lg overflow-hidden hover:border-white/15 hover:bg-white/5 transition-all"
        >
          <div className="relative pb-[100%] bg-stone-900 overflow-hidden">
            {obj.image_url ? (
              <img
                src={obj.image_url}
                alt={obj.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-2xl text-stone-700">
                {obj.emoji || '🏛️'}
              </div>
            )}
          </div>
          <div className="p-2">
            <div className="text-xs font-medium text-stone-100 leading-snug line-clamp-2">
              {obj.title}
            </div>
            <div className="text-[10px] font-mono text-stone-600 truncate mt-1">
              {obj.museum_name}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ListView({ items }: { items: DiscoverItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(obj => (
        <Link
          key={obj.id}
          href={`/museum/${obj.museum_slug}/object/${obj.id}`}
          className="group flex gap-4 bg-white/3 border border-white/8 rounded-xl overflow-hidden hover:border-white/15 hover:bg-white/5 transition-all"
        >
          <div className="relative w-28 sm:w-36 aspect-square flex-shrink-0 bg-stone-900 overflow-hidden">
            {obj.image_url ? (
              <img
                src={obj.image_url}
                alt={obj.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-3xl text-stone-700">
                {obj.emoji || '🏛️'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 py-3 pr-4 flex flex-col justify-center">
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div className="text-base font-medium text-stone-100 leading-snug line-clamp-2">
                {obj.title}
              </div>
              {obj.effective_category && (
                <span className="flex-shrink-0 text-[10px] font-mono uppercase tracking-wider text-stone-400 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                  {obj.effective_category}
                </span>
              )}
            </div>
            {obj.description && (
              <div className="text-sm text-stone-400 leading-relaxed line-clamp-3 mb-2">
                {obj.description}
              </div>
            )}
            <div className="text-xs font-mono text-stone-600 truncate">
              {obj.museum_name}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="4" x2="13" y2="4" />
      <line x1="3" y1="8" x2="13" y2="8" />
      <line x1="3" y1="12" x2="13" y2="12" />
    </svg>
  )
}

function IconLarge() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.5" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="0.5" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="0.5" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="0.5" />
    </svg>
  )
}

function IconCompact() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="2" y="2" width="3" height="3" rx="0.4" />
      <rect x="6.5" y="2" width="3" height="3" rx="0.4" />
      <rect x="11" y="2" width="3" height="3" rx="0.4" />
      <rect x="2" y="6.5" width="3" height="3" rx="0.4" />
      <rect x="6.5" y="6.5" width="3" height="3" rx="0.4" />
      <rect x="11" y="6.5" width="3" height="3" rx="0.4" />
      <rect x="2" y="11" width="3" height="3" rx="0.4" />
      <rect x="6.5" y="11" width="3" height="3" rx="0.4" />
      <rect x="11" y="11" width="3" height="3" rx="0.4" />
    </svg>
  )
}
