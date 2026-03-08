'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { useToast } from '@/components/Toast'
import { CardGridSkeleton, TableSkeleton } from '@/components/Skeleton'
import { inputCls, labelCls, ENTRY_REASONS } from '@/components/tabs/shared'

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
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
  const [newEntry, setNewEntry] = useState(defaultEntry)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUserId(user.id)
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      try {
        const [{ data: entries }, { data: artifacts }] = await Promise.all([
          supabase.from('entry_records').select('*, artifacts(title, accession_no, deleted_at)').eq('museum_id', museum.id).order('entry_date', { ascending: false }),
          supabase.from('artifacts').select('id, title, accession_no').eq('museum_id', museum.id).is('deleted_at', null).order('title'),
        ])
        setMuseum(museum)
        setIsOwner(isOwner)
        setStaffAccess(staffAccess)
        setEntries(entries || [])
        setArtifacts(artifacts || [])
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
    const limit = planInfo.artifacts
    if (limit !== null) {
      const { count } = await supabase
        .from('artifacts').select('*', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
        .is('deleted_at', null)
      if (count !== null && count >= limit) {
        toast(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`, 'error')
        return
      }
    }
    const { data: newArtifact, error: createError } = await supabase.from('artifacts').insert({
      museum_id: museum.id,
      title: entry.object_description,
      acquisition_source: entry.depositor_name,
      acquisition_source_contact: entry.depositor_contact,
      acquisition_object_count: entry.object_count,
      status: 'Entry',
      emoji: '🖼️',
    }).select('id').single()

    if (createError) { toast(createError.message, 'error'); return }

    const { error: updateError } = await supabase.from('entry_records').update({ artifact_id: newArtifact.id }).eq('id', entry.id)
    if (updateError) { toast(updateError.message, 'error'); return }

    setEntries(entries.map(e => e.id === entry.id ? { ...e, artifact_id: newArtifact.id } : e))
    router.push(`/dashboard/artifacts/${newArtifact.id}?tab=entry`)
  }

  async function handleCreateEntry(mode: 'stay' | 'continue') {
    const { entry_date, depositor_name, entry_reason, object_description, received_by } = newEntry
    if (!entry_date || !depositor_name || !entry_reason || !object_description || !received_by) {
      toast('Please fill in all required fields.', 'error')
      return
    }
    // Check plan limits
    const planInfo = getPlan(museum?.plan)
    const limit = planInfo.artifacts
    if (limit !== null) {
      const { count } = await supabase.from('artifacts').select('*', { count: 'exact', head: true }).eq('museum_id', museum.id).is('deleted_at', null)
      if (count !== null && count >= limit) {
        toast(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`, 'error')
        return
      }
    }
    setSubmitting(true)
    const year = new Date(entry_date).getFullYear()
    const yearEntries = entries.filter(e => e.entry_number?.startsWith(`EN-${year}-`))
    const entryNumber = `EN-${year}-${String(yearEntries.length + 1).padStart(3, '0')}`
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
    }).select('*').single()
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    // Create the artifact
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
    if (mode === 'continue') {
      router.push(`/dashboard/artifacts/${newArtifact.id}`)
    } else {
      setEntries([{ ...created, artifact_id: newArtifact.id, artifacts: { title: newEntry.object_description, accession_no: newEntry.accession_no || null, deleted_at: null } }, ...entries])
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
  const pending = entries.filter(e => e.outcome === 'Pending').length
  const acquired = entries.filter(e => e.outcome === 'Acquired').length
  const returned = entries.filter(e => e.outcome === 'Returned to depositor').length

  return (
    <DashboardShell museum={museum} activePath="/dashboard/entry" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Object Entry Register</span>
          {canEdit && (
            <button
              onClick={() => setShowForm(v => !v)}
              className="text-sm font-mono text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              {showForm ? 'Cancel' : '+ New Entry'}
            </button>
          )}
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Entries', value: entries.length },
              { label: 'Pending Outcome', value: pending },
              { label: 'Acquired', value: acquired },
              { label: 'Returned', value: returned },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Pending Outcome' && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Artifact usage bar */}
          {(() => {
            const planInfo = getPlan(museum?.plan)
            const limit = planInfo.artifacts
            if (limit === null) return null
            const count = artifacts.length
            const pct = Math.min(100, Math.round((count / limit) * 100))
            const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-stone-400 dark:bg-stone-500'
            const textColor = pct >= 95 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
            return (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3 flex items-center gap-4">
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


          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Entry details are edited on each object&apos;s page. Click an entry below to open it, or create a new object to begin.</p>
          </div>

          {/* New Entry Form */}
          {showForm && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">New Entry Record</div>
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
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleCreateEntry('stay')}
                  disabled={submitting}
                  className="text-sm font-mono border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded px-4 py-2 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording…' : 'Record Entry'}
                </button>
                <button
                  onClick={() => handleCreateEntry('continue')}
                  disabled={submitting}
                  className="text-sm font-mono bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded px-4 py-2 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording…' : 'Record & Add Details →'}
                </button>
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
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Depositor</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Entry Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Objects</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Received By</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Outcome</th>
                    {!simple && <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Receipt</th>}
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${e.artifact_id && !e.artifacts?.deleted_at ? 'cursor-pointer' : 'cursor-default'}`}
                      onClick={() => {
                        if (e.artifact_id && !e.artifacts?.deleted_at) router.push(`/dashboard/artifacts/${e.artifact_id}`)
                      }}
                    >
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{e.entry_number}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {new Date(e.entry_date + 'T00:00:00').toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{e.depositor_name}</div>
                        {e.artifacts && <div className="text-xs text-stone-400 dark:text-stone-500">{e.artifacts.accession_no || e.artifacts.title}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{e.entry_reason}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{e.object_count}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{e.received_by}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${OUTCOME_STYLES[e.outcome] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                          {e.outcome || 'Pending'}
                        </span>
                      </td>
                      {!simple && (
                        <td className="px-4 py-3">
                          {e.receipt_issued
                            ? <span className="text-xs font-mono text-emerald-600">✓ Issued</span>
                            : <span className="text-xs font-mono text-amber-600">Pending</span>
                          }
                        </td>
                      )}
                      <td className="px-4 py-3 text-right" onClick={ev => ev.stopPropagation()}>
                        {e.artifact_id && e.artifacts?.deleted_at ? (
                          <button
                            onClick={() => router.push('/dashboard/trash')}
                            className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors"
                            title="This object has been moved to trash"
                          >
                            Removed — view trash →
                          </button>
                        ) : e.artifact_id ? (
                          (() => {
                            const incomplete = e.outcome === 'Pending' && !e.artifacts?.accession_no
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
    </DashboardShell>
  )
}
