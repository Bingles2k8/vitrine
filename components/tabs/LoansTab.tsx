'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { inputCls, labelCls, sectionTitle, INSURANCE_TYPES, LOAN_STATUSES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'
import type { SupabaseClient } from '@supabase/supabase-js'

interface LoanRecord {
  id: string
  loan_number: string | null
  direction: string | null
  status: string | null
  borrowing_institution: string | null
  contact_name: string | null
  contact_email: string | null
  loan_start_date: string | null
  loan_end_date: string | null
  purpose: string | null
  conditions: string | null
  insurance_type: string | null
  insurance_value: number | null
  environmental_requirements: string | null
  display_requirements: string | null
  courier_transport_arrangements: string | null
  condition_arrival: string | null
  condition_return: string | null
  notes: string | null
  agreement_reference: string | null
  agreement_signed_date: string | null
  lender_object_ref: string | null
  loan_coordinator: string | null
  approved_by: string | null
  borrower_address: string | null
  borrower_phone: string | null
  facility_report_reference: string | null
  object_location_during_loan: string | null
}

const EMPTY_LOAN_EDIT = {
  direction: 'Out', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '', borrower_address: '', borrower_phone: '', facility_report_reference: '', environmental_requirements: '', display_requirements: '', courier_transport_arrangements: '', object_location_during_loan: '',
}

interface LoansTabProps {
  form: Record<string, string | number | boolean | null | undefined>
  set: (field: string, value: string | number | boolean | null) => void
  canEdit: boolean
  object: { id: string; title?: string | null; [key: string]: unknown }
  museum: { id: string; plan: string; [key: string]: unknown }
  supabase: SupabaseClient
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function LoansTab({ form, set, canEdit, object, museum, supabase, logActivity }: LoansTabProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loanHistory, setLoanHistory] = useState<LoanRecord[]>([])
  const [loanLoaded, setLoanLoaded] = useState(false)
  const [loanForm, setLoanForm] = useState({ direction: searchParams.get('direction') === 'In' ? 'In' : 'Out', status: 'Requested', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '', borrower_address: '', borrower_phone: '', facility_report_reference: '', environmental_requirements: '', display_requirements: '', courier_transport_arrangements: '', object_location_during_loan: '' })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [selectedRecord, setSelectedRecord] = useState<LoanRecord | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_LOAN_EDIT)
  const [extending, setExtending] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [endingLoanId, setEndingLoanId] = useState<string | null>(null)
  const [returnLocation, setReturnLocation] = useState('')
  const [returnCondition, setReturnCondition] = useState('')
  const [docsLoanId, setDocsLoanId] = useState<string | null>(null)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const [entryRecord, setEntryRecord] = useState<{ id: string } | null>(null)
  const canAttach = canEdit && getPlan(museum.plan).compliance

  useEffect(() => {
    supabase.from('loans').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
      .then(({ data }: { data: LoanRecord[] | null }) => { setLoanHistory(data || []); setLoanLoaded(true) })
    supabase.from('entry_records').select('id').eq('object_id', object.id).maybeSingle()
      .then(({ data }: { data: { id: string } | null }) => setEntryRecord(data))
  }, [object.id])

  async function addLoan() {
    if (!loanForm.borrowing_institution || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const loanNumber = `LN-${year}-${String(loanHistory.length + 1).padStart(3, '0')}`
    const { data: newLoan, error: loanErr } = await supabase.from('loans').insert({ ...loanForm, object_id: object.id, museum_id: museum.id, loan_number: loanNumber, status: loanForm.status || 'Requested', loan_start_date: loanForm.loan_start_date || null, loan_end_date: loanForm.loan_end_date || null, insurance_value: loanForm.insurance_value ? parseFloat(loanForm.insurance_value) : null, agreement_signed_date: loanForm.agreement_signed_date || null, lender_object_ref: loanForm.direction === 'In' ? (loanForm.lender_object_ref || null) : null, borrower_address: loanForm.borrower_address || null, borrower_phone: loanForm.borrower_phone || null, facility_report_reference: loanForm.facility_report_reference || null, environmental_requirements: loanForm.environmental_requirements || null, display_requirements: loanForm.display_requirements || null, courier_transport_arrangements: loanForm.courier_transport_arrangements || null, object_location_during_loan: loanForm.object_location_during_loan || null }).select('id').single()
    if (loanErr) { toast(loanErr.message, 'error'); setSubmitting(false); return }
    if (loanForm.status === 'Active') {
      await supabase.from('objects').update({ status: 'On Loan' }).eq('id', object.id)
      set('status', 'On Loan')
    }
    if (stagedDocs.length > 0) {
      const failed = await uploadStagedDocs(stagedDocs, object.id, museum.id, 'loan', newLoan.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedDocs([])
    }
    setLoanForm({ direction: 'Out', status: 'Requested', borrowing_institution: '', contact_name: '', contact_email: '', loan_start_date: '', loan_end_date: '', purpose: '', conditions: '', insurance_value: '', notes: '', agreement_reference: '', agreement_signed_date: '', lender_object_ref: '', condition_arrival: '', insurance_type: '', loan_coordinator: '', approved_by: '', borrower_address: '', borrower_phone: '', facility_report_reference: '', environmental_requirements: '', display_requirements: '', courier_transport_arrangements: '', object_location_during_loan: '' })
    const { data } = await supabase.from('loans').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setLoanHistory(data || [])
    router.refresh()
    logActivity('loan_added', `Recorded loan for "${object.title}" to ${loanForm.borrowing_institution}`)
    setSubmitting(false)
  }

  function closeModal() {
    setSelectedRecord(null)
    setEditing(false)
    setExtending(false)
  }

  function openEditLoan() {
    if (!selectedRecord) return
    setEditForm({
      direction: selectedRecord.direction || 'Out',
      borrowing_institution: selectedRecord.borrowing_institution || '',
      contact_name: selectedRecord.contact_name || '',
      contact_email: selectedRecord.contact_email || '',
      loan_start_date: selectedRecord.loan_start_date || '',
      loan_end_date: selectedRecord.loan_end_date || '',
      purpose: selectedRecord.purpose || '',
      conditions: selectedRecord.conditions || '',
      insurance_value: selectedRecord.insurance_value != null ? String(selectedRecord.insurance_value) : '',
      notes: selectedRecord.notes || '',
      agreement_reference: selectedRecord.agreement_reference || '',
      agreement_signed_date: selectedRecord.agreement_signed_date || '',
      lender_object_ref: selectedRecord.lender_object_ref || '',
      condition_arrival: selectedRecord.condition_arrival || '',
      insurance_type: selectedRecord.insurance_type || '',
      loan_coordinator: selectedRecord.loan_coordinator || '',
      approved_by: selectedRecord.approved_by || '',
      borrower_address: selectedRecord.borrower_address || '',
      borrower_phone: selectedRecord.borrower_phone || '',
      facility_report_reference: selectedRecord.facility_report_reference || '',
      environmental_requirements: selectedRecord.environmental_requirements || '',
      display_requirements: selectedRecord.display_requirements || '',
      courier_transport_arrangements: selectedRecord.courier_transport_arrangements || '',
      object_location_during_loan: selectedRecord.object_location_during_loan || '',
    })
    setExtending(false)
    setEditing(true)
  }

  async function saveLoanEdit() {
    if (!selectedRecord || !editForm.borrowing_institution || submitting) return
    setSubmitting(true)
    const payload = {
      direction: editForm.direction,
      borrowing_institution: editForm.borrowing_institution,
      contact_name: editForm.contact_name || null,
      contact_email: editForm.contact_email || null,
      loan_start_date: editForm.loan_start_date || null,
      loan_end_date: editForm.loan_end_date || null,
      purpose: editForm.purpose || null,
      conditions: editForm.conditions || null,
      insurance_value: editForm.insurance_value ? parseFloat(editForm.insurance_value) : null,
      notes: editForm.notes || null,
      agreement_reference: editForm.agreement_reference || null,
      agreement_signed_date: editForm.agreement_signed_date || null,
      lender_object_ref: editForm.direction === 'In' ? (editForm.lender_object_ref || null) : null,
      condition_arrival: editForm.condition_arrival || null,
      insurance_type: editForm.insurance_type || null,
      loan_coordinator: editForm.loan_coordinator || null,
      approved_by: editForm.approved_by || null,
      borrower_address: editForm.borrower_address || null,
      borrower_phone: editForm.borrower_phone || null,
      facility_report_reference: editForm.facility_report_reference || null,
      environmental_requirements: editForm.environmental_requirements || null,
      display_requirements: editForm.display_requirements || null,
      courier_transport_arrangements: editForm.courier_transport_arrangements || null,
      object_location_during_loan: editForm.object_location_during_loan || null,
    }
    const { error } = await supabase.from('loans').update(payload).eq('id', selectedRecord.id)
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    const updated = { ...selectedRecord, ...payload }
    setLoanHistory(h => h.map(l => l.id === selectedRecord.id ? updated : l))
    setSelectedRecord(updated)
    setEditing(false)
    setSubmitting(false)
  }

  async function deleteLoan() {
    if (!selectedRecord || submitting) return
    if (!confirm('Delete this loan record? This cannot be undone.')) return
    setSubmitting(true)
    const { error } = await supabase.from('loans').delete().eq('id', selectedRecord.id)
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    setLoanHistory(h => h.filter(l => l.id !== selectedRecord.id))
    closeModal()
    setSubmitting(false)
  }

  function promptExtendLoan() {
    if (!selectedRecord) return
    setExtendDate(selectedRecord.loan_end_date || '')
    setEditing(false)
    setExtending(true)
  }

  async function renewLoan() {
    if (!selectedRecord || submitting) return
    setSubmitting(true)
    const payload = { loan_end_date: extendDate || null, status: 'Extended' }
    const { error } = await supabase.from('loans').update(payload).eq('id', selectedRecord.id)
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    const updated = { ...selectedRecord, ...payload }
    setLoanHistory(h => h.map(l => l.id === selectedRecord.id ? updated : l))
    setSelectedRecord(updated)
    setExtending(false)
    logActivity('loan_extended', `Extended loan ${selectedRecord.loan_number || ''} for "${object.title}"`)
    setSubmitting(false)
  }

  async function cancelLoan() {
    if (!selectedRecord || submitting) return
    if (!confirm('Cancel this loan? Its status will be set to Cancelled.')) return
    setSubmitting(true)
    const { error } = await supabase.from('loans').update({ status: 'Cancelled' }).eq('id', selectedRecord.id)
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    const updated = { ...selectedRecord, status: 'Cancelled' }
    setLoanHistory(h => h.map(l => l.id === selectedRecord.id ? updated : l))
    setSelectedRecord(updated)
    setSubmitting(false)
  }

  function promptEndLoan(loanId: string) {
    setEndingLoanId(loanId)
    setReturnLocation((form.current_location as string) || '')
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
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
          This object is currently on loan — the active loan record is highlighted below.
        </div>
      )}


      {canEdit && <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Add Loan Record</div>
        <div>
          <label className={labelCls} data-learn="loans.direction">Direction</label>
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
        <div>
          <label className={labelCls} data-learn="loans.status">Status</label>
          <div className="flex gap-2 flex-wrap">
            {LOAN_STATUSES.filter(s => s !== 'Cancelled' && s !== 'Returned').map(s => (
              <button key={s} type="button" onClick={() => setLoanForm(f => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${loanForm.status === s ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls} data-learn="loans.borrowing_institution">Institution *</label><input value={loanForm.borrowing_institution} onChange={e => setLoanForm(f => ({ ...f, borrowing_institution: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls} data-learn="loans.contact_name">Contact Name</label><input value={loanForm.contact_name} onChange={e => setLoanForm(f => ({ ...f, contact_name: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls} data-learn="loans.contact_email">Contact Email</label><input type="email" value={loanForm.contact_email} onChange={e => setLoanForm(f => ({ ...f, contact_email: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls} data-learn="loans.insurance_value">Insurance Value (£)</label><input type="number" value={loanForm.insurance_value} onChange={e => setLoanForm(f => ({ ...f, insurance_value: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>{loanForm.direction === 'In' ? 'Lender Address' : 'Borrower Address'}</label><textarea value={loanForm.borrower_address} onChange={e => setLoanForm(f => ({ ...f, borrower_address: e.target.value }))} rows={2} placeholder="Full postal address" className={`${inputCls} resize-none`} /></div>
          <div><label className={labelCls}>{loanForm.direction === 'In' ? 'Lender Phone' : 'Borrower Phone'}</label><input value={loanForm.borrower_phone} onChange={e => setLoanForm(f => ({ ...f, borrower_phone: e.target.value }))} placeholder="Phone number" className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls} data-learn="loans.loan_start_date">Loan Start</label><input type="date" value={loanForm.loan_start_date} onChange={e => setLoanForm(f => ({ ...f, loan_start_date: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls} data-learn="loans.loan_end_date">Expected Return</label><input type="date" value={loanForm.loan_end_date} onChange={e => setLoanForm(f => ({ ...f, loan_end_date: e.target.value }))} className={inputCls} /></div>
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
        <div><label className={labelCls} data-learn="loans.conditions">Special Conditions</label><textarea value={loanForm.conditions} onChange={e => setLoanForm(f => ({ ...f, conditions: e.target.value }))} rows={2} className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" /></div>
        <div><label className={labelCls} data-learn="loans.purpose">Purpose of Loan</label><textarea value={loanForm.purpose} onChange={e => setLoanForm(f => ({ ...f, purpose: e.target.value }))} rows={2} placeholder="e.g. Exhibition loan for summer 2026 display" className={`${inputCls} resize-none`} /></div>
        {canAttach && (
          <div>
            <label className={labelCls}>Supporting Documents</label>
            <StagedDocumentPicker relatedToType="loan" value={stagedDocs} onChange={setStagedDocs} />
          </div>
        )}
        <button type="button" onClick={addLoan} disabled={submitting}
          className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save loan record →'}
        </button>
      </div>}

      {canAttach && entryRecord && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle} style={{marginBottom: 8}}>Entry Record Documents</div>
          <DocumentAttachments
            objectId={object.id}
            museumId={museum.id}
            relatedToType="entry_record"
            relatedToId={entryRecord.id}
            canEdit={canEdit}
            canAttach={canAttach}
          />
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!submitting) closeModal() }}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{selectedRecord.borrowing_institution}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">Loan {selectedRecord.direction}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${selectedRecord.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : selectedRecord.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : selectedRecord.status === 'Agreed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : selectedRecord.status === 'Cancelled' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>{selectedRecord.status}</span>
                  {selectedRecord.loan_number && <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{selectedRecord.loan_number}</span>}
                </div>
              </div>
              <button type="button" onClick={() => { if (!submitting) closeModal() }} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            {editing ? (
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Direction</label>
                <div className="flex gap-2">
                  {['Out','In'].map(d => (
                    <button key={d} type="button" onClick={() => setEditForm(f => ({ ...f, direction: d }))}
                      className={`px-4 py-1.5 rounded text-xs font-mono border transition-all ${editForm.direction === d ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                      Loan {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Institution *</label><input value={editForm.borrowing_institution} onChange={e => setEditForm(f => ({ ...f, borrowing_institution: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Contact Name</label><input value={editForm.contact_name} onChange={e => setEditForm(f => ({ ...f, contact_name: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Contact Email</label><input type="email" value={editForm.contact_email} onChange={e => setEditForm(f => ({ ...f, contact_email: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Insurance Value (£)</label><input type="number" value={editForm.insurance_value} onChange={e => setEditForm(f => ({ ...f, insurance_value: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>{editForm.direction === 'In' ? 'Lender Address' : 'Borrower Address'}</label><textarea value={editForm.borrower_address} onChange={e => setEditForm(f => ({ ...f, borrower_address: e.target.value }))} rows={2} placeholder="Full postal address" className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>{editForm.direction === 'In' ? 'Lender Phone' : 'Borrower Phone'}</label><input value={editForm.borrower_phone} onChange={e => setEditForm(f => ({ ...f, borrower_phone: e.target.value }))} placeholder="Phone number" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Loan Start</label><input type="date" value={editForm.loan_start_date} onChange={e => setEditForm(f => ({ ...f, loan_start_date: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Expected Return</label><input type="date" value={editForm.loan_end_date} onChange={e => setEditForm(f => ({ ...f, loan_end_date: e.target.value }))} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Agreement Reference</label><input value={editForm.agreement_reference} onChange={e => setEditForm(f => ({ ...f, agreement_reference: e.target.value }))} placeholder="Loan agreement document ref" className={inputCls} /></div>
                <div><label className={labelCls}>Agreement Signed Date</label><input type="date" value={editForm.agreement_signed_date} onChange={e => setEditForm(f => ({ ...f, agreement_signed_date: e.target.value }))} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Facility Report Reference</label><input value={editForm.facility_report_reference} onChange={e => setEditForm(f => ({ ...f, facility_report_reference: e.target.value }))} placeholder="Reference to the borrower's facility report" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Environmental Requirements</label><textarea value={editForm.environmental_requirements} onChange={e => setEditForm(f => ({ ...f, environmental_requirements: e.target.value }))} rows={2} placeholder="Temperature, humidity, light levels…" className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Display Requirements</label><textarea value={editForm.display_requirements} onChange={e => setEditForm(f => ({ ...f, display_requirements: e.target.value }))} rows={2} placeholder="Case type, mount, distance from viewer…" className={`${inputCls} resize-none`} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Courier / Transport Arrangements</label><textarea value={editForm.courier_transport_arrangements} onChange={e => setEditForm(f => ({ ...f, courier_transport_arrangements: e.target.value }))} rows={2} placeholder="Courier requirements, transport method…" className={`${inputCls} resize-none`} /></div>
                <div><label className={labelCls}>Object Location During Loan</label><input value={editForm.object_location_during_loan} onChange={e => setEditForm(f => ({ ...f, object_location_during_loan: e.target.value }))} placeholder="Where the object will be held" className={inputCls} /></div>
              </div>
              {editForm.direction === 'In' && (
                <div><label className={labelCls}>Lender&apos;s Object Reference</label><input value={editForm.lender_object_ref} onChange={e => setEditForm(f => ({ ...f, lender_object_ref: e.target.value }))} placeholder="Lender's own catalogue or accession number" className={inputCls} /></div>
              )}
              <div>
                <label className={labelCls}>Insurance Type</label>
                <div className="flex gap-2 flex-wrap">
                  {INSURANCE_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setEditForm(f => ({ ...f, insurance_type: t }))}
                      className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${editForm.insurance_type === t ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Loan Coordinator</label><input value={editForm.loan_coordinator} onChange={e => setEditForm(f => ({ ...f, loan_coordinator: e.target.value }))} placeholder="Staff member managing this loan" className={inputCls} /></div>
                <div><label className={labelCls}>Approved By</label><input value={editForm.approved_by} onChange={e => setEditForm(f => ({ ...f, approved_by: e.target.value }))} placeholder="Authorising person or body" className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>Condition at {editForm.direction === 'In' ? 'Arrival' : 'Exit'}</label><textarea value={editForm.condition_arrival} onChange={e => setEditForm(f => ({ ...f, condition_arrival: e.target.value }))} rows={2} placeholder="Record condition when object left / arrived" className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Special Conditions</label><textarea value={editForm.conditions} onChange={e => setEditForm(f => ({ ...f, conditions: e.target.value }))} rows={2} className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Purpose of Loan</label><textarea value={editForm.purpose} onChange={e => setEditForm(f => ({ ...f, purpose: e.target.value }))} rows={2} placeholder="e.g. Exhibition loan for summer 2026 display" className={`${inputCls} resize-none`} /></div>
              <div><label className={labelCls}>Notes</label><textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={saveLoanEdit} disabled={!editForm.borrowing_institution || submitting}
                  className="flex-1 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono py-2.5 rounded disabled:opacity-50">
                  {submitting ? 'Saving…' : 'Save →'}
                </button>
                <button type="button" onClick={() => setEditing(false)} disabled={submitting}
                  className="flex-1 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </div>
            ) : (
            <div className="p-6 space-y-4">
              {(selectedRecord.loan_start_date || selectedRecord.loan_end_date) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.loan_start_date && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Start Date</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRecord.loan_start_date).toLocaleDateString('en-GB')}</div>
                    </div>
                  )}
                  {selectedRecord.loan_end_date && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Expected Return</div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRecord.loan_end_date).toLocaleDateString('en-GB')}</div>
                    </div>
                  )}
                </div>
              )}
              {(selectedRecord.contact_name || selectedRecord.contact_email) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.contact_name && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Contact</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.contact_name}</div>
                    </div>
                  )}
                  {selectedRecord.contact_email && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Email</div>
                      <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.contact_email}</div>
                    </div>
                  )}
                </div>
              )}
              {selectedRecord.purpose && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Purpose</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.purpose}</div>
                </div>
              )}
              {selectedRecord.insurance_type && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Insurance Type</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.insurance_type}</div>
                </div>
              )}
              {selectedRecord.insurance_value && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Insurance Value</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">£{Number(selectedRecord.insurance_value).toLocaleString('en-GB')}</div>
                </div>
              )}
              {selectedRecord.conditions && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Special Conditions</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.conditions}</div>
                </div>
              )}
              {selectedRecord.environmental_requirements && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Environmental Requirements</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.environmental_requirements}</div>
                </div>
              )}
              {selectedRecord.display_requirements && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Display Requirements</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.display_requirements}</div>
                </div>
              )}
              {selectedRecord.courier_transport_arrangements && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Courier / Transport</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.courier_transport_arrangements}</div>
                </div>
              )}
              {selectedRecord.condition_arrival && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Condition at {selectedRecord.direction === 'In' ? 'Arrival' : 'Exit'}</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.condition_arrival}</div>
                </div>
              )}
              {selectedRecord.condition_return && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Condition on Return</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.condition_return}</div>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.notes}</div>
                </div>
              )}
              {extending && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Renew / extend loan</div>
                  <div>
                    <label className={labelCls}>New expected return date</label>
                    <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)} className={inputCls} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={renewLoan} disabled={submitting}
                      className="flex-1 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono py-2.5 rounded disabled:opacity-50">
                      {submitting ? 'Saving…' : 'Confirm extension →'}
                    </button>
                    <button type="button" onClick={() => setExtending(false)} disabled={submitting}
                      className="flex-1 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-stone-500">Loans are immutable — extending keeps the record and marks it Extended.</p>
                </div>
              )}
              {canEdit && !extending && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <button type="button" onClick={openEditLoan}
                    className="flex-1 min-w-[100px] bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono py-2.5 rounded">
                    Edit
                  </button>
                  <button type="button" onClick={deleteLoan}
                    className="flex-1 min-w-[100px] border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:border-red-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    Delete
                  </button>
                  {(selectedRecord.status === 'Active' || selectedRecord.status === 'Extended') && (
                    <button type="button" onClick={promptExtendLoan}
                      className="flex-1 min-w-[100px] border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                      Renew / extend →
                    </button>
                  )}
                  {selectedRecord.status === 'Active' && (
                    <button type="button" onClick={() => { promptEndLoan(selectedRecord.id); closeModal() }}
                      className="flex-1 min-w-[100px] border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                      End loan →
                    </button>
                  )}
                  {(selectedRecord.status === 'Requested' || selectedRecord.status === 'Agreed') && (
                    <button type="button" onClick={cancelLoan}
                      className="flex-1 min-w-[100px] border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono py-2.5 rounded hover:border-red-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      Cancel loan
                    </button>
                  )}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      )}

      {loanLoaded && loanHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Loan History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Loan No.</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Direction</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Institution</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Dates</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Status</th>
              <th className="px-4 py-4"></th>
            </tr></thead>
            <tbody>
              {loanHistory.map(l => (
                <Fragment key={l.id}>
                  <tr className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer ${l.status === 'Active' ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''}`} onClick={() => { setEditing(false); setExtending(false); setSelectedRecord(l) }}>
                    <td className="px-6 py-4 text-xs font-mono text-stone-600 dark:text-stone-400">{l.loan_number || '—'}</td>
                    <td className="px-6 py-4"><span className="text-xs font-mono px-2 py-1 rounded bg-stone-100 text-stone-600">Loan {l.direction}</span></td>
                    <td className="px-4 py-4 text-sm text-stone-900 dark:text-stone-100">{l.borrowing_institution}</td>
                    <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">
                      {l.loan_start_date ? new Date(l.loan_start_date).toLocaleDateString('en-GB') : '—'}
                      {' → '}
                      {l.loan_end_date ? new Date(l.loan_end_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${l.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : l.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : l.status === 'Agreed' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' : l.status === 'Cancelled' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3">
                        {canEdit && l.status === 'Requested' && (
                          <button type="button" onClick={async () => { await supabase.from('loans').update({ status: 'Agreed' }).eq('id', l.id); setLoanHistory(h => h.map(x => x.id === l.id ? { ...x, status: 'Agreed' } : x)) }} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">Mark Agreed →</button>
                        )}
                        {canEdit && l.status === 'Agreed' && (
                          <button type="button" onClick={async () => { await supabase.from('loans').update({ status: 'Active' }).eq('id', l.id); await supabase.from('objects').update({ status: 'On Loan' }).eq('id', object.id); set('status', 'On Loan'); setLoanHistory(h => h.map(x => x.id === l.id ? { ...x, status: 'Active' } : x)) }} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">Mark Active →</button>
                        )}
                        {canEdit && l.status === 'Active' && (
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
                            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-xs font-mono px-4 py-2 rounded whitespace-nowrap"
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
