'use client'

import { useState, useEffect, use as usePromise } from 'react'

type ShareObject = {
  id: string
  title: string
  emoji: string | null
  image_url: string | null
  medium: string | null
  year: string | null
  production_date: string | null
  description: string | null
  status: string | null
  accession_no: string | null
}

export default function PrivateShareLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params)
  const [passcode, setPasscode] = useState('')
  const [objects, setObjects] = useState<ShareObject[] | null>(null)
  const [museum, setMuseum] = useState<{ name: string; logo_emoji: string | null } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reset if id changes (unlikely in practice).
    setObjects(null)
    setMuseum(null)
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passcode) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/share-links/${id}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(payload.error || 'Could not unlock')
        setSubmitting(false)
        return
      }
      setObjects(payload.objects || [])
      setMuseum(payload.museum || null)
    } catch {
      setError('Something went wrong')
    }
    setSubmitting(false)
  }

  if (objects === null) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8 w-full max-w-sm space-y-4 shadow-sm">
          <div>
            <h1 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-1">Private collection</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">Enter the passcode you were given to view this collection.</p>
          </div>
          <input
            type="password"
            autoFocus
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Passcode"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !passcode}
            className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono py-2.5 rounded disabled:opacity-50"
          >
            {submitting ? 'Unlocking…' : 'Unlock →'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <div className="text-4xl mb-2">{museum?.logo_emoji || '🗄'}</div>
          <h1 className="font-serif text-3xl italic text-stone-900 dark:text-stone-100">{museum?.name || 'Private collection'}</h1>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Shared with you privately</p>
        </header>
        {objects.length === 0 ? (
          <div className="text-center text-sm text-stone-400 dark:text-stone-500 py-12">This share has no objects yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {objects.map(o => (
              <div key={o.id} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                {o.image_url ? (
                  <img src={o.image_url} alt="" className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-5xl">{o.emoji || '◯'}</div>
                )}
                <div className="p-4">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-1">{o.title}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap gap-2">
                    {o.production_date && <span>{o.production_date}</span>}
                    {o.medium && <span>{o.medium}</span>}
                  </div>
                  {o.description && <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-3">{o.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
