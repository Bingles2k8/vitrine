'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'
import SearchFilterBar, { FilterState, EMPTY_FILTERS, SortBy } from '@/components/SearchFilterBar'
import { inputCls, labelCls, sectionTitle, RISK_TYPES, RISK_SEVERITIES, RISK_LIKELIHOODS } from '@/components/tabs/shared'

const OBJECTS_SELECT = '*, objects(title, accession_no, emoji, description, medium, physical_materials, artist, maker_name, object_type, status, created_at, production_date, acquisition_method, accession_register_confirmed)'
const BLANK_RISK_FORM = { risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' }

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  High:     'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Medium:   'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Low:      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}

const STATUS_STYLES: Record<string, string> = {
  Open:      'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Mitigated: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  Closed:    'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

export default function RiskPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Open' | 'Mitigated' | 'Closed'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [riskForm, setRiskForm] = useState({ ...BLANK_RISK_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: risks } = await supabase
        .from('risk_register')
        .select(OBJECTS_SELECT)
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setRisks(risks || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function addCollectionRisk() {
    if (!riskForm.risk_type || !riskForm.description || submitting || !museum) return
    setSubmitting(true)
    setFormError(null)
    const { data, error } = await supabase
      .from('risk_register')
      .insert({
        ...riskForm,
        review_date: riskForm.review_date || null,
        object_id: null,
        museum_id: museum.id,
      })
      .select(OBJECTS_SELECT)
      .single()
    if (error) { setFormError(error.message); setSubmitting(false); return }
    setRisks(prev => [data, ...prev])
    setRiskForm({ ...BLANK_RISK_FORM })
    setShowAddForm(false)
    setSubmitting(false)
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  // Collection-wide risks (object_id null) have no object page to click through
  // to, so without these they could never be progressed or removed — they sat
  // at Open forever, inflating the Open Risks and Due for Review stats (B4).
  async function updateCollectionRiskStatus(id: string, status: string) {
    const { error } = await supabase.from('risk_register').update({ status }).eq('id', id)
    if (error) { setFormError(error.message); return }
    setRisks(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  async function deleteCollectionRisk(id: string) {
    if (!confirm('Delete this collection-wide risk? This cannot be undone.')) return
    const { error } = await supabase.from('risk_register').delete().eq('id', id)
    if (error) { setFormError(error.message); return }
    setRisks(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/risk" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/risk" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Risk Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Risk Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Identify and manage risks to your collection. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-xs font-mono px-5 py-2.5 rounded transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  const openRisks = risks.filter(r => r.status === 'Open')
  const criticalOpen = risks.filter(r => r.severity === 'Critical' && r.status === 'Open')
  const dueForReview = risks.filter(r => r.status === 'Open' && r.review_date && r.review_date <= today)

  const mediumOptions = Array.from(new Set(risks.map(r => r.objects?.medium).filter(Boolean))).sort() as string[]
  const objectTypeOptions = Array.from(new Set(risks.map(r => r.objects?.object_type).filter(Boolean))).sort() as string[]
  const artistOptions = [] as string[]

  const q = searchQuery.trim().toLowerCase()
  const filtered = risks
    .filter(r => {
      if (filter !== 'All' && r.status !== filter) return false
      if (filters.dateFrom && (r.created_at || '') < filters.dateFrom) return false
      if (filters.dateTo && (r.created_at || '') > filters.dateTo + 'T23:59:59') return false
      if (filters.medium && r.objects?.medium !== filters.medium) return false
      if (filters.objectType && r.objects?.object_type !== filters.objectType) return false
      if (filters.status && r.objects?.status !== filters.status) return false
      if (filters.accessionStatus === 'confirmed' && !r.objects?.accession_register_confirmed) return false
      if (filters.accessionStatus === 'unconfirmed' && r.objects?.accession_register_confirmed) return false
      if (filters.acquisitionMethod && r.objects?.acquisition_method !== filters.acquisitionMethod) return false
      if (!q) return true
      return (
        r.objects?.title?.toLowerCase().includes(q) ||
        r.objects?.accession_no?.toLowerCase().includes(q) ||
        r.objects?.description?.toLowerCase().includes(q) ||
        r.objects?.medium?.toLowerCase().includes(q) ||
        r.objects?.physical_materials?.toLowerCase().includes(q) ||
        r.objects?.artist?.toLowerCase().includes(q) ||
        r.objects?.maker_name?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.objects?.title || '').localeCompare(b.objects?.title || '')
      if (sortBy === 'date_added') return (b.objects?.created_at || '').localeCompare(a.objects?.created_at || '')
      if (sortBy === 'date_made') return (b.objects?.production_date || '').localeCompare(a.objects?.production_date || '')
      return 0
    })

  return (
    <DashboardShell museum={museum} activePath="/dashboard/risk" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Risk Register</span>
          <button
            type="button"
            onClick={() => { setShowAddForm(v => !v); setFormError(null) }}
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-xs font-mono px-4 py-2 rounded transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add collection-wide risk'}
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Open Risks', learn: 'register.risk.open_risks', value: openRisks.length, warn: openRisks.length > 0 },
              { label: 'Critical Severity', learn: 'register.risk.critical_severity', value: criticalOpen.length, warn: criticalOpen.length > 0 },
              { label: 'Due for Review', learn: 'register.risk.due_review', value: dueForReview.length, warn: dueForReview.length > 0 },
            ].map(s => (
              <div key={s.label} data-learn={s.learn} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Object-level risks are added and managed on each object&apos;s page under the Risk tab. Use &ldquo;Add collection-wide risk&rdquo; above to record risks affecting the whole collection (e.g. fire, flood, theft). Click an object-linked risk below to view it.</p>
          </div>

          {/* Add collection-wide risk form */}
          {showAddForm && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className={sectionTitle}>Add Collection-wide Risk</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Risk Type <span className="text-red-400">*</span></label>
                  <select value={riskForm.risk_type} onChange={e => setRiskForm(f => ({ ...f, risk_type: e.target.value }))} className={inputCls}>
                    <option value="">Select type…</option>
                    {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Responsible Person</label>
                  <input value={riskForm.responsible_person} onChange={e => setRiskForm(f => ({ ...f, responsible_person: e.target.value }))} placeholder="Name" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description <span className="text-red-400">*</span></label>
                <textarea value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the risk…" className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Severity</label>
                  <select value={riskForm.severity} onChange={e => setRiskForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                    {RISK_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Likelihood</label>
                  <select value={riskForm.likelihood} onChange={e => setRiskForm(f => ({ ...f, likelihood: e.target.value }))} className={inputCls}>
                    {RISK_LIKELIHOODS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Review Date</label>
                  <input type="date" value={riskForm.review_date} onChange={e => setRiskForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mitigation</label>
                <textarea value={riskForm.mitigation} onChange={e => setRiskForm(f => ({ ...f, mitigation: e.target.value }))} rows={2} placeholder="Steps taken or planned to mitigate…" className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={riskForm.notes} onChange={e => setRiskForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
              </div>
              {formError && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded px-4 py-2.5">
                  <p className="text-xs text-red-700 dark:text-red-400">{formError}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button type="button" onClick={addCollectionRisk} disabled={!riskForm.risk_type || !riskForm.description || submitting}
                  className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Add risk →'}
                </button>
                <button type="button" onClick={() => { setShowAddForm(false); setRiskForm({ ...BLANK_RISK_FORM }); setFormError(null) }}
                  className="text-sm font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 px-3 py-2.5 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Open', 'Mitigated', 'Closed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Risks' : f}
              </button>
            ))}
          </div>

          {/* Search */}
          <SearchFilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filters={filters} onFiltersChange={setFilters}
            sortBy={sortBy} onSortChange={setSortBy}
            isFullMode={true}
            mediumOptions={mediumOptions} objectTypeOptions={objectTypeOptions} artistOptions={artistOptions}
            placeholder="Search objects…"
          />

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⚑</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No risks recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Add risks from each object&apos;s Risk tab.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Risk</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Linked Object</th>
                    <th data-learn="risk.severity" className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Severity</th>
                    <th data-learn="risk.likelihood" className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Likelihood</th>
                    <th data-learn="risk.review_date" className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Review Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Status</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const overdue = r.review_date && r.review_date <= today && r.status === 'Open'
                    return (
                      <tr key={r.id}
                        className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${r.object_id ? 'cursor-pointer' : ''} ${overdue ? 'bg-amber-50/20' : ''}`}
                        onClick={() => r.object_id && router.push(`/dashboard/objects/${r.object_id}?tab=risk`)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.risk_type}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                        </td>
                        <td className="px-4 py-4">
                          {r.objects ? (
                            <div className="flex items-center gap-2">
                              <span className="text-base">{r.objects.emoji}</span>
                              <div>
                                <div className="text-xs font-medium text-stone-900 dark:text-stone-100">{r.objects.title}</div>
                                <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{r.objects.accession_no}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-400 dark:text-stone-500 italic">Collection-wide</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.Medium}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-stone-500 dark:text-stone-400">{r.likelihood}</td>
                        <td className="px-4 py-4 text-xs font-mono">
                          {r.review_date ? (
                            <span className={overdue ? 'text-amber-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                              {new Date(r.review_date).toLocaleDateString('en-GB')}
                              {overdue && ' ⚠'}
                            </span>
                          ) : <span className="text-stone-400 dark:text-stone-500">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[r.status] || STATUS_STYLES.Open}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                          {/* Object risks are managed on the object's Risk tab, which this
                              row clicks through to. Collection-wide risks have no such page. */}
                          {!r.object_id && canEdit && (
                            <div className="flex items-center gap-3">
                              {r.status === 'Open' && <button type="button" onClick={() => updateCollectionRiskStatus(r.id, 'Mitigated')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Mitigated</button>}
                              {r.status !== 'Closed' && <button type="button" onClick={() => updateCollectionRiskStatus(r.id, 'Closed')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Close</button>}
                              {r.status === 'Closed' && <button type="button" onClick={() => updateCollectionRiskStatus(r.id, 'Open')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Reopen</button>}
                              <button type="button" onClick={() => deleteCollectionRisk(r.id)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
