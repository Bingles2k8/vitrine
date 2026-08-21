'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import AddToSetModal from './AddToSetModal'
import { matchesRule, parseRule } from '@/lib/collectionGroups'
import type { CollectionGroupItemRow, CollectionGroupRow, RuleObject } from '@/lib/collectionGroups/types'

/**
 * Which sets this object is in, on its own record.
 *
 * Rule-derived membership is shown but not directly removable — the honest
 * action there is "exclude from this set", which writes the private override
 * rather than pretending the filter changed.
 */

interface Props {
  museumId: string
  object: RuleObject
  nouns: { singular: string; plural: string }
  canEdit: boolean
}

export default function ObjectSetsField({ museumId, object, nouns, canEdit }: Props) {
  const supabase = createClient()
  const [sets, setSets] = useState<CollectionGroupRow[]>([])
  const [items, setItems] = useState<CollectionGroupItemRow[]>([])
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [{ data: groups }, { data: rows }] = await Promise.all([
      supabase.from('collection_groups').select('*').eq('museum_id', museumId)
        .order('display_order', { ascending: true, nullsFirst: false }),
      supabase.from('collection_group_items').select('*').eq('object_id', object.id),
    ])
    setSets((groups ?? []) as CollectionGroupRow[])
    setItems((rows ?? []) as CollectionGroupItemRow[])
  }, [museumId, object.id])

  useEffect(() => { void load() }, [load])

  const pinned = new Set(items.filter(i => i.role === 'include').map(i => i.group_id))
  const excluded = new Set(items.filter(i => i.role === 'exclude').map(i => i.group_id))

  const memberships = sets
    .map(set => {
      if (excluded.has(set.id)) return null
      if (pinned.has(set.id)) return { set, byRule: false }
      if (set.membership === 'rule' && matchesRule(parseRule(set.rule), object)) {
        return { set, byRule: true }
      }
      return null
    })
    .filter((m): m is { set: CollectionGroupRow; byRule: boolean } => m !== null)

  async function detach(set: CollectionGroupRow, byRule: boolean) {
    if (!canEdit || busy) return
    setBusy(true)
    await fetch(`/api/collection-groups/${set.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(byRule ? { exclude: [object.id] } : { remove: [object.id] }),
    })
    await load()
    setBusy(false)
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">
        {nouns.plural}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {memberships.map(({ set, byRule }) => (
          <span
            key={set.id}
            className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
            title={byRule ? `Matched by this ${nouns.singular.toLowerCase()}'s filter` : undefined}
          >
            {set.title}
            {byRule && <span className="text-stone-300 dark:text-stone-600">auto</span>}
            {set.status === 'draft' && <span className="text-stone-300 dark:text-stone-600">draft</span>}
            {canEdit && (
              <button
                type="button"
                onClick={() => detach(set, byRule)}
                disabled={busy}
                aria-label={byRule ? `Exclude from ${set.title}` : `Remove from ${set.title}`}
                className="text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors disabled:opacity-40"
              >
                ✕
              </button>
            )}
          </span>
        ))}

        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-mono px-2.5 py-1.5 rounded border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500 hover:border-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          >
            + Add to {nouns.singular.toLowerCase()}
          </button>
        )}

        {memberships.length === 0 && !canEdit && (
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Not in any {nouns.plural.toLowerCase()}.
          </span>
        )}
      </div>

      <AddToSetModal
        open={open}
        objectIds={[object.id]}
        sets={sets}
        nouns={nouns}
        onClose={() => setOpen(false)}
        onDone={load}
      />
    </div>
  )
}
