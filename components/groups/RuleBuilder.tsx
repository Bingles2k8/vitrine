'use client'

import { useMemo } from 'react'
import {
  MAX_RULE_CONDITIONS, OP_LABELS, RULE_FIELDS, VALUELESS_OPS,
  opsForField, ruleField,
} from '@/lib/collectionGroups'
import type { GroupCondition, GroupRule, RuleOp } from '@/lib/collectionGroups/types'
import type { PublicLabels } from '@/lib/publicProfile'

/**
 * The saved-filter builder for a rule-based set.
 *
 * Only fields from RULE_FIELDS are offered, because a rule leaks through its
 * membership — a set built on "value over £10,000" publishes that ranking to
 * anyone who opens the page. The API validates the same list; this is the
 * friendly half of that boundary, not the boundary itself.
 */

interface Props {
  rule: GroupRule
  onChange: (rule: GroupRule) => void
  /** Distinct values already in the collection, per field, for the suggestions. */
  suggestions: Record<string, string[]>
  /** Profile vocabulary, so a coin collection's rule reads "Mint" not "Maker". */
  labels: PublicLabels
  matchCount: number
  totalCount: number
  disabled?: boolean
}

const selectCls =
  'border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs font-mono bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-stone-400 dark:focus:border-stone-500 transition-colors'

export default function RuleBuilder({
  rule, onChange, suggestions, labels, matchCount, totalCount, disabled,
}: Props) {
  const fieldLabel = useMemo(() => {
    return (key: string): string => {
      const field = ruleField(key)
      if (!field) return key
      if (field.labelKey && labels[field.labelKey]) return labels[field.labelKey] as string
      return field.label
    }
  }, [labels])

  function update(index: number, patch: Partial<GroupCondition>) {
    const conditions = rule.conditions.map((c, i) => {
      if (i !== index) return c
      const next = { ...c, ...patch }
      // Changing field can strand an operator its new type does not allow.
      if (patch.field && !opsForField(patch.field).includes(next.op)) {
        next.op = opsForField(patch.field)[0]
      }
      return next
    })
    onChange({ ...rule, conditions })
  }

  function add() {
    if (rule.conditions.length >= MAX_RULE_CONDITIONS) return
    onChange({
      ...rule,
      conditions: [...rule.conditions, { field: 'medium', op: 'is', value: '' }],
    })
  }

  function remove(index: number) {
    onChange({ ...rule, conditions: rule.conditions.filter((_, i) => i !== index) })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-stone-500 dark:text-stone-400">Include items where</span>
        <select
          value={rule.match}
          onChange={e => onChange({ ...rule, match: e.target.value as GroupRule['match'] })}
          disabled={disabled}
          className={selectCls}
        >
          <option value="all">all</option>
          <option value="any">any</option>
        </select>
        <span className="text-xs text-stone-500 dark:text-stone-400">of these match:</span>
      </div>

      <div className="space-y-2">
        {rule.conditions.map((condition, i) => {
          const field = ruleField(condition.field)
          const ops = opsForField(condition.field)
          const needsValue = !VALUELESS_OPS.includes(condition.op)
          const options = suggestions[condition.field] ?? []
          const listId = `rule-suggest-${i}-${condition.field}`

          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={condition.field}
                onChange={e => update(i, { field: e.target.value })}
                disabled={disabled}
                className={selectCls}
              >
                {RULE_FIELDS.map(f => (
                  <option key={f.key} value={f.key}>{fieldLabel(f.key)}</option>
                ))}
              </select>

              <select
                value={condition.op}
                onChange={e => update(i, { op: e.target.value as RuleOp })}
                disabled={disabled}
                className={selectCls}
              >
                {ops.map(op => <option key={op} value={op}>{OP_LABELS[op]}</option>)}
              </select>

              {needsValue && (
                <>
                  <input
                    type={field?.type === 'number' ? 'number' : 'text'}
                    value={condition.value}
                    onChange={e => update(i, { value: e.target.value })}
                    disabled={disabled}
                    list={field?.suggest && options.length > 0 ? listId : undefined}
                    placeholder="value"
                    className={`${selectCls} w-40`}
                  />
                  {field?.suggest && options.length > 0 && (
                    <datalist id={listId}>
                      {options.map(v => <option key={v} value={v} />)}
                    </datalist>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label="Remove condition"
                className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors px-1"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <button
          type="button"
          onClick={add}
          disabled={disabled || rule.conditions.length >= MAX_RULE_CONDITIONS}
          className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-40 transition-colors"
        >
          + Add condition
        </button>

        <span className="text-xs font-mono text-stone-400 dark:text-stone-500 tabular-nums">
          {rule.conditions.length === 0
            ? 'Add a condition to start matching'
            : `Matches ${matchCount} of ${totalCount} items`}
        </span>
      </div>

      {rule.conditions.length === 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
          A filter with no conditions matches nothing — that way a half-built {' '}
          set never publishes your whole collection by accident.
        </p>
      )}
    </div>
  )
}
