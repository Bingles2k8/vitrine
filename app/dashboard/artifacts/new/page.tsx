'use client'

import ImageUpload from '@/components/ImageUpload'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MEDIUMS = ['Oil on canvas','Watercolour','Sculpture','Photography','Ceramics','Textiles','Metalwork','Mixed media','Wood','Glass','Print']
const STATUSES = ['Entry','On Display','Storage','On Loan','Restoration','Deaccessioned']
const EMOJIS = ['🖼️','🏺','🗿','💎','📜','👗','🏮','🗡️','🪞','🧣','⚗️','🌿','📷','🎨']
const OBJECT_TYPES = ['Painting','Drawing','Print','Photograph','Sculpture','Ceramic','Textile','Furniture','Metalwork','Glass','Archaeological','Natural History','Document / Archive','Other']
const ACQ_METHODS = ['Purchase','Gift','Bequest','Transfer','Found','Fieldwork','Exchange','Unknown']
const CONDITION_GRADES = ['Excellent','Good','Fair','Poor','Critical']
const COPYRIGHT_OPTIONS = ['In Copyright','Out of Copyright','Public Domain','Unknown','CC BY','CC BY-SA','CC BY-NC']

export default function NewObject() {
  const [museum, setMuseum] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
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
    // Cataloguing
    object_type: '',
    inscription: '',
    marks: '',
    provenance: '',
    // Acquisition
    acquisition_method: '',
    acquisition_date: '',
    acquisition_source: '',
    acquisition_note: '',
    legal_transfer_date: '',
    // Location
    current_location: '',
    location_note: '',
    // Condition
    condition_grade: '',
    condition_date: '',
    condition_assessor: '',
    // Rights
    copyright_status: '',
    rights_holder: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: museum } = await supabase
        .from('museums').select('*').eq('owner_id', user.id).single()
      if (!museum) { router.push('/onboarding'); return }
      setMuseum(museum)
    }
    load()
  }, [])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setLoading(true)

    const { error } = await supabase.from('artifacts').insert({
      ...form,
      museum_id: museum.id,
      acquisition_date: form.acquisition_date || null,
      legal_transfer_date: form.legal_transfer_date || null,
      condition_date: form.condition_date || null,
    })

    if (error) { setError(error.message); setLoading(false) } else { router.push('/dashboard') }
  }

  const inputCls = 'w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors bg-white'
  const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 mb-1.5'
  const sectionTitle = 'text-xs uppercase tracking-widest text-stone-400 mb-4'
  const textareaCls = 'w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors resize-none'

  return (
    <div className="min-h-screen bg-stone-50 flex">

      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed top-0 left-0 bottom-0">
        <div className="p-5 border-b border-stone-200">
          <span className="font-serif text-xl italic text-stone-900">Vitrine<span className="text-amber-600">.</span></span>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2">Collections</div>
          <div onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50">
            <span>⬡</span> Objects
          </div>
        </nav>
      </aside>

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white flex items-center gap-3 px-8 sticky top-0">
          <button onClick={() => router.push('/dashboard')}
            className="text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors">
            ← Collection
          </button>
          <span className="text-stone-200">/</span>
          <span className="font-serif text-lg italic text-stone-900">Add Object</span>
        </div>

        <div className="p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Image */}
            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <ImageUpload onUpload={(url) => set('image_url', url)} />
            </div>

            {/* Icon */}
            <div className="bg-white border border-stone-200 rounded-lg p-6">
              <label className={labelCls}>Icon</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => set('emoji', e)}
                    className={`w-10 h-10 rounded-lg border text-xl transition-all ${form.emoji === e ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Details */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Core Details</div>

              <div>
                <label className={labelCls}>Title *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="The Portland Vase" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Artist / Maker</label><input value={form.artist} onChange={e => set('artist', e.target.value)} placeholder="Jan van Eyck" className={inputCls} /></div>
                <div><label className={labelCls}>Date / Year</label><input value={form.year} onChange={e => set('year', e.target.value)} placeholder="c. 1434" className={inputCls} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Medium</label>
                  <select value={form.medium} onChange={e => set('medium', e.target.value)} className={inputCls}>
                    {MEDIUMS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Culture / Origin</label><input value={form.culture} onChange={e => set('culture', e.target.value)} placeholder="Flemish" className={inputCls} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Accession No.</label><input value={form.accession_no} onChange={e => set('accession_no', e.target.value)} placeholder="2024:001" className={`${inputCls} font-mono`} /></div>
                <div><label className={labelCls}>Dimensions</label><input value={form.dimensions} onChange={e => set('dimensions', e.target.value)} placeholder="H: 24.5cm" className={inputCls} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Object Type</label>
                  <select value={form.object_type} onChange={e => set('object_type', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {OBJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Current Location</label><input value={form.current_location} onChange={e => set('current_location', e.target.value)} placeholder="Gallery A, Case 3" className={inputCls} /></div>
              </div>

              <div>
                <label className={labelCls}>Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => (
                    <button key={s} type="button" onClick={() => set('status', s)}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${form.status === s ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Description (public)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="A brief description for the public site…" rows={4} className={textareaCls} />
              </div>
            </div>

            {/* Cataloguing */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Cataloguing (Spectrum)</div>

              <div>
                <label className={labelCls}>Provenance</label>
                <textarea value={form.provenance} onChange={e => set('provenance', e.target.value)}
                  placeholder="Known ownership history prior to acquisition…" rows={3} className={textareaCls} />
              </div>

              <div>
                <label className={labelCls}>Inscription</label>
                <textarea value={form.inscription} onChange={e => set('inscription', e.target.value)}
                  placeholder="Text inscribed on the object…" rows={2} className={textareaCls} />
              </div>

              <div>
                <label className={labelCls}>Marks & Stamps</label>
                <textarea value={form.marks} onChange={e => set('marks', e.target.value)}
                  placeholder="Hallmarks, maker's marks, stamps, signatures on reverse…" rows={2} className={textareaCls} />
              </div>
            </div>

            {/* Acquisition */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Acquisition (Spectrum)</div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Acquisition Method</label>
                  <select value={form.acquisition_method} onChange={e => set('acquisition_method', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {ACQ_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Acquisition Date</label><input type="date" value={form.acquisition_date} onChange={e => set('acquisition_date', e.target.value)} className={inputCls} /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Acquisition Source</label><input value={form.acquisition_source} onChange={e => set('acquisition_source', e.target.value)} placeholder="Donor name, auction house…" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Legal Transfer Date</label>
                  <input type="date" value={form.legal_transfer_date} onChange={e => set('legal_transfer_date', e.target.value)} className={inputCls} />
                  <p className="text-xs text-stone-400 mt-1">Date legal title passed to the museum</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>Acquisition Notes</label>
                <textarea value={form.acquisition_note} onChange={e => set('acquisition_note', e.target.value)} rows={3} className={textareaCls} />
              </div>
            </div>

            {/* Location */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Location (Spectrum)</div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Current Location</label><input value={form.current_location} onChange={e => set('current_location', e.target.value)} placeholder="Gallery A, Case 3" className={inputCls} /></div>
                <div><label className={labelCls}>Location Note</label><input value={form.location_note} onChange={e => set('location_note', e.target.value)} placeholder="Additional context" className={inputCls} /></div>
              </div>
            </div>

            {/* Condition */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Condition at Acquisition (Spectrum)</div>
              <div>
                <label className={labelCls}>Condition Grade</label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITION_GRADES.map(g => (
                    <button key={g} type="button" onClick={() => set('condition_grade', g)}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${form.condition_grade === g ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:bg-stone-50'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Assessment Date</label><input type="date" value={form.condition_date} onChange={e => set('condition_date', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>Assessor</label><input value={form.condition_assessor} onChange={e => set('condition_assessor', e.target.value)} className={inputCls} /></div>
              </div>
            </div>

            {/* Rights */}
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Rights Management (Spectrum)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Copyright Status</label>
                  <select value={form.copyright_status} onChange={e => set('copyright_status', e.target.value)} className={inputCls}>
                    <option value="">— Select —</option>
                    {COPYRIGHT_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className={labelCls}>Rights Holder</label><input value={form.rights_holder} onChange={e => set('rights_holder', e.target.value)} placeholder="Name of copyright owner" className={inputCls} /></div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

            <div className="flex gap-3">
              <button type="submit" disabled={loading}
                className="bg-stone-900 text-white text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
                {loading ? 'Saving…' : 'Save object →'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard')}
                className="border border-stone-200 text-stone-500 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50">
                Cancel
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  )
}
