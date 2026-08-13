'use client'

import { useMemo, useState } from 'react'
import { COLLECTION_PROFILES } from '@/lib/collectionProfiles'

interface Props {
  /** Ordered list of selected profile ids. Index 0 is the primary. */
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  /** Object counts per profile, so removing one can warn with a real number. */
  usageCount?: Record<string, number>
}

/**
 * "What do you collect?" — multi-select, ordered, primary-first.
 * See docs/collection-profiles-plan.md §8.1.
 *
 * Selecting nothing is valid and resolves to the `general` profile, which
 * renders identically to today's UI.
 */
export default function CollectionProfilePicker({
  value, onChange, disabled, usageCount,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COLLECTION_PROFILES
    return COLLECTION_PROFILES.filter(p =>
      p.label.toLowerCase().includes(q) ||
      p.blurb.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }, [search])

  function toggle(id: string) {
    if (disabled) return

    if (value.includes(id)) {
      const inUse = usageCount?.[id] ?? 0
      if (inUse > 0) {
        const profile = COLLECTION_PROFILES.find(p => p.id === id)
        const ok = confirm(
          `${inUse} ${inUse === 1 ? 'item uses' : 'items use'} the ${profile?.label} type.\n\n` +
          `They'll fall back to your main type's wording. Nothing will be deleted — ` +
          `anything you entered in those fields is kept, and comes back if you re-add this type.`
        )
        if (!ok) return
      }
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  function makePrimary(id: string) {
    if (disabled) return
    onChange([id, ...value.filter(v => v !== id)])
  }

  return (
    <div>
      {COLLECTION_PROFILES.length > 12 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 mb-4"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(profile => {
          const index = value.indexOf(profile.id)
          const selected = index >= 0
          const isPrimary = index === 0

          return (
            <button
              key={profile.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(profile.id)}
              className={`text-left border rounded-lg transition-all disabled:opacity-50 p-4 ${
                selected
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-600'
                  : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800/60'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none">{profile.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-stone-900 dark:text-stone-100">
                    {profile.label}
                  </div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{profile.blurb}</div>
                  {selected && (
                    <div className="mt-1.5 flex items-center gap-2">
                      {isPrimary ? (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-500">
                          Main type
                        </span>
                      ) : (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={e => { e.stopPropagation(); makePrimary(profile.id) }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault(); e.stopPropagation(); makePrimary(profile.id)
                            }
                          }}
                          className="text-[10px] font-mono uppercase tracking-widest text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 underline cursor-pointer"
                        >
                          Make main
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {value.length > 1 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">
          You collect more than one thing, so menus stay neutral (&ldquo;Items&rdquo;).
          Each item can use its own type, and you can change which is your main type at any time.
        </p>
      )}
    </div>
  )
}
