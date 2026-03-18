'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { inputCls, labelCls, sectionTitle, COPYRIGHT_OPTIONS, DISPOSAL_METHODS, RIGHTS_TYPES, RIGHTS_STATUSES, REPRODUCTION_TYPES, CURRENCIES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'
import { getPlan } from '@/lib/plans'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'

interface RightsTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  saving: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function RightsTab({ form, set, canEdit, saving, object, museum, supabase, logActivity }: RightsTabProps) {
  const { toast } = useToast()
  const router = useRouter()
  const canAttach = canEdit && getPlan(museum.plan).compliance

  // Rights records state
  const [rightsRecords, setRightsRecords] = useState<any[]>([])
  const [rightsLoaded, setRightsLoaded] = useState(false)
  const [rightsForm, setRightsForm] = useState({
    rights_type: 'Copyright', rights_status: 'Active', rights_holder: '', expiry_date: '',
    licence_terms: '', restrictions: '', rights_in: '', rights_out: '', notes: '',
  })
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [stagedRightsDocs, setStagedRightsDocs] = useState<StagedDoc[]>([])

  // Reproduction requests state
  const [reproductionRequests, setReproductionRequests] = useState<any[]>([])
  const [reproductionRequestsLoaded, setReproductionRequestsLoaded] = useState(false)
  const [reproductionForm, setReproductionForm] = useState({
    requester_name: '', requester_org: '', request_date: new Date().toISOString().slice(0, 10),
    purpose: '', status: 'Pending', decision_date: '', decision_by: '', notes: '',
    reproduction_type: '', reproduced_by: '', reproduction_date: '',
    rights_clearance_confirmed: false, licence_terms: '', image_file_reference: '',
    credit_line: '', fee: '', fee_currency: 'GBP',
  })
  const [selectedRepro, setSelectedRepro] = useState<any>(null)
  const [stagedReproDocs, setStagedReproDocs] = useState<StagedDoc[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('rights_records').select('*').eq('object_id', object.id).order('created_at', { ascending: false }),
      supabase.from('reproduction_requests').select('*').eq('object_id', object.id).order('created_at', { ascending: false }),
    ]).then(([rightsRes, reproRes]: any) => {
      setRightsRecords(rightsRes.data || [])
      setRightsLoaded(true)
      setReproductionRequests(reproRes.data || [])
      setReproductionRequestsLoaded(true)
    })
  }, [object.id])

  // ── Rights records CRUD ──────────────────────────────────────────────
  async function addRightsRecord() {
    if (!rightsForm.rights_type || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const rightsReference = `RR-${year}-${String(rightsRecords.length + 1).padStart(3, '0')}`
    const { data: newRecord, error } = await supabase.from('rights_records').insert({
      museum_id: museum.id, object_id: object.id, rights_reference: rightsReference,
      rights_type: rightsForm.rights_type, rights_status: rightsForm.rights_status,
      rights_holder: rightsForm.rights_holder || null, expiry_date: rightsForm.expiry_date || null,
      licence_terms: rightsForm.licence_terms || null, restrictions: rightsForm.restrictions || null,
      rights_in: rightsForm.rights_in || null, rights_out: rightsForm.rights_out || null,
      notes: rightsForm.notes || null,
    }).select('id').single()
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    if (stagedRightsDocs.length > 0 && newRecord) {
      const failed = await uploadStagedDocs(supabase, stagedRightsDocs, object.id, museum.id, 'rights', newRecord.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedRightsDocs([])
    }
    setRightsForm({ rights_type: 'Copyright', rights_status: 'Active', rights_holder: '', expiry_date: '', licence_terms: '', restrictions: '', rights_in: '', rights_out: '', notes: '' })
    const { data } = await supabase.from('rights_records').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setRightsRecords(data || [])
    logActivity('rights_created', `Rights record ${rightsReference} created for "${object.title}"`)
    setSubmitting(false)
  }

  // ── Reproduction requests CRUD ───────────────────────────────────────
  async function addReproductionRequest() {
    if (!reproductionForm.requester_name || !reproductionForm.request_date || submitting) return
    setSubmitting(true)
    const { data: newRepro, error: repErr } = await supabase.from('reproduction_requests').insert({
      object_id: object.id, museum_id: museum.id,
      requester_name: reproductionForm.requester_name, requester_org: reproductionForm.requester_org || null,
      request_date: reproductionForm.request_date, purpose: reproductionForm.purpose || null,
      status: reproductionForm.status, decision_date: reproductionForm.decision_date || null,
      decision_by: reproductionForm.decision_by || null, notes: reproductionForm.notes || null,
      reproduction_type: reproductionForm.reproduction_type || null,
      reproduced_by: reproductionForm.reproduced_by || null,
      reproduction_date: reproductionForm.reproduction_date || null,
      rights_clearance_confirmed: reproductionForm.rights_clearance_confirmed,
      licence_terms: reproductionForm.licence_terms || null,
      image_file_reference: reproductionForm.image_file_reference || null,
      credit_line: reproductionForm.credit_line || null,
      fee: reproductionForm.fee ? parseFloat(reproductionForm.fee) : null,
      fee_currency: reproductionForm.fee_currency,
    }).select('id').single()
    if (repErr) { toast(repErr.message, 'error'); setSubmitting(false); return }
    if (stagedReproDocs.length > 0 && newRepro) {
      const failed = await uploadStagedDocs(supabase, stagedReproDocs, object.id, museum.id, 'reproduction', newRepro.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedReproDocs([])
    }
    setReproductionForm({
      requester_name: '', requester_org: '', request_date: new Date().toISOString().slice(0, 10),
      purpose: '', status: 'Pending', decision_date: '', decision_by: '', notes: '',
      reproduction_type: '', reproduced_by: '', reproduction_date: '',
      rights_clearance_confirmed: false, licence_terms: '', image_file_reference: '',
      credit_line: '', fee: '', fee_currency: 'GBP',
    })
    const { data } = await supabase.from('reproduction_requests').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setReproductionRequests(data || [])
    logActivity('reproduction_request', `Reproduction request logged for "${object.title}"`)
    setSubmitting(false)
  }

  async function updateRequestStatus(id: string, status: string) {
    const { error } = await supabase.from('reproduction_requests').update({ status, decision_date: new Date().toISOString().slice(0, 10) }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    const { data } = await supabase.from('reproduction_requests').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setReproductionRequests(data || [])
    if (selectedRepro?.id === id) setSelectedRepro((r: any) => ({ ...r, status, decision_date: new Date().toISOString().slice(0, 10) }))
  }

  return (
    <>
      {/* Copyright & Rights Overview */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Rights Management</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Copyright Status</label>
            <select value={form.copyright_status} onChange={e => set('copyright_status', e.target.value)} className={inputCls} disabled={!canEdit}>
              <option value="">— Select —</option>
              {COPYRIGHT_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Rights Holder</label><input value={form.rights_holder} onChange={e => set('rights_holder', e.target.value)} placeholder="Name of copyright owner" className={inputCls} disabled={!canEdit} /></div>
        </div>
        <div>
          <label className={labelCls}>Use &amp; Reproduction Restrictions</label>
          <textarea rows={3} value={form.rights_notes} onChange={e => set('rights_notes', e.target.value)} className={inputCls} disabled={!canEdit} placeholder="e.g. Permission required for commercial reproduction. Attribution must include artist name and museum." />
        </div>
      </div>

      {/* Rights Records */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Rights Records</div>

        {canEdit && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Rights Type *</label>
                <select value={rightsForm.rights_type} onChange={e => setRightsForm(f => ({ ...f, rights_type: e.target.value }))} className={inputCls}>
                  {RIGHTS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status *</label>
                <select value={rightsForm.rights_status} onChange={e => setRightsForm(f => ({ ...f, rights_status: e.target.value }))} className={inputCls}>
                  {RIGHTS_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Rights Holder</label>
                <input value={rightsForm.rights_holder} onChange={e => setRightsForm(f => ({ ...f, rights_holder: e.target.value }))} placeholder="Person or organisation" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Expiry Date</label>
                <input type="date" value={rightsForm.expiry_date} onChange={e => setRightsForm(f => ({ ...f, expiry_date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Licence Terms</label>
                <input value={rightsForm.licence_terms} onChange={e => setRightsForm(f => ({ ...f, licence_terms: e.target.value }))} placeholder="e.g. CC BY-NC 4.0" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Restrictions</label>
              <textarea rows={2} value={rightsForm.restrictions} onChange={e => setRightsForm(f => ({ ...f, restrictions: e.target.value }))} placeholder="Any restrictions on use…" className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Rights In (Held by Museum)</label>
                <input value={rightsForm.rights_in} onChange={e => setRightsForm(f => ({ ...f, rights_in: e.target.value }))} placeholder="Rights the museum holds" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Rights Out (Granted to Others)</label>
                <input value={rightsForm.rights_out} onChange={e => setRightsForm(f => ({ ...f, rights_out: e.target.value }))} placeholder="Rights granted to third parties" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea rows={2} value={rightsForm.notes} onChange={e => setRightsForm(f => ({ ...f, notes: e.target.value }))} className={`${inputCls} resize-none`} />
            </div>
            {canAttach && (
              <div>
                <label className={labelCls}>Supporting Documents</label>
                <StagedDocumentPicker relatedToType="rights" value={stagedRightsDocs} onChange={setStagedRightsDocs} />
              </div>
            )}
            <button type="button" onClick={addRightsRecord} disabled={submitting}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
              {submitting ? 'Saving…' : 'Add rights record →'}
            </button>
          </div>
        )}

        {rightsLoaded && rightsRecords.length > 0 && (
          <div className="mt-4 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Ref</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Holder</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Expiry</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Licence</th>
              </tr></thead>
              <tbody>
                {rightsRecords.map(r => (
                  <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRecord(r)}>
                    <td className="px-4 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{r.rights_reference}</td>
                    <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{r.rights_type}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${r.rights_status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : r.rights_status === 'Expired' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>
                        {r.rights_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{r.rights_holder || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.expiry_date ? new Date(r.expiry_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.licence_terms || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rightsLoaded && rightsRecords.length === 0 && (
          <div className="border border-stone-100 dark:border-stone-800 rounded-lg flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-stone-400 dark:text-stone-500">No rights records for this object.</p>
          </div>
        )}
      </div>

      {/* Reproduction Requests */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Reproduction Requests</div>
        {canEdit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Requester Name *</label><input value={reproductionForm.requester_name} onChange={e => setReproductionForm(f => ({ ...f, requester_name: e.target.value }))} placeholder="Name of person or organisation" className={inputCls} /></div>
              <div><label className={labelCls}>Organisation</label><input value={reproductionForm.requester_org} onChange={e => setReproductionForm(f => ({ ...f, requester_org: e.target.value }))} placeholder="Publisher, university, etc." className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Purpose</label>
                <select value={reproductionForm.purpose} onChange={e => setReproductionForm(f => ({ ...f, purpose: e.target.value }))} className={inputCls}>
                  <option value="">— Select —</option>
                  {['Editorial', 'Academic', 'Commercial', 'Personal', 'Exhibition', 'Other'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Request Date *</label><input type="date" value={reproductionForm.request_date} onChange={e => setReproductionForm(f => ({ ...f, request_date: e.target.value }))} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={reproductionForm.status} onChange={e => setReproductionForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                  {['Pending', 'Approved', 'Declined'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Reproduction Type</label>
                <select value={reproductionForm.reproduction_type} onChange={e => setReproductionForm(f => ({ ...f, reproduction_type: e.target.value }))} className={inputCls}>
                  <option value="">— Select —</option>
                  {REPRODUCTION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Reproduced By</label><input value={reproductionForm.reproduced_by} onChange={e => setReproductionForm(f => ({ ...f, reproduced_by: e.target.value }))} placeholder="Photographer, studio, etc." className={inputCls} /></div>
              <div><label className={labelCls}>Reproduction Date</label><input type="date" value={reproductionForm.reproduction_date} onChange={e => setReproductionForm(f => ({ ...f, reproduction_date: e.target.value }))} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Image / File Reference</label><input value={reproductionForm.image_file_reference} onChange={e => setReproductionForm(f => ({ ...f, image_file_reference: e.target.value }))} placeholder="e.g. IMG-2025-001.tiff" className={inputCls} /></div>
              <div><label className={labelCls}>Credit Line</label><input value={reproductionForm.credit_line} onChange={e => setReproductionForm(f => ({ ...f, credit_line: e.target.value }))} placeholder="Required attribution text" className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><label className={labelCls}>Licence Terms</label><input value={reproductionForm.licence_terms} onChange={e => setReproductionForm(f => ({ ...f, licence_terms: e.target.value }))} placeholder="e.g. One-time use, CC BY" className={inputCls} /></div>
              <div><label className={labelCls}>Fee</label><input type="number" step="0.01" value={reproductionForm.fee} onChange={e => setReproductionForm(f => ({ ...f, fee: e.target.value }))} placeholder="0.00" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Currency</label>
                <select value={reproductionForm.fee_currency} onChange={e => setReproductionForm(f => ({ ...f, fee_currency: e.target.value }))} className={inputCls}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Decision By</label><input value={reproductionForm.decision_by} onChange={e => setReproductionForm(f => ({ ...f, decision_by: e.target.value }))} placeholder="Staff member name" className={inputCls} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
              <input type="checkbox" checked={reproductionForm.rights_clearance_confirmed} onChange={e => setReproductionForm(f => ({ ...f, rights_clearance_confirmed: e.target.checked }))} className="rounded border-stone-300" />
              Rights clearance confirmed
            </label>
            <div><label className={labelCls}>Notes</label><input value={reproductionForm.notes} onChange={e => setReproductionForm(f => ({ ...f, notes: e.target.value }))} placeholder="Usage terms, conditions…" className={inputCls} /></div>
            {canAttach && (
              <div>
                <label className={labelCls}>Supporting Documents</label>
                <StagedDocumentPicker relatedToType="reproduction" value={stagedReproDocs} onChange={setStagedReproDocs} />
              </div>
            )}
            <button type="button" onClick={addReproductionRequest} disabled={!reproductionForm.requester_name || !reproductionForm.request_date || submitting}
              className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
              {submitting ? 'Saving…' : 'Log reproduction request →'}
            </button>
          </div>
        )}

        {reproductionRequestsLoaded && reproductionRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            {reproductionRequests.map(req => (
              <div key={req.id} className="border border-stone-100 dark:border-stone-800 rounded-lg px-4 py-3 flex items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRepro(req)}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{req.requester_name}{req.requester_org && <span className="font-normal text-stone-400 dark:text-stone-500"> — {req.requester_org}</span>}</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {req.reproduction_type && <span>{req.reproduction_type} · </span>}
                    {req.purpose && <span>{req.purpose} · </span>}
                    {new Date(req.request_date + 'T00:00:00').toLocaleDateString('en-GB')}
                    {req.fee && <span> · {req.fee_currency || 'GBP'} {Number(req.fee).toFixed(2)}</span>}
                    {req.credit_line && <span> · {req.credit_line}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {req.rights_clearance_confirmed && <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">Rights ✓</span>}
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : req.status === 'Declined' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{req.status}</span>
                  {canEdit && req.status === 'Pending' && (
                    <>
                      <button onClick={() => updateRequestStatus(req.id, 'Approved')} className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Approve</button>
                      <button onClick={() => updateRequestStatus(req.id, 'Declined')} className="text-xs font-mono text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">Decline</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {reproductionRequestsLoaded && reproductionRequests.length === 0 && (
          <div className="border border-stone-100 dark:border-stone-800 rounded-lg flex flex-col items-center justify-center py-10 text-center">
            <p className="text-xs text-stone-400 dark:text-stone-500">No reproduction requests logged.</p>
          </div>
        )}
      </div>

      {/* Deaccession Record */}
      {form.status === 'Deaccessioned' && (
        <div className="bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 rounded-lg p-6 space-y-4">
          <div className="text-xs uppercase tracking-widest text-amber-600 mb-4">Deaccession Record</div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            This object has been deaccessioned. Formal disposal records should be managed in the{' '}
            <button type="button" onClick={() => router.push('/dashboard/disposal')} className="text-stone-900 dark:text-stone-100 underline hover:no-underline">Disposal register</button>.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Disposal Method</label>
              <select value={form.disposal_method} onChange={e => set('disposal_method', e.target.value)} className={inputCls} disabled={!canEdit}>
                <option value="">— Select —</option>
                {DISPOSAL_METHODS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Disposal Date</label><input type="date" value={form.disposal_date} onChange={e => set('disposal_date', e.target.value)} className={inputCls} disabled={!canEdit} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Authorised By</label><input value={form.disposal_authorization} onChange={e => set('disposal_authorization', e.target.value)} placeholder="Name and role of authorising person" className={inputCls} disabled={!canEdit} /></div>
            <div><label className={labelCls}>Recipient</label><input value={form.disposal_recipient} onChange={e => set('disposal_recipient', e.target.value)} placeholder="Name of receiving party" className={inputCls} disabled={!canEdit} /></div>
          </div>
          <div>
            <label className={labelCls}>Disposal Notes</label>
            <textarea value={form.disposal_note} onChange={e => set('disposal_note', e.target.value)} rows={4} disabled={!canEdit}
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex gap-3 items-center">
          <button type="submit" disabled={saving}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes →'}
          </button>
          <button type="button" onClick={() => router.push('/dashboard')}
            className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800">
            Cancel
          </button>
        </div>
      )}

      {/* Rights Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{selectedRecord.rights_type}</div>
                <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">{selectedRecord.rights_reference}</div>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Status</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedRecord.rights_status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : selectedRecord.rights_status === 'Expired' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{selectedRecord.rights_status}</span>
                </div>
                {selectedRecord.rights_holder && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Rights Holder</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.rights_holder}</div>
                  </div>
                )}
              </div>
              {(selectedRecord.expiry_date || selectedRecord.licence_terms) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.expiry_date && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Expiry Date</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRecord.expiry_date + 'T00:00:00').toLocaleDateString('en-GB')}</div>
                    </div>
                  )}
                  {selectedRecord.licence_terms && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Licence Terms</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.licence_terms}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedRecord.restrictions && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Restrictions</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.restrictions}</div>
                </div>
              )}
              {(selectedRecord.rights_in || selectedRecord.rights_out) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.rights_in && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Rights In</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.rights_in}</div>
                    </div>
                  )}
                  {selectedRecord.rights_out && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Rights Out</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.rights_out}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.notes}</div>
                </div>
              )}
              {canAttach && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Documents</div>
                  <DocumentAttachments objectId={object.id} museumId={museum.id} relatedToType="rights" relatedToId={selectedRecord.id} canEdit={canEdit} canAttach={canAttach} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reproduction Request Detail Modal */}
      {selectedRepro && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRepro(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{selectedRepro.requester_name}</div>
                {selectedRepro.requester_org && <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{selectedRepro.requester_org}</div>}
              </div>
              <button type="button" onClick={() => setSelectedRepro(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Request Date</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRepro.request_date + 'T00:00:00').toLocaleDateString('en-GB')}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Status</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedRepro.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : selectedRepro.status === 'Declined' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{selectedRepro.status}</span>
                </div>
              </div>
              {(selectedRepro.purpose || selectedRepro.reproduction_type) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRepro.purpose && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Purpose</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRepro.purpose}</div>
                    </div>
                  )}
                  {selectedRepro.reproduction_type && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Type</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRepro.reproduction_type}</div>
                    </div>
                  )}
                </div>
              )}
              {(selectedRepro.reproduced_by || selectedRepro.reproduction_date) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRepro.reproduced_by && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Reproduced By</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRepro.reproduced_by}</div>
                    </div>
                  )}
                  {selectedRepro.reproduction_date && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Reproduction Date</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRepro.reproduction_date + 'T00:00:00').toLocaleDateString('en-GB')}</div>
                    </div>
                  )}
                </div>
              )}
              {(selectedRepro.image_file_reference || selectedRepro.credit_line) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRepro.image_file_reference && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">File Reference</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{selectedRepro.image_file_reference}</div>
                    </div>
                  )}
                  {selectedRepro.credit_line && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Credit Line</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRepro.credit_line}</div>
                    </div>
                  )}
                </div>
              )}
              {(selectedRepro.licence_terms || selectedRepro.fee) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRepro.licence_terms && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Licence Terms</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRepro.licence_terms}</div>
                    </div>
                  )}
                  {selectedRepro.fee && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Fee</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{selectedRepro.fee_currency || 'GBP'} {Number(selectedRepro.fee).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}
              {(selectedRepro.decision_by || selectedRepro.decision_date) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRepro.decision_by && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Decision By</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRepro.decision_by}</div>
                    </div>
                  )}
                  {selectedRepro.decision_date && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Decision Date</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRepro.decision_date + 'T00:00:00').toLocaleDateString('en-GB')}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedRepro.rights_clearance_confirmed && (
                <div>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">✓ Rights clearance confirmed</span>
                </div>
              )}
              {selectedRepro.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRepro.notes}</div>
                </div>
              )}
              {canEdit && selectedRepro.status === 'Pending' && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex gap-3">
                  <button onClick={() => updateRequestStatus(selectedRepro.id, 'Approved')} className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">Approve →</button>
                  <button onClick={() => updateRequestStatus(selectedRepro.id, 'Declined')} className="text-xs font-mono text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">Decline →</button>
                </div>
              )}
              {canAttach && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Documents</div>
                  <DocumentAttachments objectId={object.id} museumId={museum.id} relatedToType="reproduction" relatedToId={selectedRepro.id} canEdit={canEdit} canAttach={canAttach} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
