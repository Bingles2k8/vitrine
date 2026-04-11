'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface ObjectItem {
  id: string
  title: string
  artist: string
  year: string
  medium: string
  culture: string
  status: string
  emoji: string
  image_url: string | null
  condition_grade?: string | null
  rarity?: string | null
}

interface StyleSettings {
  template: string
  accentColor: string
  card_radius: number
  grid_columns: number
  image_ratio: string
  card_padding: string
  card_metadata: string
  darkMode?: boolean
}

interface Props {
  objects: ObjectItem[]
  slug: string
  settings: StyleSettings
}

export default function CollectionSearch({ objects, slug, settings }: Props) {
  const [query, setQuery] = useState('')
  const [activeMedium, setActiveMedium] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')

  const { template, accentColor, card_radius, grid_columns, image_ratio, card_padding, card_metadata, darkMode } = settings
  const DARK_TEMPLATES = new Set(['dramatic', 'classic', 'cover'])
  const useDark = darkMode === true && !DARK_TEMPLATES.has(template)

  const mediums = useMemo(() => {
    const all = objects.map(a => a.medium).filter(Boolean)
    return ['All', ...Array.from(new Set(all)).sort()]
  }, [objects])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return objects.filter(a => {
      const matchesQuery = !q || [a.title, a.artist, a.medium, a.culture, a.year]
        .some(field => field?.toLowerCase().includes(q))
      const matchesMedium = activeMedium === 'All' || a.medium === activeMedium
      const matchesStatus = activeStatus === 'All' || a.status === activeStatus
      return matchesQuery && matchesMedium && matchesStatus
    })
  }, [objects, query, activeMedium, activeStatus])

  const hasActiveFilters = query || activeMedium !== 'All' || activeStatus !== 'All'

  function clearAll() {
    setQuery('')
    setActiveMedium('All')
    setActiveStatus('All')
  }

  const titleClassLight: Record<string, string> = {
    minimal: 'font-serif text-stone-900',
    dramatic: 'font-serif italic text-white',
    archival: 'font-serif italic text-stone-800',
    editorial: 'font-sans font-bold text-black uppercase tracking-tight text-sm',
    classic: 'font-serif italic text-amber-100',
    curator: 'font-serif text-stone-900',
    magazine: 'font-sans font-bold text-black uppercase tracking-tight text-sm',
    salon: 'font-serif text-stone-900',
  }
  const titleClassDark: Record<string, string> = {
    minimal: 'font-serif text-stone-100',
    editorial: 'font-sans font-bold text-white uppercase tracking-tight text-sm',
    archival: 'font-serif italic text-stone-200',
    curator: 'font-serif text-stone-100',
    magazine: 'font-sans font-bold text-white uppercase tracking-tight text-sm',
    salon: 'font-serif text-stone-100',
  }
  const titleClass = (useDark ? titleClassDark[template] : titleClassLight[template]) ?? titleClassLight.minimal

  const artistClassLight: Record<string, string> = {
    minimal: 'text-stone-400 italic',
    dramatic: 'text-white/40 italic',
    archival: 'text-stone-500 italic',
    editorial: 'text-stone-500 font-mono uppercase tracking-widest not-italic',
    classic: 'text-amber-300/60 italic',
    curator: 'text-stone-400 italic',
    magazine: 'text-stone-500 font-mono uppercase tracking-widest not-italic',
    salon: 'text-stone-400 italic',
  }
  const artistClassDark: Record<string, string> = {
    minimal: 'text-stone-500 italic',
    editorial: 'text-stone-500 font-mono uppercase tracking-widest not-italic',
    archival: 'text-stone-500 italic',
    curator: 'text-stone-500 italic',
    magazine: 'text-stone-500 font-mono uppercase tracking-widest not-italic',
    salon: 'text-stone-500 italic',
  }
  const artistClass = (useDark ? artistClassDark[template] : artistClassLight[template]) ?? artistClassLight.minimal

  const metaClassLight: Record<string, string> = {
    minimal: 'font-mono text-stone-400',
    dramatic: 'font-mono text-white/30',
    archival: 'font-mono text-stone-400',
    editorial: 'font-mono text-stone-500',
    classic: 'font-mono text-amber-300/40',
    curator: 'font-mono text-stone-400',
    magazine: 'font-mono text-stone-500',
    salon: 'font-mono text-stone-400',
  }
  const metaClassDark: Record<string, string> = {
    minimal: 'font-mono text-stone-600',
    editorial: 'font-mono text-stone-600',
    archival: 'font-mono text-stone-600',
    curator: 'font-mono text-stone-600',
    magazine: 'font-mono text-stone-600',
    salon: 'font-mono text-stone-600',
  }
  const metaClass = (useDark ? metaClassDark[template] : metaClassLight[template]) ?? metaClassLight.minimal

  const cardBgLight: Record<string, string> = {
    minimal: 'bg-white border border-stone-200 hover:shadow-md',
    dramatic: 'bg-stone-900 border border-white/8 hover:bg-stone-800',
    archival: 'bg-amber-50/50 border border-amber-200/50 hover:bg-amber-50',
    editorial: 'bg-white border-2 border-black hover:bg-stone-50',
    classic: 'bg-stone-800 border border-white/10 hover:bg-stone-700',
    curator: 'bg-white border border-stone-200 hover:shadow-md',
    magazine: 'bg-white border-2 border-black hover:bg-stone-50',
    salon: 'bg-white border border-stone-200 hover:shadow-md',
  }
  const cardBgDark: Record<string, string> = {
    minimal: 'bg-stone-900 border border-stone-800 hover:bg-stone-800',
    editorial: 'bg-neutral-950 border-2 border-neutral-800 hover:bg-neutral-900',
    archival: 'bg-stone-900 border border-stone-700/40 hover:bg-stone-800',
    curator: 'bg-stone-900 border border-stone-800 hover:bg-stone-800',
    magazine: 'bg-neutral-950 border-2 border-neutral-800 hover:bg-neutral-900',
    salon: 'bg-stone-900 border border-stone-800 hover:bg-stone-800',
  }
  const cardBg = (useDark ? cardBgDark[template] : cardBgLight[template]) ?? cardBgLight.minimal

  const imageBgLight: Record<string, string> = {
    minimal: 'bg-stone-50',
    dramatic: 'bg-stone-800',
    archival: 'bg-amber-100/50',
    editorial: 'bg-stone-100',
    classic: 'bg-stone-700',
    curator: 'bg-stone-50',
    magazine: 'bg-stone-100',
    salon: 'bg-stone-50',
  }
  const imageBgDark: Record<string, string> = {
    minimal: 'bg-stone-800',
    editorial: 'bg-neutral-900',
    archival: 'bg-stone-800',
    curator: 'bg-stone-800',
    magazine: 'bg-neutral-900',
    salon: 'bg-stone-800',
  }
  const imageBg = (useDark ? imageBgDark[template] : imageBgLight[template]) ?? imageBgLight.minimal

  const searchInputClassLight: Record<string, string> = {
    minimal: 'bg-white border-stone-200 text-stone-900',
    dramatic: 'bg-stone-900 border-white/10 text-white placeholder:text-white/30',
    archival: 'bg-amber-50 border-amber-200 text-stone-800',
    editorial: 'bg-white border-2 border-black text-black rounded-none',
    classic: 'bg-stone-800 border-white/10 text-amber-100 placeholder:text-amber-100/30',
    curator: 'bg-white border-stone-200 text-stone-900',
    magazine: 'bg-white border-2 border-black text-black rounded-none',
    salon: 'bg-white border-stone-200 text-stone-900',
  }
  const searchInputClassDark: Record<string, string> = {
    minimal: 'bg-stone-900 border-stone-700 text-stone-100 placeholder:text-stone-600',
    editorial: 'bg-neutral-950 border-2 border-neutral-700 text-white rounded-none placeholder:text-neutral-600',
    archival: 'bg-stone-900 border-stone-700 text-stone-200 placeholder:text-stone-600',
    curator: 'bg-stone-900 border-stone-700 text-stone-100 placeholder:text-stone-600',
    magazine: 'bg-neutral-950 border-2 border-neutral-700 text-white rounded-none placeholder:text-neutral-600',
    salon: 'bg-stone-900 border-stone-700 text-stone-100 placeholder:text-stone-600',
  }
  const searchInputClass = (useDark ? searchInputClassDark[template] : searchInputClassLight[template]) ?? searchInputClassLight.minimal

  const padMap: Record<string, string> = { tight: 'p-2', normal: 'p-4', generous: 'p-6' }
  const ratioClass: Record<string, string> = { square: 'aspect-square', portrait: 'aspect-[3/4]', landscape: 'aspect-[16/9]' }
  const colClass: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }

  const cardPad = padMap[card_padding] || 'p-4'
  const imageAspect = ratioClass[image_ratio] || 'aspect-square'
  const gridCols = colClass[grid_columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
  const radius = `${card_radius}px`

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5 17 17" strokeLinecap="round" />
          </svg>
        </div>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by title, artist, medium, culture…"
          className={`w-full pl-11 pr-10 py-3.5 border rounded-xl text-sm outline-none transition-colors shadow-sm ${searchInputClass}`} />
        {query && (
          <button onClick={() => setQuery('')} className="absolute inset-y-0 right-4 flex items-center text-stone-300 hover:text-stone-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
              <path d="M3 3 13 13M13 3 3 13" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className={`flex items-center gap-1.5 rounded-lg p-1 border ${useDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
          {['All', 'On Display', 'On Loan'].map(s => (
            <button key={s} onClick={() => setActiveStatus(s)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                activeStatus === s
                  ? useDark ? 'bg-stone-100 text-stone-900' : 'bg-stone-900 text-white'
                  : useDark ? 'text-stone-500 hover:text-stone-200' : 'text-stone-500 hover:text-stone-900'
              }`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {mediums.map(m => (
            <button key={m} onClick={() => setActiveMedium(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                activeMedium === m
                  ? useDark ? 'bg-stone-100 text-stone-900 border-stone-100' : 'bg-stone-900 text-white border-stone-900'
                  : useDark ? 'border-stone-700 text-stone-500 hover:bg-stone-800' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
              }`}>
              {m}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4">
          {hasActiveFilters && (
            <button onClick={clearAll} className={`text-xs font-mono transition-colors underline underline-offset-2 ${useDark ? 'text-stone-500 hover:text-stone-200' : 'text-stone-400 hover:text-stone-900'}`}>
              Clear filters
            </button>
          )}
          <span className={`text-xs font-mono ${useDark ? 'text-stone-500' : 'text-stone-400'}`}>
            <span className={`font-medium ${useDark ? 'text-stone-200' : 'text-stone-900'}`}>{filtered.length}</span> of {objects.length} works
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-32">
          <div className="text-5xl mb-4">🔍</div>
          <div className={`font-serif text-2xl italic mb-2 ${useDark ? 'text-stone-600' : 'text-stone-400'}`}>No works found</div>
          <p className={`text-sm mb-5 ${useDark ? 'text-stone-600' : 'text-stone-400'}`}>
            Try a different search term or{' '}
            <button onClick={clearAll} className={`underline underline-offset-2 transition-colors ${useDark ? 'hover:text-stone-200' : 'hover:text-stone-900'}`}>clear all filters</button>
          </p>
        </div>
      ) : (
        <div className={`grid ${gridCols} gap-6`}>
          {filtered.map(a => (
            <Link key={a.id} href={`/museum/${slug}/object/${a.id}`}
              className={`group overflow-hidden transition-all duration-200 hover:-translate-y-1 ${cardBg}`}
              style={{ borderRadius: radius }}>
              <div className={`${imageAspect} ${imageBg} relative flex items-center justify-center overflow-hidden`}>
                {a.image_url ? (
                  <img src={a.image_url} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-5xl group-hover:scale-105 transition-transform duration-300">{a.emoji}</span>
                )}
                {a.status === 'On Loan' && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">
                      On Loan
                    </span>
                  </div>
                )}
                {a.condition_grade && (
                  <div className="absolute bottom-2 left-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                      {a.condition_grade}
                    </span>
                  </div>
                )}
              </div>
              {card_metadata !== 'none' && (
                <div className={cardPad}>
                  <div className={`text-base leading-snug mb-1 ${titleClass}`}>{a.title}</div>
                  {(card_metadata === 'title+artist' || card_metadata === 'full') && (
                    <div className={`text-xs mb-1 ${artistClass}`}>{a.artist}</div>
                  )}
                  {(card_metadata === 'title+artist' || card_metadata === 'full') && a.rarity && (
                    <div className={`text-xs font-mono mb-1 ${metaClass}`}>{a.rarity}</div>
                  )}
                  {card_metadata === 'full' && (
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${metaClass}`}>{a.year}</div>
                      {a.status === 'On Loan' && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: `${accentColor}18`, color: accentColor }}>
                          On Loan
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}