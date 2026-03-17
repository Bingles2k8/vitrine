'use client'

import { useState, useEffect } from 'react'
import { inputCls, labelCls, sectionTitle, ENTRY_REASONS, ENTRY_OUTCOMES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import { getPlan } from '@/lib/plans'

const ENTRY_METHODS = ['In person', 'Courier', 'Post / carrier', 'Found in collection', 'Digital transfer']

interface EntryTabProps {
  object: any
  museum: any
  canEdit: boolean
  supabase: any
}

export default function EntryTab({ object, museum, canEdit, supabase }: EntryTabProps) {
  const { toast } = useToast()
  const [entryRecord, setEntryRecord] = useState<any>(null)
  const [entryLoaded, setEntryLoaded] = useState(false)
  const [savingEntry, setSavingEntry] = useState(false)
  const [entryForm, setEntryForm] = useState<Record<string, any>>({
    entry_number: '',
    entry_date: '',
    depositor_name: '',
    depositor_contact: '',
    gdpr_consent: false,
    gdpr_consent_date: '',
    entry_reason: '',
    object_description: '',
    object_count: 1,
    legal_owner: '',
    terms_accepted: false,
    terms_accepted_date: '',
    liability_statement: '',
    receipt_issued: false,
    receipt_date: '',
    outcome: '',
    received_by: '',
    risk_notes: '',
    quarantine_required: false,
    notes: '',
    entry_method: '',
    scheduled_return_date: '',
    condition_on_entry: '',
  })

  const today = new Date().toISOString().slice(0, 10)

  const setE = (field: string, value: any) => {
    setEntryForm(prev => ({ ...prev, [field]: value }))
    // field changed
  }

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('entry_records')
        .select('*')
        .eq('object_id', object.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        toast(error.message, 'error')
      } else if (data) {
        setEntryRecord(data)
        setEntryForm({
          entry_number: data.entry_number || '',
          entry_date: data.entry_date || '',
          depositor_name: data.depositor_name || '',
          depositor_contact: data.depositor_contact || '',
          gdpr_consent: data.gdpr_consent || false,
          gdpr_consent_date: data.gdpr_consent_date || '',
          entry_reason: data.entry_reason || '',
          object_description: data.object_description || '',
          object_count: data.object_count || 1,
          legal_owner: data.legal_owner || '',
          terms_accepted: data.terms_accepted || false,
          terms_accepted_date: data.terms_accepted_date || '',
          liability_statement: data.liability_statement || '',
          receipt_issued: data.receipt_issued || false,
          receipt_date: data.receipt_date || '',
          outcome: data.outcome || '',
          received_by: data.received_by || '',
          risk_notes: data.risk_notes || '',
          quarantine_required: data.quarantine_required || false,
          notes: data.notes || '',
          entry_method: data.entry_method || '',
          scheduled_return_date: data.scheduled_return_date || '',
          condition_on_entry: data.condition_on_entry || '',
        })
      }
      setEntryLoaded(true)
    }
    load()
  }, [object.id])

  async function saveEntry() {
    if (!entryRecord) return
    setSavingEntry(true)

    const payload = { ...entryForm }
    if (payload.terms_accepted && !payload.terms_accepted_date) payload.terms_accepted_date = today
    if (payload.receipt_issued && !payload.receipt_date) payload.receipt_date = today

    const { error } = await supabase
      .from('entry_records')
      .update(payload)
      .eq('id', entryRecord.id)

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Entry record saved')
    }
    setSavingEntry(false)
  }

  if (!entryLoaded) {
    return <p className="text-sm text-stone-400 dark:text-stone-500 py-8 text-center">Loading entry record…</p>
  }

  if (!entryRecord) {
    return <p className="text-sm text-stone-400 dark:text-stone-500 py-8 text-center">No entry record linked</p>
  }

  return (
    <>
      {/* Card 1 — Entry Record */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Entry Record — {entryRecord.entry_number}</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Entry Number</label>
            <input value={entryForm.entry_number} onChange={e => setE('entry_number', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Entry Date</label>
            <input type="date" value={entryForm.entry_date} onChange={e => setE('entry_date', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Entry Reason</label>
            <select value={entryForm.entry_reason} onChange={e => setE('entry_reason', e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {ENTRY_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Outcome</label>
            <select value={entryForm.outcome} onChange={e => setE('outcome', e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {ENTRY_OUTCOMES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Entry Method</label>
            <select value={entryForm.entry_method} onChange={e => setE('entry_method', e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {ENTRY_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Scheduled Return Date</label>
            <input type="date" value={entryForm.scheduled_return_date} onChange={e => setE('scheduled_return_date', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Condition on Entry</label>
          <textarea value={entryForm.condition_on_entry} onChange={e => setE('condition_on_entry', e.target.value)} rows={2}
            placeholder="Condition on entry…"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Number of Objects</label>
            <input type="number" min={1} value={entryForm.object_count} onChange={e => setE('object_count', parseInt(e.target.value) || 1)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Entry By</label>
            <input value={entryForm.received_by} onChange={e => setE('received_by', e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Card 2 — Donor */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Donor</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Donor Name</label>
            <input value={entryForm.depositor_name} onChange={e => setE('depositor_name', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Donor Contact</label>
            <input value={entryForm.depositor_contact} onChange={e => setE('depositor_contact', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" checked={entryForm.gdpr_consent} onChange={e => setE('gdpr_consent', e.target.checked)} />
            GDPR consent obtained
          </label>
          {entryForm.gdpr_consent && (
            <div className="mt-2">
              <label className={labelCls}>Consent Date</label>
              <input type="date" value={entryForm.gdpr_consent_date} onChange={e => setE('gdpr_consent_date', e.target.value)} className={inputCls} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Legal Owner / Title Holder</label>
            <input value={entryForm.legal_owner} onChange={e => setE('legal_owner', e.target.value)} placeholder="If different from depositor" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Object Description</label>
          <textarea value={entryForm.object_description} onChange={e => setE('object_description', e.target.value)} rows={3}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div>
          <label className={labelCls}>Liability Statement</label>
          <textarea value={entryForm.liability_statement} onChange={e => setE('liability_statement', e.target.value)} rows={2}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>
      </div>

      {/* Card 3 — Receipt & Terms */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Receipt &amp; Terms</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
              <input type="checkbox" checked={entryForm.terms_accepted} onChange={e => setE('terms_accepted', e.target.checked)} />
              Terms &amp; conditions accepted
            </label>
            {entryForm.terms_accepted && (
              <div className="mt-2">
                <label className={labelCls}>Date accepted</label>
                <input type="date" value={entryForm.terms_accepted_date} onChange={e => setE('terms_accepted_date', e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
              <input type="checkbox" checked={entryForm.receipt_issued} onChange={e => setE('receipt_issued', e.target.checked)} />
              Receipt issued to depositor
            </label>
            {entryForm.receipt_issued && (
              <div className="mt-2">
                <label className={labelCls}>Receipt date</label>
                <input type="date" value={entryForm.receipt_date} onChange={e => setE('receipt_date', e.target.value)} className={inputCls} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 4 — Risk */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Risk</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Risk Notes</label>
            <textarea value={entryForm.risk_notes} onChange={e => setE('risk_notes', e.target.value)} rows={2}
              placeholder="Pest, hazardous materials, fragility…"
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
          </div>
          <div className="pt-6">
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
              <input type="checkbox" checked={entryForm.quarantine_required} onChange={e => setE('quarantine_required', e.target.checked)} />
              Quarantine required
            </label>
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={entryForm.notes} onChange={e => setE('notes', e.target.value)} rows={2}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>
      </div>

      {/* Card 5 — Supporting Documents */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
        <div className={sectionTitle}>Supporting Documents</div>
        <DocumentAttachments
          objectId={object.id}
          museumId={museum.id}
          relatedToType="entry_record"
          relatedToId={entryRecord.id}
          canEdit={canEdit}
          canAttach={canEdit && getPlan(museum.plan).compliance}
        />
      </div>

      {/* Save button */}
      {canEdit && (
        <div className="flex gap-3 items-center">
          <button type="button" onClick={saveEntry} disabled={savingEntry}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
            {savingEntry ? 'Saving…' : 'Save entry record →'}
          </button>
        </div>
      )}
    </>
  )
}
