'use client'

import { useTransition } from 'react'
import { deletePost } from '../actions'

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (!confirm('Delete this post? This cannot be undone.')) return
        startTransition(() => deletePost(id))
      }}
      className="text-xs text-red-400 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
