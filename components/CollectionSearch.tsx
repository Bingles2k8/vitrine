'use client'

import { useState, useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { ChromeStyle, GridOptions, GridVariant } from '@/lib/templates'
import type { PublicLabels } from '@/lib/publicProfile'
import type { GridObject, GridTheme } from './collection/types'
import {
  CatalogueList, EditorialGrid, MosaicGrid, PlateGrid,
  SalonGrid, SpotlightGrid, StackGrid, UniformGrid,
} from './collection/grids'

interface ContentColors {
  heading: string
  body: string
  muted: string
  border: string
  cardBg: string
  inputBg: string
  imageBg: string
}

interface StyleSettings {
  template: string
  accentColor: string
  card_radius: number
  grid_columns: number
  image_ratio: string
  card_padding: string
  card_metadata: string
  gridVariant: GridVariant
  gridOptions: GridOptions
  chrome: ChromeStyle
  /** Resolved by getMuseumStyles — already accounts for dark mode. */
  content: ContentColors
  headingStyle: CSSProperties
  labels: PublicLabels
}

interface Props {
  objects: GridObject[]
  slug: string
  settings: StyleSettings
  showStatusFilter?: boolean
}

const RATIO_CLASS: Record<string, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[16/9]',
}

const PAD_CLASS: Record<string, string> = {
  tight: 'p-2',
  normal: 'p-4',
  generous: 'p-6',
}

const GRIDS: Record<GridVariant, (p: { items: GridObject[]; slug: string; theme: GridTheme }) => React.ReactElement> = {
  uniform: UniformGrid,
  plate: PlateGrid,
  catalogue: CatalogueList,
  spotlight: SpotlightGrid,
  mosaic: MosaicGrid,
  salon: SalonGrid,
  editorial: EditorialGrid,
  stack: StackGrid,
}

export default function CollectionSearch({ objects, slug, settings, showStatusFilter = true }: Props) {
  const [query, setQuery] = useState('')
  const [activeMedium, setActiveMedium] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')

  const {
    accentColor, card_radius, grid_columns, image_ratio, card_padding, card_metadata,
    gridVariant, gridOptions, chrome, content, headingStyle, labels,
  } = settings

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

  const theme: GridTheme = {
    accent: accentColor,
    heading: content.heading,
    body: content.body,
    muted: content.muted,
    border: content.border,
    cardBg: content.cardBg,
    imageBg: content.imageBg,
    headingStyle,
    radius: card_radius,
    imageAspect: RATIO_CLASS[image_ratio] || 'aspect-square',
    columns: grid_columns,
    padding: PAD_CLASS[card_padding] || 'p-4',
    metadata: card_metadata,
    options: gridOptions,
    labels,
  }

  const Grid = GRIDS[gridVariant] ?? UniformGrid

  // ── Chrome ────────────────────────────────────────────────────────────────
  // The search box and filters used to be identical on every template, which
  // is a large share of why every site read the same below the masthead.

  const hard = chrome === 'hard'
  const rule = chrome === 'rule'

  const inputClass = hard
    ? 'w-full pl-11 pr-10 py-3 text-sm outline-none border-2 rounded-none'
    : rule
      ? 'w-full pl-9 pr-10 py-3 text-sm outline-none bg-transparent border-0 border-b rounded-none'
      : 'w-full pl-11 pr-10 py-3.5 text-sm outline-none border rounded-xl shadow-sm'

  const inputStyle: CSSProperties = {
    background: rule ? 'transparent' : content.inputBg,
    borderColor: hard ? content.heading : content.border,
    color: content.heading,
  }

  function chipStyle(active: boolean): CSSProperties {
    if (hard) {
      return active
        ? { background: content.heading, color: content.cardBg, border: `2px solid ${content.heading}` }
        : { background: 'transparent', color: content.muted, border: `2px solid ${content.border}` }
    }
    if (rule) {
      return active
        ? { color: content.heading, borderBottom: `1px solid ${accentColor}` }
        : { color: content.muted, borderBottom: '1px solid transparent' }
    }
    return active
      ? { background: content.heading, color: content.cardBg, border: `1px solid ${content.heading}` }
      : { background: 'transparent', color: content.muted, border: `1px solid ${content.border}` }
  }

  const chipClass = hard
    ? 'px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all'
    : rule
      ? 'px-1 py-1 text-xs font-mono transition-all'
      : 'px-3 py-1.5 rounded-lg text-xs font-mono transition-all'

  const itemsWord = labels.itemPlural.toLowerCase()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Search */}
      <div className="relative mb-6">
        <div className={`absolute inset-y-0 ${rule ? 'left-1' : 'left-4'} flex items-center pointer-events-none`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20" stroke={content.muted} strokeWidth={1.8}>
            <circle cx="9" cy="9" r="5.5" />
            <path d="M13.5 13.5 17 17" strokeLinecap="round" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={`Search this ${labels.collection.toLowerCase()}`}
          className={inputClass}
          style={inputStyle}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 flex items-center transition-opacity hover:opacity-60"
            style={{ color: content.muted }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2}>
              <path d="M3 3 13 13M13 3 3 13" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {showStatusFilter && (
          <div className={`flex items-center gap-1.5 ${rule ? '' : 'p-1 rounded-lg border'}`}
            style={rule ? undefined : { background: content.cardBg, borderColor: content.border }}>
            {['All', 'On Display', 'On Loan'].map(s => (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={chipClass}
                style={chipStyle(activeStatus === s)}
              >
                {s === 'All' ? 'All' : (labels.statusLabels[s] ?? s)}
              </button>
            ))}
          </div>
        )}

        {/* Without the segmented box that soft/hard chrome draws, the status
            and medium filters read as one undifferentiated row. */}
        {showStatusFilter && rule && (
          <span aria-hidden className="h-4 w-px" style={{ background: content.border }} />
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {mediums.map(m => (
            <button
              key={m}
              onClick={() => setActiveMedium(m)}
              className={chipClass}
              style={chipStyle(activeMedium === m)}
            >
              {/* The profile's own medium label ("Metal / Composition") is too
                  long to head a chip row; the collection noun reads better. */}
              {m === 'All' ? `All ${itemsWord}` : m}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs font-mono transition-opacity hover:opacity-70 underline underline-offset-2"
              style={{ color: content.muted }}
            >
              Clear filters
            </button>
          )}
          <span className="text-xs font-mono" style={{ color: content.muted }}>
            <span style={{ color: content.heading }}>{filtered.length}</span> of {objects.length} {itemsWord}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-32">
          <div className="text-5xl mb-4">🔍</div>
          <div className="text-2xl mb-2" style={{ ...headingStyle, color: content.muted }}>
            No {itemsWord} found
          </div>
          <p className="text-sm mb-5" style={{ color: content.muted }}>
            Try a different search term or{' '}
            <button
              onClick={clearAll}
              className="underline underline-offset-2 transition-opacity hover:opacity-70"
            >
              clear all filters
            </button>
          </p>
        </div>
      ) : (
        <Grid items={filtered} slug={slug} theme={theme} />
      )}
    </div>
  )
}
