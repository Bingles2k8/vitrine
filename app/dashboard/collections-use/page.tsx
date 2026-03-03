'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

const USE_TYPES = ['Research', 'Exhibition', 'Education', 'Photography', 'Conservation study', 'Publication', 'Broadcast / media', 'Other']

const inputCls = "w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"

export default function CollectionsUsePage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    use_type: 'Research',
    requester_name: '',
    requester_org: '',
    request_date: new Date().toISOString().slice(0, 10),
    use_date_start: '',
    use_date_end: '',
    purpose: '',
    conditions: '',
    approved_by: '',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: records } = await supabase
        .from('collection_use_records')
        .select('*')
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setRecords(records || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/collections-use" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Use of Collections</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Use of Collections is an Institution feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track research requests, exhibition loans, educational use, and other access to your collections. Available on Institution and Enterprise plans.</p>
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

  const pending = records.filter(r => r.status === 'Pending')
  const inUse = records.filter(r => r.status === 'In Use')
  const completed = records.filter(r => r.status === 'Completed')

  async function generateReference() {
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('collection_use_records')
      .select('*', { count: 'exact', head: true })
      .eq('museum_id', museum.id)
      .ilike('reference', `CU-${year}-%`)
    const num = (count || 0) + 1
    return `CU-${year}-${String(num).padStart(3, '0')}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canEdit) return
    setSaving(true)
    const reference = await generateReference()
    const { data, error } = await supabase
      .from('collection_use_records')
      .insert({
        museum_id: museum.id,
        reference,
        use_type: form.use_type,
        requester_name: form.requester_name,
        requester_org: form.requester_org,
        request_date: form.request_date,
        use_date_start: form.use_date_start || null,
        use_date_end: form.use_date_end || null,
        purpose: form.purpose || null,
        conditions: form.conditions || null,
        approved_by: form.approved_by || null,
        notes: form.notes || null,
        status: 'Pending',
      })
      .select()
      .single()
    if (!error && data) {
      setRecords([data, ...records])
      setForm({
        use_type: 'Research',
        requester_name: '',
        requester_org: '',
        request_date: new Date().toISOString().slice(0, 10),
        use_date_start: '',
        use_date_end: '',
        purpose: '',
        conditions: '',
        approved_by: '',
        notes: '',
      })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('collection_use_records')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setRecords(records.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  function statusBadge(status: string) {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
      case 'Approved': return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
      case 'In Use': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      case 'Completed': return 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
      default: return 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
    }
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/collections-use" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Use of Collections</span>
          {canEdit && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
            >
              {showForm ? 'Cancel' : '+ New record'}
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: records.length },
              { label: 'Pending', value: pending.length },
              { label: 'In Use', value: inUse.length },
              { label: 'Completed', value: completed.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Use of collections records track research requests, exhibition loans, educational use, and other access. Create records from this page.</p>
          </div>

          {/* Form */}
          {showForm && canEdit && (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <h3 className="font-serif text-lg italic text-stone-900 dark:text-stone-100 mb-2">New Use of Collections Record</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Use Type *</label>
                  <select
                    value={form.use_type}
                    onChange={e => setForm({ ...form, use_type: e.target.value })}
                    className={inputCls}
                    required
                  >
                    {USE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Requester Name *</label>
                  <input
                    type="text"
                    value={form.requester_name}
                    onChange={e => setForm({ ...form, requester_name: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Requester Organisation</label>
                  <input
                    type="text"
                    value={form.requester_org}
                    onChange={e => setForm({ ...form, requester_org: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Request Date *</label>
                  <input
                    type="date"
                    value={form.request_date}
                    onChange={e => setForm({ ...form, request_date: e.target.value })}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Use Date Start</label>
                  <input
                    type="date"
                    value={form.use_date_start}
                    onChange={e => setForm({ ...form, use_date_start: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Use Date End</label>
                  <input
                    type="date"
                    value={form.use_date_end}
                    onChange={e => setForm({ ...form, use_date_end: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Purpose</label>
                <textarea
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  className={inputCls}
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Conditions</label>
                <textarea
                  value={form.conditions}
                  onChange={e => setForm({ ...form, conditions: e.target.value })}
                  className={inputCls}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Approved By</label>
                  <input
                    type="text"
                    value={form.approved_by}
                    onChange={e => setForm({ ...form, approved_by: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className={inputCls}
                  rows={2}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Create record'}
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          {records.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📋</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No use of collections records yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Create your first record to track research requests, loans, and other access.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Reference</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Requester</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800">
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{r.reference}</td>
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{r.use_type}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.requester_name}</div>
                        {r.requester_org && <div className="text-xs text-stone-400 dark:text-stone-500">{r.requester_org}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {r.use_date_start
                          ? <>
                              {new Date(r.use_date_start + 'T00:00:00').toLocaleDateString('en-GB')}
                              {r.use_date_end && <> — {new Date(r.use_date_end + 'T00:00:00').toLocaleDateString('en-GB')}</>}
                            </>
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${statusBadge(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div className="flex gap-2">
                            {r.status === 'Pending' && (
                              <button
                                onClick={() => updateStatus(r.id, 'Approved')}
                                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Approve
                              </button>
                            )}
                            {r.status === 'Approved' && (
                              <button
                                onClick={() => updateStatus(r.id, 'In Use')}
                                className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                Start Use
                              </button>
                            )}
                            {r.status === 'In Use' && (
                              <button
                                onClick={() => updateStatus(r.id, 'Completed')}
                                className="text-xs font-mono text-stone-600 dark:text-stone-400 hover:underline"
                              >
                                Complete
                              </button>
                            )}
                          </div>
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
