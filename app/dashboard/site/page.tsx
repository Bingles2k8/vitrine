'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { TEMPLATES } from '@/lib/templates'
import DashboardShell from '@/components/DashboardShell'
import { useIsMobile } from '@/hooks/useIsMobile'
import { getMuseumForUser } from '@/lib/get-museum'
import { compressImage, ALLOWED_IMAGE_ACCEPT } from '@/lib/image-compression'
import { getPlan, FREE_TIER_TEMPLATES } from '@/lib/plans'

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

function CollapsibleSection({ title, defaultOpen = false, children }: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
      >
        <span className="text-xs uppercase tracking-widest text-stone-500 dark:text-stone-400">{title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-stone-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-6 pb-6 pt-4 space-y-6 border-t border-stone-100 dark:border-stone-800">{children}</div>}
    </div>
  )
}

export default function SiteBuilder() {
  const isMobile = useIsMobile()
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
    contact_phone: '',
    contact_email: '',
    about_text: '',
    facilities: '',
    maps_embed_url: '',
    template: 'minimal',
    card_radius: 8,
    hero_height: 'medium',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'full',
    social_instagram: '',
    social_twitter: '',
    social_facebook: '',
    social_website: '',
    seo_description: '',
    footer_text: '',
    collection_label: '',
    collecting_since: '',
    collector_bio: '',
    show_wanted: false,
    show_collection_value: false,
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
        contact_phone: museum.contact_phone || '',
        contact_email: museum.contact_email || '',
        about_text: museum.about_text || '',
        facilities: museum.facilities || '',
        maps_embed_url: museum.maps_embed_url || '',
        template: museum.template || 'minimal',
        card_radius: museum.card_radius ?? 8,
        hero_height: museum.hero_height || 'medium',
        grid_columns: museum.grid_columns || 4,
        image_ratio: museum.image_ratio || 'square',
        card_padding: museum.card_padding || 'normal',
        card_metadata: museum.card_metadata || 'full',
        social_instagram: museum.social_instagram || '',
        social_twitter: museum.social_twitter || '',
        social_facebook: museum.social_facebook || '',
        social_website: museum.social_website || '',
        seo_description: museum.seo_description || '',
        footer_text: museum.footer_text || '',
        collection_label: museum.collection_label || '',
        collecting_since: museum.collecting_since || '',
        collector_bio: museum.collector_bio || '',
        show_wanted: museum.show_wanted ?? false,
        show_collection_value: museum.show_collection_value ?? false,
      })
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    FONTS.forEach(f => {
      if (document.querySelector(`link[data-vitrine-font="${f.id}"]`)) return
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.setAttribute('data-vitrine-font', f.id)
      link.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=block`
      document.head.appendChild(link)
      link.addEventListener('load', () => {
        const name = f.css.split(',')[0].replace(/'/g, '').trim()
        document.fonts.load(`italic 400 1em "${name}"`)
        document.fonts.load(`400 1em "${name}"`)
      })
    })
  }, [])

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function uploadImage(file: File, field: 'hero_image_url' | 'logo_image_url') {
    setUploadingField(field)
    const compressed = await compressImage(file)
    const ext = compressed.type === 'image/webp' ? 'webp' : compressed.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('museum-assets').upload(filename, compressed, { upsert: true })
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

  const selectedTemplate = TEMPLATES.find(t => t.id === form.template) || TEMPLATES[0]
  const layoutVariant = selectedTemplate.layout_variant
  const isLightTemplate = form.template === 'minimal' || form.template === 'editorial' || form.template === 'curator' || form.template === 'magazine' || form.template === 'salon'
  const previewHeroBg = isLightTemplate ? '#ffffff' : form.primary_color
  const previewHeroText = isLightTemplate ? '#111111' : '#ffffff'

  const previewNavBg: Record<string, string> = {
    minimal: '#ffffff', dramatic: '#0c0a09', archival: '#fdf6e3', editorial: '#ffffff', classic: '#1e293b',
    cover: 'transparent', curator: '#faf8f5', magazine: '#ffffff', salon: '#fafaf9',
  }
  const previewNavText: Record<string, string> = {
    minimal: '#111111', dramatic: '#ffffff', archival: '#3a2e1e', editorial: '#000000', classic: '#f0ead8',
    cover: '#ffffff', curator: '#1c1917', magazine: '#000000', salon: '#1c1917',
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

  const previewGridCols = form.grid_columns
  const previewColClass = ['', '', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5'][previewGridCols]
  const sampleEmojis = ['🏺','🖼️','💎','📜','🗿','🌿','🎭','🔮','🌸','🗽']

  return (
    <DashboardShell
      museum={{ ...museum, logo_emoji: form.logo_emoji, name: form.name }}
      activePath="/dashboard/site"
      onSignOut={async () => { await supabase.auth.signOut(); router.push('/login') }}
      isOwner={isOwner}
      staffAccess={staffAccess}
    >

      {isMobile ? (
        <>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 sticky top-0 z-10">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Site Builder</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="text-4xl mb-4">🖥</div>
            <h2 className="font-serif text-lg italic text-stone-900 dark:text-stone-100 mb-2">Desktop only</h2>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-500">The Site Builder requires a larger screen. Please switch to a desktop or laptop to edit your site.</p>
          </div>
        </div>
        </>
      ) : (
      <>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Site Builder</span>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-mono text-emerald-600">Saved</span>}
            {error && <span className="text-xs font-mono text-red-500">{error}</span>}
            <button onClick={() => window.open('/museum/' + museum.slug, '_blank')}
              className="hidden sm:block border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-mono px-4 py-2 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
              View public site
            </button>
            <button onClick={handleSave} disabled={saving}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-50">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <div className="h-[calc(100vh-3.5rem)] grid grid-cols-2 gap-8 overflow-hidden">

          {/* Left — settings */}
          <div className="overflow-y-auto p-4 md:p-8 space-y-3">

            {/* Template & Colour */}
            <CollapsibleSection title="Template & Colour">
              <div>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">Choose a starting point — everything below can be customised.</p>
                <div className="grid grid-cols-3 gap-3">
                  {TEMPLATES.map(t => {
                    const isLocked = museum?.plan === 'community' && !FREE_TIER_TEMPLATES.includes(t.id)
                    return (
                    <button key={t.id} onClick={() => !isLocked && selectTemplate(t.id)}
                      className={`text-left rounded-lg border-2 overflow-hidden transition-all ${isLocked ? 'opacity-50 cursor-default' : ''} ${form.template === t.id ? 'border-stone-900 dark:border-white shadow-md' : 'border-stone-200 dark:border-stone-700 ' + (!isLocked ? 'hover:border-stone-400 dark:hover:border-stone-500' : '')}`}>
                      <div className="h-20 relative overflow-hidden" style={{ background: t.previewBg }}>
                        {t.layout_variant === 'cover' && (
                          <>
                            {/* Full-bleed cover preview */}
                            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${t.previewBg}, ${t.previewText}30 80%, ${t.previewText}80)` }} />
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="w-8 h-1.5 rounded mb-1" style={{ background: t.previewText + 'cc' }} />
                              <div className="w-12 h-0.5 rounded" style={{ background: t.previewText + '50' }} />
                            </div>
                            <div className="absolute top-1.5 left-2 right-2 flex items-center justify-between">
                              <div className="w-6 h-0.5 rounded" style={{ background: t.previewText + '40' }} />
                              <div className="flex gap-1">
                                <div className="w-4 h-0.5 rounded" style={{ background: t.previewText + '30' }} />
                                <div className="w-4 h-0.5 rounded" style={{ background: t.previewText + '30' }} />
                              </div>
                            </div>
                          </>
                        )}
                        {t.layout_variant === 'text-forward' && (
                          <>
                            {/* Centered text preview */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3">
                              <div className="w-16 h-2 rounded" style={{ background: t.previewText + 'dd' }} />
                              <div className="w-10 h-1 rounded" style={{ background: t.previewText + '60' }} />
                              <div className="w-12 h-0.5 rounded mt-1" style={{ background: t.previewAccent + '80' }} />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 flex gap-0.5 h-5">
                              {[3,4,3,4].map((_, i) => (
                                <div key={i} className="flex-1" style={{ background: t.previewText + '15' }} />
                              ))}
                            </div>
                          </>
                        )}
                        {t.layout_variant === 'magazine' && (
                          <>
                            {/* Masthead bar */}
                            <div className="absolute top-0 left-0 right-0 px-2 py-1 border-b-2" style={{ borderColor: t.previewText }}>
                              <div className="w-14 h-2 rounded" style={{ background: t.previewText + 'ee', fontWeight: 800 }} />
                            </div>
                            {/* Asymmetric grid preview */}
                            <div className="absolute top-7 left-1.5 right-1.5 bottom-1.5 flex gap-0.5">
                              <div className="flex-[2] rounded-sm" style={{ background: t.previewText + '25' }} />
                              <div className="flex-[1] flex flex-col gap-0.5">
                                <div className="flex-1 rounded-sm" style={{ background: t.previewText + '18' }} />
                                <div className="flex-1 rounded-sm" style={{ background: t.previewText + '18' }} />
                              </div>
                            </div>
                          </>
                        )}
                        {t.layout_variant === 'sidebar' && (
                          <>
                            {/* Sidebar split preview */}
                            <div className="absolute inset-0 flex">
                              <div className="w-6 h-full flex flex-col pt-2 px-1 gap-1.5 border-r" style={{ background: t.previewBg, borderColor: t.previewText + '20' }}>
                                <div className="w-3 h-3 rounded-sm" style={{ background: t.previewText + '40' }} />
                                <div className="w-4 h-0.5 rounded" style={{ background: t.previewText + '60' }} />
                                <div className="w-3 h-0.5 rounded" style={{ background: t.previewText + '30' }} />
                                <div className="w-3 h-0.5 rounded" style={{ background: t.previewText + '30' }} />
                              </div>
                              <div className="flex-1 p-1 grid grid-cols-2 gap-0.5 content-start">
                                {[0,1,2,3].map(i => (
                                  <div key={i} className="rounded-sm aspect-square" style={{ background: t.previewText + '18' }} />
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                        {t.layout_variant === 'standard' && (
                          <>
                            <div className="px-2 py-1.5 border-b flex items-center" style={{ borderColor: t.previewText + '15' }}>
                              <div className="w-10 h-1 rounded" style={{ background: t.previewText + '60' }} />
                            </div>
                            <div className="px-2 pt-2">
                              <div className="w-8 h-1 rounded mb-1" style={{ background: t.previewAccent + 'cc' }} />
                              <div className="w-12 h-2 rounded" style={{ background: t.previewText + 'cc' }} />
                            </div>
                          </>
                        )}
                        {isLocked && (
                          <div className="absolute top-1 left-1 z-10">
                            <span className="text-[9px] font-mono uppercase tracking-wide bg-stone-900 text-white px-1 py-0.5 rounded">Hobbyist+</span>
                          </div>
                        )}
                        {form.template === t.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-stone-900 dark:bg-white flex items-center justify-center z-10">
                            <span className="text-white dark:text-stone-900 text-xs leading-none">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-1.5 bg-white dark:bg-stone-800 border-t border-stone-100 dark:border-stone-700">
                        <div className="text-xs font-medium text-stone-900 dark:text-stone-100">{t.name}</div>
                        <div className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5" style={{ fontSize: '10px' }}>{t.description}</div>
                      </div>
                    </button>
                  )})}
                </div>
              </div>
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
            </CollapsibleSection>

            {/* Museum Identity */}
            <CollapsibleSection title="Museum Identity" defaultOpen>
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
                        <input type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo_image_url')} />
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
                    <input type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo_image_url')} />
                  </label>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Header Image</label>
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">Background image for the hero section. Wide landscape images work best.</p>
                {form.hero_image_url ? (
                  <div className="space-y-2">
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
                      <div className="absolute bottom-0 inset-x-0 px-2.5 py-1.5 bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                        <p className="text-xs text-white/80 font-mono">Drag to reposition</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <label className="text-xs font-mono text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        {uploadingField === 'hero_image_url' ? 'Uploading…' : 'Change image'}
                        <input type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'hero_image_url')} />
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
                    <input type="file" accept={ALLOWED_IMAGE_ACCEPT} className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'hero_image_url')} />
                  </label>
                )}
              </div>
              {getPlan(museum?.plan).advancedCustomisation ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Footer Text</label>
                  <input value={form.footer_text} onChange={e => set('footer_text', e.target.value)}
                    placeholder="© 2025 My Museum. All rights reserved."
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Appears in the footer alongside "Powered by Vitrine".</p>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Footer Text</div>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Add a custom copyright notice or text to your site footer. Available on Hobbyist and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* Layout & Style */}
            <CollapsibleSection title="Layout & Style">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">Heading Font</div>
                <div className="space-y-2">
                  {FONTS.map(f => (
                    <button key={f.id} type="button" onClick={() => set('heading_font', f.id)}
                      className={`w-full text-left px-3 py-2.5 rounded border transition-all flex items-center justify-between ${form.heading_font === f.id ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'}`}>
                      <span className={form.heading_font === f.id ? 'text-white dark:text-stone-900' : 'text-stone-800 dark:text-stone-200'} style={{ fontFamily: f.css, fontSize: '18px' }}>{f.name}</span>
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
            </CollapsibleSection>

            {/* Visit Information — Professional+ */}
            <CollapsibleSection title="Visit Information">
              {getPlan(museum?.plan).visitInfo ? (
                <div className="space-y-6">
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
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Phone Number</label>
                    <input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                      placeholder="+44 20 7946 0958"
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Contact Email</label>
                    <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
                      placeholder="hello@yourmuseum.org"
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Map Embed URL</label>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">Paste the <code className="font-mono">src</code> URL from Google Maps → Share → Embed a map.</p>
                    <input value={form.maps_embed_url} onChange={e => set('maps_embed_url', e.target.value)}
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Add your address, opening hours, and contact details to your public site. Available on Professional and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* About & Social */}
            <CollapsibleSection title="About & Social">
              {getPlan(museum?.plan).visitInfo ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">About / Mission</label>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">A short description of your museum's history and purpose, shown on the Visit page.</p>
                    <textarea value={form.about_text} onChange={e => set('about_text', e.target.value)}
                      placeholder="Founded in 1892, the Whitmore Collection preserves..." rows={4}
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-950" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Facilities & Accessibility</label>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">e.g. wheelchair access, free parking, café on-site, hearing loop available.</p>
                    <textarea value={form.facilities} onChange={e => set('facilities', e.target.value)}
                      placeholder="Fully wheelchair accessible. Free parking on-site. Café open during museum hours." rows={3}
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-950" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">About & Facilities</div>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Add about text and facilities info to your public site. Available on Professional and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
              {getPlan(museum?.plan).advancedCustomisation ? (
                <div className="space-y-6">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Social Links</div>
                  <p className="text-xs text-stone-400 dark:text-stone-500 -mt-2">Links shown as icons in your site's footer.</p>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Instagram</label>
                    <input value={form.social_instagram} onChange={e => set('social_instagram', e.target.value)}
                      placeholder="https://instagram.com/yourmuseum"
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">X / Twitter</label>
                    <input value={form.social_twitter} onChange={e => set('social_twitter', e.target.value)}
                      placeholder="https://x.com/yourmuseum"
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Facebook</label>
                    <input value={form.social_facebook} onChange={e => set('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/yourmuseum"
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Website</label>
                    <input value={form.social_website} onChange={e => set('social_website', e.target.value)}
                      placeholder="https://yourmuseum.org"
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Social Links</div>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Add Instagram, X, Facebook, and website links to your public site footer. Available on Hobbyist and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* SEO & Sharing — Hobbyist+ */}
            <CollapsibleSection title="SEO & Sharing">
              {getPlan(museum?.plan).advancedCustomisation ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Meta Description</label>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">Shown in Google results and link previews. Defaults to your tagline if left blank.</p>
                  <textarea value={form.seo_description} onChange={e => set('seo_description', e.target.value)}
                    placeholder="Discover our permanent collection of 18th-century European paintings and decorative arts."
                    rows={3}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-950" />
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Your hero image is automatically used as the link preview image.</p>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Customise how your site appears in Google results and link previews. Available on Hobbyist and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* Collector Identity — Hobbyist+ */}
            <CollapsibleSection title="Collector Identity">
              {getPlan(museum?.plan).advancedCustomisation ? (
                <div className="space-y-6">
                  <p className="text-xs text-stone-400 dark:text-stone-500">Personalise how your collection is described and introduce yourself to visitors.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Collection Label</label>
                      <select value={form.collection_label} onChange={e => set('collection_label', e.target.value)}
                        className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950">
                        <option value="">Collection (default)</option>
                        <option value="Museum">Museum</option>
                        <option value="Collection">Collection</option>
                        <option value="Archive">Archive</option>
                        <option value="Gallery">Gallery</option>
                        <option value="Cabinet">Cabinet</option>
                      </select>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Used in your public site headings.</p>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Collecting Since</label>
                      <input value={form.collecting_since} onChange={e => set('collecting_since', e.target.value)}
                        placeholder="e.g. 2003"
                        className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Shown in your collection stats.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">About the Collector</label>
                    <textarea value={form.collector_bio} onChange={e => set('collector_bio', e.target.value)}
                      placeholder="I've been collecting vintage radios since 2003, starting with a Bush TR82 I found at a car boot sale…"
                      rows={4}
                      className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-950" />
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">Shown as a personal introduction above your collection grid.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Add a personal bio, collection label, and "collecting since" year to your public site. Available on Hobbyist and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
            </CollapsibleSection>

            {/* Wanted List — Community & Hobbyist only */}
            {getPlan(museum?.plan).wishlist && (
              <CollapsibleSection title="Wanted List">
                <div className="space-y-3">
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    Show what you&apos;re actively looking for on your public collection site. Visitors who own items on your list can reach out directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => set('show_wanted', !form.show_wanted)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded border text-xs font-mono transition-all ${
                      form.show_wanted
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                        : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
                    }`}
                  >
                    <span className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${form.show_wanted ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${form.show_wanted ? 'left-4' : 'left-0.5'}`} />
                    </span>
                    {form.show_wanted ? 'Wanted list visible on public site' : 'Show wanted list on public site'}
                  </button>
                  {form.show_wanted && museum?.slug && (
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      Accessible at <span className="font-mono">/museum/{museum.slug}/wanted</span>
                    </p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Collection Value */}
            <CollapsibleSection title="Collection Value">
              <div className="space-y-3">
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Optionally display your total estimated collection value on the public site. Individual object values are never shown publicly.
                </p>
                <button
                  type="button"
                  onClick={() => set('show_collection_value', !form.show_collection_value)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded border text-xs font-mono transition-all ${
                    form.show_collection_value
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
                  }`}
                >
                  <span className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${form.show_collection_value ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${form.show_collection_value ? 'left-4' : 'left-0.5'}`} />
                  </span>
                  {form.show_collection_value ? 'Collection value visible on public site' : 'Show collection value on public site'}
                </button>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Enter estimated values on individual objects via the <span className="font-mono">Valuation</span> tab on each object record.
                </p>
              </div>
            </CollapsibleSection>

            {/* Embed on Website — Professional+ */}
            <CollapsibleSection title="Embed on Website">
              {getPlan(museum?.plan).fullMode ? (
                <div className="space-y-3">
                  <p className="text-xs text-stone-400 dark:text-stone-500">Add your collection to any existing website using this iframe snippet.</p>
                  <textarea
                    readOnly
                    value={`<iframe\n  src="${typeof window !== 'undefined' ? window.location.origin : 'https://vitrine.app'}/museum/${museum.slug}/embed"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border:none;border-radius:8px"\n></iframe>`}
                    rows={7}
                    className="w-full font-mono text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-stone-600 dark:text-stone-400 resize-none outline-none"
                  />
                  <button
                    onClick={() => {
                      const code = `<iframe\n  src="${window.location.origin}/museum/${museum.slug}/embed"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border:none;border-radius:8px"\n></iframe>`
                      navigator.clipboard.writeText(code).then(() => {
                        const btn = document.getElementById('copy-embed-btn')
                        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy embed code' }, 2000) }
                      })
                    }}
                    id="copy-embed-btn"
                    className="text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                  >
                    Copy embed code
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-stone-500 dark:text-stone-400">Embed your collection as an iframe on any website. Available on Professional and above.</p>
                  </div>
                  <button onClick={() => router.push('/dashboard/plan')}
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors">
                    Upgrade →
                  </button>
                </div>
              )}
            </CollapsibleSection>


          </div>

          {/* Right — live preview */}
          <div className="overflow-y-auto p-4 md:p-8">
            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Preview</div>
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

              {/* ── COVER preview ──────────────────────────────────────── */}
              {layoutVariant === 'cover' && (() => {
                const heroBg = form.hero_image_url ? undefined : form.primary_color
                return (
                  <>
                    {/* Full-bleed hero with nav overlaid */}
                    <div className="relative" style={{
                      height: '160px',
                      backgroundColor: heroBg || '#1a1a1a',
                      backgroundImage: form.hero_image_url ? `url(${form.hero_image_url})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: form.hero_image_url ? form.hero_image_position : 'center',
                    }}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)' }} />
                      {/* Floating nav */}
                      <div className="absolute top-0 left-0 right-0 px-4 h-9 flex items-center justify-between">
                        <div className="text-xs flex items-center gap-1" style={{ ...previewHeadingStyle, color: '#ffffff' }}>
                          {form.logo_emoji} {form.name || 'Your Museum'}
                        </div>
                        <div className="flex gap-3">
                          <span className="text-xs border-b border-white/60 text-white/90">Collection</span>
                        </div>
                      </div>
                      {/* Name + tagline at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                        <div className="text-xs font-mono mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>{form.name || 'Your Museum'}</div>
                        <div style={{ ...previewHeadingStyle, color: '#ffffff', fontSize: '24px' }}>
                          {form.tagline || 'Explore the collection'}
                        </div>
                      </div>
                    </div>
                    {/* Cards below */}
                    <div className="p-3" style={{ background: '#0d0b08' }}>
                      <div className={`grid ${previewColClass} gap-2`}>
                        {sampleEmojis.slice(0, previewGridCols * 2).map((e, i) => (
                          <div key={i} className="overflow-hidden" style={{ borderRadius: `${form.card_radius}px`, background: 'rgba(255,255,255,0.06)' }}>
                            <div className={`relative w-full ${imageRatioPb[form.image_ratio] || 'pb-[100%]'}`} style={{ background: 'rgba(255,255,255,0.1)' }}>
                              <div className="absolute inset-0 flex items-center justify-center text-xl">{e}</div>
                            </div>
                            {form.card_metadata !== 'none' && (
                              <div className={cardPadMap[form.card_padding] || 'p-2'}>
                                <div className="h-1.5 rounded w-3/4 mb-1" style={{ background: 'rgba(255,255,255,0.3)' }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}

              {/* ── CURATOR (text-forward) preview ─────────────────────── */}
              {layoutVariant === 'text-forward' && (
                <>
                  {/* Nav */}
                  <div className="px-4 h-10 flex items-center justify-between border-b" style={{ background: '#faf8f5', borderColor: '#e7e5e4' }}>
                    <div className="text-xs flex items-center gap-1.5" style={{ ...previewHeadingStyle, color: '#1c1917' }}>
                      {form.logo_emoji} {form.name || 'Your Museum'}
                    </div>
                    <span className="text-xs border-b" style={{ color: '#1c1917', borderColor: form.accent_color }}>Collection</span>
                  </div>
                  {/* Large centred text intro */}
                  <div className="flex flex-col items-center justify-center text-center px-6 py-8" style={{ background: '#faf8f5' }}>
                    <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: form.accent_color }}>{form.name || 'Your Museum'}</div>
                    <div className="mb-3" style={{ ...previewHeadingStyle, color: '#1c1917', fontSize: '28px' }}>
                      {form.tagline || 'Explore the collection'}
                    </div>
                    <div className="w-10 h-px mb-3" style={{ background: '#e7e5e4' }} />
                    <div className="text-xs leading-relaxed max-w-xs" style={{ color: '#78716c' }}>
                      A carefully curated collection…
                    </div>
                  </div>
                  {/* Thin rule */}
                  <div className="mx-4 mb-3 h-px" style={{ background: '#e7e5e4' }} />
                  {/* Cards */}
                  <div className="px-3 pb-3" style={{ background: '#faf8f5' }}>
                    <div className={`grid ${previewColClass} gap-2`}>
                      {sampleEmojis.slice(0, previewGridCols * 2).map((e, i) => (
                        <div key={i} className="overflow-hidden bg-white border border-stone-100" style={{ borderRadius: `${form.card_radius}px` }}>
                          <div className={`relative w-full ${imageRatioPb[form.image_ratio] || 'pb-[100%]'} bg-stone-50`}>
                            <div className="absolute inset-0 flex items-center justify-center text-xl">{e}</div>
                          </div>
                          {form.card_metadata !== 'none' && (
                            <div className={cardPadMap[form.card_padding] || 'p-2'}>
                              <div className="h-1.5 bg-stone-200 rounded w-3/4 mb-1" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── MAGAZINE preview ───────────────────────────────────── */}
              {layoutVariant === 'magazine' && (
                <>
                  {/* Nav — bold border */}
                  <div className="px-4 h-10 flex items-center justify-between border-b-2 border-black bg-white">
                    <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#000' }}>
                      {form.logo_emoji} {form.name || 'Your Museum'}
                    </div>
                    <span className="text-xs border-b font-bold" style={{ color: '#000', borderColor: form.accent_color }}>Collection</span>
                  </div>
                  {/* Masthead bar */}
                  <div className="px-3 py-2 flex items-end justify-between border-b-2 border-black bg-white">
                    <div style={{ ...previewHeadingStyle, color: '#000', fontSize: '26px', fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
                      {form.tagline || form.name || 'The Collection'}
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono" style={{ color: form.accent_color }}>{form.name}</div>
                    </div>
                  </div>
                  {/* Asymmetric hero grid */}
                  <div className="p-2 bg-white">
                    <div className="grid grid-cols-3 gap-1" style={{ height: '110px' }}>
                      <div className="col-span-2 bg-stone-100 flex items-center justify-center text-2xl rounded-sm overflow-hidden relative">
                        {sampleEmojis[0]}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-1">
                          <div className="h-1.5 bg-white/60 rounded w-3/4" />
                        </div>
                      </div>
                      <div className="col-span-1 flex flex-col gap-1">
                        {[1, 2].map(i => (
                          <div key={i} className="flex-1 bg-stone-100 flex items-center justify-center text-lg rounded-sm overflow-hidden relative">
                            {sampleEmojis[i]}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                              <div className="h-1 bg-white/60 rounded w-3/4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Rule + small grid */}
                  <div className="px-3 pb-3 bg-white">
                    <div className="h-px mb-2" style={{ background: '#e7e5e4' }} />
                    <div className={`grid ${previewColClass} gap-2`}>
                      {sampleEmojis.slice(3, 3 + previewGridCols).map((e, i) => (
                        <div key={i} className="overflow-hidden border border-stone-100" style={{ borderRadius: `${form.card_radius}px` }}>
                          <div className={`relative w-full ${imageRatioPb[form.image_ratio] || 'pb-[100%]'} bg-stone-50`}>
                            <div className="absolute inset-0 flex items-center justify-center">{e}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* ── SALON (sidebar) preview ────────────────────────────── */}
              {layoutVariant === 'sidebar' && (
                <div className="flex" style={{ background: '#fafaf9', minHeight: '280px' }}>
                  {/* Sidebar */}
                  <div className="flex flex-col pt-4 px-3 gap-3 border-r" style={{ width: '72px', borderColor: '#e7e5e4' }}>
                    <div className="flex flex-col items-start gap-1">
                      <div className="text-lg">{form.logo_emoji}</div>
                      <div className="text-xs leading-tight" style={{ ...previewHeadingStyle, color: '#1c1917', fontSize: '9px', maxWidth: '56px' }}>
                        {form.name || 'Your Museum'}
                      </div>
                    </div>
                    <div className="w-8 h-px" style={{ background: '#e7e5e4' }} />
                    <div className="flex flex-col gap-2">
                      <div className="text-xs font-mono" style={{ color: form.accent_color, fontSize: '8px', borderLeft: `2px solid ${form.accent_color}`, paddingLeft: '4px' }}>Collection</div>
                      <div className="text-xs font-mono" style={{ color: '#a8a29e', fontSize: '8px', paddingLeft: '6px' }}>Events</div>
                      <div className="text-xs font-mono" style={{ color: '#a8a29e', fontSize: '8px', paddingLeft: '6px' }}>Visit</div>
                    </div>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-3">
                    <div className="text-xs font-mono mb-2" style={{ color: '#a8a29e', fontSize: '9px' }}>Collection · 42 pieces</div>
                    <div className={`grid ${previewColClass} gap-2`}>
                      {sampleEmojis.slice(0, previewGridCols * 2).map((e, i) => (
                        <div key={i} className="overflow-hidden border border-stone-100 bg-white" style={{ borderRadius: `${form.card_radius}px` }}>
                          <div className={`relative w-full ${imageRatioPb[form.image_ratio] || 'pb-[100%]'} bg-stone-50`}>
                            <div className="absolute inset-0 flex items-center justify-center text-lg">{e}</div>
                          </div>
                          {form.card_metadata !== 'none' && (
                            <div className={cardPadMap[form.card_padding] || 'p-2'}>
                              <div className="h-1.5 bg-stone-200 rounded w-3/4" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STANDARD preview (all original templates) ──────────── */}
              {layoutVariant === 'standard' && (
                <>
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
                      backgroundColor: previewHeroBg,
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
                          fontSize: form.hero_height === 'fullscreen' ? '32px' : form.hero_height === 'tall' ? '26px' : '22px'
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
                </>
              )}

            </div>
          </div>

        </div>
      </>
      )}
    </DashboardShell>
  )
}