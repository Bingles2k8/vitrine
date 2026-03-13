'use client'

import { useEffect, useState, Fragment } from 'react'
import { inputCls, labelCls, sectionTitle, TREATMENT_TYPES, CURRENCIES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'

interface ConservationTabProps {
  form: Record<string, any>
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function ConservationTab({ form, canEdit, object, museum, supabase, logActivity }: ConservationTabProps) {
  const [conservationHistory, setConservationHistory] = useState<any[]>([])
  const [conservationLoaded, setConservationLoaded] = useState(false)
  const [conservationForm, setConservationForm] = useState({ treatment_type: '', conservator: '', start_date: '', end_date: '', description: '', outcome: '', condition_before: '', condition_after: '', materials_used: '', cost: '', cost_currency: 'GBP', recommendation_future: '' })
  const [submitting, setSubmitting] = useState(false)
  const [docsTreatmentId, setDocsTreatmentId] = useState<string | null>(null)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const canAttach = canEdit && getPlan(museum.plan).compliance
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('conservation_treatments').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setConservationHistory(data || []); setConservationLoaded(true) })
  }, [object.id])

  async function addConservation() {
    if (!conservationForm.treatment_type || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const count = conservationHistory.filter(t => t.treatment_reference?.startsWith(`CT-${year}-`)).length
    const treatmentRef = `CT-${year}-${String(count + 1).padStart(3, '0')}`
    const { data: newTreatment, error: consErr } = await supabase.from('conservation_treatments').insert({ ...conservationForm, object_id: object.id, museum_id: museum.id, start_date: conservationForm.start_date || null, end_date: conservationForm.end_date || null, treatment_reference: treatmentRef, condition_before: conservationForm.condition_before || null, condition_after: conservationForm.condition_after || null, materials_used: conservationForm.materials_used || null, cost: conservationForm.cost ? parseFloat(conservationForm.cost) : null, cost_currency: conservationForm.cost_currency || null, recommendation_future: conservationForm.recommendation_future || null }).select('id').single()
    if (consErr) { toast(consErr.message, 'error'); setSubmitting(false); return }
    if (stagedDocs.length > 0) {
      const failed = await uploadStagedDocs(supabase, stagedDocs, object.id, museum.id, 'conservation_treatment', newTreatment.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedDocs([])
    }
    setConservationForm({ treatment_type: '', conservator: '', start_date: '', end_date: '', description: '', outcome: '', condition_before: '', condition_after: '', materials_used: '', cost: '', cost_currency: 'GBP', recommendation_future: '' })
    const { data } = await supabase.from('conservation_treatments').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setConservationHistory(data || [])
    logActivity('conservation_added', `Added ${conservationForm.treatment_type} treatment for "${object.title}"`)
    setSubmitting(false)
  }

  async function updateConservationStatus(id: string, status: string) {
    const { error } = await supabase.from('conservation_treatments').update({ status }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setConservationHistory(h => h.map(t => t.id === id ? { ...t, status } : t))
  }

  return (
    <>
      {form.status !== 'Restoration' && conservationHistory.some(t => t.status === 'Active') && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
          This object has an active treatment — consider setting status to <strong>Restoration</strong> on the Overview tab.
        </div>
      )}


      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Add Conservation Treatment (Procedure 5)</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Treatment Type *</label>
            <select value={conservationForm.treatment_type} onChange={e => setConservationForm(f => ({ ...f, treatment_type: e.target.value }))} className={inputCls}>
              <option value="">— Select —</option>
              {TREATMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Conservator</label><input value={conservationForm.conservator} onChange={e => setConservationForm(f => ({ ...f, conservator: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Start Date</label><input type="date" value={conservationForm.start_date} onChange={e => setConservationForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>End Date (leave blank if ongoing)</label><input type="date" value={conservationForm.end_date} onChange={e => setConservationForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Condition Before</label>
            <textarea value={conservationForm.condition_before} onChange={e => setConservationForm(f => ({ ...f, condition_before: e.target.value }))} rows={2} placeholder="Condition before treatment..." className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Condition After</label>
            <textarea value={conservationForm.condition_after} onChange={e => setConservationForm(f => ({ ...f, condition_after: e.target.value }))} rows={2} placeholder="Condition after treatment..." className={`${inputCls} resize-none`} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Materials Used</label>
          <input value={conservationForm.materials_used} onChange={e => setConservationForm(f => ({ ...f, materials_used: e.target.value }))} placeholder="Conservation materials and chemicals used" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Cost</label>
            <input type="number" step="0.01" min="0" value={conservationForm.cost} onChange={e => setConservationForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <select value={conservationForm.cost_currency} onChange={e => setConservationForm(f => ({ ...f, cost_currency: e.target.value }))} className={inputCls}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea value={conservationForm.description} onChange={e => setConservationForm(f => ({ ...f, description: e.target.value }))} rows={3}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>
        <div>
          <label className={labelCls}>Future Recommendations</label>
          <textarea value={conservationForm.recommendation_future} onChange={e => setConservationForm(f => ({ ...f, recommendation_future: e.target.value }))} rows={2} placeholder="Recommendations for future conservation..." className={`${inputCls} resize-none`} />
        </div>
        {canAttach && (
          <div>
            <label className={labelCls}>Supporting Documents</label>
            <StagedDocumentPicker relatedToType="conservation_treatment" value={stagedDocs} onChange={setStagedDocs} />
          </div>
        )}
        <button type="button" onClick={addConservation} disabled={submitting}
          className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
          {submitting ? 'Saving…' : 'Save treatment →'}
        </button>
      </div>

      {conservationLoaded && conservationHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Treatment History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Type</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Conservator</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {conservationHistory.map(t => (
                <Fragment key={t.id}>
                  <tr className="border-b border-stone-100 dark:border-stone-800">
                    <td className="px-6 py-3 text-sm text-stone-900 dark:text-stone-100">{t.treatment_type}</td>
                    <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{t.conservator}</td>
                    <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                      {t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '—'}
                      {' → '}
                      {t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : <span className="text-amber-600">Ongoing</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${t.status === 'Active' ? 'bg-amber-50 text-amber-700' : t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {t.status === 'Active' && (
                          <>
                            <button type="button" onClick={() => updateConservationStatus(t.id, 'Completed')} className="text-xs font-mono text-stone-400 hover:text-emerald-700">Complete</button>
                            <button type="button" onClick={() => updateConservationStatus(t.id, 'Cancelled')} className="text-xs font-mono text-stone-400 hover:text-red-500">Cancel</button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDocsTreatmentId(docsTreatmentId === t.id ? null : t.id)}
                          className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                        >
                          {docsTreatmentId === t.id ? 'Hide docs' : 'Documents'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {docsTreatmentId === t.id && (
                    <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                      <td colSpan={5} className="px-6 py-4">
                        <DocumentAttachments
                          objectId={object.id}
                          museumId={museum.id}
                          relatedToType="conservation_treatment"
                          relatedToId={t.id}
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
