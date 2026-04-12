'use client'

import { useState } from 'react'

export interface FilterState {
  dateFrom: string
  dateTo: string
  medium: string
  objectType: string
  artist: string
  status: string
  accessionStatus: string
  acquisitionMethod: string
}

export const EMPTY_FILTERS: FilterState = {
  dateFrom: '', dateTo: '', medium: '', objectType: '',
  artist: '', status: '', accessionStatus: '', acquisitionMethod: '',
}

export type SortBy = '' | 'alpha' | 'insured_value' | 'date_added' | 'date_made'

const ACQ_METHODS = ['Purchase', 'Gift', 'Bequest', 'Transfer', 'Found', 'Fieldwork', 'Exchange', 'Unknown']
const STATUSES = ['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration', 'Deaccessioned']

const selectCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs font-mono bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors'
const dateCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs font-mono bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'

interface Props {
  searchQuery: string
  onSearchChange: (q: string) => void
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
  sortBy: SortBy
  onSortChange: (s: SortBy) => void
  isFullMode: boolean
  mediumOptions: string[]
  objectTypeOptions: string[]
  artistOptions: string[]
  placeholder?: string
  additionalFilters?: React.ReactNode
}

export default function SearchFilterBar({
  searchQuery, onSearchChange,
  filters, onFiltersChange,
  sortBy, onSortChange,
  isFullMode,
  mediumOptions, objectTypeOptions, artistOptions,
  placeholder = 'Search objects…',
  additionalFilters,
}: Props) {
  const [open, setOpen] = useState(false)

  function set(key: keyof FilterState, val: string) {
    onFiltersChange({ ...filters, [key]: val })
  }

  const activeCount = [
    filters.dateFrom, filters.dateTo, filters.medium, filters.objectType,
    ...(isFullMode
      ? [filters.status, filters.accessionStatus, filters.acquisitionMethod]
      : [filters.artist]
    ),
  ].filter(Boolean).length

  const sortOptions = isFullMode
    ? [
        { value: '', label: 'Default order' },
        { value: 'alpha', label: 'Alphabetical' },
        { value: 'date_added', label: 'Date Added' },
        { value: 'date_made', label: 'Date Made' },
      ]
    : [
        { value: '', label: 'Default order' },
        { value: 'alpha', label: 'Alphabetical' },
        { value: 'insured_value', label: 'Insured Value' },
        { value: 'date_added', label: 'Date Added' },
        { value: 'date_made', label: 'Date Made' },
      ]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded border text-xs font-mono transition-colors flex-shrink-0 ${
            open || activeCount > 0
              ? 'bg-stone-900 border-stone-900 text-white dark:bg-white dark:border-white dark:text-stone-900'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filter
          {activeCount > 0 && (
            <span className="bg-amber-500 text-stone-950 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </button>

        {/* Search input */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded text-xs font-mono text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as SortBy)}
          className="flex-shrink-0 border border-stone-200 dark:border-stone-700 rounded px-2 py-2 text-xs font-mono bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
        >
          {sortOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filter panel */}
      {open && (
        <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Date range */}
            <div>
              <label className={labelCls}>Date From</label>
              <input type="date" value={filters.dateFrom} onChange={e => set('dateFrom', e.target.value)} className={dateCls} />
            </div>
            <div>
              <label className={labelCls}>Date To</label>
              <input type="date" value={filters.dateTo} onChange={e => set('dateTo', e.target.value)} className={dateCls} />
            </div>

            {/* Medium */}
            <div>
              <label className={labelCls}>Medium</label>
              <select value={filters.medium} onChange={e => set('medium', e.target.value)} className={selectCls}>
                <option value="">All mediums</option>
                {mediumOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Object Type */}
            <div>
              <label className={labelCls}>Object Type</label>
              <select value={filters.objectType} onChange={e => set('objectType', e.target.value)} className={selectCls}>
                <option value="">All types</option>
                {objectTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Free / Hobbyist only */}
            {!isFullMode && (
              <div>
                <label className={labelCls}>Artist / Maker</label>
                <select value={filters.artist} onChange={e => set('artist', e.target.value)} className={selectCls}>
                  <option value="">All artists</option>
                  {artistOptions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            )}

            {/* Professional+ only */}
            {isFullMode && (
              <>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={filters.status} onChange={e => set('status', e.target.value)} className={selectCls}>
                    <option value="">All statuses</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Accession Status</label>
                  <select value={filters.accessionStatus} onChange={e => set('accessionStatus', e.target.value)} className={selectCls}>
                    <option value="">All</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="unconfirmed">Not confirmed</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Purchase or Gift</label>
                  <select value={filters.acquisitionMethod} onChange={e => set('acquisitionMethod', e.target.value)} className={selectCls}>
                    <option value="">All methods</option>
                    {ACQ_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </>
            )}

            {additionalFilters}
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onFiltersChange(EMPTY_FILTERS)}
              className="mt-3 text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Clear all filters ×
            </button>
          )}
        </div>
      )}
    </div>
  )
}
