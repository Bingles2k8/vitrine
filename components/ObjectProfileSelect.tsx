'use client'

import { inputCls, labelCls } from '@/components/tabs/shared'
import type { CollectionProfile } from '@/lib/collectionProfiles'

interface Props {
  /** The collection's active profiles, in order. Primary first. */
  options: CollectionProfile[]
  /** Current objects.collection_profile, or null to inherit the primary. */
  value: string | null
  onChange: (value: string | null) => void
  canEdit: boolean
}

/**
 * Per-object profile picker. Only rendered when a collection has more than one
 * active profile — with a single profile there is nothing to choose.
 * See docs/collection-profiles-plan.md §6.1.
 */
export default function ObjectProfileSelect({ options, value, onChange, canEdit }: Props) {
  if (options.length < 2) return null

  const primary = options[0]

  return (
    <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-lg p-4">
      <label className={labelCls} data-learn="objects.collection_profile">Type of item</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={!canEdit}
        className={inputCls}
      >
        <option value="">
          {`— Use my main type (${primary.label}) —`}
        </option>
        {options.map(p => (
          <option key={p.id} value={p.id}>{p.emoji} {p.label}</option>
        ))}
      </select>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
        Changes which fields and wording this item uses. Nothing you&rsquo;ve already
        entered is lost when you switch.
      </p>
    </div>
  )
}
