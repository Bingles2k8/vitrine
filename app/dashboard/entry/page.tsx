'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { useToast } from '@/components/Toast'
import { CardGridSkeleton, TableSkeleton } from '@/components/Skeleton'
import SearchFilterBar, { FilterState, EMPTY_FILTERS, SortBy } from '@/components/SearchFilterBar'
import { inputCls, labelCls, ENTRY_REASONS, CONDITION_GRADES } from '@/components/tabs/shared'
import CSVImportModal from '@/components/CSVImportModal'

const OUTCOME_STYLES: Record<string, string> = {
  'Pending':                 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Acquired':                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Returned to depositor':   'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'Transferred to loan':     'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'Disposed':                'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

export default function EntryRegisterPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>('')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const defaultEntry = () => ({
    entry_date: new Date().toISOString().slice(0, 10),
    entry_number: '',
    object_title: '',
    depositor_name: '',
    depositor_contact: '',
    gdpr_consent: false,
    gdpr_consent_date: '',
    entry_reason: '',
    object_description: '',
    object_count: 1,
    received_by: '',
    entry_method: '',
    accession_no: '',
    condition_grade: '',
  })
  const [newEntry, setNewEntry] = useState(defaultEntry)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('newEntry') === 'true') {
      setShowForm(true)
    }
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      try {
        const [{ data: entries }, { data: objects }] = await Promise.all([
          supabase.from('entry_records').select('*, objects(title, accession_no, deleted_at, description, medium, physical_materials, artist, maker_name, object_type, status, created_at, production_date, acquisition_method, accession_register_confirmed)').eq('museum_id', museum.id).order('entry_date', { ascending: false }),
          supabase.from('objects').select('id, title, accession_no').eq('museum_id', museum.id).is('deleted_at', null).order('title'),
        ])
        setMuseum(museum)
        setIsOwner(isOwner)
        setStaffAccess(staffAccess)
        setEntries(entries || [])
        setObjects(objects || [])
      } catch {
        // Queries failed — show empty state rather than infinite loading
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handlePromote(entry: any) {
        const planInfo = getPlan(museum?.plan)
    const limit = planInfo.objects
    if (limit !== null) {
      const { count } = await supabase
        .from('objects').select('*', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
        .is('deleted_at', null)
      if (count !== null && count >= limit) {
        toast(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`, 'error')
        return
      }
    }
    const { data: newObject, error: createError } = await supabase.from('objects').insert({
      museum_id: museum.id,
      title: entry.objects?.title || entry.object_description || 'Untitled',
      acquisition_source: entry.depositor_name,
      acquisition_source_contact: entry.depositor_contact,
      acquisition_object_count: entry.object_count,
      number_of_parts: entry.object_count,
      status: 'Entry',
      emoji: '🖼️',
    }).select('id').single()

    if (createError) { toast(createError.message, 'error'); return }

    const { error: updateError } = await supabase.from('entry_records').update({ object_id: newObject.id }).eq('id', entry.id)
    if (updateError) { toast(updateError.message, 'error'); return }

    setEntries(entries.map(e => e.id === entry.id ? { ...e, object_id: newObject.id } : e))
    router.push(`/dashboard/objects/${newObject.id}?tab=entry`)
  }

  async function handleCreateEntry(mode: 'stay' | 'continue') {
    const { entry_date, object_title, depositor_name, entry_reason, object_description, received_by, accession_no } = newEntry
    const trackDepositor = getPlan(museum?.plan).depositorTracking
    const requiredMissing = !entry_date || !object_title || (fullMode && !entry_reason) || !object_description || !accession_no ||
      (trackDepositor && (!depositor_name || !received_by))
    if (requiredMissing) {
      toast('Please fill in all required fields.', 'error')
      return
    }
    // Check plan limits
    const planInfo = getPlan(museum?.plan)
    const limit = planInfo.objects
    if (limit !== null) {
      const { count } = await supabase.from('objects').select('*', { count: 'exact', head: true }).eq('museum_id', museum.id).is('deleted_at', null)
      if (count !== null && count >= limit) {
        toast(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`, 'error')
        return
      }
    }
    setSubmitting(true)
    const year = new Date(entry_date).getFullYear()
    const yearEntries = entries.filter(e => e.entry_number?.startsWith(`EN-${year}-`))
    const entryNumber = newEntry.entry_number.trim() || `EN-${year}-${String(yearEntries.length + 1).padStart(3, '0')}`
    const { data: created, error } = await supabase.from('entry_records').insert({
      museum_id: museum.id,
      entry_number: entryNumber,
      entry_date: newEntry.entry_date,
      depositor_name: newEntry.depositor_name,
      depositor_contact: newEntry.depositor_contact || null,
      gdpr_consent: newEntry.gdpr_consent,
      gdpr_consent_date: newEntry.gdpr_consent && newEntry.gdpr_consent_date ? newEntry.gdpr_consent_date : newEntry.gdpr_consent ? new Date().toISOString().slice(0, 10) : null,
      entry_reason: newEntry.entry_reason,
      object_description: newEntry.object_description,
      object_count: newEntry.object_count,
      received_by: newEntry.received_by,
      entry_method: newEntry.entry_method || null,
      outcome: 'Pending',
    }).select('*').single()
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    // Create the object
    const { data: newObject, error: objectError } = await supabase.from('objects').insert({
      museum_id: museum.id,
      title: newEntry.object_title,
      acquisition_source: newEntry.depositor_name,
      acquisition_source_contact: newEntry.depositor_contact || null,
      acquisition_object_count: newEntry.object_count,
      number_of_parts: newEntry.object_count,
      accession_no: newEntry.accession_no || null,
      status: 'Entry',
      emoji: '🖼️',
      condition_grade: newEntry.condition_grade || null,
    }).select('id').single()
    if (objectError) { toast(objectError.message, 'error'); setSubmitting(false); return }
    await supabase.from('entry_records').update({ object_id: newObject.id }).eq('id', created.id)
    if (mode === 'continue') {
      router.push(`/dashboard`)
    } else {
      setEntries([{ ...created, object_id: newObject.id, objects: { title: newEntry.object_title, accession_no: newEntry.accession_no || null, deleted_at: null } }, ...entries])
      setNewEntry(defaultEntry())
      setShowForm(false)
      setSubmitting(false)
      toast(`Entry ${entryNumber} recorded.`, 'success')
    }
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/entry" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <CardGridSkeleton cards={4} />
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const simple = museum?.ui_mode === 'simple'
  const fullMode = getPlan(museum?.plan).fullMode
  const trackDepositor = getPlan(museum?.plan).depositorTracking
  const pending = entries.filter(e => e.outcome === 'Pending').length

  const mediumOptions = Array.from(new Set(entries.map(e => e.objects?.medium).filter(Boolean))).sort() as string[]
  const objectTypeOptions = Array.from(new Set(entries.map(e => e.objects?.object_type).filter(Boolean))).sort() as string[]
  const artistOptions = Array.from(new Set(
    entries.flatMap(e => [e.objects?.artist, e.objects?.maker_name]).filter(Boolean)
  )).sort() as string[]

  const q = searchQuery.trim().toLowerCase()
  const filteredEntries = entries
    .filter(e => {
      if (filters.dateFrom && (e.entry_date || '') < filters.dateFrom) return false
      if (filters.dateTo && (e.entry_date || '') > filters.dateTo) return false
      if (filters.medium && e.objects?.medium !== filters.medium) return false
      if (filters.objectType && e.objects?.object_type !== filters.objectType) return false
      if (fullMode) {
        if (filters.status && e.objects?.status !== filters.status) return false
        if (filters.accessionStatus === 'confirmed' && !e.objects?.accession_register_confirmed) return false
        if (filters.accessionStatus === 'unconfirmed' && e.objects?.accession_register_confirmed) return false
        if (filters.acquisitionMethod && e.objects?.acquisition_method !== filters.acquisitionMethod) return false
      } else {
        if (filters.artist && e.objects?.artist !== filters.artist && e.objects?.maker_name !== filters.artist) return false
      }
      if (!q) return true
      return (
        e.objects?.title?.toLowerCase().includes(q) ||
        e.objects?.accession_no?.toLowerCase().includes(q) ||
        e.object_description?.toLowerCase().includes(q) ||
        e.entry_number?.toLowerCase().includes(q) ||
        e.objects?.description?.toLowerCase().includes(q) ||
        e.objects?.medium?.toLowerCase().includes(q) ||
        e.objects?.physical_materials?.toLowerCase().includes(q) ||
        e.objects?.artist?.toLowerCase().includes(q) ||
        e.objects?.maker_name?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.objects?.title || a.object_description || '').localeCompare(b.objects?.title || b.object_description || '')
      if (sortBy === 'date_added') return (b.objects?.created_at || '').localeCompare(a.objects?.created_at || '')
      if (sortBy === 'date_made') return (b.objects?.production_date || '').localeCompare(a.objects?.production_date || '')
      if (sortBy === 'insured_value') return (b.objects?.insured_value ?? 0) - (a.objects?.insured_value ?? 0)
      return 0
    })
  const acquired = entries.filter(e => e.outcome === 'Acquired').length
  const returned = entries.filter(e => e.outcome === 'Returned to depositor').length

  return (
    <DashboardShell museum={museum} activePath="/dashboard/entry" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Object Entry Register</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Entries', value: entries.length },
              ...(fullMode ? [
                { label: 'Pending Outcome', value: pending },
                { label: 'Acquired', value: acquired },
                { label: 'Returned', value: returned },
              ] : []),
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Pending Outcome' && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Object usage bar + action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {(() => {
              const planInfo = getPlan(museum?.plan)
              const limit = planInfo.objects
              if (limit === null) return <div className="flex-1" />
              const count = objects.length
              const pct = Math.min(100, Math.round((count / limit) * 100))
              const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-stone-400 dark:bg-stone-500'
              const textColor = pct >= 95 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
              return (
                <div className="w-full sm:flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Collection usage</span>
                      <span className={`text-xs font-mono ${textColor}`}>{count.toLocaleString()} / {limit.toLocaleString()} objects</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {pct >= 80 && (
                    <button
                      onClick={() => router.push('/dashboard/plan')}
                      className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors"
                    >
                      Upgrade →
                    </button>
                  )}
                </div>
              )
            })()}
            {canEdit && (
              <div className="flex gap-2 shrink-0">
                {getPlan(museum?.plan).fullMode && (
                  <button
                    onClick={() => setShowImport(true)}
                    className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                  >
                    Import CSV
                  </button>
                )}
                <button
                  onClick={() => setShowForm(v => !v)}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                >
                  {showForm ? 'Cancel' : '+ New Entry'}
                </button>
              </div>
            )}
          </div>


          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Entry details are edited on each object&apos;s page. Click an entry below to open it, or create a new object to begin.</p>
          </div>

          {/* Search */}
          <SearchFilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filters={filters} onFiltersChange={setFilters}
            sortBy={sortBy} onSortChange={setSortBy}
            isFullMode={fullMode}
            mediumOptions={mediumOptions} objectTypeOptions={objectTypeOptions} artistOptions={artistOptions}
            placeholder="Search entries…"
          />

          {/* New Entry Form */}
          {showForm && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">New Entry Record</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelCls}>Object Title <span className="text-red-400">*</span></label>
                  <input type="text" className={inputCls} placeholder="Name or title of the object" value={newEntry.object_title} onChange={e => setNewEntry(v => ({ ...v, object_title: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Entry Date <span className="text-red-400">*</span></label>
                  <input type="date" className={inputCls} value={newEntry.entry_date} onChange={e => setNewEntry(v => ({ ...v, entry_date: e.target.value }))} />
                </div>
                {fullMode && (
                  <div>
                    <label className={labelCls}>Entry Number</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder={(() => {
                        const year = new Date(newEntry.entry_date).getFullYear()
                        const yearEntries = entries.filter(e => e.entry_number?.startsWith(`EN-${year}-`))
                        return `EN-${year}-${String(yearEntries.length + 1).padStart(3, '0')} (auto)`
                      })()}
                      value={newEntry.entry_number}
                      onChange={e => setNewEntry(v => ({ ...v, entry_number: e.target.value }))}
                    />
                  </div>
                )}
                {trackDepositor && (
                  <div>
                    <label className={labelCls}>Donor Name <span className="text-red-400">*</span></label>
                    <input type="text" className={inputCls} placeholder="Name of donor" value={newEntry.depositor_name} onChange={e => setNewEntry(v => ({ ...v, depositor_name: e.target.value }))} />
                  </div>
                )}
                {trackDepositor && (
                  <div>
                    <label className={labelCls}>Donor Contact</label>
                    <input type="text" className={inputCls} placeholder="Email or phone" value={newEntry.depositor_contact} onChange={e => setNewEntry(v => ({ ...v, depositor_contact: e.target.value }))} />
                  </div>
                )}
                {trackDepositor && (
                  <div className="flex flex-col justify-end gap-2 pt-1">
                    <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input type="checkbox" checked={newEntry.gdpr_consent} onChange={e => setNewEntry(v => ({ ...v, gdpr_consent: e.target.checked }))} className="rounded border-stone-300 dark:border-stone-600 accent-stone-900" />
                      <span className="text-xs font-mono text-stone-500 dark:text-stone-400">GDPR consent obtained</span>
                    </label>
                    {newEntry.gdpr_consent && (
                      <div>
                        <label className={labelCls}>Consent Date</label>
                        <input type="date" className={inputCls} value={newEntry.gdpr_consent_date} onChange={e => setNewEntry(v => ({ ...v, gdpr_consent_date: e.target.value }))} />
                      </div>
                    )}
                  </div>
                )}
                {fullMode && (
                  <div>
                    <label className={labelCls}>Entry Reason <span className="text-red-400">*</span></label>
                    <select className={inputCls} value={newEntry.entry_reason} onChange={e => setNewEntry(v => ({ ...v, entry_reason: e.target.value }))}>
                      <option value="">Select reason…</option>
                      {ENTRY_REASONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Entry Method</label>
                  <select className={inputCls} value={newEntry.entry_method} onChange={e => setNewEntry(v => ({ ...v, entry_method: e.target.value }))}>
                    <option value="">Select method…</option>
                    {['In person', 'Courier', 'Post / carrier', 'Found in collection', 'Digital transfer'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                {trackDepositor && (
                  <div>
                    <label className={labelCls}>Entry By <span className="text-red-400">*</span></label>
                    <input type="text" className={inputCls} placeholder="Staff member name" value={newEntry.received_by} onChange={e => setNewEntry(v => ({ ...v, received_by: e.target.value }))} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={labelCls}>Object Description <span className="text-red-400">*</span></label>
                  <textarea className={inputCls} rows={2} placeholder="Brief description of the object(s)" value={newEntry.object_description} onChange={e => setNewEntry(v => ({ ...v, object_description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className={labelCls}>Object Count</label>
                    <input type="number" min={1} className={inputCls} value={newEntry.object_count} onChange={e => setNewEntry(v => ({ ...v, object_count: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Object Number <span className="text-red-400">*</span></label>
                    <input type="text" className={inputCls} placeholder="e.g. 2026.001" value={newEntry.accession_no} onChange={e => setNewEntry(v => ({ ...v, accession_no: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Condition Grade</label>
                    <select className={inputCls} value={newEntry.condition_grade} onChange={e => setNewEntry(v => ({ ...v, condition_grade: e.target.value }))}>
                      <option value="">— Select —</option>
                      {CONDITION_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleCreateEntry('stay')}
                  disabled={submitting}
                  className="text-sm font-mono border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording…' : 'Record Entry'}
                </button>
                {!getPlan(museum?.plan).fullMode && (
                  <button
                    onClick={() => handleCreateEntry('continue')}
                    disabled={submitting}
                    className="text-sm font-mono bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded px-4 py-2 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Recording…' : 'Record & Add Details →'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          {entries.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🗂</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No entry records yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Record every object that comes into your care, before any decision is made.</p>
              {canEdit && (
                <button
                  onClick={() => setShowForm(true)}
                  className="text-sm font-mono text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  + New Entry
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Entry No.</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    {trackDepositor && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Donor</th>}
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Entry Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Objects</th>
                    {trackDepositor && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Entry By</th>}
                    {fullMode && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Outcome</th>}
                    {!simple && trackDepositor && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Receipt</th>}
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(e => (
                    <tr key={e.id}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${e.objects?.deleted_at ? 'cursor-default' : 'cursor-pointer'}`}
                      onClick={() => {
                        if (e.objects?.deleted_at) return
                        if (e.object_id) { router.push(`/dashboard/objects/${e.object_id}`); return }
                        if (canEdit) handlePromote(e)
                      }}
                    >
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{e.entry_number}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {new Date(e.entry_date + 'T00:00:00').toLocaleDateString('en-GB')}
                      </td>
                      {trackDepositor && (
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{e.depositor_name}</div>
                          {e.objects && <div className="text-xs text-stone-400 dark:text-stone-500">{e.objects.accession_no || e.objects.title}</div>}
                        </td>
                      )}
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{e.entry_reason}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{e.object_count}</td>
                      {trackDepositor && <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{e.received_by}</td>}
                      {fullMode && (
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${OUTCOME_STYLES[e.outcome] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                            {e.outcome || 'Pending'}
                          </span>
                        </td>
                      )}
                      {!simple && trackDepositor && (
                        <td className="px-4 py-3">
                          {e.receipt_issued
                            ? <span className="text-xs font-mono text-emerald-600">✓ Issued</span>
                            : <span className="text-xs font-mono text-amber-600">Pending</span>
                          }
                        </td>
                      )}
                      <td className="px-4 py-3 text-right" onClick={ev => ev.stopPropagation()}>
                        {e.object_id && e.objects?.deleted_at ? (
                          <button
                            onClick={() => router.push('/dashboard/trash')}
                            className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                            title="This object has been moved to bin"
                          >
                            Removed — view bin →
                          </button>
                        ) : e.object_id ? (
                          (() => {
                            const incomplete = e.outcome === 'Pending' && !e.objects?.accession_no
                            return (
                              <span className={`text-xs font-mono ${incomplete ? 'text-amber-600' : 'text-stone-400 dark:text-stone-500'}`}>
                                {incomplete ? 'Incomplete →' : 'View object →'}
                              </span>
                            )
                          })()
                        ) : (
                          e.outcome === 'Acquired' && canEdit ? (
                            <button
                              onClick={() => handlePromote(e)}
                              className="text-xs font-mono text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              Create object →
                            </button>
                          ) : (
                            <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      {showImport && museum && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); window.location.reload() }}
        />
      )}
    </DashboardShell>
  )
}
