'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { TEMPLATES } from '@/lib/templates'
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/plans'

export default function Onboarding() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🏛️')
  const [template, setTemplate] = useState('minimal')
  const [plan, setPlan] = useState<PlanId>('community')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Redirect to dashboard if user already has a museum (as owner or staff)
  useEffect(() => {
    async function checkExisting() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: ownedList } = await supabase
        .from('museums')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
      if (ownedList?.[0]) { router.replace('/dashboard'); return }
      const { data: staffList } = await supabase
        .from('staff_members')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      if (staffList?.[0]) router.replace('/dashboard')
    }
    checkExisting()
  }, [])

  // Sync slug from name when user hasn't manually edited it
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(toSlug(name))
    }
  }, [name, slugManuallyEdited])

  // Debounced slug availability check
  useEffect(() => {
    if (!slug) { setSlugAvailable(null); setSlugChecking(false); setSlugSuggestion(null); return }

    setSlugChecking(true)
    setSlugAvailable(null)
    setSlugSuggestion(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`)
      const { available } = await res.json()
      setSlugAvailable(available)
      setSlugChecking(false)
      if (!available) {
        const suggestion = await findSuggestion(slug)
        setSlugSuggestion(suggestion)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [slug])

  function toSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function sanitizeSlugInput(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9-]/g, '')
  }

  async function findSuggestion(base: string): Promise<string | null> {
    for (let i = 2; i <= 9; i++) {
      const candidate = `${base}-${i}`
      const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(candidate)}`)
      const { available } = await res.json()
      if (available) return candidate
    }
    return null
  }

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your museum name'); return }
    if (!slug) { setError('Please enter a public URL for your museum'); return }
    if (slugAvailable === false) { setError('This URL is already taken — please choose another'); return }
    setError('')
    setStep(2)
  }

  async function handleSubmit() {
    // TEST MODE: Enterprise plan is selectable without payment.
    // TODO: When payment is implemented, gate Enterprise behind a contact/sales flow.
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); router.push('/login'); return }

    const selectedTemplate = TEMPLATES.find(t => t.id === template)!

    const { error } = await supabase.from('museums').insert({
      name: name.trim(),
      slug,
      owner_id: user.id,
      logo_emoji: emoji,
      template,
      primary_color: selectedTemplate.primary_color,
      accent_color: selectedTemplate.accent_color,
      plan,
      ui_mode: PLANS[plan].fullMode ? 'full' : 'simple',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Use full navigation to ensure session cookies are read fresh by the dashboard
      window.location.href = '/dashboard'
    }
  }

  const TOTAL_STEPS = 3

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl italic text-stone-900 mb-2">Welcome to Vitrine.</h1>
          <p className="text-stone-400 text-sm">Let's set up your museum in three quick steps.</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono transition-all ${step >= s ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-400'}`}>
                {s}
              </div>
              {s < TOTAL_STEPS && <div className={`w-12 h-px transition-all ${step > s ? 'bg-stone-900' : 'bg-stone-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white border border-stone-200 rounded-xl p-8 max-w-md mx-auto">
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-6">Step 1 — Your museum</div>
            <form onSubmit={handleNext} className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Museum Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="The Hackney Museum"
                  className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Logo Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {['🏛️','🖼️','🏺','🗿','🔮','🎨','📜','🌿','💎','🦋'].map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg border text-xl transition-all ${emoji === e ? 'border-stone-900 bg-stone-100' : 'border-stone-200 hover:bg-stone-50'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">Public URL</label>
                <div className="flex items-stretch border border-stone-200 rounded focus-within:border-stone-900 transition-colors overflow-hidden">
                  <span className="bg-stone-50 text-stone-400 text-xs font-mono px-3 flex items-center border-r border-stone-200 whitespace-nowrap">vitrinecms.com/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => {
                      setSlug(sanitizeSlugInput(e.target.value))
                      setSlugManuallyEdited(true)
                    }}
                    placeholder="your-museum"
                    className="flex-1 px-3 py-2 text-sm text-stone-900 outline-none bg-white min-w-0"
                  />
                </div>
                <div className="mt-1.5 text-xs font-mono min-h-[1.25rem]">
                  {slugChecking && <span className="text-stone-400">checking…</span>}
                  {!slugChecking && slugAvailable === true && <span className="text-emerald-600">✓ Available</span>}
                  {!slugChecking && slugAvailable === false && (
                    <span className="text-red-500">
                      ✗ Taken
                      {slugSuggestion && (
                        <> — use &ldquo;<button
                          type="button"
                          onClick={() => { setSlug(slugSuggestion); setSlugManuallyEdited(true) }}
                          className="underline hover:text-red-700"
                        >{slugSuggestion}</button>&rdquo;?</>
                      )}
                    </span>
                  )}
                </div>
              </div>
              {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
              <button
                type="submit"
                disabled={slugChecking || slugAvailable === false}
                className="w-full bg-stone-900 text-white rounded py-2.5 text-sm font-mono disabled:opacity-50"
              >
                Next — Choose a template →
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-3 text-center">Step 2 — Choose a template</div>
            <p className="text-sm text-stone-400 text-center mb-8">You can customise colours and fonts later in the Site Builder.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {TEMPLATES.slice(0, 3).map(t => (
                <TemplateCard key={t.id} t={t} selected={template === t.id} onSelect={() => setTemplate(t.id)} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-xl mx-auto">
              {TEMPLATES.slice(3).map(t => (
                <TemplateCard key={t.id} t={t} selected={template === t.id} onSelect={() => setTemplate(t.id)} />
              ))}
            </div>
            {error && <p className="text-xs text-red-500 font-mono text-center mb-4">{error}</p>}
            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep(1)} className="border border-stone-200 text-stone-500 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50">
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="bg-stone-900 text-white text-sm font-mono px-8 py-2.5 rounded">
                Next — Choose a plan →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-stone-400 mb-3 text-center">Step 3 — Choose a plan</div>
            <p className="text-sm text-stone-400 text-center mb-2">You can upgrade at any time from your account settings.</p>
            {/* TEST MODE: Payment is not required — any plan can be selected for free. Remove this banner when billing is live. */}
            <p className="text-xs font-mono text-amber-600 text-center mb-8 bg-amber-50 border border-amber-200 rounded px-4 py-2">
              Testing mode — no payment required. Select any plan to get started.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {PLAN_ORDER.map(id => {
                const p = PLANS[id]
                const selected = plan === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPlan(id)}
                    className={`text-left rounded-xl border-2 p-6 transition-all ${
                      selected
                        ? 'border-stone-900 shadow-lg bg-white'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest text-stone-400 mb-1">{p.label}</div>
                        <div className="text-2xl font-serif font-medium text-stone-900">{p.price}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                        selected ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                      }`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                    <ul className="space-y-1.5 mb-4">
                      {p.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-stone-500">
                          <span className="text-stone-300 mt-0.5">—</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
            {error && <p className="text-xs text-red-500 font-mono text-center mb-4">{error}</p>}
            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep(2)} className="border border-stone-200 text-stone-500 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-stone-900 text-white text-sm font-mono px-8 py-2.5 rounded disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create my museum →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function TemplateCard({ t, selected, onSelect }: { t: any; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`text-left rounded-xl border-2 overflow-hidden transition-all ${selected ? 'border-stone-900 shadow-lg scale-[1.02]' : 'border-stone-200 hover:border-stone-400'}`}>
      <div className="h-36 relative" style={{ background: t.previewBg }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: t.previewText + '15' }}>
          <span className="font-serif italic text-xs" style={{ color: t.previewText }}>{t.name} Museum</span>
          <div className="flex gap-2">
            <div className="w-8 h-1.5 rounded" style={{ background: t.previewText + '30' }} />
            <div className="w-8 h-1.5 rounded" style={{ background: t.previewText + '30' }} />
          </div>
        </div>
        <div className="px-3 pt-3 pb-2">
          <div className="w-16 h-1.5 rounded mb-1.5" style={{ background: t.previewAccent + 'cc' }} />
          <div className="w-24 h-3 rounded mb-1" style={{ background: t.previewText + 'cc' }} />
          <div className="w-20 h-3 rounded" style={{ background: t.previewText + '66' }} />
        </div>
        <div className="px-3 grid grid-cols-3 gap-1.5 mt-2">
          {[0,1,2].map(i => (
            <div key={i} className="rounded overflow-hidden border" style={{ borderColor: t.previewText + '15' }}>
              <div className="h-7" style={{ background: t.previewText + '10' }} />
              <div className="p-1" style={{ background: t.previewBg }}>
                <div className="h-1.5 rounded w-3/4" style={{ background: t.previewText + '30' }} />
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      <div className="px-4 py-3 bg-white border-t border-stone-100">
        <div className="text-sm font-medium text-stone-900 mb-0.5">{t.name}</div>
        <div className="text-xs text-stone-400">{t.description}</div>
      </div>
    </button>
  )
}
