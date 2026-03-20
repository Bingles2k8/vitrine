'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import { getPlan } from '@/lib/plans'

type Theme = 'system' | 'light' | 'dark'

interface SidebarProps {
  museum: any
  activePath: string
  onSignOut: () => void
  isOwner?: boolean
  staffAccess?: string | null
  onNavigate?: () => void
}

export default function Sidebar({ museum, activePath, onSignOut, isOwner = true, staffAccess = null, onNavigate }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const simple = museum?.ui_mode === 'simple'
  const planInfo = museum ? getPlan(museum.plan) : null
  const communityLocked = planInfo ? !planInfo.fullMode : false
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<Theme>('system')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [discoverable, setDiscoverable] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  // Sync discoverable from museum prop (museum may be null on first render)
  useEffect(() => {
    setDiscoverable(museum?.discoverable ?? false)
  }, [museum?.discoverable])

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

  function navItem(path: string, icon: string, label: string) {
    const active = activePath === path
    return (
      <div
        onClick={() => { router.push(path); onNavigate?.() }}
        className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono mb-1 cursor-pointer transition-colors ${
          active
            ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900'
            : 'text-stone-500 hover:bg-stone-50 dark:text-stone-400 dark:hover:bg-stone-800'
        }`}
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
      inventoryExercises, rightsRecords, docPlans, docBacklogs,
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
      supabase.from('inventory_exercises').select('*').eq('museum_id', mid),
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
      inventory_exercises: inventoryExercises.data,
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
    <aside className="w-56 bg-white dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col fixed top-0 left-0 bottom-0">
      <div className="p-5 border-b border-stone-200 dark:border-stone-800">
        <span className="font-serif text-xl italic text-stone-900 dark:text-stone-100">Vitrine<span className="text-amber-600">.</span></span>
      </div>
      {museum && (
        <div className="p-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-lg">
              {museum.logo_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate">{museum.name}</div>
              <div className="text-xs text-amber-600 tracking-wide uppercase">{museum.plan} plan</div>
            </div>
          </div>
        </div>
      )}
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2">Collections</div>
        {navItem('/dashboard', '⬡', 'Objects')}

        {simple ? (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Record</div>
            {navItem('/dashboard/entry', '🗂', 'Add Object')}
          </>
        ) : (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Object Management</div>
            {navItem('/dashboard/entry', '🗂', 'Object Entry')}
            {navItem('/dashboard/register', '📋', 'Accession Register')}
            {navItem('/dashboard/loans', '⇄', 'Loans Register')}
            {navItem('/dashboard/conservation', '⚗', 'Conservation')}
            {navItem('/dashboard/audit', '◎', 'Audit & Inventory')}
            {navItem('/dashboard/exits', '↗', 'Object Exit')}
            {navItem('/dashboard/valuation', '◈', 'Valuation Register')}
            {navItem('/dashboard/risk', '⚑', 'Risk Register')}
            {navItem('/dashboard/emergency', '⚡', 'Emergency Plans')}
            {navItem('/dashboard/insurance', '🛡', 'Insurance')}
            {navItem('/dashboard/damage', '⚠', 'Damage Reports')}
            {navItem('/dashboard/collections-use', '⊞', 'Use of Collections')}
            {navItem('/dashboard/disposal', '⊘', 'Disposal')}
            {navItem('/dashboard/collections-review', '⊡', 'Collections Review')}
            {navItem('/dashboard/docs', '✓', 'Documentation Plan')}
            {navItem('/dashboard/trash', '🗑', 'Deleted Objects')}
          </>
        )}

        <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Website</div>
        {navItem('/dashboard/site', '◫', 'Site Builder')}
        {planInfo?.ticketing && navItem('/dashboard/events', '◎', 'Events')}

        {!simple && (isOwner || staffAccess === 'Admin') && (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">People</div>
            {navItem('/dashboard/staff', '◉', 'Staff & Roles')}
          </>
        )}

        <div className="text-xs tracking-widest uppercase text-stone-300 dark:text-stone-600 px-2 py-2 mt-2">Data</div>
        {navItem('/dashboard/analytics', '▦', 'Analytics')}
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
                <div className="flex gap-1">
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
              {museum && (
                <div>
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Interface</div>
                  {communityLocked ? (
                    <span className="text-xs font-mono text-stone-300 dark:text-stone-600">
                      ◎ Simple mode (Community plan)
                    </span>
                  ) : (
                    <button
                      onClick={toggleMode}
                      className="w-full text-left text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                    >
                      {simple ? '⊕ Switch to Full mode' : '◎ Switch to Simple mode'}
                    </button>
                  )}
                </div>
              )}

              {/* Directory (Professional+ owners only) */}
              {museum && isOwner && planInfo?.fullMode && (
                <div>
                  <div className="text-xs tracking-widest uppercase text-stone-400 dark:text-stone-500 mb-2">Directory</div>
                  <button
                    onClick={toggleDiscoverable}
                    className={`flex items-center gap-2 w-full text-left text-xs font-mono transition-colors ${
                      discoverable
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    }`}
                  >
                    <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${discoverable ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                      <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${discoverable ? 'left-3.5' : 'left-0.5'}`} />
                    </span>
                    {discoverable ? 'Listed in directory' : 'Not listed'}
                  </button>
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
