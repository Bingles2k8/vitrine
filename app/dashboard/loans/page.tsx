'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { inputCls, labelCls, ENTRY_REASONS } from '@/components/tabs/shared'

const defaultEntry = () => ({
  entry_date: new Date().toISOString().slice(0, 10),
  depositor_name: '',
  depositor_contact: '',
  entry_reason: '',
  object_description: '',
  object_count: 1,
  received_by: '',
  entry_method: '',
  condition_on_entry: '',
  accession_no: '',
})

export default function LoansPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Out' | 'In' | 'Overdue'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newEntry, setNewEntry] = useState(defaultEntry)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: loans } = await supabase
        .from('loans')
        .select('*, artifacts(title, accession_no, emoji)')
        .eq('museum_id', museum.id)
        .order('loan_end_date', { ascending: true, nullsFirst: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setLoans(loans || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleCreateEntry() {
    const { entry_date, depositor_name, entry_reason, object_description, received_by } = newEntry
    if (!entry_date || !depositor_name || !entry_reason || !object_description || !received_by) {
      toast('Please fill in all required fields.', 'error')
      return
    }
    setSubmitting(true)
    const year = new Date(entry_date).getFullYear()
    const { count } = await supabase
      .from('entry_records')
      .select('*', { count: 'exact', head: true })
      .eq('museum_id', museum.id)
      .ilike('entry_number', `EN-${year}-%`)
    const entryNumber = `EN-${year}-${String((count || 0) + 1).padStart(3, '0')}`
    const { data: created, error } = await supabase.from('entry_records').insert({
      museum_id: museum.id,
      entry_number: entryNumber,
      entry_date: newEntry.entry_date,
      depositor_name: newEntry.depositor_name,
      depositor_contact: newEntry.depositor_contact || null,
      entry_reason: newEntry.entry_reason,
      object_description: newEntry.object_description,
      object_count: newEntry.object_count,
      received_by: newEntry.received_by,
      entry_method: newEntry.entry_method || null,
      condition_on_entry: newEntry.condition_on_entry || null,
      outcome: 'Pending',
    }).select('id').single()
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    const { data: newArtifact, error: artifactError } = await supabase.from('artifacts').insert({
      museum_id: museum.id,
      title: newEntry.object_description,
      acquisition_source: newEntry.depositor_name,
      acquisition_source_contact: newEntry.depositor_contact || null,
      acquisition_object_count: newEntry.object_count,
      accession_no: newEntry.accession_no || null,
      status: 'Entry',
      emoji: '🖼️',
    }).select('id').single()
    if (artifactError) { toast(artifactError.message, 'error'); setSubmitting(false); return }
    await supabase.from('entry_records').update({ artifact_id: newArtifact.id }).eq('id', created.id)
    router.push(`/dashboard/artifacts/${newArtifact.id}?tab=loans&direction=In`)
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/loans" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/loans" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Loans Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Loans Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track incoming and outgoing loans with full audit trails. Available on Professional, Institution, and Enterprise plans.</p>
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

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (l: any) => l.status === 'Active' && l.loan_end_date && l.loan_end_date < today

  const active = loans.filter(l => l.status === 'Active')
  const activeOut = active.filter(l => l.direction === 'Out')
  const activeIn = active.filter(l => l.direction === 'In')
  const overdue = active.filter(isOverdue)
  const returnedThisYear = loans.filter(l => l.status === 'Returned' && l.loan_end_date?.startsWith(new Date().getFullYear().toString()))

  const q = searchQuery.trim().toLowerCase()
  const filtered = loans.filter(l => {
    if (filter === 'Out' && !(l.direction === 'Out' && l.status === 'Active')) return false
    if (filter === 'In' && !(l.direction === 'In' && l.status === 'Active')) return false
    if (filter === 'Overdue' && !isOverdue(l)) return false
    if (!q) return true
    return (
      l.artifacts?.title?.toLowerCase().includes(q) ||
      l.artifacts?.accession_no?.toLowerCase().includes(q) ||
      l.borrowing_institution?.toLowerCase().includes(q)
    )
  })

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  return (
    <DashboardShell museum={museum} activePath="/dashboard/loans" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Loans Register</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Loans Out', value: activeOut.length },
              { label: 'Active Loans In', value: activeIn.length },
              { label: 'Overdue', value: overdue.length },
              { label: 'Returned This Year', value: returnedThisYear.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Overdue' && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters + New loan in */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {(['All', 'Out', 'In', 'Overdue'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                  {f === 'All' ? 'All Loans' : f === 'Out' ? 'Loans Out' : f === 'In' ? 'Loans In' : 'Overdue'}
                </button>
              ))}
            </div>
            {canEdit && (
              <button
                onClick={() => { setShowForm(v => !v); setNewEntry(defaultEntry()) }}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                {showForm ? 'Cancel' : '+ New loan in'}
              </button>
            )}
          </div>

          {/* New Loan In Form */}
          {showForm && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">New Entry Record — Loan In</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Entry Date <span className="text-red-400">*</span></label>
                  <input type="date" className={inputCls} value={newEntry.entry_date} onChange={e => setNewEntry(v => ({ ...v, entry_date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Depositor Name <span className="text-red-400">*</span></label>
                  <input type="text" className={inputCls} placeholder="Name of depositor" value={newEntry.depositor_name} onChange={e => setNewEntry(v => ({ ...v, depositor_name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Depositor Contact</label>
                  <input type="text" className={inputCls} placeholder="Email or phone" value={newEntry.depositor_contact} onChange={e => setNewEntry(v => ({ ...v, depositor_contact: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Entry Reason <span className="text-red-400">*</span></label>
                  <select className={inputCls} value={newEntry.entry_reason} onChange={e => setNewEntry(v => ({ ...v, entry_reason: e.target.value }))}>
                    <option value="">Select reason…</option>
                    {ENTRY_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Entry Method</label>
                  <select className={inputCls} value={newEntry.entry_method} onChange={e => setNewEntry(v => ({ ...v, entry_method: e.target.value }))}>
                    <option value="">Select method…</option>
                    {['In person', 'Courier', 'Post / carrier', 'Found in collection', 'Digital transfer'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Received By <span className="text-red-400">*</span></label>
                  <input type="text" className={inputCls} placeholder="Staff member name" value={newEntry.received_by} onChange={e => setNewEntry(v => ({ ...v, received_by: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Object Description <span className="text-red-400">*</span></label>
                  <textarea className={inputCls} rows={2} placeholder="Brief description of the object(s)" value={newEntry.object_description} onChange={e => setNewEntry(v => ({ ...v, object_description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className={labelCls}>Object Count</label>
                    <input type="number" min={1} className={inputCls} value={newEntry.object_count} onChange={e => setNewEntry(v => ({ ...v, object_count: parseInt(e.target.value) || 1 }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Condition on Entry</label>
                    <input type="text" className={inputCls} placeholder="e.g. Good" value={newEntry.condition_on_entry} onChange={e => setNewEntry(v => ({ ...v, condition_on_entry: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Object Number</label>
                    <input type="text" className={inputCls} placeholder="e.g. 2026.001" value={newEntry.accession_no} onChange={e => setNewEntry(v => ({ ...v, accession_no: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreateEntry}
                  disabled={submitting}
                  className="text-sm font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded px-4 py-2 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording…' : 'Record & add loan details →'}
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by object name, accession number, or institution…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⇄</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No loans recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Open an object and go to the Loans tab to record a loan.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Institution</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Direction</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Start</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Return</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const overdueLoan = isOverdue(l)
                    return (
                      <tr key={l.id} className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${overdueLoan ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{l.artifacts?.emoji}</div>
                            <div>
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{l.artifacts?.title}</div>
                              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{l.artifacts?.accession_no}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{l.borrowing_institution}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">Loan {l.direction}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                          {l.loan_start_date ? new Date(l.loan_start_date).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {l.loan_end_date ? (
                            <span className={overdueLoan ? 'text-amber-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                              {new Date(l.loan_end_date).toLocaleDateString('en-GB')}
                              {overdueLoan && ' ⚠'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                            l.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                            l.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                            'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                          }`}>{l.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => router.push(`/dashboard/artifacts/${l.artifact_id}?tab=loans`)}
                            className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                          >
                            View →
                          </button>
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
