'use client'

import { inputCls, labelCls, sectionTitle } from '@/components/tabs/shared'
import type { CustomFieldDef, CustomFieldValue } from '@/lib/collectionProfiles'

interface Props {
  title: string
  defs: CustomFieldDef[]
  values: Record<string, CustomFieldValue>
  onChange: (next: Record<string, CustomFieldValue>) => void
  canEdit: boolean
}

/**
 * Tier B detail fields — the per-profile long tail stored in
 * objects.custom_fields. See docs/collection-profiles-plan.md §5.6.
 *
 * Values are written straight into the bag by key. Keys are namespaced by
 * profile, so a value belonging to another (possibly inactive) profile in the
 * same bag is never touched here — that is invariant G.
 */
export default function CustomFieldsCard({ title, defs, values, onChange, canEdit }: Props) {
  if (defs.length === 0) return null

  function setValue(key: string, value: CustomFieldValue) {
    const next = { ...values }
    if (value === null || value === '') delete next[key]
    else next[key] = value
    onChange(next)
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
      <div className={sectionTitle}>{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {defs.map(def => {
          const raw = values[def.key]
          const span = def.width === 'full' ? 'sm:col-span-2' : ''

          return (
            <div key={def.key} className={span}>
              <label className={labelCls} htmlFor={def.key}>{def.label}</label>

              {def.type === 'boolean' ? (
                <button
                  id={def.key}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setValue(def.key, raw === true ? false : true)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded border text-xs font-mono transition-all w-full ${
                    raw === true
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
                  } disabled:opacity-50`}
                >
                  <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${raw === true ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                    <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${raw === true ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                  {raw === true ? 'Yes' : 'No'}
                </button>

              ) : def.type === 'select' ? (
                <select
                  id={def.key}
                  value={typeof raw === 'string' ? raw : ''}
                  onChange={e => setValue(def.key, e.target.value || null)}
                  disabled={!canEdit}
                  className={inputCls}
                >
                  <option value="">{'—'} Select {'—'}</option>
                  {(def.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                </select>

              ) : def.type === 'number' ? (
                <div className="relative">
                  <input
                    id={def.key}
                    type="number"
                    value={typeof raw === 'number' ? raw : ''}
                    min={def.min}
                    max={def.max}
                    step="any"
                    placeholder={def.placeholder}
                    onChange={e => setValue(def.key, e.target.value === '' ? null : Number(e.target.value))}
                    disabled={!canEdit}
                    className={`${inputCls} ${def.unit ? 'pr-12' : ''}`}
                  />
                  {def.unit && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400 dark:text-stone-500 pointer-events-none">
                      {def.unit}
                    </span>
                  )}
                </div>

              ) : (
                <input
                  id={def.key}
                  type={def.type === 'date' ? 'date' : 'text'}
                  value={typeof raw === 'string' ? raw : ''}
                  placeholder={def.placeholder}
                  onChange={e => setValue(def.key, e.target.value || null)}
                  disabled={!canEdit}
                  className={inputCls}
                />
              )}

              {def.help && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">{def.help}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
