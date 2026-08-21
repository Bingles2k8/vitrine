'use client'

import { useMemo, useState } from 'react'
import type { ChromeStyle, GridVariant } from '@/lib/templates'
import type { SetNavStyle } from '@/lib/collectionGroups/types'
import SetItems from './SetItems'
import type { GridObject, GridTheme } from './types'

/**
 * Search, filter and sort within one set.
 *
 * Wraps SetItems rather than reimplementing the collection's search, so the
 * input, the chips and the `chrome` treatment match the main collection page
 * exactly. Chips are built from *this set's* mediums — a chip that matches
 * nothing in view is noise.
 *
 * Below SET_BROWSER_THRESHOLD items this component is not rendered at all: on
 * a set of six, the chrome is bigger than the thing it operates on.
 */

interface Props {
  items: GridObject[]
  slug: string
  setSlug: string
  theme: GridTheme
  navStyle: SetNavStyle
  gridVariant: GridVariant
  chrome: ChromeStyle
  /** The set's own sort, offered first as "Curator's order". */
  curatorOrder: boolean
}

type SortKey = 'curator' | 'alpha' | 'year'

export default function SetBrowser({
  items, slug, setSlug, theme, navStyle, gridVariant, chrome, curatorOrder,
}: Props) {
  const [query, setQuery] = useState('')
  const [medium, setMedium] = useState('All')
  const [sort, setSort] = useState<SortKey>(curatorOrder ? 'curator' : 'alpha')

  const mediums = useMemo(() => {
    const all = items.map(i => i.medium).filter(Boolean)
    return ['All', ...Array.from(new Set(all)).sort()]
  }, [items])

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim()
    const filtered = items.filter(item => {
      const matchesQuery = !q || [item.title, item.artist, item.medium, item.culture, item.year]
        .some(f => f?.toLowerCase().includes(q))
      return matchesQuery && (medium === 'All' || item.medium === medium)
    })

    if (sort === 'alpha') {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
    }
    if (sort === 'year') {
      const y = (o: GridObject) => {
        const m = (o.year || o.production_date || '').match(/-?\d{1,4}/)
        return m ? Number(m[0]) : Number.POSITIVE_INFINITY
      }
      return [...filtered].sort((a, b) => y(a) - y(b))
    }
    return filtered
  }, [items, query, medium, sort])

  const active = query !== '' || medium !== 'All'

  // Chip and input styling mirrors CollectionSearch so a set page and the
  // collection page never look like two different pieces of software.
  const inputClass =
    chrome === 'hard' ? 'border-2 rounded-none px-3 py-2'
    : chrome === 'rule' ? 'border-0 border-b rounded-none px-1 py-2'
    : 'border rounded-full px-4 py-2'

  const chipClass = (on: boolean) =>
    chrome === 'hard'
      ? `text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 border-2 transition-colors ${on ? '' : 'opacity-60'}`
      : chrome === 'rule'
      ? `text-xs transition-colors ${on ? 'underline underline-offset-4' : 'opacity-60 hover:opacity-100'}`
      : `text-xs px-3 py-1 rounded-full border transition-colors ${on ? '' : 'opacity-60'}`

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={theme.labels.searchPlaceholder}
          className={`text-sm outline-none flex-1 min-w-[200px] max-w-sm ${inputClass}`}
          style={{ borderColor: theme.border, background: chrome === 'rule' ? 'transparent' : theme.cardBg, color: theme.heading }}
        />

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          aria-label="Sort items"
          className="text-xs font-mono px-2 py-1.5 outline-none rounded"
          style={{ border: `1px solid ${theme.border}`, background: theme.cardBg, color: theme.body }}
        >
          {curatorOrder && <option value="curator">Curator’s order</option>}
          <option value="alpha">A – Z</option>
          <option value="year">By date</option>
        </select>

        <div className="text-xs font-mono ml-auto tabular-nums" style={{ color: theme.muted }}>
          {visible.length} of {items.length}
        </div>
      </div>

      {mediums.length > 2 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {mediums.map(m => {
            const on = medium === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMedium(m)}
                className={chipClass(on)}
                style={{
                  borderColor: on ? theme.accent : theme.border,
                  color: on ? theme.accent : theme.body,
                  background: on && chrome === 'soft' ? `${theme.accent}14` : 'transparent',
                }}
              >
                {m}
              </button>
            )
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="text-center py-20 text-sm" style={{ color: theme.muted }}>
          Nothing matches that.{' '}
          <button
            type="button"
            onClick={() => { setQuery(''); setMedium('All') }}
            className="underline underline-offset-4"
            style={{ color: theme.accent }}
          >
            Clear
          </button>
        </div>
      ) : (
        <SetItems
          items={visible}
          slug={slug}
          setSlug={setSlug}
          theme={theme}
          // Searching inside a stepped style would leave the visitor mid-deck
          // with no way to see what survived, so an active filter drops to the
          // grid and returns to the chosen style when cleared.
          navStyle={active ? 'grid' : navStyle}
          gridVariant={gridVariant}
        />
      )}
    </div>
  )
}
