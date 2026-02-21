'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SiteBuilder() {
  const [museum, setMuseum] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    logo_emoji: '🏛️',
    primary_color: '#0f0e0c',
    accent_color: '#c8961e',
    address: '',
    opening_hours: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: museum } = await supabase
        .from('museums')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (!museum) { router.push('/onboarding'); return }
      setMuseum(museum)
      setForm({
        name: museum.name || '',
        tagline: museum.tagline || '',
        logo_emoji: museum.logo_emoji || '🏛️',
        primary_color: museum.primary_color || '#0f0e0c',
        accent_color: museum.accent_color || '#c8961e',
        address: museum.address || '',
        opening_hours: museum.opening_hours || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

async function handleSave() {
    if (!museum) return
    setSaving(true)
    setError('')
    const { error } = await supabase
      .from('museums')
      .update(form)
      .eq('id', museum.id)
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const emojis = ['🏛️','🖼️','🏺','🗿','🔮','🎨','📜','🌿','💎','🦋','🏯','⛩️','🗽','🎭']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="font-mono text-sm text-stone-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">

      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed top-0 left-0 bottom-0">
        <div className="p-5 border-b border-stone-200">
          <span className="font-serif text-xl italic text-stone-900">Vitrine<span className="text-amber-600">.</span></span>
        </div>
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
              {form.logo_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-900 truncate">{form.name}</div>
              <div className="text-xs text-amber-600 tracking-wide uppercase">{museum.plan} plan</div>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2">Collections</div>
          <div
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50"
          >
            <span>⬡</span> Artifacts
          </div>
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Website</div>
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-stone-900 text-white text-xs font-mono mb-1 cursor-pointer">
            <span>◫</span> Site Builder
          </div>
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">People</div>
          <div
            onClick={() => router.push('/dashboard/staff')}
            className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50"
          >
            <span>◉</span> Staff & Roles
          </div>
        </nav>
      </aside>

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900">Site Builder</span>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-mono text-emerald-600">Saved</span>}
            {error && <span className="text-xs font-mono text-red-500">{error}</span>}
            <button
              onClick={() => window.open('/museum/' + museum.slug, '_blank')}
              className="border border-stone-200 text-stone-600 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50"
            >
              View public site
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8 items-start">

          <div className="space-y-6">

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400">Museum Identity</div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Museum Name</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Tagline</label>
                <input
                  value={form.tagline}
                  onChange={e => set('tagline', e.target.value)}
                  placeholder="A short description of your museum"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Logo Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => set('logo_emoji', e)}
                      className={'w-9 h-9 rounded-lg border text-lg transition-all ' + (form.logo_emoji === e ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50')}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400">Colours</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-stone-900 mb-1">Primary colour</div>
                  <div className="text-xs text-stone-400">Used for the hero banner</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-stone-200" style={{ background: form.primary_color }}></div>
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-stone-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-stone-900 mb-1">Accent colour</div>
                  <div className="text-xs text-stone-400">Used for labels and highlights</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-stone-200" style={{ background: form.accent_color }}></div>
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={e => set('accent_color', e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-stone-200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400">Visit Information</div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Address</label>
                <textarea
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="123 Museum Street, London W1 2AB"
                  rows={2}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Opening Hours</label>
                <textarea
                  value={form.opening_hours}
                  onChange={e => set('opening_hours', e.target.value)}
                  placeholder="Mon-Fri: 10:00-17:00, Sat-Sun: 10:00-18:00"
                  rows={3}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none"
                />
              </div>
            </div>

          </div>

          <div className="sticky top-24">
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">Live Preview</div>
            <div className="border border-stone-200 rounded-lg overflow-hidden shadow-sm">

              <div className="bg-stone-100 px-3 py-2 flex items-center gap-2 border-b border-stone-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                  <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                  <div className="w-3 h-3 rounded-full bg-stone-300"></div>
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs font-mono text-stone-400 text-center">
                  vitrine.app/museum/{museum.slug}
                </div>
              </div>

              <div className="bg-white border-b border-stone-200 px-4 h-10 flex items-center justify-between">
                <div className="font-serif text-sm italic text-stone-900">
                  {form.logo_emoji} {form.name || 'Your Museum'}
                </div>
                <div className="flex gap-4">
                  <span className="text-xs text-stone-900 border-b border-stone-900">Collection</span>
                  <span className="text-xs text-stone-400">Visit</span>
                </div>
              </div>

              <div className="px-6 py-8" style={{ background: form.primary_color || '#0f0e0c' }}>
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: form.accent_color || '#c8961e' }}>
                  {form.name || 'Your Museum'}
                </div>
                <div className="font-serif text-xl italic text-white leading-tight">
                  {form.tagline || 'Explore the collection'}
                </div>
              </div>

              <div className="bg-white p-4">
                <div className="text-xs font-serif italic text-stone-500 mb-3">On Display</div>
                <div className="grid grid-cols-3 gap-2">
                  {['🏺','🖼️','💎','📜','🗿','🌿'].map((e, i) => (
                    <div key={i} className="border border-stone-100 rounded overflow-hidden">
                      <div className="bg-stone-50 h-10 flex items-center justify-center text-lg">{e}</div>
                      <div className="p-1.5">
                        <div className="h-2 bg-stone-100 rounded w-3/4 mb-1"></div>
                        <div className="h-1.5 bg-stone-50 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}