'use client'

import { useState, useTransition } from 'react'
import { sendNudgeEmail, sendOrphanNudgeEmail } from './actions'
import type { NudgeVariant } from '@/lib/email/nudge'

const VARIANT_LABEL: Record<NudgeVariant, string> = {
  never_returned: 'never came back after signing up',
  dormant: 'used it, then went quiet',
  no_museum: 'never finished setting up a museum',
}

/**
 * Send one nudge from an admin table.
 *
 * Two targets, because the two tables identify a person differently: a museum
 * owner by their museum, and an abandoned signup by their user id, since that
 * is all they have. The confirm dialog, the pending state and the result
 * reporting are the same either way, which is why this is one component rather
 * than two nearly-identical ones.
 */
export type NudgeTarget =
  | { kind: 'museum'; museumId: string }
  | { kind: 'user'; userId: string }

export function NudgeButton({
  target,
  ownerEmail,
  variant,
  lastEmailedLabel,
  unconfirmedEmail = false,
}: {
  target: NudgeTarget
  ownerEmail: string
  variant: NudgeVariant
  /** e.g. "12 days ago", or null if we have never emailed them. */
  lastEmailedLabel: string | null
  /**
   * Address was never confirmed, so it may be a typo of a real address
   * belonging to someone else. Said out loud in the dialog rather than
   * blocked: chasing an abandoned signup is exactly when it happens, and the
   * judgement is the admin's.
   */
  unconfirmedEmail?: boolean
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
    if (unconfirmedEmail) {
      lines.push('', 'This address was never confirmed — it may not be theirs.')
    }
    if (!window.confirm(lines.join('\n'))) return

    setResult(null)
    startTransition(async () => {
      const res = target.kind === 'museum'
        ? await sendNudgeEmail(target.museumId)
        : await sendOrphanNudgeEmail(target.userId)
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
