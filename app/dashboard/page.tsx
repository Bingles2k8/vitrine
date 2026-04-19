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
import SearchFilterBar, { FilterState, EMPTY_FILTERS, SortBy } from '@/components/SearchFilterBar'
import { getCollectionValue, formatCollectionValue } from '@/lib/collectionValue'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>('')
  const [conditionDueIds, setConditionDueIds] = useState<Set<string>>(new Set())
  const [showConditionDue, setShowConditionDue] = useState(false)
  const [valuations, setValuations] = useState<any[]>([])
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

  async function toggleShowOnSite(id: string, current: boolean, e: React.MouseEvent) {
    e.stopPropagation()
    if (!canEdit) return
    const next = !current
    setObjects(prev => prev.map(o => o.id === id ? { ...o, show_on_site: next } : o))
    const { error } = await supabase.from('objects').update({ show_on_site: next }).eq('id', id)
    if (error) {
      setObjects(prev => prev.map(o => o.id === id ? { ...o, show_on_site: current } : o))
    }
  }

  async function handleDeleteObject(id: string, title: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Move "${title}" to bin?\n\nItems in the bin are permanently deleted after 90 days.`)) return
    await supabase.from('objects').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setObjects(prev => prev.filter(a => a.id !== id))
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
        const [{ data: objects }, { data: activeLoans }, { data: activity }, { count: trashed }, { data: dupeLinks }, { data: conditionDue }, { data: valuationRows }] = await Promise.all([
          supabase.from('objects').select('*').eq('museum_id', museum.id).is('deleted_at', null).order('created_at', { ascending: false }),
          supabase.from('loans').select('*').eq('museum_id', museum.id).eq('status', 'Active'),
          supabase.from('activity_log').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false }).limit(200),
          supabase.from('objects').select('id', { count: 'exact', head: true }).eq('museum_id', museum.id).not('deleted_at', 'is', null),
          supabase.from('object_duplicates').select('object_id').eq('museum_id', museum.id),
          supabase.from('condition_assessments').select('object_id').eq('museum_id', museum.id).lte('next_check_date', new Date().toISOString().slice(0, 10)).not('next_check_date', 'is', null),
          supabase.from('valuations').select('object_id, value, currency, valuation_date').eq('museum_id', museum.id),
        ])

        setMuseum(museum)
        setIsOwner(isOwner)
        setStaffAccess(staffAccess)
        setDiscoverable(museum.discoverable ?? false)
        setCollectionCategory(museum.collection_category || '')
        setTrashedCount(trashed ?? 0)
        setDuplicateObjectIds(new Set((dupeLinks || []).map((d: any) => d.object_id)))
        setConditionDueIds(new Set((conditionDue || []).map((c: any) => c.object_id)))
        setObjects(objects || [])
        setLoans(activeLoans || [])
        setActivityLog(activity || [])
        setValuations(valuationRows || [])
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
    setDiscoverable(newDiscoverable)
    const { error } = await supabase.from('museums').update({
      discoverable: newDiscoverable,
      collection_category: newCategory || null,
    }).eq('id', museum.id)
    if (error) {
      setDiscoverable(!newDiscoverable)
    } else {
      setMuseum((m: any) => m ? { ...m, discoverable: newDiscoverable } : m)
    }
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

  const fullMode = getPlan(museum?.plan).fullMode
  const canImport = getPlan(museum?.plan).analytics
  const hideMoneyValues = !!museum?.hide_money_values
  const onPublicSiteCount = objects.filter(a => a.show_on_site).length

  // null = show all; a status string = show only that status; '__on_public_site__' = show_on_site=true
  const FULL_CARDS = [
    { label: 'Total Objects', filterKey: null,           value: objects.length + trashedCount, sub: objects.length === 0 && trashedCount === 0 ? 'Add your first item' : trashedCount > 0 ? `${objects.length} in collection · ${trashedCount} in bin` : `${objects.length} in collection`, learnKey: 'dashboard.total_objects' },
    { label: 'On Display',    filterKey: 'On Display',   value: statusCount('On Display'),    sub: objects.length ? `${Math.round(statusCount('On Display')/objects.length*100)}% of collection` : '—', learnKey: 'dashboard.on_display' },
    { label: 'On Loan',       filterKey: 'On Loan',      value: statusCount('On Loan'),       sub: '—', learnKey: 'dashboard.on_loan' },
    { label: 'In Restoration',filterKey: 'Restoration',  value: statusCount('Restoration'),   sub: '—', learnKey: 'dashboard.in_restoration' },
    { label: 'Deaccessioned', filterKey: 'Deaccessioned',value: statusCount('Deaccessioned'), sub: '—', learnKey: 'dashboard.deaccessioned' },
  ]

  const mediumOptions = Array.from(new Set(objects.map(a => a.medium).filter(Boolean))).sort() as string[]
  const objectTypeOptions = Array.from(new Set(objects.map(a => a.object_type).filter(Boolean))).sort() as string[]
  const artistOptions = Array.from(new Set(
    objects.flatMap(a => [a.artist, a.maker_name]).filter(Boolean)
  )).sort() as string[]

  const q = searchQuery.trim().toLowerCase()
  const visibleObjects = objects
    .filter(a => {
      if (!filter) return true
      if (filter === '__on_public_site__') return !!a.show_on_site
      return a.status === filter
    })
    .filter(a => showDuplicatesOnly ? duplicateObjectIds.has(a.id) : true)
    .filter(a => showConditionDue ? conditionDueIds.has(a.id) : true)
    .filter(a => {
      if (filters.dateFrom && (a.created_at || '') < filters.dateFrom) return false
      if (filters.dateTo && (a.created_at || '') > filters.dateTo + 'T23:59:59') return false
      if (filters.medium && a.medium !== filters.medium) return false
      if (filters.objectType && a.object_type !== filters.objectType) return false
      if (fullMode) {
        if (filters.status && a.status !== filters.status) return false
        if (filters.accessionStatus === 'confirmed' && !a.accession_register_confirmed) return false
        if (filters.accessionStatus === 'unconfirmed' && a.accession_register_confirmed) return false
        if (filters.acquisitionMethod && a.acquisition_method !== filters.acquisitionMethod) return false
      } else {
        if (filters.artist && a.artist !== filters.artist && a.maker_name !== filters.artist) return false
      }
      if (!q) return true
      return (
        a.title?.toLowerCase().includes(q) ||
        a.accession_no?.toLowerCase().includes(q) ||
        a.artist?.toLowerCase().includes(q) ||
        a.maker_name?.toLowerCase().includes(q) ||
        a.medium?.toLowerCase().includes(q) ||
        a.object_type?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'date_added') return (b.created_at || '').localeCompare(a.created_at || '')
      if (sortBy === 'date_made') return (b.production_date || b.year || '').localeCompare(a.production_date || a.year || '')
      if (sortBy === 'insured_value') return (b.insured_value ?? 0) - (a.insured_value ?? 0)
      return 0
    })

  const totalPaid = objects.reduce((sum, o) => sum + (o.acquisition_value ? parseFloat(o.acquisition_value) : 0), 0)
  const totalEstimated = objects.reduce((sum, o) => sum + (o.estimated_value ? parseFloat(o.estimated_value) : 0), 0)
  const showValueTiles = (totalPaid > 0 || totalEstimated > 0) && !hideMoneyValues
  const valueDiff = totalEstimated - totalPaid
  const defaultCurrency = objects.find(o => o.acquisition_currency || o.estimated_value_currency)?.acquisition_currency || objects.find(o => o.estimated_value_currency)?.estimated_value_currency || 'GBP'
  function fmtCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  }
  const { total: collectionValue, currency: collectionValueCurrency } = getCollectionValue(objects, valuations)
  const SIMPLE_CARDS = [
    { label: 'Total Objects',  filterKey: null,                   value: String(objects.length + trashedCount),       sub: objects.length === 0 && trashedCount === 0 ? 'Add your first item' : trashedCount > 0 ? `${objects.length} in collection · ${trashedCount} in bin` : `${objects.length} in collection`, learnKey: 'dashboard.total_objects', isValue: false },
    { label: 'On Public Site', filterKey: '__on_public_site__',   value: String(onPublicSiteCount),                    sub: objects.length ? `${Math.round(onPublicSiteCount/objects.length*100)}% of collection` : '—', learnKey: 'dashboard.on_public_site', isValue: false },
    { label: 'On Loan',        filterKey: 'On Loan',              value: String(statusCount('On Loan')),               sub: '—', learnKey: 'dashboard.on_loan', isValue: false },
    { label: 'Collection Value', filterKey: null,                 value: hideMoneyValues ? '—' : (collectionValue > 0 ? formatCollectionValue(collectionValue, collectionValueCurrency) : '—'), sub: hideMoneyValues ? 'Hidden' : (collectionValue > 0 ? 'Latest valuation, estimate, or purchase' : '—'), learnKey: 'dashboard.collection_value', isValue: true },
  ]
  const CARDS = fullMode ? FULL_CARDS.map(c => ({ ...c, value: String(c.value), isValue: false })) : SIMPLE_CARDS
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
            titleOnly={!fullMode}
          />
        )}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Collection</span>
          {canEdit && canImport && (
            <button onClick={() => setShowImport(true)} className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors" data-learn="action.import_csv">
              Import CSV
            </button>
          )}
        </div>

        <div className="p-4 md:p-8">
          <div className={`grid grid-cols-2 ${fullMode ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mb-8`}>
            {CARDS.map(card => {
              const active = !card.isValue && filter === card.filterKey
              const Element: any = card.isValue ? 'div' : 'button'
              return (
                <Element
                  key={card.label}
                  {...(card.isValue ? {} : { type: 'button', onClick: () => setFilter(card.filterKey) })}
                  data-learn={card.learnKey}
                  className={`text-left rounded-lg p-5 border transition-all ${
                    active
                      ? 'bg-stone-900 dark:bg-white border-stone-900 dark:border-white'
                      : card.isValue
                        ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'
                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm'
                  }`}
                >
                  <div className={`text-xs uppercase tracking-widest mb-2 ${active ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}`}>{card.label}</div>
                  <div className={`font-serif ${card.isValue ? 'text-3xl' : 'text-4xl'} ${active ? 'text-white dark:text-stone-900' : 'text-stone-900 dark:text-stone-100'}`}>{card.value}</div>
                  <div className={`text-xs mt-1 ${active ? 'text-stone-400' : 'text-stone-400 dark:text-stone-500'}`}>{card.sub}</div>
                </Element>
              )
            })}
          </div>

          {/* Collection value tiles (full mode only) */}
          {fullMode && showValueTiles && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5" data-learn="dashboard.total_paid">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Total Purchase Price</div>
                <div className="font-serif text-3xl text-stone-900 dark:text-stone-100">{totalPaid > 0 ? fmtCurrency(totalPaid, defaultCurrency) : '—'}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">Purchase prices recorded</div>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5" data-learn="dashboard.estimated_value">
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
          {nearLimit && (
            <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-6 py-4">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                You're using {objects.length} of {objectLimit} objects on your plan.{' '}
                {trashedCount > 0 ? (
                  <>You have {trashedCount} item{trashedCount !== 1 ? 's' : ''} in the bin — permanently deleting them will free up space.{' '}
                  <a href="/dashboard/trash" className="underline hover:text-amber-900 dark:hover:text-amber-200 transition-colors">Go to bin →</a></>
                ) : (
                  <><a href="/dashboard/plan" className="underline hover:text-amber-900 dark:hover:text-amber-200 transition-colors">Upgrade your plan</a> to add more.</>
                )}
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
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">{fullMode ? 'Log an object in the Entry Register to begin.' : 'Add your first object to begin.'}</p>
              <button
                onClick={() => router.push('/dashboard/entry')}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded"
                data-learn="action.new_entry"
              >
                {fullMode ? '+ New Entry Record' : '+ Add an object'}
              </button>
            </div>
          ) : (
            <>
              {/* Search and filter bar */}
              <div className="mb-3">
                <SearchFilterBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  filters={filters}
                  onFiltersChange={setFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  isFullMode={fullMode}
                  mediumOptions={mediumOptions}
                  objectTypeOptions={objectTypeOptions}
                  artistOptions={artistOptions}
                  sortBeforeSearch={!fullMode}
                  trailingSlot={!fullMode && (isOwner || staffAccess === 'Admin') ? (
                    <div className="relative group/discover flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => saveDiscoverability(!discoverable, collectionCategory)}
                        disabled={savingDiscovery}
                        className="flex items-center gap-2 px-3 py-2 rounded border text-xs font-mono transition-colors disabled:opacity-50 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500"
                      >
                        <span className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${discoverable ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'}`}>
                          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${discoverable ? 'left-4' : 'left-0.5'}`} />
                        </span>
                        <span className={discoverable ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-stone-400'}>
                          Discover
                        </span>
                      </button>
                      <div className="absolute right-0 top-full mt-1.5 w-56 p-2.5 bg-stone-900 text-white text-[11px] rounded shadow-xl opacity-0 invisible group-hover/discover:opacity-100 group-hover/discover:visible transition-all z-50 pointer-events-none leading-relaxed">
                        {discoverable
                          ? 'Your collection is listed in Vitrine Discover. Click to remove it.'
                          : 'List your collection in Vitrine Discover so others can find it.'}
                      </div>
                    </div>
                  ) : undefined}
                  additionalFilters={
                    conditionDueIds.size > 0 ? (
                      <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Condition</label>
                        <label className="flex items-center gap-2 cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={showConditionDue}
                            onChange={e => setShowConditionDue(e.target.checked)}
                            className="rounded border-stone-300 dark:border-stone-600 accent-stone-900"
                          />
                          <span className="text-xs font-mono text-stone-700 dark:text-stone-300">Check Due</span>
                          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">({conditionDueIds.size})</span>
                        </label>
                      </div>
                    ) : undefined
                  }
                />
              </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              {/* Filter bar */}
              {(filter || showDuplicatesOnly) && selectedIds.size === 0 && (
                <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800">
                  <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                    Showing {visibleObjects.length} {visibleObjects.length === 1 ? 'object' : 'objects'}
                    {filter ? ` — ${filter === '__on_public_site__' ? 'On public site' : filter}` : ''}
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
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3" data-learn="dashboard.col.object">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3" data-learn="dashboard.col.year">Year</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3" data-learn="dashboard.col.medium">Medium</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3" data-learn="dashboard.col.status">Status</th>
                    {!fullMode && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3" data-learn="dashboard.col.public">Public</th>}
                    {canEdit && <th className="w-10 px-2 py-3" />}
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
                      {!fullMode && (
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <label className={`inline-flex items-center gap-2 ${canEdit ? 'cursor-pointer' : 'cursor-default opacity-60'}`} title={a.show_on_site ? 'Visible on your public site' : 'Hidden from your public site'}>
                            <input
                              type="checkbox"
                              checked={!!a.show_on_site}
                              onChange={e => toggleShowOnSite(a.id, !!a.show_on_site, e as any)}
                              disabled={!canEdit}
                              className="rounded border-stone-300 dark:border-stone-600 accent-amber-600"
                            />
                          </label>
                        </td>
                      )}
                      {canEdit && (
                        <td className="px-2 py-3 w-10" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={e => handleDeleteObject(a.id, a.title, e)}
                            className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Move to bin"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {visibleObjects.length === 0 && (
                    <tr>
                      <td colSpan={4 + (fullMode && canEdit ? 1 : 0) + (!fullMode ? 1 : 0) + (canEdit ? 1 : 0)} className="px-6 py-12 text-center text-sm text-stone-400 dark:text-stone-500">
                        {searchQuery || showConditionDue ? 'No objects match your filters.' : filter === '__on_public_site__' ? 'No objects are currently visible on your public site.' : `No objects with status "${filter}"`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            </>
          )}
          {activityLog.length > 0 && (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Recent Activity</div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden" style={{ maxHeight: '440px', overflowY: 'auto' }}>
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
                        {fullMode && entry.user_name && <span className="text-xs text-stone-400 dark:text-stone-500">by {entry.user_name}</span>}
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
