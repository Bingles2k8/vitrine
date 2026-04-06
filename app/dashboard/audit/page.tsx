'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'
const AUDIT_METHODS = ['Physical inspection', 'Barcode scan', 'RFID', 'Spot-check', 'Full audit', 'Other']
const AUDIT_STATUSES = ['In Progress', 'Completed', 'Paused', 'Cancelled']

export default function AuditPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [specificSearch, setSpecificSearch] = useState(false)
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [savingExercise, setSavingExercise] = useState(false)
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  const [exerciseRecords, setExerciseRecords] = useState<any[]>([])
  const [exerciseRecordsLoading, setExerciseRecordsLoading] = useState(false)
  const [exerciseFilter, setExerciseFilter] = useState<'all' | 'found' | 'not_found' | 'discrepancy'>('all')
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({})
  const [exerciseIssueCounts, setExerciseIssueCounts] = useState<Record<string, number>>({})
  const [exerciseForm, setExerciseForm] = useState({
    audit_reference: '', scope: '', method: '', auditor: '',
    date_started: new Date().toISOString().slice(0, 10), date_completed: '',
    objects_checked: '', objects_found: '', objects_not_found: '', discrepancies: '',
    actions_required: '', actions_completed: '', overall_audit_report: '',
    governance_reported: false, governance_report_date: '', status: 'In Progress', notes: '',
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const [{ data: objects }, { data: exercises }, { data: auditCounts }] = await Promise.all([
        supabase.from('objects')
          .select('id, title, accession_no, emoji, status, current_location, last_inventoried, inventoried_by, description, medium, physical_materials, artist, maker_name')
          .eq('museum_id', museum.id).is('deleted_at', null).neq('status', 'Deaccessioned')
          .order('last_inventoried', { ascending: true, nullsFirst: true }),
        supabase.from('audit_exercises')
          .select('*').eq('museum_id', museum.id)
          .order('date_started', { ascending: false }),
        supabase.from('audit_records')
          .select('exercise_id, inventory_outcome')
          .eq('museum_id', museum.id)
          .not('exercise_id', 'is', null),
      ])
      const counts: Record<string, number> = {}
      const issueCounts: Record<string, number> = {}
      for (const r of auditCounts || []) {
        counts[r.exercise_id] = (counts[r.exercise_id] || 0) + 1
        if (r.inventory_outcome === 'Not found' || r.inventory_outcome === 'Present — location differs') {
          issueCounts[r.exercise_id] = (issueCounts[r.exercise_id] || 0) + 1
        }
      }
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setObjects(objects || [])
      setExercises(exercises || [])
      setExerciseCounts(counts)
      setExerciseIssueCounts(issueCounts)
      setLoading(false)
    }
    load()
  }, [])

  async function openExercise(ex: any) {
    setSelectedExercise(ex)
    setExerciseFilter('all')
    setExerciseRecordsLoading(true)
    const { data } = await supabase
      .from('audit_records')
      .select('*, objects(id, title, emoji, accession_no, current_location)')
      .eq('exercise_id', ex.id)
      .order('inventoried_at', { ascending: false })
    setExerciseRecords(data || [])
    setExerciseRecordsLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/audit" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/audit" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Audit &amp; Inventory</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Audit &amp; Inventory is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Run collection audits and track inventory checks. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  async function saveExercise() {
    if (!exerciseForm.audit_reference.trim() || savingExercise) return
    setSavingExercise(true)
    const payload = {
      audit_reference: exerciseForm.audit_reference,
      scope: exerciseForm.scope || null,
      method: exerciseForm.method || null,
      auditor: exerciseForm.auditor || null,
      date_started: exerciseForm.date_started,
      date_completed: exerciseForm.date_completed || null,
      objects_checked: exerciseForm.objects_checked ? parseInt(exerciseForm.objects_checked) : 0,
      objects_found: exerciseForm.objects_found ? parseInt(exerciseForm.objects_found) : 0,
      objects_not_found: exerciseForm.objects_not_found ? parseInt(exerciseForm.objects_not_found) : 0,
      discrepancies: exerciseForm.discrepancies ? parseInt(exerciseForm.discrepancies) : 0,
      actions_required: exerciseForm.actions_required || null,
      actions_completed: exerciseForm.actions_completed || null,
      overall_audit_report: exerciseForm.overall_audit_report || null,
      governance_reported: exerciseForm.governance_reported,
      governance_report_date: exerciseForm.governance_reported && exerciseForm.governance_report_date ? exerciseForm.governance_report_date : null,
      status: exerciseForm.status,
      notes: exerciseForm.notes || null,
    }
    if (editingExerciseId) {
      const { data, error } = await supabase.from('audit_exercises').update(payload).eq('id', editingExerciseId).select().single()
      if (!error && data) {
        setExercises(exercises.map(ex => ex.id === editingExerciseId ? data : ex))
      }
    } else {
      const { data, error } = await supabase.from('audit_exercises').insert({ ...payload, museum_id: museum.id }).select().single()
      if (!error && data) {
        setExercises([data, ...exercises])
      }
    }
    setExerciseForm({
      audit_reference: '', scope: '', method: '', auditor: '',
      date_started: new Date().toISOString().slice(0, 10), date_completed: '',
      objects_checked: '', objects_found: '', objects_not_found: '', discrepancies: '',
      actions_required: '', actions_completed: '', overall_audit_report: '',
      governance_reported: false, governance_report_date: '', status: 'In Progress', notes: '',
    })
    setEditingExerciseId(null)
    setShowExerciseForm(false)
    setSavingExercise(false)
  }

  const today = new Date()
  const oneYearAgo = new Date(today); oneYearAgo.setFullYear(today.getFullYear() - 1)
  const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10)
  const thisYearStr = today.getFullYear().toString()

  const neverInventoried = objects.filter(a => !a.last_inventoried)
  const inventoriedThisYear = objects.filter(a => a.last_inventoried?.startsWith(thisYearStr))
  const overdue = objects.filter(a => a.last_inventoried && a.last_inventoried < oneYearAgoStr)

  const rawQ = searchQuery.trim()
  const isQuoted = rawQ.startsWith('"') && rawQ.endsWith('"') && rawQ.length > 2
  const isSpecific = specificSearch || isQuoted
  const q = isQuoted ? rawQ.slice(1, -1).toLowerCase() : rawQ.toLowerCase()
  const filteredObjects = objects.filter(a => {
    if (!q) return true
    if (isSpecific) return (
      a.title?.toLowerCase().includes(q) ||
      a.accession_no?.toLowerCase().includes(q)
    )
    return (
      a.title?.toLowerCase().includes(q) ||
      a.accession_no?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.medium?.toLowerCase().includes(q) ||
      a.physical_materials?.toLowerCase().includes(q) ||
      a.artist?.toLowerCase().includes(q) ||
      a.maker_name?.toLowerCase().includes(q)
    )
  })

  return (
    <DashboardShell museum={museum} activePath="/dashboard/audit" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Audit & Inventory</span>
          <button
            onClick={() => {
              const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
              const rows = [['Accession No', 'Title', 'Status', 'Location', 'Last Inventoried', 'Inventoried By'].join(',')]
              objects.forEach(a => rows.push([esc(a.accession_no), esc(a.title), esc(a.status), esc(a.current_location), esc(a.last_inventoried ? new Date(a.last_inventoried).toLocaleDateString('en-GB') : ''), esc(a.inventoried_by)].join(',')))
              const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const el = document.createElement('a')
              el.href = url; el.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`; el.click()
              URL.revokeObjectURL(url)
            }}
            className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded whitespace-nowrap shrink-0"
          >
            Export CSV
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Never Inventoried', value: neverInventoried.length, warn: neverInventoried.length > 0 },
              { label: 'Inventoried This Year', value: inventoriedThisYear.length, warn: false },
              { label: 'Overdue (> 12 months)', value: overdue.length, warn: overdue.length > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Audit Exercises — Spectrum 5.1 Proc 21 */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Audit Exercises</div>
              {canEdit && (
                <button onClick={() => { setShowExerciseForm(!showExerciseForm); setEditingExerciseId(null); setExerciseForm({ audit_reference: '', scope: '', method: '', auditor: '', date_started: new Date().toISOString().slice(0, 10), date_completed: '', objects_checked: '', objects_found: '', objects_not_found: '', discrepancies: '', actions_required: '', actions_completed: '', overall_audit_report: '', governance_reported: false, governance_report_date: '', status: 'In Progress', notes: '' }) }}
                  className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors">
                  {showExerciseForm ? 'Cancel' : '+ New exercise'}
                </button>
              )}
            </div>

            {showExerciseForm && canEdit && (
              <div className="p-6 border-b border-stone-100 dark:border-stone-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelCls}>Audit Reference *</label><input value={exerciseForm.audit_reference} onChange={e => setExerciseForm(f => ({ ...f, audit_reference: e.target.value }))} placeholder="e.g. AUD-2026-001" className={inputCls} /></div>
                  <div><label className={labelCls}>Auditor</label><input value={exerciseForm.auditor} onChange={e => setExerciseForm(f => ({ ...f, auditor: e.target.value }))} placeholder="Name or team" className={inputCls} /></div>
                </div>
                <div><label className={labelCls}>Scope</label><textarea rows={2} value={exerciseForm.scope} onChange={e => setExerciseForm(f => ({ ...f, scope: e.target.value }))} placeholder="Which part of the collection will be audited…" className={`${inputCls} resize-none`} /></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div><label className={labelCls}>Planned Start Date</label><input type="date" value={exerciseForm.date_started} onChange={e => setExerciseForm(f => ({ ...f, date_started: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Planned Completion Date</label><input type="date" value={exerciseForm.date_completed} onChange={e => setExerciseForm(f => ({ ...f, date_completed: e.target.value }))} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select value={exerciseForm.status} onChange={e => setExerciseForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                      {AUDIT_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className={labelCls}>Anticipated Actions</label><textarea rows={2} value={exerciseForm.actions_required} onChange={e => setExerciseForm(f => ({ ...f, actions_required: e.target.value }))} placeholder="Actions anticipated as a result of this audit…" className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Actions to be Completed</label><textarea rows={2} value={exerciseForm.actions_completed} onChange={e => setExerciseForm(f => ({ ...f, actions_completed: e.target.value }))} placeholder="Actions planned to be completed following the audit…" className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Audit Report (URL or reference)</label><input value={exerciseForm.overall_audit_report} onChange={e => setExerciseForm(f => ({ ...f, overall_audit_report: e.target.value }))} placeholder="Link to planned report or document reference…" className={inputCls} /></div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                    <input type="checkbox" checked={exerciseForm.governance_reported} onChange={e => setExerciseForm(f => ({ ...f, governance_reported: e.target.checked }))} className="rounded border-stone-300" />
                    Will be reported to governing body
                  </label>
                  {exerciseForm.governance_reported && (
                    <div className="flex-1 max-w-[200px]">
                      <input type="date" value={exerciseForm.governance_report_date} onChange={e => setExerciseForm(f => ({ ...f, governance_report_date: e.target.value }))} className={inputCls} />
                    </div>
                  )}
                </div>
                <div><label className={labelCls}>Notes</label><textarea rows={2} value={exerciseForm.notes} onChange={e => setExerciseForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} /></div>
                <div className="flex items-center gap-3">
                  <button onClick={saveExercise} disabled={!exerciseForm.audit_reference || savingExercise}
                    className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
                    {savingExercise ? 'Saving…' : editingExerciseId ? 'Save changes →' : 'Save audit exercise →'}
                  </button>
                  {editingExerciseId && exerciseForm.status !== 'Completed' && (
                    <button type="button" onClick={() => setExerciseForm(f => ({ ...f, status: 'Completed', date_completed: f.date_completed || new Date().toISOString().slice(0, 10) }))}
                      className="border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 text-sm font-mono px-6 py-2.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">
                      Mark as complete
                    </button>
                  )}
                </div>
              </div>
            )}

            {exercises.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-xs text-stone-400 dark:text-stone-500">No audit exercises recorded. Create one to track formal collection audits.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Reference</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Auditor</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Checked</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Not Found / Discrepancy</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {exercises.map(ex => (
                    <tr key={ex.id} onClick={() => openExercise(ex)} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer">
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{ex.audit_reference}</td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{ex.auditor || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{ex.date_started ? new Date(ex.date_started + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{exerciseCounts[ex.id] ?? 0}</td>
                      <td className="px-4 py-3">
                        {(exerciseIssueCounts[ex.id] ?? 0) > 0
                          ? <span className="text-xs font-mono text-amber-600 dark:text-amber-400">{exerciseIssueCounts[ex.id]}</span>
                          : <span className="text-xs font-mono text-stone-400">0</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${ex.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : ex.status === 'In Progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                          {ex.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500">Objects sorted by last inventoried date — never-inventoried items appear first. Best practice recommends annual inventory checks. Click any row to record an audit.</p>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search objects… or use "quotes" for specific search'
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs font-mono text-stone-500 dark:text-stone-400 cursor-pointer whitespace-nowrap select-none">
              <input type="checkbox" checked={specificSearch} onChange={e => setSpecificSearch(e.target.checked)} className="rounded border-stone-300 dark:border-stone-600 accent-stone-900" />
              Specific search
            </label>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Location</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Last Inventoried</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {filteredObjects.map(a => {
                  const isNever = !a.last_inventoried
                  const isOld = a.last_inventoried && a.last_inventoried < oneYearAgoStr

                  return (
                    <tr key={a.id} onClick={() => router.push(`/dashboard/objects/${a.id}?tab=location`)}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer ${isNever || isOld ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{a.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{a.title}</div>
                            <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{a.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-stone-500 dark:text-stone-400">{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{a.current_location || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {isNever ? (
                          <span className="text-amber-600">Never</span>
                        ) : isOld ? (
                          <span className="text-amber-600">{new Date(a.last_inventoried).toLocaleDateString('en-GB')} ⚠</span>
                        ) : (
                          <span className="text-stone-500 dark:text-stone-400">{new Date(a.last_inventoried).toLocaleDateString('en-GB')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{a.inventoried_by || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      {/* Exercise detail modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedExercise(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700 shrink-0">
              <div>
                <div className="font-serif text-xl italic text-stone-900 dark:text-stone-100">{selectedExercise.audit_reference}</div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {selectedExercise.auditor && <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{selectedExercise.auditor}</span>}
                  {selectedExercise.date_started && <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{new Date(selectedExercise.date_started + 'T00:00:00').toLocaleDateString('en-GB')}</span>}
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${selectedExercise.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : selectedExercise.status === 'In Progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>{selectedExercise.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                {canEdit && selectedExercise.status !== 'Completed' && (
                  <button type="button" onClick={async () => {
                    const today = new Date().toISOString().slice(0, 10)
                    const { data } = await supabase.from('audit_exercises').update({ status: 'Completed', date_completed: selectedExercise.date_completed || today }).eq('id', selectedExercise.id).select().single()
                    if (data) {
                      setExercises(exercises.map(ex => ex.id === data.id ? data : ex))
                      setSelectedExercise(data)
                    }
                  }} className="text-xs font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">
                    Mark as complete
                  </button>
                )}
                {canEdit && (
                  <button type="button" onClick={() => {
                    setExerciseForm({
                      audit_reference: selectedExercise.audit_reference || '',
                      scope: selectedExercise.scope || '',
                      method: selectedExercise.method || '',
                      auditor: selectedExercise.auditor || '',
                      date_started: selectedExercise.date_started || new Date().toISOString().slice(0, 10),
                      date_completed: selectedExercise.date_completed || '',
                      objects_checked: selectedExercise.objects_checked?.toString() || '',
                      objects_found: selectedExercise.objects_found?.toString() || '',
                      objects_not_found: selectedExercise.objects_not_found?.toString() || '',
                      discrepancies: selectedExercise.discrepancies?.toString() || '',
                      actions_required: selectedExercise.actions_required || '',
                      actions_completed: selectedExercise.actions_completed || '',
                      overall_audit_report: selectedExercise.overall_audit_report || '',
                      governance_reported: selectedExercise.governance_reported || false,
                      governance_report_date: selectedExercise.governance_report_date || '',
                      status: selectedExercise.status || 'In Progress',
                      notes: selectedExercise.notes || '',
                    })
                    setEditingExerciseId(selectedExercise.id)
                    setShowExerciseForm(true)
                    setSelectedExercise(null)
                  }} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors">
                    Edit
                  </button>
                )}
                <button type="button" onClick={() => setSelectedExercise(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none">×</button>
              </div>
            </div>

            {/* Live stats */}
            {!exerciseRecordsLoading && (
              <div className="grid grid-cols-3 gap-px bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 shrink-0">
                {[
                  { label: 'Checked', value: exerciseRecords.length },
                  { label: 'Present', value: exerciseRecords.filter(r => r.inventory_outcome === 'Present and correct' || r.inventory_outcome === 'Present — location differs').length },
                  { label: 'Not Found / Discrepancy', value: exerciseRecords.filter(r => r.inventory_outcome === 'Not found' || r.inventory_outcome === 'Present — location differs').length },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-stone-900 px-5 py-3 text-center">
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-0.5">{s.label}</div>
                    <div className="font-serif text-2xl text-stone-900 dark:text-stone-100">{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Scope / notes */}
            {(selectedExercise.scope || selectedExercise.notes) && (
              <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800 shrink-0 space-y-1">
                {selectedExercise.scope && <p className="text-xs text-stone-500 dark:text-stone-400"><span className="uppercase tracking-widest text-stone-300 dark:text-stone-600 mr-2">Scope</span>{selectedExercise.scope}</p>}
                {selectedExercise.notes && <p className="text-xs text-stone-500 dark:text-stone-400"><span className="uppercase tracking-widest text-stone-300 dark:text-stone-600 mr-2">Notes</span>{selectedExercise.notes}</p>}
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-1 px-6 py-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              {(['all', 'found', 'not_found', 'discrepancy'] as const).map(f => (
                <button key={f} type="button" onClick={() => setExerciseFilter(f)}
                  className={`px-3 py-1 rounded text-xs font-mono border transition-colors ${exerciseFilter === f ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-transparent' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                  {f === 'all' ? 'All' : f === 'found' ? 'Present' : f === 'not_found' ? 'Not Found' : 'Discrepancy'}
                </button>
              ))}
            </div>

            {/* Object list */}
            <div className="overflow-y-auto flex-1">
              {exerciseRecordsLoading ? (
                <div className="p-8 text-center text-xs text-stone-400">Loading…</div>
              ) : exerciseRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400 dark:text-stone-500">No audit records linked to this exercise yet.</div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Outcome</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Location Found</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exerciseRecords
                      .filter(r => {
                        if (exerciseFilter === 'all') return true
                        if (exerciseFilter === 'found') return r.inventory_outcome === 'Present and correct' || r.inventory_outcome === 'Present — location differs'
                        if (exerciseFilter === 'not_found') return r.inventory_outcome === 'Not found'
                        if (exerciseFilter === 'discrepancy') return r.inventory_outcome === 'Present — location differs'
                        return true
                      })
                      .map(r => {
                        const obj = r.objects as any
                        return (
                          <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
                            onClick={() => { setSelectedExercise(null); router.push(`/dashboard/objects/${obj?.id}?tab=location`) }}>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <span>{obj?.emoji}</span>
                                <div>
                                  <div className="text-sm text-stone-900 dark:text-stone-100">{obj?.title || '—'}</div>
                                  <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{obj?.accession_no}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(r.inventoried_at).toLocaleDateString('en-GB')}</td>
                            <td className="px-4 py-3">
                              {r.inventory_outcome ? (
                                <span className={`text-xs font-mono px-2 py-1 rounded-full ${r.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : r.inventory_outcome === 'Not found' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>
                                  {r.inventory_outcome}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.location_confirmed || '—'}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  )
}
