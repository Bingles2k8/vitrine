'use client'

import { useState, useTransition } from 'react'
import { setComplimentaryPlan } from './actions'

const OPTIONS = [
  { value: '', label: 'None (pays normally)' },
  { value: 'hobbyist', label: 'Hobbyist' },
  { value: 'professional', label: 'Professional' },
  { value: 'institution', label: 'Institution' },
  { value: 'enterprise', label: 'Enterprise' },
]

export function ComplimentaryPlanControl({
  museumId,
  current,
  hasSubscription,
}: {
  museumId: string
  current: string | null
  hasSubscription: boolean
}) {
  const [selected, setSelected] = useState(current ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const changed = selected !== (current ?? '')

  function save() {
    const label = OPTIONS.find(o => o.value === selected)?.label ?? selected
    const msg = selected
      ? `Give this museum the ${label} plan free, with no end date?`
      : 'Remove the complimentary plan? The museum moves to Community. Anything over its limits is deleted after 180 days, and the owner is emailed.'
    if (!window.confirm(msg)) return
    setError(null)
    startTransition(async () => {
      try {
        await setComplimentaryPlan(museumId, selected || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={pending}
          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white"
        >
          {OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={pending || !changed}
          className="text-xs font-medium px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      {hasSubscription && !current && (
        <p className="text-xs text-gray-500">Has a live Stripe subscription. Cancel it before granting a free plan.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
