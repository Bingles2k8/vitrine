'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

const RISK_TYPES = ['Theft', 'Fire', 'Flood', 'Pest', 'Light damage', 'Handling damage', 'Environmental', 'Provenance', 'Legal', 'Other']
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const LIKELIHOODS = ['Low', 'Medium', 'High']

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

const EMPTY_FORM = {
  risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium',
  mitigation: '', review_date: '', responsible_person: '', notes: '',
}

export default function RiskPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Open' | 'Mitigated' | 'Closed'>('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
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
        .select('*, artifacts(title, accession_no, emoji)')
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

  async function addRisk() {
    if (!form.risk_type || !form.description) return
    setSaving(true)
    await supabase.from('risk_register').insert({
      ...form,
      review_date: form.review_date || null,
      museum_id: museum.id,
    })
    const { data } = await supabase
      .from('risk_register')
      .select('*, artifacts(title, accession_no, emoji)')
      .eq('museum_id', museum.id)
      .order('created_at', { ascending: false })
    setRisks(data || [])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('risk_register').update({ status }).eq('id', id)
    setRisks(r => r.map(x => x.id === id ? { ...x, status } : x))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const today = new Date().toISOString().slice(0, 10)

  const openRisks = risks.filter(r => r.status === 'Open')
  const criticalOpen = risks.filter(r => r.severity === 'Critical' && r.status === 'Open')
  const dueForReview = risks.filter(r => r.status === 'Open' && r.review_date && r.review_date <= today)

  const filtered = risks.filter(r => filter === 'All' || r.status === filter)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/risk" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Risk Register</span>
          {canEdit && (
            <button onClick={() => setShowForm(s => !s)}
              className="text-xs font-mono px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              {showForm ? 'Cancel' : '+ Add risk'}
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Open Risks', value: openRisks.length, warn: openRisks.length > 0 },
              { label: 'Critical Severity', value: criticalOpen.length, warn: criticalOpen.length > 0 },
              { label: 'Due for Review', value: dueForReview.length, warn: dueForReview.length > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Add risk form */}
          {showForm && canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-sm font-mono text-stone-500 dark:text-stone-400 mb-2">New risk</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Risk Type *</label>
                  <select value={form.risk_type} onChange={e => setForm(f => ({ ...f, risk_type: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    <option value="">Select type…</option>
                    {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Responsible Person</label>
                  <input value={form.responsible_person} onChange={e => setForm(f => ({ ...f, responsible_person: e.target.value }))}
                    placeholder="Name"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Describe the risk…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Likelihood</label>
                  <select value={form.likelihood} onChange={e => setForm(f => ({ ...f, likelihood: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {LIKELIHOODS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Review Date</label>
                  <input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Mitigation</label>
                <textarea value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))}
                  rows={2} placeholder="Steps taken or planned to mitigate this risk…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={addRisk} disabled={saving || !form.risk_type || !form.description}
                  className="px-4 py-2 text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 transition-colors">
                  {saving ? 'Saving…' : 'Add risk'}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2">
            {(['All', 'Open', 'Mitigated', 'Closed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Risks' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⚑</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No risks recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Use the Add risk button to begin building your risk register.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Risk</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Linked Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Severity</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Likelihood</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Review Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const overdue = r.review_date && r.review_date <= today && r.status === 'Open'
                    return (
                      <tr key={r.id} className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${overdue ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.risk_type}</div>
                          <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          {r.artifacts ? (
                            <button onClick={() => router.push(`/dashboard/artifacts/${r.artifact_id}`)}
                              className="flex items-center gap-2 text-left hover:opacity-70 transition-opacity">
                              <span className="text-base">{r.artifacts.emoji}</span>
                              <div>
                                <div className="text-xs font-medium text-stone-900 dark:text-stone-100">{r.artifacts.title}</div>
                                <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{r.artifacts.accession_no}</div>
                              </div>
                            </button>
                          ) : (
                            <span className="text-xs text-stone-400 dark:text-stone-500 italic">Collection-wide</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.Medium}`}>
                            {r.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.likelihood}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {r.review_date ? (
                            <span className={overdue ? 'text-amber-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                              {new Date(r.review_date).toLocaleDateString('en-GB')}
                              {overdue && ' ⚠'}
                            </span>
                          ) : <span className="text-stone-400 dark:text-stone-500">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[r.status] || STATUS_STYLES.Open}`}>
                            {r.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === 'Open' && (
                                <button onClick={() => updateStatus(r.id, 'Mitigated')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Mitigate
                                </button>
                              )}
                              {r.status !== 'Closed' && (
                                <button onClick={() => updateStatus(r.id, 'Closed')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Close
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
