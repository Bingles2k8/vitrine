'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { TEMPLATES } from '@/lib/templates'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

const FONTS = [
  { id: 'playfair',   name: 'Playfair Display',   sample: 'Elegant & refined',    google: 'Playfair+Display:ital,wght@0,400;0,700;1,400',                 css: "'Playfair Display', serif" },
  { id: 'cormorant',  name: 'Cormorant Garamond',  sample: 'Classical & literary', google: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',               css: "'Cormorant Garamond', serif" },
  { id: 'dm-serif',   name: 'DM Serif Display',    sample: 'Modern & bold',        google: 'DM+Serif+Display:ital@0;1',                                    css: "'DM Serif Display', serif" },
  { id: 'libre',      name: 'Libre Baskerville',   sample: 'Scholarly & legible',  google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',                css: "'Libre Baskerville', serif" },
  { id: 'dm-sans',    name: 'DM Sans',             sample: 'Clean & contemporary', google: 'DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,700;1,9..40,300',  css: "'DM Sans', sans-serif" },
]

function OptionToggle({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{label}</div>
      <div className="flex gap-1.5 flex-wrap">
        {options.map(o => (
          <button key={o.value} type="button" onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${value === o.value ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function RadiusSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Card Corner Radius</div>
        <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{value}px</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border border-stone-300 dark:border-stone-600 flex-shrink-0" style={{ borderRadius: '0px' }} />
        <input type="range" min={0} max={20} value={value} onChange={e => onChange(parseInt(e.target.value))}
          className="flex-1 accent-stone-900 dark:accent-white" />
        <div className="w-6 h-6 border border-stone-300 dark:border-stone-600 flex-shrink-0" style={{ borderRadius: '20px' }} />
      </div>
    </div>
  )
}

export default function SiteBuilder() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    tagline: '',
    logo_emoji: '🏛️',
    logo_image_url: '',
    hero_image_url: '',
    hero_image_position: '50% 50%',
    heading_font: 'playfair',
    primary_color: '#0f0e0c',
    accent_color: '#c8961e',
    address: '',
    opening_hours: '',
    template: 'minimal',
    card_radius: 8,
    hero_height: 'medium',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'full',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setForm({
        name: museum.name || '',
        tagline: museum.tagline || '',
        logo_emoji: museum.logo_emoji || '🏛️',
        logo_image_url: museum.logo_image_url || '',
        hero_image_url: museum.hero_image_url || '',
        hero_image_position: museum.hero_image_position || '50% 50%',
        heading_font: museum.heading_font || 'playfair',
        primary_color: museum.primary_color || '#0f0e0c',
        accent_color: museum.accent_color || '#c8961e',
        address: museum.address || '',
        opening_hours: museum.opening_hours || '',
        template: museum.template || 'minimal',
        card_radius: museum.card_radius ?? 8,
        hero_height: museum.hero_height || 'medium',
        grid_columns: museum.grid_columns || 4,
        image_ratio: museum.image_ratio || 'square',
        card_padding: museum.card_padding || 'normal',
        card_metadata: museum.card_metadata || 'full',
      })
      setLoading(false)
    }
    load()
  }, [])

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function uploadImage(file: File, field: 'hero_image_url' | 'logo_image_url') {
    setUploadingField(field)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('museum-assets').upload(filename, file, { upsert: true })
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('museum-assets').getPublicUrl(data.path)
      set(field, publicUrl)
    }
    setUploadingField(null)
  }

  function handleFocalPoint(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)))
    set('hero_image_position', `${x}% ${y}%`)
  }

  function selectTemplate(id: string) {
    const tmpl = TEMPLATES.find(t => t.id === id)!
    setForm(f => ({
      ...f,
      template: id,
      primary_color: tmpl.primary_color,
      accent_color: tmpl.accent_color,
      card_radius: tmpl.card_radius,
      hero_height: tmpl.hero_height,
      grid_columns: tmpl.grid_columns,
      image_ratio: tmpl.image_ratio,
      card_padding: tmpl.card_padding,
      card_metadata: tmpl.card_metadata,
    }))
  }

  async function handleSave() {
    if (!museum) return
    setSaving(true)
    setError('')
    const { error } = await supabase.from('museums').update(form).eq('id', museum.id)
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const emojis = ['🏛️','🖼️','🏺','🗿','🔮','🎨','📜','🌿','💎','🦋','🏯','⛩️','🗽','🎭']

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400">Loading...</p>
    </div>
  )

  const isLightTemplate = form.template === 'minimal' || form.template === 'editorial'
  const previewHeroBg = isLightTemplate ? '#ffffff' : form.primary_color
  const previewHeroText = isLightTemplate ? '#111111' : '#ffffff'

  const previewNavBg: Record<string, string> = {
    minimal: '#ffffff', dramatic: '#0c0a09', archival: '#fdf6e3', editorial: '#ffffff', classic: '#1e293b',
  }
  const previewNavText: Record<string, string> = {
    minimal: '#111111', dramatic: '#ffffff', archival: '#3a2e1e', editorial: '#000000', classic: '#f0ead8',
  }

  const navBg = previewNavBg[form.template] || '#ffffff'
  const navText = previewNavText[form.template] || '#111111'

  const selectedFont = FONTS.find(f => f.id === form.heading_font) || FONTS[0]
  const previewHeadingStyle = form.template === 'editorial'
    ? { fontFamily: selectedFont.css, fontStyle: 'normal', fontWeight: 700, textTransform: 'uppercase' as const }
    : { fontFamily: selectedFont.css, fontStyle: 'italic' }

  const heroPy: Record<string, string> = {
    none: 'py-0', compact: 'py-4', medium: 'py-8', tall: 'py-14', fullscreen: 'py-20',
  }

  const imageRatioPb: Record<string, string> = {
    square: 'pb-[100%]', portrait: 'pb-[133%]', landscape: 'pb-[60%]',
  }

  const cardPadMap: Record<string, string> = {
    tight: 'p-1.5', normal: 'p-2', generous: 'p-3',
  }

  const previewGridCols = Math.min(form.grid_columns, 3)
  const previewColClass = ['', '', 'grid-cols-2', 'grid-cols-3', 'grid-cols-3', 'grid-cols-3'][previewGridCols]
  const sampleEmojis = ['🏺','🖼️','💎','📜','🗿','🌿']

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">

      {/* Preload all Google Fonts so the picker preview renders instantly */}
      {FONTS.map(f => (
        <link key={f.id} rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${f.google}&display=swap`} />
      ))}

      {/* Sidebar — pass live form values so name/emoji update as the user edits */}
      <Sidebar
        museum={{ ...museum, logo_emoji: form.logo_emoji, name: form.name }}
        activePath="/dashboard/site"
        onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
        isOwner={isOwner}
        staffAccess={staffAccess}
      />

      {/* Main */}
      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0 z-10">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Site Builder</span>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-mono text-emerald-600">Saved</span>}
            {error && <span className="text-xs font-mono text-red-500">{error}</span>}
            <button onClick={() => window.open('/museum/' + museum.slug, '_blank')}
              className="border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
              View public site
            </button>
            <button onClick={handleSave} disabled={saving}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-50">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-2 gap-8 items-start">

          {/* Left — settings */}
          <div className="space-y-6">

            {/* Template picker */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Template</div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">Choose a starting point — everything below can be customised.</p>
              <div className="grid grid-cols-5 gap-3">
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => selectTemplate(t.id)}
                    className={`text-left rounded-lg border-2 overflow-hidden transition-all ${form.template === t.id ? 'border-stone-900 dark:border-white shadow-md' : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'}`}>
                    <div className="h-20 relative" style={{ background: t.previewBg }}>
                      <div className="px-2 py-1.5 border-b flex items-center" style={{ borderColor: t.previewText + '15' }}>
                        <div className="w-10 h-1 rounded" style={{ background: t.previewText + '60' }} />
                      </div>
                      <div className="px-2 pt-2">
                        <div className="w-8 h-1 rounded mb-1" style={{ background: t.previewAccent + 'cc' }} />
                        <div className="w-12 h-2 rounded" style={{ background: t.previewText + 'cc' }} />
                      </div>
                      {form.template === t.id && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
                          <span className="text-white text-xs leading-none">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-white dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700">
                      <div className="text-xs font-medium text-stone-900 dark:text-stone-100">{t.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Identity */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Museum Identity</div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Museum Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Tagline</label>
                <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
                  placeholder="A short description of your museum"
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Logo Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {emojis.map(e => (
                    <button key={e} type="button" onClick={() => set('logo_emoji', e)}
                      className={'w-9 h-9 rounded-lg border text-lg transition-all ' + (form.logo_emoji === e ? 'border-stone-900 bg-stone-100 dark:border-white dark:bg-stone-700' : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800')}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Logo Image</label>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">Upload an image to replace the emoji in the nav bar. Square images work best.</p>
                {form.logo_image_url ? (
                  <div className="flex items-center gap-3">
                    <img src={form.logo_image_url} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-stone-200 dark:border-stone-700" />
                    <div className="flex gap-2">
                      <label className="text-xs font-mono text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        {uploadingField === 'logo_image_url' ? 'Uploading…' : 'Change'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo_image_url')} />
                      </label>
                      <button type="button" onClick={() => set('logo_image_url', '')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors px-2">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="w-12 h-12 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg flex items-center justify-center text-xl hover:border-stone-400 dark:hover:border-stone-500 transition-colors">
                      {uploadingField === 'logo_image_url' ? <span className="text-xs font-mono text-stone-400">…</span> : form.logo_emoji}
                    </div>
                    <span className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">Upload logo image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo_image_url')} />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Header Image</label>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">Background image for the hero section. Wide landscape images work best.</p>
                {form.hero_image_url ? (
                  <div className="space-y-2">
                    {/* Focal point picker */}
                    <div
                      className="relative rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 select-none"
                      style={{ height: '120px', cursor: 'crosshair' }}
                      onMouseDown={e => { setIsDragging(true); handleFocalPoint(e) }}
                      onMouseMove={e => { if (isDragging) handleFocalPoint(e) }}
                      onMouseUp={() => setIsDragging(false)}
                      onMouseLeave={() => setIsDragging(false)}
                    >
                      <img
                        src={form.hero_image_url} alt="Header" draggable={false}
                        className="w-full h-full object-cover pointer-events-none"
                        style={{ objectPosition: form.hero_image_position }}
                      />
                      {/* Focal point indicator */}
                      {(() => {
                        const parts = (form.hero_image_position || '50% 50%').split(' ')
                        const px = parseInt(parts[0]) || 50
                        const py = parseInt(parts[1]) || 50
                        return (
                          <div
                            className="absolute w-5 h-5 rounded-full border-2 border-white pointer-events-none"
                            style={{ left: `${px}%`, top: `${py}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 0 0 1.5px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)' }}
                          />
                        )
                      })()}
                      {/* Hint */}
                      <div className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                        <p className="text-xs text-white/80 font-mono">Drag to reposition</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-xs font-mono text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        {uploadingField === 'hero_image_url' ? 'Uploading…' : 'Change image'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'hero_image_url')} />
                      </label>
                      <button type="button" onClick={() => set('hero_image_url', '')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors px-2">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg cursor-pointer hover:border-stone-400 dark:hover:border-stone-500 transition-colors bg-stone-50 dark:bg-stone-800">
                    {uploadingField === 'hero_image_url' ? (
                      <span className="text-xs font-mono text-stone-400">Uploading…</span>
                    ) : (
                      <>
                        <div className="text-2xl mb-1">🖼️</div>
                        <div className="text-xs text-stone-400 dark:text-stone-500">Upload a header image</div>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'hero_image_url')} />
                  </label>
                )}
              </div>
            </div>

            {/* Colours */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Colours</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-stone-900 dark:text-stone-100 mb-1">Primary colour</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500">Used for the hero banner</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700" style={{ background: form.primary_color }} />
                  <input type="color" value={form.primary_color} onChange={e => set('primary_color', e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-stone-200" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-stone-900 dark:text-stone-100 mb-1">Accent colour</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500">Used for labels and highlights</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700" style={{ background: form.accent_color }} />
                  <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-stone-200" />
                </div>
              </div>
            </div>

            {/* Layout & Style */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Layout & Style</div>

              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">Heading Font</div>
                <div className="space-y-2">
                  {FONTS.map(f => (
                    <button key={f.id} type="button" onClick={() => set('heading_font', f.id)}
                      className={`w-full text-left px-3 py-2.5 rounded border transition-all flex items-center justify-between ${form.heading_font === f.id ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'}`}>
                      <span className={form.heading_font === f.id ? 'text-white dark:text-stone-900' : 'text-stone-800 dark:text-stone-200'} style={{ fontFamily: f.css, fontSize: '15px' }}>{f.name}</span>
                      <span className={`text-xs font-mono ${form.heading_font === f.id ? 'text-stone-400 dark:text-stone-600' : 'text-stone-500 dark:text-stone-400'}`}>{f.sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              <RadiusSlider value={form.card_radius} onChange={v => set('card_radius', v)} />

              <OptionToggle
                label="Hero Height"
                value={form.hero_height}
                onChange={v => set('hero_height', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'compact', label: 'Compact' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'tall', label: 'Tall' },
                  { value: 'fullscreen', label: 'Full' },
                ]}
              />

              <OptionToggle
                label="Grid Columns"
                value={String(form.grid_columns)}
                onChange={v => set('grid_columns', parseInt(v))}
                options={[
                  { value: '2', label: '2 col' },
                  { value: '3', label: '3 col' },
                  { value: '4', label: '4 col' },
                  { value: '5', label: '5 col' },
                ]}
              />

              <OptionToggle
                label="Image Shape"
                value={form.image_ratio}
                onChange={v => set('image_ratio', v)}
                options={[
                  { value: 'square', label: 'Square' },
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'landscape', label: 'Landscape' },
                ]}
              />

              <OptionToggle
                label="Card Padding"
                value={form.card_padding}
                onChange={v => set('card_padding', v)}
                options={[
                  { value: 'tight', label: 'Tight' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'generous', label: 'Generous' },
                ]}
              />

              <OptionToggle
                label="Card Info"
                value={form.card_metadata}
                onChange={v => set('card_metadata', v)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'title', label: 'Title' },
                  { value: 'title+artist', label: '+ Artist' },
                  { value: 'full', label: 'Full' },
                ]}
              />
            </div>

            {/* Visit info */}
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Visit Information</div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-1.5">Address</label>
                <textarea value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="123 Museum Street, London W1 2AB" rows={2}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-950" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Opening Hours</label>
                <textarea value={form.opening_hours} onChange={e => set('opening_hours', e.target.value)}
                  placeholder="Mon-Fri: 10:00-17:00, Sat-Sun: 10:00-18:00" rows={3}
                  className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-950" />
              </div>
            </div>

          </div>

          {/* Right — live preview */}
          <div className="sticky top-24">
            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Live Preview</div>
            <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden shadow-sm">

              {/* Browser chrome */}
              <div className="bg-stone-100 dark:bg-stone-800 px-3 py-2 flex items-center gap-2 border-b border-stone-200 dark:border-stone-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-600" />
                  <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-600" />
                  <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-600" />
                </div>
                <div className="flex-1 bg-white dark:bg-stone-900 rounded px-3 py-1 text-xs font-mono text-stone-400 dark:text-stone-500 text-center">
                  vitrine.app/museum/{museum.slug}
                </div>
              </div>

              {/* Nav */}
              <div className="px-4 h-10 flex items-center justify-between border-b"
                style={{ background: navBg, borderColor: navText + '15' }}>
                <div className="text-sm flex items-center gap-1.5" style={{ ...previewHeadingStyle, color: navText }}>
                  {form.logo_image_url
                    ? <img src={form.logo_image_url} alt="Logo" className="w-5 h-5 rounded object-cover" />
                    : form.logo_emoji
                  }
                  {form.name || 'Your Museum'}
                </div>
                <div className="flex gap-4">
                  <span className="text-xs border-b" style={{ color: navText, borderColor: form.accent_color }}>Collection</span>
                  <span className="text-xs opacity-40" style={{ color: navText }}>Visit</span>
                </div>
              </div>

              {/* Hero */}
              {form.hero_height !== 'none' && (
                <div className={`px-6 ${heroPy[form.hero_height] || 'py-8'} relative`} style={{
                  background: previewHeroBg,
                  backgroundImage: form.hero_image_url ? `url(${form.hero_image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: form.hero_image_url ? form.hero_image_position : 'center',
                }}>
                  {form.hero_image_url && <div className="absolute inset-0 bg-black/40" />}
                  <div className="relative z-10">
                    <div className="text-xs uppercase tracking-widest mb-1.5 font-mono" style={{ color: form.hero_image_url ? '#fff' : form.accent_color }}>
                      {form.name || 'Your Museum'}
                    </div>
                    <div style={{
                      ...previewHeadingStyle,
                      color: form.hero_image_url ? '#fff' : previewHeroText,
                      fontSize: form.hero_height === 'fullscreen' ? '20px' : form.hero_height === 'tall' ? '16px' : '13px'
                    }}>
                      {form.tagline || 'Explore the collection'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className="bg-white p-3">
                {form.card_metadata !== 'none' && (
                  <div className="text-xs text-stone-400 font-mono mb-2">On Display</div>
                )}
                <div className={`grid ${previewColClass} gap-2`}>
                  {sampleEmojis.slice(0, previewGridCols * 2).map((e, i) => (
                    <div key={i} className="overflow-hidden border border-stone-100"
                      style={{ borderRadius: `${form.card_radius}px` }}>
                      <div className={`relative w-full ${imageRatioPb[form.image_ratio] || 'pb-[100%]'} bg-stone-50`}>
                        <div className="absolute inset-0 flex items-center justify-center text-xl">{e}</div>
                      </div>
                      {form.card_metadata !== 'none' && (
                        <div className={cardPadMap[form.card_padding] || 'p-2'}>
                          <div className="h-2 bg-stone-200 rounded w-3/4 mb-1" />
                          {(form.card_metadata === 'title+artist' || form.card_metadata === 'full') && (
                            <div className="h-1.5 bg-stone-100 rounded w-1/2 mb-1" />
                          )}
                          {form.card_metadata === 'full' && (
                            <div className="h-1.5 bg-stone-100 rounded w-1/3" />
                          )}
                        </div>
                      )}
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