'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getPlan } from '@/lib/plans'

const ENTRY_REASONS = ['Potential acquisition', 'Loan in', 'Enquiry', 'Return from loan', 'Found in collection']
const OUTCOMES = ['Pending', 'Acquired', 'Returned to depositor', 'Transferred to loan', 'Disposed']

const OUTCOME_STYLES: Record<string, string> = {
  'Pending':                 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Acquired':                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Returned to depositor':   'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'Transferred to loan':     'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'Disposed':                'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'
const checkboxCls = 'w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900'

export default function EntryRegisterPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any | null>(null)
  const [promoteError, setPromoteError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState({
    entry_number: '',
    entry_date: today,
    depositor_name: '',
    depositor_contact: '',
    entry_reason: 'Potential acquisition',
    object_description: '',
    object_count: 1,
    legal_owner: '',
    terms_accepted: false,
    terms_accepted_date: '',
    liability_statement: '',
    receipt_issued: false,
    receipt_date: '',
    outcome: 'Pending',
    received_by: '',
    risk_notes: '',
    quarantine_required: false,
    notes: '',
    artifact_id: '',
  })

  function set(field: string, value: any) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleEdit(entry: any) {
    if (entry.artifact_id) {
      router.push(`/dashboard/artifacts/${entry.artifact_id}?tab=entry`)
      return
    }
    setForm({
      entry_number: entry.entry_number || '',
      entry_date: entry.entry_date || today,
      depositor_name: entry.depositor_name || '',
      depositor_contact: entry.depositor_contact || '',
      entry_reason: entry.entry_reason || 'Potential acquisition',
      object_description: entry.object_description || '',
      object_count: entry.object_count || 1,
      legal_owner: entry.legal_owner || '',
      terms_accepted: entry.terms_accepted || false,
      terms_accepted_date: entry.terms_accepted_date || '',
      liability_statement: entry.liability_statement || '',
      receipt_issued: entry.receipt_issued || false,
      receipt_date: entry.receipt_date || '',
      outcome: entry.outcome || 'Pending',
      received_by: entry.received_by || '',
      risk_notes: entry.risk_notes || '',
      quarantine_required: entry.quarantine_required || false,
      notes: entry.notes || '',
      artifact_id: entry.artifact_id || '',
    })
    setEditingEntry(entry)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: museum } = await supabase.from('museums').select('*').eq('owner_id', user.id).single()
      if (!museum) { router.push('/onboarding'); return }
      const [{ data: entries }, { data: artifacts }] = await Promise.all([
        supabase.from('entry_records').select('*, artifacts(title, accession_no)').eq('museum_id', museum.id).order('entry_date', { ascending: false }),
        supabase.from('artifacts').select('id, title, accession_no').eq('museum_id', museum.id).order('title'),
      ])
      setMuseum(museum)
      setEntries(entries || [])
      setArtifacts(artifacts || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleSave() {
    if (!form.depositor_name.trim()) return
    if (!form.object_description.trim()) return
    if (!form.received_by.trim()) return
    setSaving(true)

    if (editingEntry) {
      const { data, error } = await supabase
        .from('entry_records')
        .update({
          entry_number: form.entry_number || editingEntry.entry_number,
          entry_date: form.entry_date,
          depositor_name: form.depositor_name,
          depositor_contact: form.depositor_contact || null,
          entry_reason: form.entry_reason,
          object_description: form.object_description,
          object_count: form.object_count,
          legal_owner: form.legal_owner || null,
          terms_accepted: form.terms_accepted,
          terms_accepted_date: form.terms_accepted ? (form.terms_accepted_date || today) : null,
          liability_statement: form.liability_statement || null,
          receipt_issued: form.receipt_issued,
          receipt_date: form.receipt_issued ? (form.receipt_date || today) : null,
          outcome: form.outcome,
          received_by: form.received_by,
          risk_notes: form.risk_notes || null,
          quarantine_required: form.quarantine_required,
          notes: form.notes || null,
          artifact_id: form.artifact_id || null,
        })
        .eq('id', editingEntry.id)
        .select('*, artifacts(title, accession_no)')
        .single()

      if (!error && data) {
        setEntries(e => e.map(entry => entry.id === editingEntry.id ? data : entry))
        setShowForm(false)
        setEditingEntry(null)
        setForm({ entry_number: '', entry_date: today, depositor_name: '', depositor_contact: '', entry_reason: 'Potential acquisition', object_description: '', object_count: 1, legal_owner: '', terms_accepted: false, terms_accepted_date: '', liability_statement: '', receipt_issued: false, receipt_date: '', outcome: 'Pending', received_by: '', risk_notes: '', quarantine_required: false, notes: '', artifact_id: '' })
      }
    } else {
      const year = new Date().getFullYear()
      const entryNumber = form.entry_number || `OE-${year}-${String(entries.length + 1).padStart(3, '0')}`

      const { data, error } = await supabase.from('entry_records').insert({
        museum_id: museum.id,
        artifact_id: form.artifact_id || null,
        entry_number: entryNumber,
        entry_date: form.entry_date,
        depositor_name: form.depositor_name,
        depositor_contact: form.depositor_contact || null,
        entry_reason: form.entry_reason,
        object_description: form.object_description,
        object_count: form.object_count,
        legal_owner: form.legal_owner || null,
        terms_accepted: form.terms_accepted,
        terms_accepted_date: form.terms_accepted ? (form.terms_accepted_date || today) : null,
        liability_statement: form.liability_statement || null,
        receipt_issued: form.receipt_issued,
        receipt_date: form.receipt_issued ? (form.receipt_date || today) : null,
        outcome: form.outcome,
        received_by: form.received_by,
        risk_notes: form.risk_notes || null,
        quarantine_required: form.quarantine_required,
        notes: form.notes || null,
      }).select('*, artifacts(title, accession_no)').single()

      if (!error && data) {
        setEntries(e => [data, ...e])
        setShowForm(false)
        setForm({ entry_number: '', entry_date: today, depositor_name: '', depositor_contact: '', entry_reason: 'Potential acquisition', object_description: '', object_count: 1, legal_owner: '', terms_accepted: false, terms_accepted_date: '', liability_statement: '', receipt_issued: false, receipt_date: '', outcome: 'Pending', received_by: '', risk_notes: '', quarantine_required: false, notes: '', artifact_id: '' })
      }
    }
    setSaving(false)
  }

  async function handlePromote(entry: any) {
    setPromoteError('')
    const planInfo = getPlan(museum?.plan)
    const limit = planInfo.artifacts
    if (limit !== null) {
      const { count } = await supabase
        .from('artifacts').select('*', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
      if (count !== null && count >= limit) {
        setPromoteError(`Your ${planInfo.label} plan allows up to ${limit.toLocaleString()} objects. Upgrade your plan to add more.`)
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

    if (createError) { console.error('Error creating artifact:', createError); return }

    const { error: updateError } = await supabase.from('entry_records').update({ artifact_id: newArtifact.id }).eq('id', entry.id)
    if (updateError) { console.error('Error updating entry record:', updateError); return }

    setEntries(entries.map(e => e.id === entry.id ? { ...e, artifact_id: newArtifact.id } : e))
    router.push(`/dashboard/artifacts/${newArtifact.id}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400">Loading…</p>
    </div>
  )

  const simple = museum?.ui_mode === 'simple'
  const pending = entries.filter(e => e.outcome === 'Pending').length
  const acquired = entries.filter(e => e.outcome === 'Acquired').length
  const returned = entries.filter(e => e.outcome === 'Returned to depositor').length

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/entry" onSignOut={handleSignOut} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Object Entry Register</span>
          <button
            onClick={() => setShowForm(s => !s)}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded"
          >
            {showForm ? '× Cancel' : '+ New Entry'}
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
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
                    className="text-xs font-mono text-amber-600 hover:text-amber-700 dark:hover:text-amber-500 whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    Upgrade →
                  </button>
                )}
              </div>
            )
          })()}

          {promoteError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-mono text-red-600 dark:text-red-400">{promoteError}</span>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="text-xs font-mono text-red-600 dark:text-red-400 underline ml-4 whitespace-nowrap"
              >
                View plans →
              </button>
            </div>
          )}

          {/* Inline form */}
          {showForm && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">
                {editingEntry ? `Edit Entry Record — ${editingEntry.entry_number}` : (simple ? 'New Object Record' : 'New Entry Record — Spectrum Procedure 1')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Entry Number</label>
                  <input type="text" value={form.entry_number} onChange={e => set('entry_number', e.target.value)} className={`${inputCls} font-mono`} placeholder="Auto-generated (e.g. OE-2025-001)" />
                </div>
                <div>
                  <label className={labelCls}>Entry Date *</label>
                  <input type="date" value={form.entry_date} onChange={e => set('entry_date', e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Entry Reason *</label>
                  <select value={form.entry_reason} onChange={e => set('entry_reason', e.target.value)} className={inputCls}>
                    {ENTRY_REASONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Number of Objects *</label>
                  <input type="number" min={1} value={form.object_count} onChange={e => set('object_count', parseInt(e.target.value) || 1)} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Depositor Name *</label>
                  <input type="text" value={form.depositor_name} onChange={e => set('depositor_name', e.target.value)} className={inputCls} placeholder="Individual or organisation" />
                </div>
                <div>
                  <label className={labelCls}>Depositor Contact</label>
                  <input type="text" value={form.depositor_contact} onChange={e => set('depositor_contact', e.target.value)} className={inputCls} placeholder="Email, phone, or address" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!simple && (
                  <div>
                    <label className={labelCls}>Legal Owner / Title Holder</label>
                    <input type="text" value={form.legal_owner} onChange={e => set('legal_owner', e.target.value)} className={inputCls} placeholder="If different from depositor" />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Received By *</label>
                  <input type="text" value={form.received_by} onChange={e => set('received_by', e.target.value)} className={inputCls} placeholder="Staff member name" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Object Description *</label>
                <textarea rows={3} value={form.object_description} onChange={e => set('object_description', e.target.value)} className={inputCls} placeholder="Name, materials, brief description — enough to identify the object(s)" />
              </div>

              {!simple && (
                <div>
                  <label className={labelCls}>Liability Statement</label>
                  <textarea rows={2} value={form.liability_statement} onChange={e => set('liability_statement', e.target.value)} className={inputCls} placeholder="What the museum is/isn't responsible for" />
                </div>
              )}

              {!simple && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="terms" checked={form.terms_accepted} onChange={e => set('terms_accepted', e.target.checked)} className={checkboxCls} />
                      <label htmlFor="terms" className="text-sm text-stone-700 dark:text-stone-300">Terms &amp; conditions accepted</label>
                    </div>
                    {form.terms_accepted && (
                      <div>
                        <label className={labelCls}>Date accepted</label>
                        <input type="date" value={form.terms_accepted_date} onChange={e => set('terms_accepted_date', e.target.value)} className={inputCls} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="receipt" checked={form.receipt_issued} onChange={e => set('receipt_issued', e.target.checked)} className={checkboxCls} />
                      <label htmlFor="receipt" className="text-sm text-stone-700 dark:text-stone-300">Receipt issued to depositor</label>
                    </div>
                    {form.receipt_issued && (
                      <div>
                        <label className={labelCls}>Receipt date</label>
                        <input type="date" value={form.receipt_date} onChange={e => set('receipt_date', e.target.value)} className={inputCls} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!simple && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Risk Notes</label>
                    <textarea rows={2} value={form.risk_notes} onChange={e => set('risk_notes', e.target.value)} className={inputCls} placeholder="Pest, hazardous materials, fragility concerns…" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mt-6">
                      <input type="checkbox" id="quarantine" checked={form.quarantine_required} onChange={e => set('quarantine_required', e.target.checked)} className={checkboxCls} />
                      <label htmlFor="quarantine" className="text-sm text-stone-700 dark:text-stone-300">Quarantine required</label>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Outcome</label>
                  <select value={form.outcome} onChange={e => set('outcome', e.target.value)} className={inputCls}>
                    {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Link to Object (optional)</label>
                  <select value={form.artifact_id} onChange={e => set('artifact_id', e.target.value)} className={inputCls}>
                    <option value="">— Select object —</option>
                    {artifacts.map(a => (
                      <option key={a.id} value={a.id}>{a.accession_no ? `${a.accession_no} — ` : ''}{a.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} className={inputCls} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleSave} disabled={saving || !form.depositor_name || !form.object_description || !form.received_by} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded disabled:opacity-40">
                  {saving ? 'Saving…' : (editingEntry ? 'Save Changes' : 'Save Entry Record')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingEntry(null); setForm({ entry_number: '', entry_date: today, depositor_name: '', depositor_contact: '', entry_reason: 'Potential acquisition', object_description: '', object_count: 1, legal_owner: '', terms_accepted: false, terms_accepted_date: '', liability_statement: '', receipt_issued: false, receipt_date: '', outcome: 'Pending', received_by: '', risk_notes: '', quarantine_required: false, notes: '', artifact_id: '' }); }} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-3">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {entries.length === 0 && !showForm ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🗂</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No entry records yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Record every object that comes into your care, before any decision is made.</p>
              <button onClick={() => setShowForm(true)} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded">
                + New Entry Record
              </button>
            </div>
          ) : entries.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
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
                    <tr key={e.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer" onClick={() => handleEdit(e)}>
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
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        {e.outcome === 'Acquired' ? (
                          e.artifact_id ? (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); router.push(`/dashboard/artifacts/${e.artifact_id}`); }}
                              className="text-xs font-mono text-amber-600 hover:text-amber-700 transition-colors"
                            >
                              View object →
                            </button>
                          ) : (
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handlePromote(e); }}
                              className="text-xs font-mono text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              Create record →
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-stone-300 dark:text-stone-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
