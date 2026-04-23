'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DeleteAccountButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    const confirmed = window.confirm(
      'This will permanently delete your museum, all objects, images, and documents. This cannot be undone. Continue?',
    )
    if (!confirmed) return
    const typed = window.prompt('Type DELETE to confirm:')
    if (typed !== 'DELETE') return

    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(body.error || 'Failed to delete account')
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
      >
        {busy ? 'Deleting…' : 'Delete my account and all data now'}
      </button>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  )
}
