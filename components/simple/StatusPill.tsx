'use client'

import type { CollectionProfile } from '@/lib/collectionProfiles'
import { statusLabel } from '@/lib/collectionProfiles'
import { SIMPLE_MODE_STATUS_LABELS } from '@/components/tabs/shared'

/**
 * A status shown in the collection's own words.
 *
 * Resolution order is the app's existing chain and must not be duplicated
 * elsewhere: the profile's own statusLabels first (a vinyl collection calls
 * Storage "On the Shelf"), then SIMPLE_MODE_STATUS_LABELS, then the canonical
 * value. Stored values stay canonical — only the label changes.
 */

const TONES: Record<string, string> = {
  'Entry':         'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'On Display':    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Storage':       'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'On Loan':       'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Restoration':   'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  'Conservation':  'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  'Deaccessioned': 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500',
}

const FALLBACK = 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'

interface StatusPillProps {
  /** Canonical status as stored on the object. */
  status: string
  profile: CollectionProfile
  className?: string
}

export function resolveStatusLabel(profile: CollectionProfile, status: string): string {
  return statusLabel(profile, status, SIMPLE_MODE_STATUS_LABELS[status] ?? status)
}

export default function StatusPill({ status, profile, className = '' }: StatusPillProps) {
  return (
    <span
      className={`inline-block text-xs font-mono px-2 py-1 rounded-full whitespace-nowrap ${TONES[status] ?? FALLBACK} ${className}`}
    >
      {resolveStatusLabel(profile, status)}
    </span>
  )
}
