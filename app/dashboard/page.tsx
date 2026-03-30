'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { CardGridSkeleton, TableSkeleton } from '@/components/Skeleton'
import CSVImportModal from '@/components/CSVImportModal'
import { COLLECTION_CATEGORIES } from '@/lib/categories'

const STATUS_STYLES: Record<string, string> = {
  'Entry':         'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'On Display':    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Storage':       'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'On Loan':       'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Restoration':   'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  'Deaccessioned': 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500',
}

export default function Dashboard() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [trashedCount, setTrashedCount] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [discoverable, setDiscoverable] = useState(false)
  const [collectionCategory, setCollectionCategory] = useState('')
  const [savingDiscovery, setSavingDiscovery] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(true) // true until localStorage checked
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulking, setBulking] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [duplicateObjectIds, setDuplicateObjectIds] = useState<Set<string>>(new Set())
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === visibleObjects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleObjects.map(a => a.id)))
    }
  }

  async function bulkUpdateStatus(status: string) {
    if (!selectedIds.size || !canEdit) return
    setBulking(true)
    const ids = Array.from(selectedIds)
    await supabase.from('objects').update({ status }).in('id', ids)
    setObjects(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, status } : a))
    setSelectedIds(new Set())
    setBulking(false)
  }

  async function bulkSetVisibility(show: boolean) {
    if (!selectedIds.size || !canEdit) return
    setBulking(true)
    const ids = Array.from(selectedIds)
    await supabase.from('objects').update({ show_on_site: show }).in('id', ids)
    setObjects(prev => prev.map(a => selectedIds.has(a.id) ? { ...a, show_on_site: show } : a))
    setSelectedIds(new Set())
    setBulking(false)
  }

  async function bulkDelete() {
    if (!selectedIds.size || !canEdit) return
    if (!confirm(`Move ${selectedIds.size} object${selectedIds.size === 1 ? '' : 's'} to bin?\n\nItems in the bin are permanently deleted after 90 days.`)) return
    setBulking(true)
    const ids = Array.from(selectedIds)
    await supabase.from('objects').update({ deleted_at: new Date().toISOString() }).in('id', ids)
    setObjects(prev => prev.filter(a => !selectedIds.has(a.id)))
    setSelectedIds(new Set())
    setBulking(false)
  }

  useEffect(() => {
    setBannerDismissed(localStorage.getItem('discover-banner-dismissed') === 'true')
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result

      try {
        const [{ data: objects }, { data: activeLoans }, { data: activity }, { count: trashed }, { data: dupeLinks }] = await Promise.all([
          supabase.from('objects').select('*').eq('museum_id', museum.id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('loans').select('*').eq('museum_id', museum.id).eq('status', 'Active'),
          supabase.from('activity_log').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('objects').select('id', { count: 'exact', head: true }).eq('museum_id', museum.id).not('deleted_at', 'is', null),
          supabase.from('object_duplicates').select('object_id').eq('museum_id', museum.id),
        ])

        setMuseum(museum)
        setIsOwner(isOwner)
        setStaffAccess(staffAccess)
        setDiscoverable(museum.discoverable ?? false)
        setCollectionCategory(museum.collection_category || '')
        setTrashedCount(trashed ?? 0)
        setDuplicateObjectIds(new Set((dupeLinks || []).map((d: any) => d.object_id)))
        setObjects(objects || [])
        setLoans(activeLoans || [])
        setActivityLog(activity || [])
      } catch {
        setLoadError(true)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function saveDiscoverability(newDiscoverable: boolean, newCategory: string) {
    if (!museum) return
    setSavingDiscovery(true)
    await supabase.from('museums').update({
      discoverable: newDiscoverable,
      collection_category: newCategory || null,
    }).eq('id', museum.id)
    setSavingDiscovery(false)
  }

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8 space-y-8">
          <CardGridSkeleton cards={5} />
          <TableSkeleton rows={8} cols={4} />
        </div>
      </DashboardShell>
    )
  }

  if (loadError) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard" onSignOut={handleSignOut}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8 flex items-center justify-center min-h-64">
          <div className="text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">Failed to load your collection. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  const statusCount = (s: string) => objects.filter(a => a.status === s).length

  const today = new Date().toISOString().slice(0, 10)
  const loanByObject: Record<string, any> = Object.fromEntries(loans.map(l => [l.object_id, l]))
  const overdueDays = (loan: any) => loan?.loan_end_date && loan.loan_end_date < today
    ? Math.floor((new Date(today).getTime() - new Date(loan.loan_end_date).getTime()) / 86400000)
    : 0

  // null = show all; a status string = show only that status
  const CARDS = [
    { label: 'Total Objects', filterKey: null,           value: objects.length + trashedCount, sub: objects.length === 0 && trashedCount === 0 ? 'Add your first item' : trashedCount > 0 ? `${objects.length} in collection · ${trashedCount} in bin` : `${objects.length} in collection` },
    { label: 'On Display',    filterKey: 'On Display',   value: statusCount('On Display'),    sub: objects.length ? `${Math.round(statusCount('On Display')/objects.length*100)}% of collection` : '—' },
    { label: 'On Loan',       filterKey: 'On Loan',      value: statusCount('On Loan'),       sub: '—' },
    { label: 'In Restoration',filterKey: 'Restoration',  value: statusCount('Restoration'),   sub: '—' },
    { label: 'Deaccessioned', filterKey: 'Deaccessioned',value: statusCount('Deaccessioned'), sub: '—' },
  ]

  const visibleObjects = objects
    .filter(a => filter ? a.status === filter : true)
    .filter(a => showDuplicatesOnly ? duplicateObjectIds.has(a.id) : true)
  const fullMode = getPlan(museum?.plan).fullMode

  const totalPaid = objects.reduce((sum, o) => sum + (o.acquisition_value ? parseFloat(o.acquisition_value) : 0), 0)
  const totalEstimated = objects.reduce((sum, o) => sum + (o.estimated_value ? parseFloat(o.estimated_value) : 0), 0)
  const showValueTiles = totalPaid > 0 || totalEstimated > 0
  const valueDiff = totalEstimated - totalPaid
  const defaultCurrency = objects.find(o => o.acquisition_currency || o.estimated_value_currency)?.acquisition_currency || objects.find(o => o.estimated_value_currency)?.estimated_value_currency || 'GBP'
  function fmtCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  }
  const objectLimit = getPlan(museum?.plan).objects
  const nearLimit = objectLimit !== null && objects.length >= objectLimit * 0.8

  return (
    <DashboardShell museum={museum} activePath="/dashboard" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        {showImport && (
          <CSVImportModal
            onClose={() => setShowImport(false)}
            onSuccess={(count) => {
              setShowImport(false)
              // Reload objects after import
              window.location.reload()
            }}
          />
        )}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Collection</span>
          {canEdit && fullMode && (
            <button onClick={() => setShowImport(true)} className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors">
              Import CSV
            </button>
          )}
        </div>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {CARDS.map(card => {
              const active = filter === card.filterKey
              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => setFilter(card.filterKey)}
                  className={`text-left rounded-lg p-5 border transition-all ${
                    active
                      ? 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm'
                  }`}
                >
                  <div className={`text-xs uppercase tracking-widest mb-2 ${active ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}`}>{card.label}</div>
                  <div className={`font-serif text-4xl ${active ? 'text-white dark:text-stone-900' : 'text-stone-900 dark:text-stone-100'}`}>{card.value}</div>
                  <div className={`text-xs mt-1 ${active ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}`}>{card.sub}</div>
                </button>
              )
            })}
          </div>

          {/* Collection value tiles */}
          {showValueTiles && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Total Paid</div>
                <div className="font-serif text-3xl text-stone-900 dark:text-stone-100">{totalPaid > 0 ? fmtCurrency(totalPaid, defaultCurrency) : '—'}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">Purchase prices recorded</div>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Est. Value</div>
                <div className="font-serif text-3xl text-stone-900 dark:text-stone-100">{totalEstimated > 0 ? fmtCurrency(totalEstimated, defaultCurrency) : '—'}</div>
                {totalPaid > 0 && totalEstimated > 0 && (
                  <div className={`text-xs mt-1 font-mono ${valueDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {valueDiff >= 0 ? '↑' : '↓'} {fmtCurrency(Math.abs(valueDiff), defaultCurrency)} {valueDiff >= 0 ? 'gain' : 'loss'}
                  </div>
                )}
                {!(totalPaid > 0 && totalEstimated > 0) && (
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">Your estimated current value</div>
                )}
              </div>
            </div>
          )}

          {/* Near object limit warning */}
          {nearLimit && trashedCount > 0 && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-6 py-4">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                You're using {objects.length} of {objectLimit} objects on your plan.{' '}
                You have {trashedCount} item{trashedCount !== 1 ? 's' : ''} in the bin — permanently deleting them will free up space.{' '}
                <a href="/dashboard/trash" className="underline hover:text-amber-900 dark:hover:text-amber-200 transition-colors">Go to bin →</a>
              </p>
            </div>
          )}

          {/* Discoverability */}
          {!bannerDismissed && fullMode && (isOwner || staffAccess === 'Admin') && (
            <div className="mb-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-6 py-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Vitrine Directory</div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-xl">
                    List your collection in the public <a href="/discover" target="_blank" className="text-amber-600 hover:text-amber-500 underline">Vitrine discovery directory</a> — a searchable catalogue of collections from across the Vitrine community. Visitors can browse by category or search for specific objects. Only items marked <span className="font-mono">On Display</span> or <span className="font-mono">On Loan</span> will appear.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <a href="/discover" target="_blank" className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors">
                    View directory →
                  </a>
                  <button
                    onClick={() => { localStorage.setItem('discover-banner-dismissed', 'true'); setBannerDismissed(true) }}
                    className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 transition-colors text-base leading-none"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    const next = !discoverable
                    setDiscoverable(next)
                    await saveDiscoverability(next, collectionCategory)
                  }}
                  disabled={savingDiscovery}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded border text-xs font-mono transition-all flex-shrink-0 ${
                    discoverable
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-stone-50 border-stone-200 text-stone-400 dark:bg-stone-900 dark:border-stone-700 dark:text-stone-500'
                  }`}
                >
                  <span className={`relative w-7 h-3.5 rounded-full transition-colors flex-shrink-0 ${discoverable ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                    <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${discoverable ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                  {discoverable ? 'Listed in Vitrine directory' : 'Not listed in directory'}
                </button>
                {discoverable && (
                  <select
                    value={collectionCategory}
                    onChange={async e => {
                      setCollectionCategory(e.target.value)
                      await saveDiscoverability(discoverable, e.target.value)
                    }}
                    disabled={savingDiscovery}
                    className="border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-xs font-mono bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 outline-none focus:border-stone-400 dark:focus:border-stone-500 disabled:opacity-50"
                  >
                    <option value="">— Select a category —</option>
                    {COLLECTION_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
                {discoverable && !collectionCategory && (
                  <span className="text-xs font-mono text-amber-600 dark:text-amber-500">A category is required to appear in the directory</span>
                )}
              </div>
            </div>
          )}

          {objects.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🏛️</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">Your collection is empty</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Log an object in the Entry Register to begin.</p>
              <button
                onClick={() => router.push('/dashboard/entry')}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded"
              >
                + New Entry Record
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              {/* Filter bar */}
              {(filter || showDuplicatesOnly) && selectedIds.size === 0 && (
                <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                    Showing {visibleObjects.length} {visibleObjects.length === 1 ? 'object' : 'objects'}
                    {filter ? ` — ${filter}` : ''}
                    {showDuplicatesOnly ? ' — Duplicates only' : ''}
                  </span>
                  <button onClick={() => { setFilter(null); setShowDuplicatesOnly(false) }} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                    Show all objects ×
                  </button>
                </div>
              )}
              {/* Duplicates filter toggle */}
              {duplicateObjectIds.size > 0 && !filter && selectedIds.size === 0 && (
                <div className="px-6 py-2 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
                  <button
                    onClick={() => setShowDuplicatesOnly(v => !v)}
                    className={`text-xs font-mono px-2.5 py-1 rounded border transition-colors ${showDuplicatesOnly ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-400' : 'border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                  >
                    {showDuplicatesOnly ? '✓ ' : ''}Show duplicates only ({duplicateObjectIds.size})
                  </button>
                </div>
              )}
              {/* Bulk action bar */}
              {canEdit && fullMode && selectedIds.size > 0 && (
                <div className="px-4 py-2.5 border-b border-stone-200 dark:border-stone-700 bg-stone-900 dark:bg-white flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{selectedIds.size} selected</span>
                  <span className="text-stone-600 dark:text-stone-400">|</span>
                  <select
                    value={bulkStatus}
                    onChange={e => { if (e.target.value) { bulkUpdateStatus(e.target.value); setBulkStatus('') } }}
                    disabled={bulking}
                    className="text-xs font-mono bg-stone-800 dark:bg-stone-100 text-stone-200 dark:text-stone-700 border border-stone-700 dark:border-stone-300 rounded px-2 py-1 outline-none disabled:opacity-50"
                  >
                    <option value="">Change status…</option>
                    {['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => bulkSetVisibility(true)} disabled={bulking} className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-white dark:hover:text-stone-900 transition-colors disabled:opacity-50">Show on site</button>
                  <button onClick={() => bulkSetVisibility(false)} disabled={bulking} className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-white dark:hover:text-stone-900 transition-colors disabled:opacity-50">Hide from site</button>
                  <button onClick={bulkDelete} disabled={bulking} className="text-xs font-mono text-red-400 hover:text-red-300 dark:hover:text-red-600 transition-colors disabled:opacity-50">Move to bin</button>
                  <button onClick={() => setSelectedIds(new Set())} className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-300 dark:hover:text-stone-600 transition-colors ml-auto">Clear ×</button>
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    {canEdit && fullMode && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={visibleObjects.length > 0 && selectedIds.size === visibleObjects.length}
                          onChange={toggleSelectAll}
                          className="rounded border-stone-300 dark:border-stone-600"
                        />
                      </th>
                    )}
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Year</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Medium</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleObjects.map(a => (
                    <tr
                      key={a.id}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer ${a.status === 'Deaccessioned' ? 'opacity-50' : ''} ${selectedIds.has(a.id) ? 'bg-stone-50 dark:bg-stone-800' : ''}`}
                      onClick={() => router.push(`/dashboard/objects/${a.id}`)}
                    >
                      {canEdit && fullMode && (
                        <td className="px-4 py-3 w-10" onClick={e => { e.stopPropagation(); toggleSelect(a.id) }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(a.id)}
                            onChange={() => toggleSelect(a.id)}
                            className="rounded border-stone-300 dark:border-stone-600"
                          />
                        </td>
                      )}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-lg">{a.emoji}</div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{a.title}</span>
                              {duplicateObjectIds.has(a.id) && (
                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  Duplicate
                                </span>
                              )}
                              {a.hazard_note && (
                                <div className="relative group/hz inline-block">
                                  <span className="text-sm cursor-default select-none">⚠️</span>
                                  <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/hz:opacity-100 group-hover/hz:visible transition-all z-50 pointer-events-none">
                                    <div className="font-medium text-amber-400 mb-1">Hazard Note</div>
                                    <div className="text-stone-300">{a.hazard_note}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-stone-400 dark:text-stone-500">{a.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{a.production_date || a.year}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{a.medium}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const loan = loanByObject[a.id]
                          const days = a.status === 'On Loan' ? overdueDays(loan) : 0
                          if (days > 0) {
                            return (
                              <div className="relative group/tt inline-block">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); router.push('/dashboard/loans') }}
                                  className="text-xs font-mono px-2 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                                >
                                  Loan Overdue
                                </button>
                                <div className="absolute bottom-full left-0 mb-2 w-60 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tt:opacity-100 group-hover/tt:visible transition-all z-50 pointer-events-none">
                                  <div className="font-medium text-red-400 mb-1">Loan overdue</div>
                                  <div className="text-stone-300">Expected: {new Date(loan.loan_end_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                  <div className="text-stone-300">{days} day{days !== 1 ? 's' : ''} overdue</div>
                                  <div className="text-stone-500 mt-2">Click to view loan details →</div>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[a.status] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                              {a.status}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                  {visibleObjects.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="px-6 py-12 text-center text-sm text-stone-400 dark:text-stone-500">
                        No objects with status "{filter}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activityLog.length > 0 && (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Recent Activity</div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                {activityLog.map((entry, i) => {
                  const ago = (() => {
                    const diff = Date.now() - new Date(entry.created_at).getTime()
                    const mins = Math.floor(diff / 60000)
                    if (mins < 1) return 'just now'
                    if (mins < 60) return `${mins}m ago`
                    const hrs = Math.floor(mins / 60)
                    if (hrs < 24) return `${hrs}h ago`
                    return `${Math.floor(hrs / 24)}d ago`
                  })()
                  return (
                    <div key={entry.id} className={`flex items-center justify-between px-5 py-3 text-sm ${i < activityLog.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-stone-300 dark:text-stone-600 text-xs font-mono">◎</span>
                        <span className="text-stone-700 dark:text-stone-300">{entry.description}</span>
                        {entry.user_name && <span className="text-xs text-stone-400 dark:text-stone-500">by {entry.user_name}</span>}
                      </div>
                      <span className="text-xs font-mono text-stone-400 dark:text-stone-500 flex-shrink-0 ml-4">{ago}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
