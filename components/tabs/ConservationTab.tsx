'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, TREATMENT_TYPES, CURRENCIES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'
import AutocompleteInput from '@/components/AutocompleteInput'
import ImageUpload from '@/components/ImageUpload'

interface ConservationTabProps {
  form: Record<string, any>
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

const OTHER_TREATMENT_SUGGESTIONS = ['Surface consolidation', 'Structural repair', 'Deacidification', 'Pest treatment', 'Fumigation', 'Freeze treatment', 'Infill', 'Inpainting', 'Varnishing', 'Humidification', 'Mount making']
const today = new Date().toISOString().split('T')[0]

export default function ConservationTab({ form, canEdit, object, museum, supabase, logActivity }: ConservationTabProps) {
  const [conservationHistory, setConservationHistory] = useState<any[]>([])
  const [conservationLoaded, setConservationLoaded] = useState(false)
  const [conservationForm, setConservationForm] = useState({
    treatment_type: '', other_treatment_type: '', conservator: '',
    start_date: '', end_date: '', description: '', condition_description: '',
    materials_used: '', cost: '', cost_currency: 'GBP', recommendation_future: '',
    before_image_url: '', after_image_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null)
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
    const effectiveType = conservationForm.treatment_type === 'Other'
      ? (conservationForm.other_treatment_type || 'Other')
      : conservationForm.treatment_type

    const { data: newTreatment, error: consErr } = await supabase.from('conservation_treatments').insert({
      treatment_type: effectiveType,
      conservator: conservationForm.conservator,
      start_date: conservationForm.start_date || null,
      end_date: conservationForm.end_date || null,
      description: conservationForm.description,
      condition_before: conservationForm.condition_description || null,
      materials_used: conservationForm.materials_used || null,
      cost: conservationForm.cost ? parseFloat(conservationForm.cost) : null,
      cost_currency: conservationForm.cost_currency || null,
      recommendation_future: conservationForm.recommendation_future || null,
      before_image_url: conservationForm.before_image_url || null,
      after_image_url: conservationForm.after_image_url || null,
      object_id: object.id,
      museum_id: museum.id,
      treatment_reference: treatmentRef,
    }).select('id').single()

    if (consErr) { toast(consErr.message, 'error'); setSubmitting(false); return }

    if (stagedDocs.length > 0) {
      const failed = await uploadStagedDocs(supabase, stagedDocs, object.id, museum.id, 'conservation_treatment', newTreatment.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedDocs([])
    }
    setConservationForm({ treatment_type: '', other_treatment_type: '', conservator: '', start_date: '', end_date: '', description: '', condition_description: '', materials_used: '', cost: '', cost_currency: 'GBP', recommendation_future: '', before_image_url: '', after_image_url: '' })
    const { data } = await supabase.from('conservation_treatments').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setConservationHistory(data || [])
    logActivity('conservation_added', `Added ${effectiveType} treatment`)
    setSubmitting(false)
  }

  async function updateConservationStatus(id: string, status: string) {
    const treatment = conservationHistory.find(t => t.id === id)
    const updates: any = { status }
    // Auto-set end date to today when completing a treatment that has no end date
    if (status === 'Completed' && !treatment?.end_date) {
      updates.end_date = today
    }
    const { error } = await supabase.from('conservation_treatments').update(updates).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setConservationHistory(h => h.map(t => t.id === id ? { ...t, ...updates } : t))
    if (selectedTreatment?.id === id) setSelectedTreatment((t: any) => ({ ...t, ...updates }))
  }

  return (
    <>
      {form.status !== 'Restoration' && conservationHistory.some(t => t.status === 'Active') && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          This object has an active treatment — consider setting status to <strong>Restoration</strong> on the Overview tab.
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Add Conservation Treatment</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Treatment Type <span className="text-red-400">*</span></label>
            <select value={conservationForm.treatment_type} onChange={e => setConservationForm(f => ({ ...f, treatment_type: e.target.value, other_treatment_type: '' }))} className={inputCls}>
              <option value="">— Select —</option>
              {TREATMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Conservator</label>
            <input value={conservationForm.conservator} onChange={e => setConservationForm(f => ({ ...f, conservator: e.target.value }))} className={inputCls} />
          </div>
        </div>

        {conservationForm.treatment_type === 'Other' && (
          <div>
            <label className={labelCls}>Specify treatment</label>
            <AutocompleteInput
              value={conservationForm.other_treatment_type}
              onChange={v => setConservationForm(f => ({ ...f, other_treatment_type: v }))}
              staticList={OTHER_TREATMENT_SUGGESTIONS}
              placeholder="Describe the treatment…"
              className={inputCls}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" value={conservationForm.start_date} onChange={e => setConservationForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Date <span className="text-stone-400 font-normal normal-case text-xs">(leave blank if ongoing)</span></label>
            <input type="date" value={conservationForm.end_date} onChange={e => setConservationForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Condition Description</label>
          <textarea value={conservationForm.condition_description} onChange={e => setConservationForm(f => ({ ...f, condition_description: e.target.value }))} rows={2} placeholder="Condition of object at time of treatment..." className={`${inputCls} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Before Image</label>
            <ImageUpload currentUrl={conservationForm.before_image_url} onUpload={url => setConservationForm(f => ({ ...f, before_image_url: url }))} />
          </div>
          <div>
            <label className={labelCls}>After Image</label>
            <ImageUpload currentUrl={conservationForm.after_image_url} onUpload={url => setConservationForm(f => ({ ...f, after_image_url: url }))} />
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

        {canEdit && (
          <button
            type="button"
            onClick={addConservation}
            disabled={submitting || !conservationForm.treatment_type}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
          >
            {submitting ? 'Saving\u2026' : 'Save treatment \u2192'}
          </button>
        )}
      </div>

      {conservationLoaded && conservationHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
            <div className={sectionTitle} style={{ marginBottom: 0 }}>Treatment History</div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Type</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Conservator</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Dates</th>
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {conservationHistory.map(t => (
                <tr
                  key={t.id}
                  className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
                  onClick={() => setSelectedTreatment(t)}
                >
                  <td className="px-6 py-3 text-sm text-stone-900 dark:text-stone-100">{t.treatment_type}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{t.conservator}</td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                    {t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '—'}
                    {' → '}
                    {t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : <span className="text-amber-600">Ongoing</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${t.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                      {t.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 items-center">
                      {(t.status === 'Active' || !t.status) && canEdit && (
                        <>
                          <button type="button" onClick={() => updateConservationStatus(t.id, 'Completed')} className="text-xs font-mono text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Complete</button>
                          <button type="button" onClick={() => updateConservationStatus(t.id, 'Cancelled')} className="text-xs font-mono text-stone-400 hover:text-red-500 transition-colors">Cancel</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Treatment Detail Modal */}
      {selectedTreatment && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTreatment(null)}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{selectedTreatment.treatment_type}</div>
                <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">{selectedTreatment.treatment_reference}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTreatment(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedTreatment.conservator && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Conservator</div>
                    <div className="text-sm text-stone-900 dark:text-stone-100">{selectedTreatment.conservator}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Status</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedTreatment.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : selectedTreatment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                    {selectedTreatment.status || 'Active'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Dates</div>
                <div className="text-sm font-mono text-stone-700 dark:text-stone-300">
                  {selectedTreatment.start_date ? new Date(selectedTreatment.start_date).toLocaleDateString('en-GB') : '—'}
                  {' → '}
                  {selectedTreatment.end_date ? new Date(selectedTreatment.end_date).toLocaleDateString('en-GB') : 'Ongoing'}
                </div>
              </div>
              {selectedTreatment.condition_before && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Condition Description</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedTreatment.condition_before}</div>
                </div>
              )}
              {(selectedTreatment.before_image_url || selectedTreatment.after_image_url) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedTreatment.before_image_url && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Before</div>
                      <img src={selectedTreatment.before_image_url} alt="Before treatment" className="w-full rounded border border-stone-200 dark:border-stone-700 object-cover" />
                    </div>
                  )}
                  {selectedTreatment.after_image_url && (
                    <div>
                      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">After</div>
                      <img src={selectedTreatment.after_image_url} alt="After treatment" className="w-full rounded border border-stone-200 dark:border-stone-700 object-cover" />
                    </div>
                  )}
                </div>
              )}
              {selectedTreatment.description && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Description</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedTreatment.description}</div>
                </div>
              )}
              {selectedTreatment.materials_used && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Materials Used</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedTreatment.materials_used}</div>
                </div>
              )}
              {selectedTreatment.cost && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Cost</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{selectedTreatment.cost_currency} {parseFloat(selectedTreatment.cost).toFixed(2)}</div>
                </div>
              )}
              {selectedTreatment.recommendation_future && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Future Recommendations</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedTreatment.recommendation_future}</div>
                </div>
              )}
              {canAttach && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Documents</div>
                  <DocumentAttachments
                    objectId={object.id}
                    museumId={museum.id}
                    relatedToType="conservation_treatment"
                    relatedToId={selectedTreatment.id}
                    canEdit={canEdit}
                    canAttach={canAttach}
                  />
                </div>
              )}
              {(selectedTreatment.status === 'Active' || !selectedTreatment.status) && canEdit && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-3">
                  <button type="button" onClick={() => updateConservationStatus(selectedTreatment.id, 'Completed')} className="text-xs font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">Mark complete</button>
                  <button type="button" onClick={() => updateConservationStatus(selectedTreatment.id, 'Cancelled')} className="text-xs font-mono text-red-500 border border-red-200 dark:border-red-800 rounded px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
