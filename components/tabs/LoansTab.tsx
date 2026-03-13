'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { inputCls, labelCls, sectionTitle, INSURANCE_TYPES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'

interface LoansTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function LoansTab({ form, set, canEdit, object, museum, supabase, logActivity }: LoansTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loanHistory, setLoanHistory] = useState<any[]>([])
  const [loanLoaded, setLoanLoaded] = useState(false)
  const [loanForm, setLoanForm] = useState({ direction: searchParams.get('direction') === 'In' ? 'In' : 'Out', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '', borrower_address: '', borrower_phone: '', facility_report_reference: '', environmental_requirements: '', display_requirements: '', courier_transport_arrangements: '', object_location_during_loan: '' })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [endingLoanId, setEndingLoanId] = useState<string | null>(null)
  const [returnLocation, setReturnLocation] = useState('')
  const [returnCondition, setReturnCondition] = useState('')
  const [docsLoanId, setDocsLoanId] = useState<string | null>(null)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const canAttach = canEdit && getPlan(museum.plan).compliance

  useEffect(() => {
    supabase.from('loans').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setLoanHistory(data || []); setLoanLoaded(true) })
  }, [object.id])

  async function addLoan() {
    if (!loanForm.borrowing_institution || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const loanNumber = `LN-${year}-${String(loanHistory.length + 1).padStart(3, '0')}`
    const { data: newLoan, error: loanErr } = await supabase.from('loans').insert({ ...loanForm, object_id: object.id, museum_id: museum.id, loan_number: loanNumber, loan_start_date: loanForm.loan_start_date || null, loan_end_date: loanForm.loan_end_date || null, insurance_value: loanForm.insurance_value ? parseFloat(loanForm.insurance_value) : null, agreement_signed_date: loanForm.agreement_signed_date || null, lender_object_ref: loanForm.direction === 'In' ? (loanForm.lender_object_ref || null) : null, borrower_address: loanForm.borrower_address || null, borrower_phone: loanForm.borrower_phone || null, facility_report_reference: loanForm.facility_report_reference || null, environmental_requirements: loanForm.environmental_requirements || null, display_requirements: loanForm.display_requirements || null, courier_transport_arrangements: loanForm.courier_transport_arrangements || null, object_location_during_loan: loanForm.object_location_during_loan || null }).select('id').single()
    if (loanErr) { toast(loanErr.message, 'error'); setSubmitting(false); return }
    await supabase.from('objects').update({ status: 'On Loan' }).eq('id', object.id)
    set('status', 'On Loan')
    if (stagedDocs.length > 0) {
      await uploadStagedDocs(supabase, stagedDocs, object.id, museum.id, 'loan', newLoan.id)
      setStagedDocs([])
    }
    setLoanForm({ direction: 'Out', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '', borrower_address: '', borrower_phone: '', facility_report_reference: '', environmental_requirements: '', display_requirements: '', courier_transport_arrangements: '', object_location_during_loan: '' })
    const { data } = await supabase.from('loans').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setLoanHistory(data || [])
    router.refresh()
    logActivity('loan_added', `Recorded loan for "${object.title}" to ${loanForm.borrowing_institution}`)
    setSubmitting(false)
  }

  function promptEndLoan(loanId: string) {
    setEndingLoanId(loanId)
    setReturnLocation(form.current_location || '')
    setReturnCondition('')
  }

  async function confirmEndLoan(loanId: string) {
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('loans').update({ status: 'Returned', condition_return: returnCondition || null, return_confirmed: true, return_confirmed_date: today }).eq('id', loanId)
    await supabase.from('objects').update({ status: 'Storage', current_location: returnLocation }).eq('id', object.id)
    if (returnLocation) {
      await supabase.from('location_history').insert({
        object_id: object.id, museum_id: museum.id,
        location: returnLocation, reason: 'Loan', moved_by: '',
      })
    }
    set('status', 'Storage')
    set('current_location', returnLocation)
    setLoanHistory(h => h.map(l => l.id === loanId ? { ...l, status: 'Returned' } : l))
    setEndingLoanId(null)
    router.refresh()
  }

  return (
    <>
      {form.status === 'On Loan' && loanHistory.some(l => l.status === 'Active') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
          This object is currently on loan — the active loan record is highlighted below.
        </div>
      )}


      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Add Loan Record (Procedures 4 &amp; 5)</div>
        <div>
          <label className={labelCls}>Direction</label>
          <div className="flex gap-2">
            {['Out','In'].map(d => (
              <button key={d} type="button" onClick={() => setLoanForm(f => ({ ...f, direction: d }))}
                className={`px-4 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.direction === d ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                Loan {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{loanForm.direction === 'Out' ? 'We lend this object to another institution' : 'Another institution lends this object to us'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Institution *</label><input value={loanForm.borrowing_institution} onChange={e => setLoanForm(f => ({ ...f, borrowing_institution: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Contact Name</label><input value={loanForm.contact_name} onChange={e => setLoanForm(f => ({ ...f, contact_name: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Contact Email</label><input type="email" value={loanForm.contact_email} onChange={e => setLoanForm(f => ({ ...f, contact_email: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Insurance Value (£)</label><input type="number" value={loanForm.insurance_value} onChange={e => setLoanForm(f => ({ ...f, insurance_value: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Borrower Address</label><textarea value={loanForm.borrower_address} onChange={e => setLoanForm(f => ({ ...f, borrower_address: e.target.value }))} rows={2} placeholder="Full postal address" className={`${inputCls} resize-none`} /></div>
          <div><label className={labelCls}>Borrower Phone</label><input value={loanForm.borrower_phone} onChange={e => setLoanForm(f => ({ ...f, borrower_phone: e.target.value }))} placeholder="Phone number" className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Loan Start</label><input type="date" value={loanForm.loan_start_date} onChange={e => setLoanForm(f => ({ ...f, loan_start_date: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Expected Return</label><input type="date" value={loanForm.loan_end_date} onChange={e => setLoanForm(f => ({ ...f, loan_end_date: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Agreement Reference</label><input value={loanForm.agreement_reference} onChange={e => setLoanForm(f => ({ ...f, agreement_reference: e.target.value }))} placeholder="Loan agreement document ref" className={inputCls} /></div>
          <div><label className={labelCls}>Agreement Signed Date</label><input type="date" value={loanForm.agreement_signed_date} onChange={e => setLoanForm(f => ({ ...f, agreement_signed_date: e.target.value }))} className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Facility Report Reference</label><input value={loanForm.facility_report_reference} onChange={e => setLoanForm(f => ({ ...f, facility_report_reference: e.target.value }))} placeholder="Reference to the borrower's facility report" className={inputCls} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Environmental Requirements</label><textarea value={loanForm.environmental_requirements} onChange={e => setLoanForm(f => ({ ...f, environmental_requirements: e.target.value }))} rows={2} placeholder="Temperature, humidity, light levels…" className={`${inputCls} resize-none`} /></div>
          <div><label className={labelCls}>Display Requirements</label><textarea value={loanForm.display_requirements} onChange={e => setLoanForm(f => ({ ...f, display_requirements: e.target.value }))} rows={2} placeholder="Case type, mount, distance from viewer…" className={`${inputCls} resize-none`} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Courier / Transport Arrangements</label><textarea value={loanForm.courier_transport_arrangements} onChange={e => setLoanForm(f => ({ ...f, courier_transport_arrangements: e.target.value }))} rows={2} placeholder="Courier requirements, transport method…" className={`${inputCls} resize-none`} /></div>
          <div><label className={labelCls}>Object Location During Loan</label><input value={loanForm.object_location_during_loan} onChange={e => setLoanForm(f => ({ ...f, object_location_during_loan: e.target.value }))} placeholder="Where the object will be held" className={inputCls} /></div>
        </div>
        {loanForm.direction === 'In' && (
          <div><label className={labelCls}>Lender&apos;s Object Reference</label><input value={loanForm.lender_object_ref} onChange={e => setLoanForm(f => ({ ...f, lender_object_ref: e.target.value }))} placeholder="Lender's own catalogue or accession number" className={inputCls} /></div>
        )}
        <div>
          <label className={labelCls}>Insurance Type</label>
          <div className="flex gap-2 flex-wrap">
            {INSURANCE_TYPES.map(t => (
              <button key={t} type="button" onClick={() => setLoanForm(f => ({ ...f, insurance_type: t }))}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.insurance_type === t ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Loan Coordinator</label><input value={loanForm.loan_coordinator} onChange={e => setLoanForm(f => ({ ...f, loan_coordinator: e.target.value }))} placeholder="Staff member managing this loan" className={inputCls} /></div>
          <div><label className={labelCls}>Approved By</label><input value={loanForm.approved_by} onChange={e => setLoanForm(f => ({ ...f, approved_by: e.target.value }))} placeholder="Authorising person or body" className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Condition at {loanForm.direction === 'In' ? 'Arrival' : 'Exit'}</label><textarea value={loanForm.condition_arrival} onChange={e => setLoanForm(f => ({ ...f, condition_arrival: e.target.value }))} rows={2} placeholder="Record condition when object left / arrived" className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" /></div>
        <div><label className={labelCls}>Special Conditions</label><textarea value={loanForm.conditions} onChange={e => setLoanForm(f => ({ ...f, conditions: e.target.value }))} rows={2} className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" /></div>
        {canAttach && (
          <div>
            <label className={labelCls}>Supporting Documents</label>
            <StagedDocumentPicker relatedToType="loan" value={stagedDocs} onChange={setStagedDocs} />
          </div>
        )}
        <button type="button" onClick={addLoan} disabled={submitting}
          className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
          {submitting ? 'Saving…' : 'Save loan record →'}
        </button>
      </div>

      {loanLoaded && loanHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Loan History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Loan No.</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Direction</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Institution</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {loanHistory.map(l => (
                <Fragment key={l.id}>
                  <tr className={`border-b border-stone-100 dark:border-stone-800 ${l.status === 'Active' ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}`}>
                    <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{l.loan_number || '—'}</td>
                    <td className="px-6 py-3"><span className="text-xs font-mono px-2 py-1 rounded bg-stone-100 text-stone-600">Loan {l.direction}</span></td>
                    <td className="px-4 py-3 text-sm text-stone-900 dark:text-stone-100">{l.borrowing_institution}</td>
                    <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                      {l.loan_start_date ? new Date(l.loan_start_date).toLocaleDateString('en-GB') : '—'}
                      {' → '}
                      {l.loan_end_date ? new Date(l.loan_end_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${l.status === 'Active' ? 'bg-amber-50 text-amber-700' : l.status === 'Returned' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {l.status === 'Active' && (
                          endingLoanId === l.id
                            ? <button type="button" onClick={() => setEndingLoanId(null)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">Cancel</button>
                            : <button type="button" onClick={() => promptEndLoan(l.id)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">End loan →</button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDocsLoanId(docsLoanId === l.id ? null : l.id)}
                          className="text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-300 dark:border-stone-600 hover:border-stone-900 dark:hover:border-stone-300 rounded px-2 py-0.5 transition-colors"
                        >
                          {docsLoanId === l.id ? 'Hide attachments' : '📎 Attachments'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {endingLoanId === l.id && (
                    <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                      <td colSpan={6} className="px-6 py-4 space-y-3">
                        <div className="text-xs uppercase tracking-widest text-stone-400">Confirm Return</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">Return location</label>
                            <input
                              type="text"
                              value={returnLocation}
                              onChange={e => setReturnLocation(e.target.value)}
                              placeholder="e.g. Gallery 3, Cabinet A"
                              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-stone-400 mb-1">Condition on return</label>
                            <input
                              type="text"
                              value={returnCondition}
                              onChange={e => setReturnCondition(e.target.value)}
                              placeholder="e.g. Good — minor surface dust"
                              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => confirmEndLoan(l.id)}
                            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded whitespace-nowrap"
                          >
                            Confirm return
                          </button>
                          <p className="text-xs text-stone-400">Marks the loan returned, sets status to Storage, and logs a location change.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {docsLoanId === l.id && (
                    <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                      <td colSpan={6} className="px-6 py-4">
                        <DocumentAttachments
                          objectId={object.id}
                          museumId={museum.id}
                          relatedToType="loan"
                          relatedToId={l.id}
                          canEdit={canEdit}
                          canAttach={canAttach}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
