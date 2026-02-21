'use client'

import ImageUpload from '@/components/ImageUpload'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function ArtifactDetail() {
  const [artifact, setArtifact] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    artist: '',
    year: '',
    medium: 'Oil on canvas',
    culture: '',
    accession_no: '',
    dimensions: '',
    description: '',
    emoji: '🖼️',
    status: 'On Display',
    image_url: '',
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

      const { data: artifact } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', params.id)
        .eq('museum_id', museum.id)
        .single()

      if (!artifact) { router.push('/dashboard'); return }

      setArtifact(artifact)
      setForm({
        title: artifact.title || '',
        artist: artifact.artist || '',
        year: artifact.year || '',
        medium: artifact.medium || 'Oil on canvas',
        culture: artifact.culture || '',
        accession_no: artifact.accession_no || '',
        dimensions: artifact.dimensions || '',
        description: artifact.description || '',
        emoji: artifact.emoji || '🖼️',
        status: artifact.status || 'On Display',
        image_url: artifact.image_url || '',
      })
      setLoading(false)
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const { error } = await supabase
      .from('artifacts')
      .update(form)
      .eq('id', params.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!artifact) return
    if (!confirm('Delete "' + artifact.title + '"? This cannot be undone.')) return
    setDeleting(true)

    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', params.id)

    if (error) {
      setError(error.message)
      setDeleting(false)
    } else {
      router.push('/dashboard')
    }
  }

  const mediums = ['Oil on canvas','Watercolour','Sculpture','Photography','Ceramics','Textiles','Metalwork','Mixed media','Wood','Glass','Print']
  const statuses = ['On Display','Storage','On Loan','Restoration']
  const emojis = ['🖼️','🏺','🗿','💎','📜','👗','🏮','🗡️','🪞','🧣','⚗️','🌿','📷','🎨']

  if (loading || !artifact) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="font-mono text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">

      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed top-0 left-0 bottom-0">
        <div className="p-5 border-b border-stone-200">
          <span className="font-serif text-xl italic text-stone-900">Vitrine<span className="text-amber-600">.</span></span>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2">Collections</div>
          <div
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50"
          >
            <span>⬡</span> Artifacts
          </div>
        </nav>
      </aside>

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-8 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors"
            >
              ← Collection
            </button>
            <span className="text-stone-200">/</span>
            <span className="font-serif text-lg italic text-stone-900">{artifact.title}</span>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete artifact'}
          </button>
        </div>

        <div className="p-8 max-w-2xl">
          <form onSubmit={handleSave} className="space-y-6">

            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <ImageUpload
                currentUrl={form.image_url}
                onUpload={(url) => set('image_url', url)}
              />
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <label className="block text-xs uppercase tracking-widest text-stone-400 mb-3">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => set('emoji', e)}
                    className={`w-10 h-10 rounded-lg border text-xl transition-all ${form.emoji === e ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Details</div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Artist / Maker</label>
                  <input
                    value={form.artist}
                    onChange={e => set('artist', e.target.value)}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Date / Year</label>
                  <input
                    value={form.year}
                    onChange={e => set('year', e.target.value)}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Medium</label>
                  <select
                    value={form.medium}
                    onChange={e => set('medium', e.target.value)}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors bg-white"
                  >
                    {mediums.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Culture / Origin</label>
                  <input
                    value={form.culture}
                    onChange={e => set('culture', e.target.value)}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Accession No.</label>
                  <input
                    value={form.accession_no}
                    onChange={e => set('accession_no', e.target.value)}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm font-mono outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Dimensions</label>
                  <input
                    value={form.dimensions}
                    onChange={e => set('dimensions', e.target.value)}
                    className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Status</label>
                <div className="flex gap-2">
                  {statuses.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('status', s)}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${form.status === s ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={4}
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <div className="flex gap-3 items-center">
              <button
                type="submit"
                disabled={saving}
                className="bg-stone-900 text-white text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes →'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="border border-stone-200 text-stone-500 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50"
              >
                Cancel
              </button>
              {saved && (
                <span className="text-xs font-mono text-emerald-600">✓ Saved</span>
              )}
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}