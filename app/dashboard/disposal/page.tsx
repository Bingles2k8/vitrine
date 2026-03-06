'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'
const DISPOSAL_METHODS = ['Sale', 'Transfer', 'Destruction', 'Return to Owner', 'Exchange', 'Gift to another museum']
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY']

export default function DisposalPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    artifact_id: '', disposal_method: '', disposal_reason: '', justification: '',
    deaccession_date: '', authorised_by: '', recipient_name: '', recipient_contact: '',
    proceeds_amount: '', proceeds_currency: 'GBP',
    governing_body_approval: false, governing_body_date: '',
    register_annotated: false, public_notice: '', public_notice_date: '', notes: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const [{ data: recs }, { data: arts }] = await Promise.all([
        supabase.from('disposal_records').select('*, artifacts(title, accession_no, emoji)').eq('museum_id', museum.id).order('created_at', { ascending: false }),
        supabase.from('artifacts').select('id, title, accession_no, emoji').eq('museum_id', museum.id).is('deleted_at', null).order('title'),
      ])
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setRecords(recs || [])
      setArtifacts(arts || [])
      setLoading(false)
    }
    load()
  }, [])

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  async function addRecord() {
    if (!form.artifact_id || !form.disposal_method || !form.disposal_reason || !form.deaccession_date || !form.authorised_by || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const count = records.filter(r => r.disposal_reference?.startsWith(`DS-${year}-`)).length
    const ref = `DS-${year}-${String(count + 1).padStart(3, '0')}`
    const { error: err } = await supabase.from('disposal_records').insert({
      disposal_reference: ref, museum_id: museum.id,
      artifact_id: form.artifact_id, disposal_method: form.disposal_method,
      disposal_reason: form.disposal_reason, justification: form.justification || null,
      deaccession_date: form.deaccession_date, authorised_by: form.authorised_by,
      recipient_name: form.recipient_name || null, recipient_contact: form.recipient_contact || null,
      proceeds_amount: form.proceeds_amount ? parseFloat(form.proceeds_amount) : null,
      proceeds_currency: form.proceeds_currency,
      governing_body_approval: form.governing_body_approval,
      governing_body_date: form.governing_body_approval && form.governing_body_date ? form.governing_body_date : null,
      register_annotated: form.register_annotated,
      public_notice: form.public_notice || null,
      public_notice_date: form.public_notice_date || null,
      notes: form.notes || null,
    })
    if (err) { setError(err.message); setSubmitting(false); return }
    setForm({ artifact_id: '', disposal_method: '', disposal_reason: '', justification: '', deaccession_date: '', authorised_by: '', recipient_name: '', recipient_contact: '', proceeds_amount: '', proceeds_currency: 'GBP', governing_body_approval: false, governing_body_date: '', register_annotated: false, public_notice: '', public_notice_date: '', notes: '' })
    const { data } = await supabase.from('disposal_records').select('*, artifacts(title, accession_no, emoji)').eq('museum_id', museum.id).order('created_at', { ascending: false })
    setRecords(data || [])
    setSubmitting(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error: err } = await supabase.from('disposal_records').update({ status }).eq('id', id)
    if (err) { setError(err.message); return }
    setRecords(r => r.map(rec => rec.id === id ? { ...rec, status } : rec))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading...</p>
    </div>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/disposal" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Disposal</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">&oslash;</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Disposal management is an Institution feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Document and track the formal disposal of objects from your collection with full governance compliance.</p>
              <button onClick={() => router.push('/dashboard/plan')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">View plans &rarr;</button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const proposed = records.filter(r => r.status === 'Proposed')
  const approved = records.filter(r => r.status === 'Approved')
  const completed = records.filter(r => r.status === 'Completed')

  return (
    <DashboardShell museum={museum} activePath="/dashboard/disposal" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Disposal Register</span>
        </div>
        <div className="p-4 md:p-8 space-y-6">
          {error && <div className="text-xs font-mono text-red-500">{error}</div>}

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-5 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">Best practice requires that all disposals are authorised by the governing body and documented in full. A public notice period may be required.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: records.length },
              { label: 'Proposed', value: proposed.length },
              { label: 'Approved', value: approved.length },
              { label: 'Completed', value: completed.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Propose Disposal</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Object *</label>
                  <select value={form.artifact_id} onChange={e => setForm(f => ({ ...f, artifact_id: e.target.value }))} className={inputCls}>
                    <option value="">-- Select object --</option>
                    {artifacts.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.title}{a.accession_no ? ` (${a.accession_no})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Disposal Method *</label>
                  <select value={form.disposal_method} onChange={e => setForm(f => ({ ...f, disposal_method: e.target.value }))} className={inputCls}>
                    <option value="">-- Select --</option>
                    {DISPOSAL_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Disposal Reason *</label>
                <textarea value={form.disposal_reason} onChange={e => setForm(f => ({ ...f, disposal_reason: e.target.value }))} rows={2} placeholder="Why is this object being disposed of..." className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Justification</label>
                <textarea value={form.justification} onChange={e => setForm(f => ({ ...f, justification: e.target.value }))} rows={2} placeholder="Detailed justification for disposal..." className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Deaccession Date *</label>
                  <input type="date" value={form.deaccession_date} onChange={e => setForm(f => ({ ...f, deaccession_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Authorised By *</label>
                  <input value={form.authorised_by} onChange={e => setForm(f => ({ ...f, authorised_by: e.target.value }))} placeholder="Name and role" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Recipient Name</label>
                  <input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Recipient Contact</label>
                  <input value={form.recipient_contact} onChange={e => setForm(f => ({ ...f, recipient_contact: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Proceeds Amount</label>
                  <input type="number" step="0.01" min="0" value={form.proceeds_amount} onChange={e => setForm(f => ({ ...f, proceeds_amount: e.target.value }))} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={form.proceeds_currency} onChange={e => setForm(f => ({ ...f, proceeds_currency: e.target.value }))} className={inputCls}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input type="checkbox" checked={form.governing_body_approval} onChange={e => setForm(f => ({ ...f, governing_body_approval: e.target.checked }))} />
                  Governing body approval obtained
                </label>
                {form.governing_body_approval && (
                  <div className="ml-6">
                    <label className={labelCls}>Approval Date</label>
                    <input type="date" value={form.governing_body_date} onChange={e => setForm(f => ({ ...f, governing_body_date: e.target.value }))} className={inputCls} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
                  <input type="checkbox" checked={form.register_annotated} onChange={e => setForm(f => ({ ...f, register_annotated: e.target.checked }))} />
                  Accession register annotated
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Public Notice</label>
                  <textarea value={form.public_notice} onChange={e => setForm(f => ({ ...f, public_notice: e.target.value }))} rows={2} placeholder="Details of public notice given..." className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Public Notice Date</label>
                  <input type="date" value={form.public_notice_date} onChange={e => setForm(f => ({ ...f, public_notice_date: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <button type="button" onClick={addRecord} disabled={!form.artifact_id || !form.disposal_method || !form.disposal_reason || !form.deaccession_date || !form.authorised_by || submitting}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
                {submitting ? 'Saving...' : 'Propose disposal \u2192'}
              </button>
            </div>
          )}

          {records.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">&oslash;</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No disposal records</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Disposal proposals and outcomes will appear here.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Reference</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Method</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{r.disposal_reference}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{r.artifacts?.emoji}</span>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.artifacts?.title}</div>
                            <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{r.artifacts?.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{r.disposal_method}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.deaccession_date ? new Date(r.deaccession_date).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                          r.status === 'Completed' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                          : r.status === 'In Progress' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                          : r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>{r.status}</span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status === 'Proposed' && <button type="button" onClick={() => updateStatus(r.id, 'Approved')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Approve</button>}
                            {r.status === 'Approved' && <button type="button" onClick={() => updateStatus(r.id, 'In Progress')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Begin</button>}
                            {r.status === 'In Progress' && <button type="button" onClick={() => updateStatus(r.id, 'Completed')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Complete</button>}
                          </div>
                        </td>
                      )}
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
