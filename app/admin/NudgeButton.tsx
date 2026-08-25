'use client'

import { useState, useTransition } from 'react'
import { sendNudgeEmail } from './actions'
import type { NudgeVariant } from '@/lib/email/nudge'

const VARIANT_LABEL: Record<NudgeVariant, string> = {
  never_returned: 'never came back after signing up',
  dormant: 'used it, then went quiet',
}

export function NudgeButton({
  museumId,
  ownerEmail,
  variant,
  lastEmailedLabel,
}: {
  museumId: string
  ownerEmail: string
  variant: NudgeVariant
  /** e.g. "12 days ago", or null if we have never emailed them. */
  lastEmailedLabel: string | null
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleClick() {
    const lines = [
      `Send a nudge to ${ownerEmail}?`,
      '',
      `They ${VARIANT_LABEL[variant]}, so they get that version of the email.`,
      lastEmailedLabel ? `Last emailed ${lastEmailedLabel}.` : 'They have never been emailed from here.',
    ]
    if (!window.confirm(lines.join('\n'))) return

    setResult(null)
    startTransition(async () => {
      const res = await sendNudgeEmail(museumId)
      setResult(res.ok ? { ok: true, message: 'sent' } : { ok: false, message: res.error })
    })
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        title={`Send the "${VARIANT_LABEL[variant]}" nudge to ${ownerEmail}`}
        className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-40"
      >
        {pending ? 'Sending…' : 'Nudge'}
      </button>
      {result && (
        <span
          className={`text-[10px] ${result.ok ? 'text-green-600' : 'text-red-500'}`}
          title={result.message}
        >
          {result.ok ? '✓ sent' : result.message}
        </span>
      )}
    </div>
  )
}
