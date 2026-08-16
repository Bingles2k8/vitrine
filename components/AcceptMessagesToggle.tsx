'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

/**
 * The "accept new messages" switch, shared by the settings panel and the Inbox.
 *
 * Both live on screen at once (the sidebar is rendered on the Inbox page), so
 * flipping one has to move the other immediately. Rather than have each copy
 * poll or re-fetch, the component broadcasts the new value on a window event
 * and every mounted copy listens. One write path, one source of truth.
 */

const SYNC_EVENT = 'vitrine:accept-messages-changed'

interface SyncDetail {
  museumId: string
  value: boolean
}

/**
 * Keeps a local copy of accept_messages in step with whatever the museum row
 * says and with any other toggle on the page.
 */
export function useAcceptMessagesSync(museumId: string | null, initial: boolean) {
  const [value, setValue] = useState(initial)

  // Follow the museum row once it loads (it's null on first render).
  useEffect(() => { setValue(initial) }, [initial])

  useEffect(() => {
    if (!museumId) return
    function onSync(e: Event) {
      const detail = (e as CustomEvent<SyncDetail>).detail
      if (detail.museumId === museumId) setValue(detail.value)
    }
    window.addEventListener(SYNC_EVENT, onSync)
    return () => window.removeEventListener(SYNC_EVENT, onSync)
  }, [museumId])

  return [value, setValue] as const
}

interface Props {
  museumId: string
  value: boolean
  onChange: (next: boolean) => void
  /** Owners and Admins only — everyone else sees the state, read-only. */
  canManage: boolean
  /** 'compact' for the settings sidebar, 'panel' for the Inbox header. */
  variant?: 'compact' | 'panel'
}

export default function AcceptMessagesToggle({
  museumId, value, onChange, canManage, variant = 'compact',
}: Props) {
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function toggle() {
    if (!canManage || saving) return
    const next = !value
    setSaving(true)
    onChange(next)                       // optimistic
    const { error } = await supabase
      .from('museums')
      .update({ accept_messages: next })
      .eq('id', museumId)

    if (error) {
      onChange(!next)                    // roll back
    } else {
      window.dispatchEvent(new CustomEvent<SyncDetail>(SYNC_EVENT, {
        detail: { museumId, value: next },
      }))
    }
    setSaving(false)
  }

  const label = value ? 'Accepting new messages' : 'Not accepting new messages'

  if (variant === 'panel') {
    return (
      <div className="flex items-start justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">
            New enquiries
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {value
              ? 'People can start a conversation about your collection.'
              : 'New conversations are turned off. You can still reply to existing ones, and start your own.'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={!canManage || saving}
          title={canManage ? undefined : 'Only owners and admins can change this'}
          className={`flex items-center gap-2.5 px-3 py-2 rounded border text-xs font-mono transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed ${
            value
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
          }`}
        >
          <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
            <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${value ? 'left-3.5' : 'left-0.5'}`} />
          </span>
          {value ? 'On' : 'Off'}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!canManage || saving}
      title={canManage ? undefined : 'Only owners and admins can change this'}
      className={`flex items-center gap-2 w-full text-left text-xs font-mono transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        value
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
      }`}
    >
      <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
        <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${value ? 'left-3.5' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  )
}
