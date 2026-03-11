'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { path: '/dashboard', icon: '⬡', label: 'Objects' },
  { path: '/dashboard/entry', icon: '🗂', label: 'Add Object' },
  { path: '/dashboard/register', icon: '📋', label: 'Accession Register' },
  { path: '/dashboard/loans', icon: '⇄', label: 'Loans Register' },
  { path: '/dashboard/conservation', icon: '⚗', label: 'Conservation' },
  { path: '/dashboard/audit', icon: '◎', label: 'Audit & Inventory' },
  { path: '/dashboard/exits', icon: '↗', label: 'Object Exit' },
  { path: '/dashboard/valuation', icon: '◈', label: 'Valuation Register' },
  { path: '/dashboard/risk', icon: '⚑', label: 'Risk Register' },
  { path: '/dashboard/emergency', icon: '⚡', label: 'Emergency Plans' },
  { path: '/dashboard/insurance', icon: '🛡', label: 'Insurance' },
  { path: '/dashboard/damage', icon: '⚠', label: 'Damage Reports' },
  { path: '/dashboard/collections-use', icon: '⊞', label: 'Use of Collections' },
  { path: '/dashboard/disposal', icon: '⊘', label: 'Disposal' },
  { path: '/dashboard/collections-review', icon: '⊡', label: 'Collections Review' },
  { path: '/dashboard/docs', icon: '✓', label: 'Documentation Plan' },
  { path: '/dashboard/site', icon: '◫', label: 'Site Builder' },
  { path: '/dashboard/staff', icon: '◉', label: 'Staff & Roles' },
  { path: '/dashboard/analytics', icon: '▦', label: 'Analytics' },
  { path: '/dashboard/plan', icon: '◇', label: 'Plan & Billing' },
]

type Result = { type: 'nav'; path: string; icon: string; label: string } | { type: 'object'; id: string; title: string; emoji: string; accession_no: string; status: string }

interface CommandPaletteProps {
  museumId: string | null
}

export default function CommandPalette({ museumId }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      setResults(NAV_ITEMS.slice(0, 6).map(n => ({ ...n, type: 'nav' as const })))
      setSelectedIndex(0)
      return
    }

    // Always filter nav items
    const navResults: Result[] = NAV_ITEMS
      .filter(n => n.label.toLowerCase().includes(q))
      .map(n => ({ ...n, type: 'nav' as const }))

    // Search objects with debounce
    if (!museumId) {
      setResults(navResults)
      setSelectedIndex(0)
      return
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('objects')
        .select('id, title, emoji, accession_no, status')
        .eq('museum_id', museumId)
        .or(`title.ilike.%${q}%,artist.ilike.%${q}%,accession_no.ilike.%${q}%`)
        .limit(8)

      const objectResults: Result[] = (data || []).map(a => ({
        type: 'object' as const,
        id: a.id,
        title: a.title,
        emoji: a.emoji || '🖼️',
        accession_no: a.accession_no || '',
        status: a.status || '',
      }))

      setResults([...navResults, ...objectResults])
      setSelectedIndex(0)
    }, 200)

    return () => clearTimeout(timer)
  }, [query, museumId])

  const navigate = useCallback((result: Result) => {
    setOpen(false)
    if (result.type === 'nav') {
      router.push(result.path)
    } else {
      router.push(`/dashboard/objects/${result.id}`)
    }
  }, [router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navigate(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center px-4 border-b border-stone-200 dark:border-stone-700">
          <svg className="w-4 h-4 text-stone-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search objects, pages..."
            className="flex-1 py-3.5 text-sm bg-transparent outline-none text-stone-900 dark:text-stone-100 placeholder-stone-400"
          />
          <kbd className="text-[10px] font-mono text-stone-400 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5 ml-2">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <p className="text-sm text-stone-400 text-center py-8">No results found</p>
          )}
          {results.map((r, i) => (
            <button
              key={r.type === 'nav' ? r.path : r.id}
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                i === selectedIndex
                  ? 'bg-stone-100 dark:bg-stone-800'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
              }`}
              onClick={() => navigate(r)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="text-base w-6 text-center flex-shrink-0">
                {r.type === 'nav' ? r.icon : r.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-900 dark:text-stone-100 truncate">
                  {r.type === 'nav' ? r.label : r.title}
                </div>
                {r.type === 'object' && r.accession_no && (
                  <div className="text-xs text-stone-400 truncate">{r.accession_no}</div>
                )}
              </div>
              <span className="text-[10px] font-mono text-stone-400 flex-shrink-0">
                {r.type === 'nav' ? 'Page' : r.status}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 dark:border-stone-700 px-4 py-2 flex items-center gap-4 text-[10px] font-mono text-stone-400">
          <span><kbd className="border border-stone-200 dark:border-stone-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-stone-200 dark:border-stone-700 rounded px-1">↵</kbd> open</span>
          <span><kbd className="border border-stone-200 dark:border-stone-700 rounded px-1">esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
