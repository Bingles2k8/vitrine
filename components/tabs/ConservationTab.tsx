'use client'

import { useEffect, useRef, useState } from 'react'
import { inputCls, labelCls, sectionTitle, TREATMENT_TYPES, CURRENCIES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'
import AutocompleteInput from '@/components/AutocompleteInput'
import { createClient } from '@/lib/supabase'
import { compressImage, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_ACCEPT } from '@/lib/image-compression'
import { checkStorageQuota } from '@/lib/storageUsage'
import { uploadToR2 } from '@/lib/r2-upload'

interface ConservationTabProps {
  form: Record<string, any>
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

interface TreatmentImage {
  url: string
  name: string
  date: string
  file_size?: number
}

const OTHER_TREATMENT_SUGGESTIONS = ['Surface consolidation', 'Structural repair', 'Deacidification', 'Pest treatment', 'Fumigation', 'Freeze treatment', 'Infill', 'Inpainting', 'Varnishing', 'Humidification', 'Mount making']
const today = new Date().toISOString().split('T')[0]

function useAutoExpand(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }, [value])
  return ref
}

function emptyForm() {
  return {
    treatment_name: '', treatment_type: '', other_treatment_type: '', conservator: '',
    start_date: '', end_date: '', description: '', condition_description: '',
    materials_used: '', cost: '', cost_currency: 'GBP', recommendation_future: '',
    images: [] as TreatmentImage[],
  }
}

export default function ConservationTab({ form, canEdit, object, museum, supabase, logActivity }: ConservationTabProps) {
  const [conservationHistory, setConservationHistory] = useState<any[]>([])
  const [conservationLoaded, setConservationLoaded] = useState(false)
  const [conservationForm, setConservationForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [editImageUploading, setEditImageUploading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const canAttach = canEdit && getPlan(museum.plan).compliance
  const { toast } = useToast()
  const supabaseClient = createClient()

  const conditionRef = useAutoExpand(conservationForm.condition_description)
  const editConditionRef = useAutoExpand(editForm?.condition_description ?? '')

  useEffect(() => {
    supabase.from('conservation_treatments').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setConservationHistory(data || []); setConservationLoaded(true) })
  }, [object.id])

  async function uploadImage(file: File): Promise<{ url: string; size: number } | null> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast('Please upload a JPG, PNG, WEBP, GIF, or AVIF file.', 'error')
      return null
    }
    const compressed = await compressImage(file)
    const withinQuota = await checkStorageQuota(supabaseClient, museum.id, museum.plan, compressed.size)
    if (!withinQuota) {
      toast('Storage limit reached for your plan', 'error')
      return null
    }
    const ext = compressed.type === 'image/webp' ? 'webp' : compressed.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    try {
      const publicUrl = await uploadToR2('object-images', filename, compressed)
      return { url: publicUrl, size: compressed.size }
    } catch {
      toast('Upload failed — please try again', 'error')
      return null
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    const result = await uploadImage(file)
    if (result) {
      const newImg: TreatmentImage = { url: result.url, name: file.name.replace(/\.[^.]+$/, ''), date: today, file_size: result.size }
      setConservationForm(f => ({ ...f, images: [...f.images, newImg] }))
    }
    e.target.value = ''
    setImageUploading(false)
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImageUploading(true)
    const result = await uploadImage(file)
    if (result) {
      const newImg: TreatmentImage = { url: result.url, name: file.name.replace(/\.[^.]+$/, ''), date: today, file_size: result.size }
      setEditForm((f: any) => ({ ...f, images: [...(f.images ?? []), newImg] }))
    }
    e.target.value = ''
    setEditImageUploading(false)
  }

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
      treatment_name: conservationForm.treatment_name || null,
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
      images: conservationForm.images,
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
    setConservationForm(emptyForm())
    const { data } = await supabase.from('conservation_treatments').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setConservationHistory(data || [])
    logActivity('conservation_added', `Added ${effectiveType} treatment`)
    setSubmitting(false)
  }

  async function updateConservationStatus(id: string, status: string) {
    const treatment = conservationHistory.find(t => t.id === id)
    const updates: any = { status }
    if (status === 'Completed' && !treatment?.end_date) {
      updates.end_date = today
    }
    const { error } = await supabase.from('conservation_treatments').update(updates).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setConservationHistory(h => h.map(t => t.id === id ? { ...t, ...updates } : t))
    if (selectedTreatment?.id === id) setSelectedTreatment((t: any) => ({ ...t, ...updates }))
  }

  function openEdit(treatment: any) {
    setEditForm({
      treatment_name: treatment.treatment_name || '',
      treatment_type: treatment.treatment_type || '',
      conservator: treatment.conservator || '',
      start_date: treatment.start_date || '',
      end_date: treatment.end_date || '',
      description: treatment.description || '',
      condition_description: treatment.condition_before || '',
      materials_used: treatment.materials_used || '',
      cost: treatment.cost ? String(treatment.cost) : '',
      cost_currency: treatment.cost_currency || 'GBP',
      recommendation_future: treatment.recommendation_future || '',
      images: treatment.images ?? [],
    })
    setIsEditing(true)
  }

  async function saveEdit() {
    if (!selectedTreatment || editSubmitting) return
    setEditSubmitting(true)
    const updates = {
      treatment_name: editForm.treatment_name || null,
      treatment_type: editForm.treatment_type || null,
      conservator: editForm.conservator || null,
      start_date: editForm.start_date || null,
      end_date: editForm.end_date || null,
      description: editForm.description || null,
      condition_before: editForm.condition_description || null,
      materials_used: editForm.materials_used || null,
      cost: editForm.cost ? parseFloat(editForm.cost) : null,
      cost_currency: editForm.cost_currency || null,
      recommendation_future: editForm.recommendation_future || null,
      images: editForm.images ?? [],
    }
    const { error } = await supabase.from('conservation_treatments').update(updates).eq('id', selectedTreatment.id)
    if (error) { toast(error.message, 'error'); setEditSubmitting(false); return }
    const updated = { ...selectedTreatment, ...updates, condition_before: updates.condition_before }
    setConservationHistory(h => h.map(t => t.id === selectedTreatment.id ? updated : t))
    setSelectedTreatment(updated)
    setIsEditing(false)
    setEditSubmitting(false)
    toast('Treatment updated', 'success')
  }

  const isActive = (t: any) => !t.status || t.status === 'Active'

  return (
    <>
      {form.status !== 'Restoration' && conservationHistory.some(t => isActive(t)) && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          This object has an active treatment — consider setting status to <strong>Restoration</strong> on the Overview tab.
        </div>
      )}

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Add Conservation Report</div>

        <div>
          <label className={labelCls} data-learn="conservation.treatment_name">Report Name</label>
          <input
            value={conservationForm.treatment_name}
            onChange={e => setConservationForm(f => ({ ...f, treatment_name: e.target.value }))}
            placeholder="e.g. Surface clean 2024, Annual condition check…"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="conservation.treatment_type">Treatment Type <span className="text-red-400">*</span></label>
            <select value={conservationForm.treatment_type} onChange={e => setConservationForm(f => ({ ...f, treatment_type: e.target.value, other_treatment_type: '' }))} className={inputCls}>
              <option value="">— Select —</option>
              {TREATMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} data-learn="conservation.conservator">Conservator</label>
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
            <label className={labelCls} data-learn="conservation.start_date">Start Date</label>
            <input type="date" value={conservationForm.start_date} onChange={e => setConservationForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} data-learn="conservation.end_date">End Date <span className="text-stone-400 font-normal normal-case text-xs">(leave blank if ongoing)</span></label>
            <input type="date" value={conservationForm.end_date} onChange={e => setConservationForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls} data-learn="conservation.condition_description">Condition Description</label>
          <textarea
            ref={conditionRef}
            value={conservationForm.condition_description}
            onChange={e => setConservationForm(f => ({ ...f, condition_description: e.target.value }))}
            rows={4}
            placeholder="Condition of object at time of treatment..."
            className={`${inputCls} resize-none overflow-hidden`}
          />
        </div>

        {/* Image upload */}
        <div>
          <label className={labelCls}>Images</label>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-stone-300 dark:border-stone-600 rounded cursor-pointer hover:border-stone-500 transition-colors text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50">
            <span>{imageUploading ? 'Uploading…' : '+ Upload image'}</span>
            <input type="file" accept={ALLOWED_IMAGE_ACCEPT} onChange={handleImageUpload} disabled={imageUploading} className="hidden" />
          </label>

          {conservationForm.images.length > 0 && (
            <table className="w-full mt-3 text-xs border border-stone-100 dark:border-stone-800 rounded overflow-hidden">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                  <th className="px-3 py-2 w-14"></th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-3 py-2">Name</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-3 py-2">Date</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {conservationForm.images.map((img, i) => (
                  <tr key={i} className="border-b border-stone-50 dark:border-stone-800/50 last:border-0">
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => setLightboxUrl(img.url)} className="block w-12 h-12 rounded overflow-hidden border border-stone-200 dark:border-stone-700 hover:ring-2 hover:ring-stone-400 transition-all flex-shrink-0">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={img.name}
                        onChange={e => setConservationForm(f => ({ ...f, images: f.images.map((im, j) => j === i ? { ...im, name: e.target.value } : im) }))}
                        className="w-full bg-transparent outline-none text-stone-800 dark:text-stone-200 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={img.date}
                        onChange={e => setConservationForm(f => ({ ...f, images: f.images.map((im, j) => j === i ? { ...im, date: e.target.value } : im) }))}
                        className="bg-transparent outline-none text-stone-500 dark:text-stone-400 text-xs font-mono"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button type="button" onClick={() => setConservationForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="text-stone-300 hover:text-red-400 transition-colors">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <label className={labelCls} data-learn="conservation.materials_used">Materials Used</label>
          <input value={conservationForm.materials_used} onChange={e => setConservationForm(f => ({ ...f, materials_used: e.target.value }))} placeholder="Conservation materials and chemicals used" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="conservation.cost">Cost</label>
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
          <label className={labelCls} data-learn="conservation.description">Notes</label>
          <textarea value={conservationForm.description} onChange={e => setConservationForm(f => ({ ...f, description: e.target.value }))} rows={3}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>

        <div>
          <label className={labelCls} data-learn="conservation.recommendation_future">Future Recommendations</label>
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
            {submitting ? 'Saving\u2026' : 'Save report \u2192'}
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
                <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Name / Type</th>
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
                  onClick={() => { setSelectedTreatment(t); setIsEditing(false) }}
                >
                  <td className="px-6 py-3">
                    <div className="text-sm text-stone-900 dark:text-stone-100">{t.treatment_name || t.treatment_type}</div>
                    {t.treatment_name && <div className="text-xs text-stone-400 dark:text-stone-500">{t.treatment_type}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{t.conservator}</td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                    {t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '—'}
                    {' → '}
                    {t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : <span className="text-amber-600">Ongoing</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${isActive(t) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                      {t.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 items-center">
                      {isActive(t) && canEdit && (
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

      {/* Image lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="" className="max-w-full max-h-full rounded shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none">×</button>
        </div>
      )}

      {/* Treatment Detail / Edit Modal */}
      {selectedTreatment && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => { setSelectedTreatment(null); setIsEditing(false) }}
        >
          <div
            className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">
                  {selectedTreatment.treatment_name || selectedTreatment.treatment_type}
                </div>
                {selectedTreatment.treatment_name && (
                  <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{selectedTreatment.treatment_type}</div>
                )}
                <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">{selectedTreatment.treatment_reference}</div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                {isActive(selectedTreatment) && canEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={() => openEdit(selectedTreatment)}
                    className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedTreatment(null); setIsEditing(false) }}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            {isEditing && editForm ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>Report Name</label>
                  <input value={editForm.treatment_name} onChange={e => setEditForm((f: any) => ({ ...f, treatment_name: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Treatment Type</label>
                    <select value={editForm.treatment_type} onChange={e => setEditForm((f: any) => ({ ...f, treatment_type: e.target.value }))} className={inputCls}>
                      <option value="">— Select —</option>
                      {TREATMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Conservator</label>
                    <input value={editForm.conservator} onChange={e => setEditForm((f: any) => ({ ...f, conservator: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input type="date" value={editForm.start_date} onChange={e => setEditForm((f: any) => ({ ...f, start_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input type="date" value={editForm.end_date} onChange={e => setEditForm((f: any) => ({ ...f, end_date: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Condition Description</label>
                  <textarea
                    ref={editConditionRef}
                    value={editForm.condition_description}
                    onChange={e => setEditForm((f: any) => ({ ...f, condition_description: e.target.value }))}
                    rows={4}
                    className={`${inputCls} resize-none overflow-hidden`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Images</label>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-stone-300 dark:border-stone-600 rounded cursor-pointer hover:border-stone-500 transition-colors text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50">
                    <span>{editImageUploading ? 'Uploading…' : '+ Upload image'}</span>
                    <input type="file" accept={ALLOWED_IMAGE_ACCEPT} onChange={handleEditImageUpload} disabled={editImageUploading} className="hidden" />
                  </label>
                  {(editForm.images ?? []).length > 0 && (
                    <table className="w-full mt-3 text-xs border border-stone-100 dark:border-stone-800 rounded overflow-hidden">
                      <thead>
                        <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                          <th className="px-3 py-2 w-14"></th>
                          <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-3 py-2">Name</th>
                          <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-3 py-2">Date</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editForm.images ?? []).map((img: TreatmentImage, i: number) => (
                          <tr key={i} className="border-b border-stone-50 dark:border-stone-800/50 last:border-0">
                            <td className="px-3 py-2">
                              <button type="button" onClick={() => setLightboxUrl(img.url)} className="block w-12 h-12 rounded overflow-hidden border border-stone-200 dark:border-stone-700 hover:ring-2 hover:ring-stone-400 transition-all flex-shrink-0">
                                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <input value={img.name} onChange={e => setEditForm((f: any) => ({ ...f, images: f.images.map((im: TreatmentImage, j: number) => j === i ? { ...im, name: e.target.value } : im) }))} className="w-full bg-transparent outline-none text-stone-800 dark:text-stone-200 text-xs" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="date" value={img.date} onChange={e => setEditForm((f: any) => ({ ...f, images: f.images.map((im: TreatmentImage, j: number) => j === i ? { ...im, date: e.target.value } : im) }))} className="bg-transparent outline-none text-stone-500 dark:text-stone-400 text-xs font-mono" />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button type="button" onClick={() => setEditForm((f: any) => ({ ...f, images: f.images.filter((_: any, j: number) => j !== i) }))} className="text-stone-300 hover:text-red-400 transition-colors">×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Materials Used</label>
                  <input value={editForm.materials_used} onChange={e => setEditForm((f: any) => ({ ...f, materials_used: e.target.value }))} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Cost</label>
                    <input type="number" step="0.01" min="0" value={editForm.cost} onChange={e => setEditForm((f: any) => ({ ...f, cost: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Currency</label>
                    <select value={editForm.cost_currency} onChange={e => setEditForm((f: any) => ({ ...f, cost_currency: e.target.value }))} className={inputCls}>
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Notes</label>
                  <textarea value={editForm.description} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Future Recommendations</label>
                  <textarea value={editForm.recommendation_future} onChange={e => setEditForm((f: any) => ({ ...f, recommendation_future: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div className="flex gap-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button type="button" onClick={saveEdit} disabled={editSubmitting} className="text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded px-4 py-1.5 disabled:opacity-50">
                    {editSubmitting ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-4 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
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
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${isActive(selectedTreatment) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : selectedTreatment.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
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
                {(selectedTreatment.images ?? []).length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Images</div>
                    <table className="w-full text-xs border border-stone-100 dark:border-stone-800 rounded overflow-hidden">
                      <thead>
                        <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-800">
                          <th className="px-3 py-2 w-14"></th>
                          <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-3 py-2">Name</th>
                          <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedTreatment.images as TreatmentImage[]).map((img, i) => (
                          <tr key={i} className="border-b border-stone-50 dark:border-stone-800/50 last:border-0 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50" onClick={() => setLightboxUrl(img.url)}>
                            <td className="px-3 py-2">
                              <div className="w-12 h-12 rounded overflow-hidden border border-stone-200 dark:border-stone-700 flex-shrink-0">
                                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                              </div>
                            </td>
                            <td className="px-3 py-2 text-stone-700 dark:text-stone-300">{img.name}</td>
                            <td className="px-3 py-2 font-mono text-stone-400 dark:text-stone-500">
                              {img.date ? new Date(img.date).toLocaleDateString('en-GB') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {selectedTreatment.description && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
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
                {isActive(selectedTreatment) && canEdit && (
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-3">
                    <button type="button" onClick={() => updateConservationStatus(selectedTreatment.id, 'Completed')} className="text-xs font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">Mark complete</button>
                    <button type="button" onClick={() => updateConservationStatus(selectedTreatment.id, 'Cancelled')} className="text-xs font-mono text-red-500 border border-red-200 dark:border-red-800 rounded px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
