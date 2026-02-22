'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const EXIT_REASONS = ['Return to depositor', 'Outgoing loan', 'Transfer', 'Disposal', 'Conservation', 'Photography', 'Sale']
const TEMP_REASONS = new Set(['Outgoing loan', 'Conservation', 'Photography'])

const inputCls = 'w-full border border-stone-200 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 transition-colors bg-white'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 mb-1.5'
const checkboxCls = 'w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900'

export default function ObjectExitsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [exits, setExits] = useState<any[]>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    exit_date: today,
    artifact_id: '',
    exit_reason: 'Return to depositor',
    recipient_name: '',
    recipient_contact: '',
    destination_address: '',
    exit_condition: '',
    signed_receipt: false,
    signed_receipt_date: '',
    expected_return_date: '',
    exit_authorised_by: '',
    related_loan_id: '',
    notes: '',
  })

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: museum } = await supabase.from('museums').select('*').eq('owner_id', user.id).single()
      if (!museum) { router.push('/onboarding'); return }
      const [{ data: exits }, { data: artifacts }, { data: loans }] = await Promise.all([
        supabase.from('object_exits').select('*, artifacts(title, accession_no, emoji)').eq('museum_id', museum.id).order('exit_date', { ascending: false }),
        supabase.from('artifacts').select('id, title, accession_no, emoji').eq('museum_id', museum.id).order('title'),
        supabase.from('loans').select('id, borrowing_institution, direction').eq('museum_id', museum.id).eq('status', 'Active'),
      ])
      setMuseum(museum)
      setExits(exits || [])
      setArtifacts(artifacts || [])
      setLoans(loans || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSave() {
    if (!form.artifact_id || !form.recipient_name.trim() || !form.exit_authorised_by.trim()) return
    setSaving(true)

    const year = new Date().getFullYear()
    const exitNumber = `EX-${year}-${String(exits.length + 1).padStart(3, '0')}`
    const isTemp = TEMP_REASONS.has(form.exit_reason)

    const { data, error } = await supabase.from('object_exits').insert({
      museum_id: museum.id,
      artifact_id: form.artifact_id,
      exit_number: exitNumber,
      exit_date: form.exit_date,
      exit_reason: form.exit_reason,
      recipient_name: form.recipient_name,
      recipient_contact: form.recipient_contact || null,
      destination_address: form.destination_address || null,
      exit_condition: form.exit_condition || null,
      signed_receipt: form.signed_receipt,
      signed_receipt_date: form.signed_receipt ? (form.signed_receipt_date || today) : null,
      expected_return_date: isTemp && form.expected_return_date ? form.expected_return_date : null,
      exit_authorised_by: form.exit_authorised_by,
      related_loan_id: form.related_loan_id || null,
      notes: form.notes || null,
    }).select('*, artifacts(title, accession_no, emoji)').single()

    if (!error && data) {
      setExits(e => [data, ...e])
      setShowForm(false)
      setForm({
        exit_date: today, artifact_id: '', exit_reason: 'Return to depositor',
        recipient_name: '', recipient_contact: '', destination_address: '',
        exit_condition: '', signed_receipt: false, signed_receipt_date: '',
        expected_return_date: '', exit_authorised_by: '', related_loan_id: '', notes: '',
      })
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="font-mono text-sm text-stone-400">Loading…</p>
    </div>
  )

  const todayStr = today
  const temporary = exits.filter(e => e.expected_return_date)
  const permanent = exits.filter(e => !e.expected_return_date)
  const overdue = temporary.filter(e => e.expected_return_date < todayStr)
  const isTemp = TEMP_REASONS.has(form.exit_reason)

  function exitStatus(e: any) {
    if (!e.expected_return_date) return { label: 'Permanent', cls: 'bg-stone-100 text-stone-500' }
    if (e.expected_return_date < todayStr) return { label: 'Overdue', cls: 'bg-red-50 text-red-600' }
    return { label: 'Temporary', cls: 'bg-amber-50 text-amber-700' }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <Sidebar museum={museum} activePath="/dashboard/exits" onSignOut={handleSignOut} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900">Object Exit Register</span>
          <button
            onClick={() => setShowForm(s => !s)}
            className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded"
          >
            {showForm ? '× Cancel' : '+ New Exit'}
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Exits', value: exits.length },
              { label: 'Temporary', value: temporary.length },
              { label: 'Permanent', value: permanent.length },
              { label: 'Overdue Returns', value: overdue.length },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-200 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Overdue Returns' && s.value > 0 ? 'text-red-600' : 'text-stone-900'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Inline form */}
          {showForm && (
            <div className="bg-white border border-stone-200 rounded-lg p-6 space-y-6">
              <div className="text-xs uppercase tracking-widest text-stone-400">New Exit Record — Spectrum Procedure 6</div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Exit Date *</label>
                  <input type="date" value={form.exit_date} onChange={e => set('exit_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Exit Reason *</label>
                  <select value={form.exit_reason} onChange={e => set('exit_reason', e.target.value)} className={inputCls}>
                    {EXIT_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Exit Authorised By *</label>
                  <input type="text" value={form.exit_authorised_by} onChange={e => set('exit_authorised_by', e.target.value)} className={inputCls} placeholder="Staff member or governing body" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Object *</label>
                <select value={form.artifact_id} onChange={e => set('artifact_id', e.target.value)} className={inputCls}>
                  <option value="">— Select object —</option>
                  {artifacts.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.accession_no ? `${a.accession_no} — ` : ''}{a.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Recipient Name *</label>
                  <input type="text" value={form.recipient_name} onChange={e => set('recipient_name', e.target.value)} className={inputCls} placeholder="Who received the object" />
                </div>
                <div>
                  <label className={labelCls}>Recipient Contact</label>
                  <input type="text" value={form.recipient_contact} onChange={e => set('recipient_contact', e.target.value)} className={inputCls} placeholder="Email, phone" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Destination Address</label>
                <input type="text" value={form.destination_address} onChange={e => set('destination_address', e.target.value)} className={inputCls} placeholder="Where the object is going" />
              </div>

              <div>
                <label className={labelCls}>Condition at Exit</label>
                <textarea rows={2} value={form.exit_condition} onChange={e => set('exit_condition', e.target.value)} className={inputCls} placeholder="Brief condition note — protects against claims on return" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="signed" checked={form.signed_receipt} onChange={e => set('signed_receipt', e.target.checked)} className={checkboxCls} />
                    <label htmlFor="signed" className="text-sm text-stone-700">Signed receipt obtained</label>
                  </div>
                  {form.signed_receipt && (
                    <div>
                      <label className={labelCls}>Receipt date</label>
                      <input type="date" value={form.signed_receipt_date} onChange={e => set('signed_receipt_date', e.target.value)} className={inputCls} />
                    </div>
                  )}
                </div>
                {isTemp && (
                  <div>
                    <label className={labelCls}>Expected Return Date</label>
                    <input type="date" value={form.expected_return_date} onChange={e => set('expected_return_date', e.target.value)} className={inputCls} />
                  </div>
                )}
              </div>

              {loans.length > 0 && (
                <div>
                  <label className={labelCls}>Related Loan (optional)</label>
                  <select value={form.related_loan_id} onChange={e => set('related_loan_id', e.target.value)} className={inputCls}>
                    <option value="">— None —</option>
                    {loans.map(l => (
                      <option key={l.id} value={l.id}>Loan {l.direction} — {l.borrowing_institution}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleSave} disabled={saving || !form.artifact_id || !form.recipient_name || !form.exit_authorised_by} className="bg-stone-900 text-white text-xs font-mono px-5 py-2.5 rounded disabled:opacity-40">
                  {saving ? 'Saving…' : 'Save Exit Record'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors px-3">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {exits.length === 0 && !showForm ? (
            <div className="bg-white border border-stone-200 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">↗</div>
              <div className="font-serif text-2xl italic text-stone-900 mb-2">No exit records yet</div>
              <p className="text-sm text-stone-400 mb-6">Record every object that leaves your premises, for any reason.</p>
              <button onClick={() => setShowForm(true)} className="bg-stone-900 text-white text-xs font-mono px-5 py-2.5 rounded">
                + New Exit Record
              </button>
            </div>
          ) : exits.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Exit No.</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Exit Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Recipient</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Receipt</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Expected Return</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exits.map(e => {
                    const status = exitStatus(e)
                    return (
                      <tr key={e.id} className={`border-b border-stone-100 hover:bg-stone-50 ${status.label === 'Overdue' ? 'bg-red-50/20' : ''}`}>
                        <td className="px-6 py-3 text-xs font-mono text-stone-600">{e.exit_number}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500">
                          {new Date(e.exit_date + 'T00:00:00').toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{e.artifacts?.emoji}</span>
                            <div>
                              <div className="text-sm font-medium text-stone-900">{e.artifacts?.title}</div>
                              <div className="text-xs font-mono text-stone-400">{e.artifacts?.accession_no}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600">{e.exit_reason}</td>
                        <td className="px-4 py-3 text-sm text-stone-700">{e.recipient_name}</td>
                        <td className="px-4 py-3">
                          {e.signed_receipt
                            ? <span className="text-xs font-mono text-emerald-600">✓ Signed</span>
                            : <span className="text-xs font-mono text-amber-600">Pending</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500">
                          {e.expected_return_date ? new Date(e.expected_return_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${status.cls}`}>{status.label}</span>
                        </td>
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
