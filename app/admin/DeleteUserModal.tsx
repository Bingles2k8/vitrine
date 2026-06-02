'use client'

import { useState, useTransition } from 'react'
import { deleteUser } from './actions'

interface Props {
  museumId: string
  museumName: string
  slug: string
  ownerEmail: string
}

export function DeleteUserButton({ museumId, museumName, slug, ownerEmail }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-400 hover:text-red-600 transition-colors"
      >
        Delete
      </button>
      {open && (
        <DeleteUserModal
          museumId={museumId}
          museumName={museumName}
          slug={slug}
          ownerEmail={ownerEmail}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

function DeleteUserModal({ museumId, museumName, slug, ownerEmail, onClose }: Props & { onClose: () => void }) {
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const confirmed = input === slug

  function handleDelete() {
    if (!confirmed) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteUser(museumId)
        onClose()
      } catch (err: any) {
        setError(err?.message ?? 'Something went wrong')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Delete museum &amp; user</h2>
        <p className="text-sm text-gray-500 mb-4">
          This will permanently delete <span className="font-medium text-gray-800">{museumName}</span> ({ownerEmail}),
          all their data, storage files, staff accounts, and their Supabase auth account.
          This cannot be undone.
        </p>

        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mb-4">
          Type <span className="font-mono font-semibold">{slug}</span> to confirm
        </div>

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={slug}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
          autoFocus
          disabled={isPending}
        />

        {error && (
          <p className="text-xs text-red-600 mb-3">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || isPending}
            className="text-sm px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
