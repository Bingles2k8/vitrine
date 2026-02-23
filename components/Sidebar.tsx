'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface SidebarProps {
  museum: any
  activePath: string
  onSignOut: () => void
}

export default function Sidebar({ museum, activePath, onSignOut }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const simple = museum?.ui_mode === 'simple'

  function navItem(path: string, icon: string, label: string) {
    const active = activePath === path
    return (
      <div
        onClick={() => router.push(path)}
        className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono mb-1 cursor-pointer transition-colors ${
          active ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'
        }`}
      >
        <span>{icon}</span> {label}
      </div>
    )
  }

  async function toggleMode() {
    if (!museum) return
    const newMode = simple ? 'full' : 'simple'
    await supabase.from('museums').update({ ui_mode: newMode }).eq('id', museum.id)
    window.location.reload()
  }

  return (
    <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed top-0 left-0 bottom-0">
      <div className="p-5 border-b border-stone-200">
        <span className="font-serif text-xl italic text-stone-900">Vitrine<span className="text-amber-600">.</span></span>
      </div>
      {museum && (
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
              {museum.logo_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-900 truncate">{museum.name}</div>
              <div className="text-xs text-amber-600 tracking-wide uppercase">{museum.plan} plan</div>
            </div>
          </div>
        </div>
      )}
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2">Collections</div>
        {navItem('/dashboard', '⬡', 'Objects')}

        {simple ? (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Record</div>
            {navItem('/dashboard/entry', '🗂', 'Add Object')}
          </>
        ) : (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Compliance</div>
            {navItem('/dashboard/entry', '🗂', 'Object Entry')}
            {navItem('/dashboard/register', '📋', 'Accession Register')}
            {navItem('/dashboard/loans', '⇄', 'Loans Register')}
            {navItem('/dashboard/conservation', '⚗', 'Conservation')}
            {navItem('/dashboard/audit', '◎', 'Audit & Inventory')}
            {navItem('/dashboard/exits', '↗', 'Object Exit')}
            {navItem('/dashboard/docs', '✓', 'Documentation Plan')}
          </>
        )}

        <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Website</div>
        {navItem('/dashboard/site', '◫', 'Site Builder')}

        {!simple && (
          <>
            <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">People</div>
            {navItem('/dashboard/staff', '◉', 'Staff & Roles')}
          </>
        )}

        <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Data</div>
        {navItem('/dashboard/analytics', '◈', 'Analytics')}
      </nav>
      <div className="p-4 border-t border-stone-200 space-y-3">
        <button
          onClick={toggleMode}
          className="w-full text-left text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors"
        >
          {simple ? '⊕ Switch to Full mode' : '◎ Switch to Simple mode'}
        </button>
        <button
          onClick={onSignOut}
          className="w-full text-left text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  )
}
