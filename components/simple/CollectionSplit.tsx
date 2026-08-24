'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CollectionProfile, ProfileNouns, ListColumnKey } from '@/lib/collectionProfiles'
import { fieldLabel } from '@/lib/collectionProfiles'
import StatusPill, { resolveStatusLabel } from '@/components/simple/StatusPill'
import Thumb from '@/components/simple/Thumb'
import Toggle from '@/components/simple/Toggle'
import SplitPane from '@/components/simple/SplitPane'
import { useIsMobile } from '@/hooks/useIsMobile'

/**
 * Simple mode's collection: a list you scan, and a pane that stays put showing
 * the record you picked.
 *
 * The pane renders from the objects already in memory — the dashboard selects
 * `*` — so choosing a record costs nothing and there is no second query to
 * drift out of step with the list.
 *
 * Editing still happens on the record's own page. The pane is for looking, and
 * for the one change people make constantly: whether something shows publicly.
 *
 * Selection lives in `?record=<id>` via replaceState rather than component
 * state, so a deep link and a refresh both land on the same record without
 * pushing a history entry for every click.
 */

/** What the list and pane read off an object. The dashboard selects `*`, so
 *  the index signature carries the columns only columnValue() needs to see. */
export interface ObjectRow {
  id: string
  title: string
  status: string
  emoji?: string | null
  image_url?: string | null
  artist?: string | null
  maker_name?: string | null
  production_date?: string | null
  year?: string | number | null
  show_on_site?: boolean | null
  accession_no?: string | null
  current_location?: string | null
  description?: string | null
  estimated_value?: string | number | null
  acquisition_value?: string | number | null
  [column: string]: unknown
}

/** Only the fields the overdue pill needs. */
interface LoanLike {
  loan_end_date?: string | null
}

interface CollectionSplitProps {
  objects: ObjectRow[]
  profile: CollectionProfile
  nouns: ProfileNouns
  canEdit: boolean
  hideMoneyValues: boolean
  /** Formats a profile list column for the row's meta line. */
  columnValue: (obj: ObjectRow, field: ListColumnKey) => string
  listColumns: { field: ListColumnKey; label: string }[]
  onToggleVisibility: (id: string, current: boolean) => void
  onDelete: (id: string, title: string, e: React.MouseEvent) => void
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  selectMode: boolean
  loanByObject: Record<string, LoanLike>
  overdueDays: (loan: LoanLike) => number
}

export default function CollectionSplit({
  objects, profile, nouns, canEdit, hideMoneyValues, columnValue, listColumns,
  onToggleVisibility, onDelete, selectedIds, onToggleSelect, selectMode,
  loanByObject, overdueDays,
}: CollectionSplitProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Deep link in. Runs once — later changes go through select().
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('record')
    if (fromUrl) setSelectedId(fromUrl)
  }, [])

  // On a wide screen something is always shown, so default to the first row.
  const selected =
    objects.find(o => o.id === selectedId) ?? (isMobile ? null : objects[0] ?? null)

  function select(id: string | null) {
    setSelectedId(id)
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('record', id)
    else url.searchParams.delete('record')
    window.history.replaceState(null, '', url)
  }

  const list = (
    <div>
      {objects.length === 0 && (
        <p className="text-sm text-stone-400 dark:text-stone-500 py-8 text-center">
          Nothing matches those filters.
        </p>
      )}
      {objects.map(a => {
        const loan = loanByObject[a.id]
        const overdue = loan ? overdueDays(loan) : 0
        const isSelected = !isMobile && selected?.id === a.id
        return (
          <div
            key={a.id}
            onClick={() => (isMobile ? router.push(`/dashboard/objects/${a.id}`) : select(a.id))}
            className={`flex items-center gap-3 px-2.5 py-2.5 -mx-2.5 rounded cursor-pointer transition-colors ${
              isSelected
                ? 'bg-amber-50 dark:bg-amber-950/40'
                : 'hover:bg-stone-100/70 dark:hover:bg-stone-800/50'
            }`}
          >
            {selectMode && canEdit && (
              <input
                type="checkbox"
                checked={selectedIds.has(a.id)}
                onClick={e => e.stopPropagation()}
                onChange={() => onToggleSelect(a.id)}
                className="rounded border-stone-300 dark:border-stone-600 accent-amber-600 flex-shrink-0"
              />
            )}
            <Thumb src={a.image_url} emoji={a.emoji} size={44} />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium truncate ${
                isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-stone-900 dark:text-stone-100'
              }`}>
                {a.title}
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                {subtitleOf(a) || resolveStatusLabel(profile, a.status)}
              </div>
            </div>
            {overdue > 0 && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 flex-shrink-0">
                {overdue}d late
              </span>
            )}
            {a.show_on_site && (
              <span
                title="On your public page"
                className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"
              />
            )}
            {isMobile && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300 dark:text-stone-600 flex-shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  )

  const detail = selected ? (
    <RecordPane
      object={selected}
      profile={profile}
      nouns={nouns}
      canEdit={canEdit}
      hideMoneyValues={hideMoneyValues}
      columnValue={columnValue}
      listColumns={listColumns}
      onToggleVisibility={onToggleVisibility}
      onDelete={onDelete}
      onBack={isMobile ? () => select(null) : undefined}
    />
  ) : (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-12 text-center">
      <p className="text-sm text-stone-400 dark:text-stone-500">
        Pick something on the left to see it here.
      </p>
    </div>
  )

  return <SplitPane list={list} detail={detail} hasSelection={false} listWidth={368} stickyTop={80} />
}

/** "Miles Davis · 1959" — whichever of those the record actually has. */
function subtitleOf(a: ObjectRow): string {
  return [a.artist || a.maker_name, a.production_date || a.year]
    .filter(Boolean)
    .map(String)
    .join(' · ')
}

/** The record itself — what it is, whether it shows publicly, and what you can do to it. */
function RecordPane({
  object: a, profile, nouns, canEdit, hideMoneyValues, columnValue, listColumns,
  onToggleVisibility, onDelete, onBack,
}: {
  object: ObjectRow
  profile: CollectionProfile
  nouns: ProfileNouns
  canEdit: boolean
  hideMoneyValues: boolean
  columnValue: (obj: ObjectRow, field: ListColumnKey) => string
  listColumns: { field: ListColumnKey; label: string }[]
  onToggleVisibility: (id: string, current: boolean) => void
  onDelete: (id: string, title: string, e: React.MouseEvent) => void
  onBack?: () => void
}) {
  const router = useRouter()

  /* Fields the collection profile puts in its list, plus where it lives. The
     profile decides the labels, so a vinyl collection reads "Label / Country"
     rather than "Culture / Origin". */
  const facts = [
    ...listColumns.map(c => ({ label: c.label, value: columnValue(a, c.field) })),
    { label: fieldLabel(profile, 'current_location', 'Where it is'), value: a.current_location ?? '' },
  ].filter(f => f.value)

  const money = !hideMoneyValues && (a.estimated_value || a.acquisition_value)

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800 w-full"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to your {nouns.itemPlural.toLowerCase()}
        </button>
      )}

      <div className="flex gap-5 p-5 pb-4">
        <Thumb src={a.image_url} emoji={a.emoji} size={124} className="rounded-lg" />
        <div className="flex-1 min-w-0 pt-0.5">
          <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100 leading-tight">{a.title}</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
            {subtitleOf(a) || '—'}
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <StatusPill status={a.status} profile={profile} />
            {a.accession_no && (
              <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{a.accession_no}</span>
            )}
          </div>
          {money ? (
            <div className="mt-3 flex items-baseline gap-4">
              {a.estimated_value ? (
                <span className="font-serif text-xl text-stone-900 dark:text-stone-100">
                  £{Number(a.estimated_value).toLocaleString('en-GB')}
                </span>
              ) : null}
              {a.acquisition_value ? (
                <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                  paid £{Number(a.acquisition_value).toLocaleString('en-GB')}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {canEdit && (
        <div className="mx-5 mb-4 px-3.5 py-3 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <Toggle
            checked={!!a.show_on_site}
            onChange={() => onToggleVisibility(a.id, !!a.show_on_site)}
            label={a.show_on_site ? 'Visible on your public page' : 'Hidden from your public page'}
            size="sm"
          />
        </div>
      )}

      {facts.length > 0 && (
        <div className="px-5 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-stone-100 dark:border-stone-800 pt-4">
          {facts.map(f => (
            <div key={f.label} className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                {f.label}
              </div>
              <div className="text-sm text-stone-900 dark:text-stone-100 break-words">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {a.description && (
        <div className="px-5 pb-4 border-t border-stone-100 dark:border-stone-800 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
            Your note
          </div>
          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">{a.description}</p>
        </div>
      )}

      <div className="flex items-center gap-3 px-5 py-3.5 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40">
        <button
          onClick={() => router.push(`/dashboard/objects/${a.id}`)}
          className="text-xs font-mono bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white rounded px-4 py-2 transition-colors"
        >
          Edit this {nouns.item.toLowerCase()}
        </button>
        {canEdit && (
          <button
            onClick={e => onDelete(a.id, a.title, e)}
            className="text-xs font-mono text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors ml-auto"
          >
            Move to bin
          </button>
        )}
      </div>
    </div>
  )
}
