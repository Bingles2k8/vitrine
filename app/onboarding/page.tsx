'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏛️')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your museum name'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = toSlug(name)

    const { error } = await supabase.from('museums').insert({
      name: name.trim(),
      slug,
      owner_id: user.id,
      logo_emoji: emoji,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl italic text-stone-900 mb-2">Welcome to Vitrine.</h1>
          <p className="text-stone-400 text-sm">Let's set up your museum. This takes 30 seconds.</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">
                Museum Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="The Hackney Museum"
                className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">
                Logo Emoji
              </label>
              <div className="flex gap-3 flex-wrap">
                {['🏛️','🖼️','🏺','🗿','🔮','🎨','📜','🌿','💎','🦋'].map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-lg border text-xl transition-all ${emoji === e ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {name && (
              <div className="bg-stone-50 rounded px-3 py-2">
                <span className="text-xs font-mono text-stone-400">Your public URL: </span>
                <span className="text-xs font-mono text-stone-600">vitrine.app/{toSlug(name)}</span>
              </div>
            )}

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 text-white rounded py-2.5 text-sm font-mono disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create my museum →'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}