'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * One-time orientation for a museum that has just reached a full-mode plan.
 *
 * Upgrading adds roughly fifteen sidebar entries at once with no explanation,
 * which is a poor first minute for someone who has just started paying. This
 * names what arrived and links to each register.
 *
 * Shown when the plan is full-mode and museums.upgrade_checklist_seen_at is
 * null. Dismissing writes the timestamp, so it is per-museum and survives a
 * change of device (localStorage would not). Museums already on a full-mode
 * plan when this shipped were backfilled as seen, so only new upgrades get it.
 */

interface UpgradeChecklistProps {
  museumId: string
  planLabel: string
  supabase: SupabaseClient
  onDismissed: () => void
}

const STEPS: { href: string; title: string; body: string }[] = [
  {
    href: '/dashboard/entry',
    title: 'Record what arrives',
    body: 'Log an object when it comes through the door, before it is formally acquired. Entry receipts and depositor terms live here.',
  },
  {
    href: '/dashboard/locations',
    title: 'Set up your locations',
    body: 'Build your building, room and case structure once. After that every move is a couple of clicks, and overdue returns are flagged for you.',
  },
  {
    href: '/dashboard/loans',
    title: 'Track loans both ways',
    body: 'Objects you lend out and objects you borrow, with agreements, conditions and return dates.',
  },
  {
    href: '/dashboard/conservation',
    title: 'Keep a care history',
    body: 'Condition checks and conservation treatments build up a record of how each object has been looked after.',
  },
  {
    href: '/dashboard/valuation',
    title: 'Value and insure',
    body: 'Formal valuations with a valuer and validity date, and insurance policies with renewal reminders.',
  },
  {
    href: '/dashboard/docs',
    title: 'See where you stand',
    body: 'Your documentation score, register by register, with a backlog view for anything missing.',
  },
]

export default function UpgradeChecklist({ museumId, planLabel, supabase, onDismissed }: UpgradeChecklistProps) {
  const [dismissing, setDismissing] = useState(false)

  async function dismiss() {
    setDismissing(true)
    // Hide it either way. A failed write means it reappears next visit, which is
    // a far better outcome than a card the user cannot get rid of.
    await supabase
      .from('museums')
      .update({ upgrade_checklist_seen_at: new Date().toISOString() })
      .eq('id', museumId)
    onDismissed()
  }

  return (
    <div className="mb-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">
            Welcome to {planLabel}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
            Your sidebar has a lot more in it than it did yesterday. Here is what each part is for.
            Nothing needs setting up before you can use the rest of Vitrine, so take these in any order.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors text-base leading-none flex-shrink-0 disabled:opacity-50"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
        {STEPS.map(step => (
          <Link
            key={step.href}
            href={step.href}
            className="group border border-stone-100 dark:border-stone-800 rounded p-3 hover:border-stone-300 dark:hover:border-stone-600 transition-colors"
          >
            <div className="text-xs font-medium text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
              {step.title} →
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 leading-relaxed mt-1">{step.body}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <a
          href="/compliance"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          What each register covers ↗
        </a>
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors disabled:opacity-50"
        >
          {dismissing ? 'Hiding…' : 'Got it, hide this'}
        </button>
      </div>
    </div>
  )
}
