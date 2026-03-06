'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, EXIT_REASONS, TEMP_REASONS } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'

interface ExitsTabProps {
  canEdit: boolean
  artifact: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

const TRANSPORT_METHODS = ['Hand carry', 'Courier', 'Post / carrier', 'Museum transport', 'Third-party transport']

export default function ExitsTab({ canEdit, artifact, museum, supabase, logActivity }: ExitsTabProps) {
  const [exitHistory, setExitHistory] = useState<any[]>([])
  const [exitLoaded, setExitLoaded] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const [exitForm, setExitForm] = useState({ exit_date: today, exit_reason: 'Return to depositor', recipient_name: '', recipient_contact: '', destination_address: '', transport_method: '', insurance_indemnity_confirmed: false, packing_notes: '', exit_condition: '', signed_receipt: false, signed_receipt_date: '', expected_return_date: '', exit_authorised_by: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('object_exits').select('*').eq('artifact_id', artifact.id).order('exit_date', { ascending: false })
      .then(({ data }: any) => { setExitHistory(data || []); setExitLoaded(true) })
  }, [artifact.id])

  async function addExit() {
    if (!exitForm.recipient_name.trim() || !exitForm.exit_authorised_by.trim() || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const exitNumber = `EX-${year}-${String(exitHistory.length + 1).padStart(3, '0')}`
    const isTemp = TEMP_REASONS.has(exitForm.exit_reason)
    const { error } = await supabase.from('object_exits').insert({
      museum_id: museum.id, artifact_id: artifact.id, exit_number: exitNumber,
      exit_date: exitForm.exit_date, exit_reason: exitForm.exit_reason,
      recipient_name: exitForm.recipient_name, recipient_contact: exitForm.recipient_contact || null,
      destination_address: exitForm.destination_address || null,
      transport_method: exitForm.transport_method || null,
      insurance_indemnity_confirmed: exitForm.insurance_indemnity_confirmed,
      packing_notes: exitForm.packing_notes || null,
      exit_condition: exitForm.exit_condition || null,
      signed_receipt: exitForm.signed_receipt,
      signed_receipt_date: exitForm.signed_receipt ? (exitForm.signed_receipt_date || today) : null,
      expected_return_date: isTemp && exitForm.expected_return_date ? exitForm.expected_return_date : null,
      exit_authorised_by: exitForm.exit_authorised_by, notes: exitForm.notes || null,
    })
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    setExitForm({ exit_date: new Date().toISOString().slice(0, 10), exit_reason: 'Return to depositor', recipient_name: '', recipient_contact: '', destination_address: '', transport_method: '', insurance_indemnity_confirmed: false, packing_notes: '', exit_condition: '', signed_receipt: false, signed_receipt_date: '', expected_return_date: '', exit_authorised_by: '', notes: '' })
    const { data } = await supabase.from('object_exits').select('*').eq('artifact_id', artifact.id).order('exit_date', { ascending: false })
    setExitHistory(data || [])
    logActivity('exit_created', `Exit record ${exitNumber} created for "${artifact.title}" (${exitForm.exit_reason})`)
    setSubmitting(false)
  }

  return (
    <>

      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Record Exit</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Exit Date *</label>
              <input type="date" value={exitForm.exit_date} onChange={e => setExitForm(f => ({ ...f, exit_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Exit Reason *</label>
              <select value={exitForm.exit_reason} onChange={e => setExitForm(f => ({ ...f, exit_reason: e.target.value }))} className={inputCls}>
                {EXIT_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Exit Authorised By *</label>
              <input value={exitForm.exit_authorised_by} onChange={e => setExitForm(f => ({ ...f, exit_authorised_by: e.target.value }))} placeholder="Staff member or governing body" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Recipient Name *</label>
              <input value={exitForm.recipient_name} onChange={e => setExitForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Who received the object" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Recipient Contact</label>
              <input value={exitForm.recipient_contact} onChange={e => setExitForm(f => ({ ...f, recipient_contact: e.target.value }))} placeholder="Email, phone" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Destination Address</label>
            <input value={exitForm.destination_address} onChange={e => setExitForm(f => ({ ...f, destination_address: e.target.value }))} placeholder="Where the object is going" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Transport Method</label>
              <select value={exitForm.transport_method} onChange={e => setExitForm(f => ({ ...f, transport_method: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {TRANSPORT_METHODS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="pt-6">
              <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <input type="checkbox" checked={exitForm.insurance_indemnity_confirmed} onChange={e => setExitForm(f => ({ ...f, insurance_indemnity_confirmed: e.target.checked }))} className="rounded border-stone-300" />
                Insurance / indemnity confirmed
              </label>
            </div>
          </div>
          <div>
            <label className={labelCls}>Packing Notes</label>
            <textarea rows={2} value={exitForm.packing_notes} onChange={e => setExitForm(f => ({ ...f, packing_notes: e.target.value }))} placeholder="Packing materials and method used…" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Condition at Exit</label>
            <textarea rows={2} value={exitForm.exit_condition} onChange={e => setExitForm(f => ({ ...f, exit_condition: e.target.value }))} placeholder="Brief condition note" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <input type="checkbox" checked={exitForm.signed_receipt} onChange={e => setExitForm(f => ({ ...f, signed_receipt: e.target.checked }))} className="rounded border-stone-300" />
                Signed receipt obtained
              </label>
              {exitForm.signed_receipt && (
                <div>
                  <label className={labelCls}>Receipt date</label>
                  <input type="date" value={exitForm.signed_receipt_date} onChange={e => setExitForm(f => ({ ...f, signed_receipt_date: e.target.value }))} className={inputCls} />
                </div>
              )}
            </div>
            {TEMP_REASONS.has(exitForm.exit_reason) && (
              <div>
                <label className={labelCls}>Expected Return Date</label>
                <input type="date" value={exitForm.expected_return_date} onChange={e => setExitForm(f => ({ ...f, expected_return_date: e.target.value }))} className={inputCls} />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} value={exitForm.notes} onChange={e => setExitForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>
          <button type="button" onClick={addExit} disabled={!exitForm.recipient_name || !exitForm.exit_authorised_by || submitting}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
            {submitting ? 'Saving…' : 'Save exit record →'}
          </button>
        </div>
      )}

      {exitLoaded && exitHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Exit History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Exit No.</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Reason</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Recipient</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Receipt</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Return</th>
            </tr></thead>
            <tbody>
              {exitHistory.map(e => (
                <tr key={e.id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{e.exit_number}</td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(e.exit_date + 'T00:00:00').toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{e.exit_reason}</td>
                  <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{e.recipient_name}</td>
                  <td className="px-4 py-3">{e.signed_receipt ? <span className="text-xs font-mono text-emerald-600">✓ Signed</span> : <span className="text-xs font-mono text-amber-600">Pending</span>}</td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{e.expected_return_date ? new Date(e.expected_return_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exitLoaded && exitHistory.length === 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">↗</div>
          <p className="text-sm text-stone-400 dark:text-stone-500">No exit records for this object.</p>
        </div>
      )}
    </>
  )
}
