'use client'

import { inputCls, labelCls, sectionTitle, ACQ_METHODS, TITLE_GUARANTEE_OPTIONS } from '@/components/tabs/shared'
import DocumentAttachments from '@/components/DocumentAttachments'

interface AcquisitionTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  saving: boolean
  objectId?: string
  museumId?: string
  canAttach?: boolean
}

function SaveBar({ saving }: { saving: boolean }) {
  return (
    <div className="flex gap-3 items-center">
      <button type="submit" disabled={saving}
        className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
        {saving ? 'Saving…' : 'Save changes →'}
      </button>
    </div>
  )
}

export default function AcquisitionTab({ form, set, canEdit, saving, objectId, museumId, canAttach }: AcquisitionTabProps) {
  return (
    <>
      {/* Card 1 — Acquisition */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Acquisition</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="acquisition.method">Acquisition Method</label>
            <select value={form.acquisition_method || ''} onChange={e => set('acquisition_method', e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {ACQ_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} data-learn="acquisition.date">Acquisition Date</label>
            <input type="date" value={form.acquisition_date || ''} onChange={e => set('acquisition_date', e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls} data-learn="acquisition.source">Acquisition Source</label>
          <input value={form.acquisition_source || ''} onChange={e => set('acquisition_source', e.target.value)} placeholder="Donor name, auction house…" className={inputCls} />
        </div>

        <div>
          <label className={labelCls} data-learn="acquisition.justification">Acquisition Justification <span className="text-red-400">*</span></label>
          <textarea value={form.acquisition_justification || ''} onChange={e => set('acquisition_justification', e.target.value)} rows={3}
            placeholder="How this object fits the collecting policy — rationale for acquisition…"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Required for Accreditation</p>
        </div>

        <div>
          <label className={labelCls} data-learn="acquisition.notes">Acquisition Notes</label>
          <textarea value={form.acquisition_note || ''} onChange={e => set('acquisition_note', e.target.value)} rows={4}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-4 space-y-3">
          <label className={labelCls} data-learn="acquisition.documentation_ref">Associated Documentation <span className="text-red-400">*</span></label>
          <textarea value={form.acquisition_documentation_ref || ''} onChange={e => set('acquisition_documentation_ref', e.target.value)}
            placeholder="e.g. Deed of Gift ref, Bill of Sale, purchase receipt filename…"
            rows={4}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
          <p className="text-xs text-stone-400 dark:text-stone-500">Required for Accreditation — deeds of gift, purchase receipts, correspondence</p>
          {objectId && museumId && (
            <>
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 pt-1">Associated Documentation Supporting Documents</div>
              <DocumentAttachments
                objectId={objectId}
                museumId={museumId}
                relatedToType="acquisition_deed"
                relatedToId={null}
                canEdit={canEdit}
                canAttach={canAttach}
              />
            </>
          )}
        </div>

        <div>
          <label className={labelCls} data-learn="acquisition.accession_date">Accession Date</label>
          <input type="date" value={form.accession_date || ''} onChange={e => set('accession_date', e.target.value)} className={inputCls} />
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Date the object was formally accessioned</p>
        </div>

        <div>
          <label className={labelCls} data-learn="acquisition.conditions">Conditions Attached to Acquisition</label>
          <textarea value={form.conditions_attached_to_acquisition || ''} onChange={e => set('conditions_attached_to_acquisition', e.target.value)} rows={2}
            placeholder="Any restrictions or conditions from the donor/seller…"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
          <input type="checkbox" checked={form.acknowledgement_sent_to_donor || false} onChange={e => set('acknowledgement_sent_to_donor', e.target.checked)} />
          Acknowledgement sent to donor
        </label>
      </div>

      {/* Card 2 — Governance */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Governance</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="acquisition.source_contact">Source Contact Details</label>
            <input value={form.acquisition_source_contact || ''} onChange={e => set('acquisition_source_contact', e.target.value)} placeholder="Email, phone or address of donor / vendor" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} data-learn="acquisition.authorised_by">Authorised By</label>
            <input value={form.acquisition_authorised_by || ''} onChange={e => set('acquisition_authorised_by', e.target.value)} placeholder="Name and role of authorising person or body" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls} data-learn="acquisition.authority_date">Authority Date</label>
            <input type="date" value={form.acquisition_authority_date || ''} onChange={e => set('acquisition_authority_date', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} data-learn="acquisition.title_guarantee">Title / Legal Basis</label>
            <select value={form.acquisition_title_guarantee || ''} onChange={e => set('acquisition_title_guarantee', e.target.value)} className={inputCls}>
              <option value="">— Select —</option>
              {TITLE_GUARANTEE_OPTIONS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} data-learn="acquisition.object_count">Number of Objects</label>
            <input type="number" min={1} value={form.acquisition_object_count || ''} onChange={e => set('acquisition_object_count', parseInt(e.target.value) || '')} className={inputCls} />
          </div>
        </div>


        <div>
          <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" checked={form.accession_register_confirmed || false} onChange={e => set('accession_register_confirmed', e.target.checked)} />
            Formally entered in accession register
          </label>
          {form.accession_register_confirmed && <span className="text-xs font-mono text-emerald-600 ml-6">✓ Confirmed</span>}
        </div>
      </div>

      {/* Card 3 — Legal & Ethics Checks */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Legal &amp; Ethics Checks</div>

        <p className="text-xs text-stone-400 dark:text-stone-500">Tick each check once completed. All must be considered for acquisitions made after 2005.</p>

        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.ethics_art_loss_register || false} onChange={e => set('ethics_art_loss_register', e.target.checked)} />
            Art Loss Register — checked that object is not listed as stolen
          </label>

          <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.ethics_cites || false} onChange={e => set('ethics_cites', e.target.checked)} />
            CITES — no endangered species materials (ivory, tortoiseshell, feathers, etc.)
          </label>

          <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.ethics_dealing_act || false} onChange={e => set('ethics_dealing_act', e.target.checked)} />
            Dealing in Cultural Objects (Offences) Act 2003 — checked country of origin
          </label>

          <label className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={form.ethics_human_remains || false} onChange={e => set('ethics_human_remains', e.target.checked)} />
            Human Remains — guidance followed if object contains human material
          </label>
        </div>
      </div>

      {/* Card 4 — Supporting Documents */}
      {objectId && museumId && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Supporting Documents</div>
          <DocumentAttachments
            objectId={objectId}
            museumId={museumId}
            relatedToType="acquisition"
            relatedToId={null}
            canEdit={canEdit}
            canAttach={canAttach}
          />
        </div>
      )}

      {canEdit && <SaveBar saving={saving} />}
    </>
  )
}
