'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import { getPlan } from '@/lib/plans'
import { useLearnMode } from '@/components/LearnModeProvider'
import { COLLECTION_CATEGORIES } from '@/lib/categories'

type Theme = 'system' | 'light' | 'dark'

interface SidebarProps {
  museum: any
  activePath: string
  onSignOut: () => void
  isOwner?: boolean
  staffAccess?: string | null
  onNavigate?: () => void
}

type NavCache = { simple: boolean; wishlist: boolean; ticketing: boolean; fullMode: boolean; name: string; logo_emoji: string; plan: string }

export default function Sidebar({ museum, activePath, onSignOut, isOwner = true, staffAccess = null, onNavigate }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const simple = museum?.ui_mode === 'simple'
  const planInfo = museum ? getPlan(museum.plan) : null
  const communityLocked = planInfo ? !planInfo.fullMode : false

  // Seed from cache so nav doesn't flash on each page load
  const [navCache, setNavCache] = useState<NavCache | null>(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('vitrine_nav') ?? 'null') } catch { return null }
  })

  // Write cache whenever museum resolves
  useEffect(() => {
    if (!museum || !planInfo) return
    const next: NavCache = {
      simple: museum.ui_mode === 'simple',
      wishlist: planInfo.wishlist ?? false,
      ticketing: planInfo.ticketing ?? false,
      fullMode: planInfo.fullMode ?? false,
      name: museum.name,
      logo_emoji: museum.logo_emoji,
      plan: museum.plan,
    }
    setNavCache(next)
    localStorage.setItem('vitrine_nav', JSON.stringify(next))
  }, [museum?.id, museum?.ui_mode, museum?.plan])

  // Resolved nav values: use live data once available, fall back to cache, else hide
  const nav = museum && planInfo
    ? { simple, wishlist: planInfo.wishlist ?? false, ticketing: planInfo.ticketing ?? false, fullMode: planInfo.fullMode ?? false, name: museum.name, logo_emoji: museum.logo_emoji, plan: museum.plan }
    : navCache

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('system')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [discoverable, setDiscoverable] = useState(false)
  const [collectionCategory, setCollectionCategory] = useState<string>('')
  const [hideMoneyValues, setHideMoneyValues] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const { learnMode, setLearnMode } = useLearnMode()

  // Sync discoverable from museum prop (museum may be null on first render)
  useEffect(() => {
    setDiscoverable(museum?.discoverable ?? false)
    setCollectionCategory(museum?.collection_category ?? '')
    setHideMoneyValues(museum?.hide_money_values ?? false)
  }, [museum?.discoverable, museum?.collection_category, museum?.hide_money_values])

  // Fetch user email
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
  }, [])

  // Initialise theme from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) || 'system'
    setTheme(stored)
  }, [])

  // Apply/remove dark class and listen to system preference
  useEffect(() => {
    function applyTheme(t: Theme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (t === 'dark' || (t === 'system' && prefersDark)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    applyTheme(theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  // Close settings panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [settingsOpen])

  function changeTheme(t: Theme) {
    setTheme(t)
    localStorage.setItem('theme', t)
  }

  async function toggleDiscoverable() {
    if (!museum) return
    const next = !discoverable
    setDiscoverable(next)
    await supabase.from('museums').update({ discoverable: next }).eq('id', museum.id)
  }

  async function updateCollectionCategory(value: string) {
    if (!museum) return
    setCollectionCategory(value)
    await supabase.from('museums').update({ collection_category: value || null }).eq('id', museum.id)
  }

  async function toggleHideMoneyValues() {
    if (!museum) return
    const next = !hideMoneyValues
    setHideMoneyValues(next)
    await supabase.from('museums').update({ hide_money_values: next }).eq('id', museum.id)
  }

  function navItem(path: string, icon: string, label: string, learnKey?: string) {
    const active = activePath === path
    return (
      <div
        onClick={() => { router.push(path); onNavigate?.() }}
        className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono mb-1 cursor-pointer transition-colors ${
          active
            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
            : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800'
        }`}
        {...(learnKey ? { 'data-learn': learnKey } : {})}
      >
        <span>{icon}</span> {label}
      </div>
    )
  }

  async function handleExport() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: museumData } = await supabase.from('museums').select('*').eq('owner_id', user.id).single()
    if (!museumData) return
    const mid = museumData.id
    const [
      objects, staff, entries, loans, conservation, audits, exits,
      locations, locationHistory, conditions, valuations, risks,
      emergencyPlans, insurance, damage, reproductions,
      collectionUse, disposals, collectionReviews, auditExercises,
      rightsRecords, docPlans, docBacklogs,
    ] = await Promise.all([
      supabase.from('objects').select('*').eq('museum_id', mid),
      supabase.from('staff_members').select('*').eq('museum_id', mid),
      supabase.from('entry_records').select('*').eq('museum_id', mid),
      supabase.from('loans').select('*').eq('museum_id', mid),
      supabase.from('conservation_treatments').select('*').eq('museum_id', mid),
      supabase.from('audit_records').select('*').eq('museum_id', mid),
      supabase.from('object_exits').select('*').eq('museum_id', mid),
      supabase.from('locations').select('*').eq('museum_id', mid),
      supabase.from('location_history').select('*').eq('museum_id', mid),
      supabase.from('condition_assessments').select('*').eq('museum_id', mid),
      supabase.from('valuations').select('*').eq('museum_id', mid),
      supabase.from('risk_register').select('*').eq('museum_id', mid),
      supabase.from('emergency_plans').select('*').eq('museum_id', mid),
      supabase.from('insurance_policies').select('*').eq('museum_id', mid),
      supabase.from('damage_reports').select('*').eq('museum_id', mid),
      supabase.from('reproduction_requests').select('*').eq('museum_id', mid),
      supabase.from('collection_use_records').select('*').eq('museum_id', mid),
      supabase.from('disposal_records').select('*').eq('museum_id', mid),
      supabase.from('collection_reviews').select('*').eq('museum_id', mid),
      supabase.from('audit_exercises').select('*').eq('museum_id', mid),
      supabase.from('rights_records').select('*').eq('museum_id', mid),
      supabase.from('documentation_plans').select('*').eq('museum_id', mid),
      supabase.from('documentation_plan_backlogs').select('*').eq('museum_id', mid),
    ])
    const exportData = {
      exported_at: new Date().toISOString(),
      museum: museumData,
      objects: objects.data,
      staff: staff.data,
      entry_records: entries.data,
      loans: loans.data,
      conservation_treatments: conservation.data,
      audit_records: audits.data,
      object_exits: exits.data,
      locations: locations.data,
      location_history: locationHistory.data,
      condition_assessments: conditions.data,
      valuations: valuations.data,
      risk_register: risks.data,
      emergency_plans: emergencyPlans.data,
      insurance_policies: insurance.data,
      damage_reports: damage.data,
      reproduction_requests: reproductions.data,
      collection_use_records: collectionUse.data,
      disposal_records: disposals.data,
      collection_reviews: collectionReviews.data,
      audit_exercises: auditExercises.data,
      rights_records: rightsRecords.data,
      documentation_plans: docPlans.data,
      documentation_plan_backlogs: docBacklogs.data,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vitrine-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function handleDeleteAccount() {
    if (!confirm('This will permanently delete your museum, all collection data, and your account. This cannot be undone. Continue?')) return
    const res = await fetch('/api/delete-account', { method: 'POST' })
    if (res.ok) router.push('/login')
  }

  async function toggleMode() {
    if (!museum || communityLocked) return
    const newMode = simple ? 'full' : 'simple'
    await supabase.from('museums').update({ ui_mode: newMode }).eq('id', museum.id)
    window.location.reload()
  }

  return (
    <aside data-sidebar className="w-56 bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col fixed top-0 left-0 bottom-0">
      <div className="p-5 border-b border-stone-200 dark:border-stone-800">
        <span className="font-serif text-xl italic text-stone-900 dark:text-stone-100">Vitrine<span className="text-amber-600">.</span></span>
      </div>
      {nav && (
        <div
          onClick={() => { router.push('/dashboard'); onNavigate?.() }}
          className="p-4 border-b border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
          role="link"
          aria-label="Go to collection overview"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-lg">
              {nav.logo_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">{nav.name}</div>
              <div className="text-xs text-amber-600 tracking-wide uppercase">{nav.plan} plan</div>
            </div>
            {museum?.slug && (
              <a
                href={`/museum/${museum.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex-shrink-0 text-stone-300 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-300 transition-colors text-sm leading-none ml-1"
                title="View public site"
              >
                ↗
              </a>
            )}
          </div>
        </div>
      )}
      <nav className="p-3 flex-1 overflow-y-auto">
        {nav && (<>
        <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2">Collections</div>
        {navItem('/dashboard', '⬡', 'Collection Overview', 'nav.objects')}
        {nav.wishlist && navItem('/dashboard/wanted', '◇', 'Wishlist', 'nav.wanted')}

        {nav.simple ? (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Record</div>
            {navItem('/dashboard/entry', '🗂', 'Add Object', 'nav.entry')}
          </>
        ) : (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Collection Management</div>
            {navItem('/dashboard/entry', '🗂', 'Object Entry', 'nav.entry')}
            {navItem('/dashboard/register', '📋', 'Accession Register', 'nav.register')}
            {navItem('/dashboard/loans', '⇄', 'Loans Register', 'nav.loans')}
            {navItem('/dashboard/conservation', '⚗', 'Conservation', 'nav.conservation')}
            {navItem('/dashboard/audit', '◎', 'Audit & Inventory', 'nav.audit')}
            {navItem('/dashboard/exits', '↗', 'Object Exit', 'nav.exits')}
            {navItem('/dashboard/locations', '◎', 'Location Register', 'nav.locations')}
            {navItem('/dashboard/valuation', '◈', 'Valuation Register', 'nav.valuation')}
            {navItem('/dashboard/risk', '⚑', 'Risk Register', 'nav.risk')}
            {navItem('/dashboard/emergency', '⚡', 'Emergency Plans', 'nav.emergency')}
            {navItem('/dashboard/insurance', '🛡', 'Insurance', 'nav.insurance')}
            {navItem('/dashboard/damage', '⚠', 'Damage Reports', 'nav.damage')}
            {navItem('/dashboard/collections-use', '⊞', 'Use of Collections', 'nav.collections-use')}
            {navItem('/dashboard/disposal', '⊘', 'Disposal', 'nav.disposal')}
            {navItem('/dashboard/collections-review', '⊡', 'Collections Review', 'nav.collections-review')}
            {navItem('/dashboard/docs', '✓', 'Documentation Plan', 'nav.docs')}
            {navItem('/dashboard/trash', '🗑', 'Deleted Objects', 'nav.trash')}
          </>
        )}

        <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Website</div>
        {navItem('/dashboard/site', '◫', 'Site Builder', 'nav.site')}
        {nav.ticketing && navItem('/dashboard/events', '◎', 'Events', 'nav.events')}

        {!nav.simple && (isOwner || staffAccess === 'Admin') && (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">People</div>
            {navItem('/dashboard/staff', '◉', 'Staff & Roles', 'nav.staff')}
          </>
        )}

        <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Data</div>
        {navItem('/dashboard/analytics', '▦', 'Analytics', 'nav.analytics')}
        </>)}
      </nav>

      {/* Settings footer */}
      <div className="relative border-t border-stone-200 dark:border-stone-800" ref={settingsRef}>
        {/* Settings panel */}
        {settingsOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-stone-800">
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300">Settings</span>
              <button
                onClick={() => setSettingsOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 text-sm leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-3 space-y-4">
              {/* Appearance */}
              <div>
                <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Appearance</div>
                <div className="flex gap-1" data-learn="settings.theme">
                  {(['system', 'light', 'dark'] as Theme[]).map(t => (
                    <button
                      key={t}
                      onClick={() => changeTheme(t)}
                      className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors capitalize ${
                        theme === t
                          ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interface */}
              {museum && !communityLocked && (
                <div data-learn="settings.ui_mode">
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Interface</div>
                  <button
                    onClick={toggleMode}
                    className="w-full text-left text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    {simple ? '⊕ Switch to Full mode' : '◎ Switch to Simple mode'}
                  </button>
                </div>
              )}

              {/* Financial values (Community + Hobbyist) */}
              {museum && communityLocked && isOwner && (
                <div>
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Display</div>
                  <button
                    onClick={toggleHideMoneyValues}
                    className={`flex items-center gap-2 w-full text-left text-xs font-mono transition-colors ${
                      hideMoneyValues
                        ? 'text-stone-500 dark:text-stone-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${!hideMoneyValues ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                      <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${!hideMoneyValues ? 'left-3.5' : 'left-0.5'}`} />
                    </span>
                    {hideMoneyValues ? 'Financial values hidden' : 'Show financial values'}
                  </button>
                </div>
              )}

              {/* Learn Mode */}
              <div>
                <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Learn Mode</div>
                <button
                  onClick={() => setLearnMode(!learnMode)}
                  className={`flex items-center gap-2 w-full text-left text-xs font-mono transition-colors ${
                    learnMode
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                  data-learn="settings.learn_mode"
                >
                  <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${learnMode ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                    <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${learnMode ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                  {learnMode ? 'Tooltips active' : 'Show field tooltips'}
                </button>
              </div>

              {/* Discover (all tiers, owners and admins) */}
              {museum && (isOwner || staffAccess === 'Admin') && (
                <div>
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-1">Discover</div>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">List in Vitrine Discover directory.</p>
                  <button
                    onClick={toggleDiscoverable}
                    className={`flex items-center gap-2 w-full text-left text-xs font-mono transition-colors ${
                      discoverable
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                    data-learn="settings.discoverable"
                  >
                    <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${discoverable ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                      <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${discoverable ? 'left-3.5' : 'left-0.5'}`} />
                    </span>
                    {discoverable ? 'Listed in Discover' : 'Not listed'}
                  </button>
                  {discoverable && (
                    <select
                      value={collectionCategory}
                      onChange={e => updateCollectionCategory(e.target.value)}
                      className="mt-2 w-full text-xs font-mono bg-transparent border border-stone-200 dark:border-stone-700 rounded px-2 py-1 text-stone-600 dark:text-stone-400"
                    >
                      <option value="">— No default category —</option>
                      {COLLECTION_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Plan (owner only) */}
              {museum && isOwner && (
                <div>
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Plan</div>
                  <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1.5 capitalize">{museum.plan}</div>
                  <button
                    onClick={() => { setSettingsOpen(false); router.push('/dashboard/plan') }}
                    className="w-full text-left text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-600 hover:border-stone-900 dark:hover:border-stone-300 rounded px-2 py-1 transition-colors"
                  >
                    My Plan →
                  </button>
                </div>
              )}

              {/* Access level (staff only) */}
              {!isOwner && staffAccess && (
                <div>
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Your access</div>
                  <div className="text-xs font-mono text-stone-500 dark:text-stone-400 capitalize">{staffAccess}</div>
                </div>
              )}

              {/* Account */}
              <div>
                <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Account</div>
                {userEmail && (
                  <div className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-2 truncate" title={userEmail}>
                    {userEmail}
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="w-full text-left text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-1.5"
                >
                  Sign out →
                </button>
                {isOwner && (
                  <>
                    <button
                      onClick={handleExport}
                      className="w-full text-left text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-1.5"
                    >
                      Export my data →
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="w-full text-left text-xs font-mono text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    >
                      Delete account →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setSettingsOpen(prev => !prev)}
          className="w-full px-5 py-4 text-left text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors flex items-center gap-2"
        >
          <span>⚙</span> Settings
        </button>
      </div>
    </aside>
  )
}
