'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, CONDITION_GRADES, CONDITION_STYLES, INVENTORY_OUTCOMES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'
import StagedDocumentPicker, { StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadToR2 } from '@/lib/r2-upload'

interface AuditTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function AuditTab({ form, set, canEdit, object, museum, supabase, logActivity }: AuditTabProps) {
  const [auditHistory, setAuditHistory] = useState<any[]>([])
  const [auditLoaded, setAuditLoaded] = useState(false)
  const [exercises, setExercises] = useState<any[]>([])
  const [exercisesLoaded, setExercisesLoaded] = useState(false)
  const [auditForm, setAuditForm] = useState({ inventoried_at: new Date().toISOString().slice(0,10), inventoried_by: '', exercise_id: '', location_confirmed: '', condition_confirmed: '', inventory_outcome: '', action_required: '', action_completed: false, action_completed_date: '', discrepancy: '', notes: '' })
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [stagedUploadProgress, setStagedUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [selectedRecordDocs, setSelectedRecordDocs] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('audit_records').select('*').eq('object_id', object.id).order('inventoried_at', { ascending: false })
      .then(({ data }: any) => { setAuditHistory(data || []); setAuditLoaded(true) })
    supabase.from('audit_exercises').select('*').eq('museum_id', museum.id).order('date_started', { ascending: false })
      .then(({ data }: any) => { setExercises(data || []); setExercisesLoaded(true) })
  }, [object.id])

  useEffect(() => {
    if (!selectedRecord) { setSelectedRecordDocs([]); return }
    supabase.from('object_documents').select('*')
      .eq('related_to_type', 'audit_record')
      .eq('related_to_id', selectedRecord.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => setSelectedRecordDocs(data || []))
  }, [selectedRecord?.id])

  async function addAudit() {
    if (!auditForm.inventoried_at || submitting) return
    setSubmitting(true)
    const { data: auditRecord, error: auditErr } = await supabase.from('audit_records').insert({
      ...auditForm,
      object_id: object.id, museum_id: museum.id,
      exercise_id: auditForm.exercise_id || null,
      action_completed_date: auditForm.action_completed && auditForm.action_completed_date ? auditForm.action_completed_date : null,
    }).select().single()
    if (auditErr) { toast(auditErr.message, 'error'); setSubmitting(false); return }
    await supabase.from('objects').update({ last_inventoried: auditForm.inventoried_at, inventoried_by: auditForm.inventoried_by }).eq('id', object.id)
    set('last_inventoried', auditForm.inventoried_at)
    set('inventoried_by', auditForm.inventoried_by)

    if (stagedDocs.length > 0 && auditRecord) {
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null
      setStagedUploadProgress({ done: 0, total: stagedDocs.length })
      let done = 0
      for (const doc of stagedDocs) {
        const ext = doc.file.name.split('.').pop()
        const path = `${museum.id}/audits/documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        let publicUrl: string
        try { publicUrl = await uploadToR2('object-documents', path, doc.file) } catch { done++; setStagedUploadProgress({ done, total: stagedDocs.length }); continue }
        await supabase.from('object_documents').insert({
          object_id: object.id, museum_id: museum.id,
          related_to_type: 'audit_record', related_to_id: auditRecord.id,
          label: doc.label || doc.file.name, document_type: doc.docType || 'Other',
          file_url: publicUrl, file_name: doc.file.name,
          file_size: doc.file.size, mime_type: doc.file.type,
          uploaded_by: userId,
        })
        done++
        setStagedUploadProgress({ done, total: stagedDocs.length })
      }
      setStagedUploadProgress(null)
    }

    setAuditForm({ inventoried_at: new Date().toISOString().slice(0,10), inventoried_by: '', exercise_id: '', location_confirmed: '', condition_confirmed: '', inventory_outcome: '', action_required: '', action_completed: false, action_completed_date: '', discrepancy: '', notes: '' })
    setStagedDocs([])
    const { data } = await supabase.from('audit_records').select('*').eq('object_id', object.id).order('inventoried_at', { ascending: false })
    setAuditHistory(data || [])
    logActivity('audit_recorded', `Audited "${object.title}"${auditForm.inventory_outcome ? ` — ${auditForm.inventory_outcome}` : ''}`)
    setSubmitting(false)
  }

  return (
    <>

      {canEdit && <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Record Inventory Check</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls} data-learn="audit.date">Date *</label><input type="date" value={auditForm.inventoried_at} onChange={e => setAuditForm(f => ({ ...f, inventoried_at: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls} data-learn="audit.inventoried_by">Inventoried By</label><input value={auditForm.inventoried_by} onChange={e => setAuditForm(f => ({ ...f, inventoried_by: e.target.value }))} className={inputCls} /></div>
        </div>
        <div>
          <label className={labelCls}>Audit Exercise</label>
          <select value={auditForm.exercise_id} onChange={e => setAuditForm(f => ({ ...f, exercise_id: e.target.value }))} className={inputCls}>
            <option value="">— Not part of an exercise —</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.audit_reference} — {ex.scope || 'General'}</option>
            ))}
          </select>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Link this audit record to a formal audit exercise</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls} data-learn="audit.location_confirmed">Location Confirmed</label><input value={auditForm.location_confirmed} onChange={e => setAuditForm(f => ({ ...f, location_confirmed: e.target.value }))} placeholder="Actual location found" className={inputCls} /></div>
          <div>
            <label className={labelCls} data-learn="audit.condition_confirmed">Condition Confirmed</label>
            <select value={auditForm.condition_confirmed} onChange={e => setAuditForm(f => ({ ...f, condition_confirmed: e.target.value }))} className={inputCls}>
              <option value="">— Not assessed —</option>
              {CONDITION_GRADES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls} data-learn="audit.outcome">Inventory Outcome *</label>
          <div className="flex gap-2 flex-wrap">
            {INVENTORY_OUTCOMES.map(o => (
              <button key={o} type="button" onClick={() => setAuditForm(f => ({ ...f, inventory_outcome: o }))}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${auditForm.inventory_outcome === o ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>
        {auditForm.inventory_outcome && auditForm.inventory_outcome !== 'Present and correct' && (
          <div className="space-y-3 border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50/30 dark:bg-amber-950/20">
            <div className="text-xs uppercase tracking-widest text-amber-600">Action Required</div>
            <div>
              <label className={labelCls}>Action Required</label>
              <input value={auditForm.action_required} onChange={e => setAuditForm(f => ({ ...f, action_required: e.target.value }))} placeholder="Describe action needed (e.g. update location, further investigation)" className={inputCls} />
            </div>
            {auditForm.action_required && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="action_completed" checked={auditForm.action_completed} onChange={e => setAuditForm(f => ({ ...f, action_completed: e.target.checked }))} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                  <label htmlFor="action_completed" className="text-sm text-stone-700 dark:text-stone-300">Action completed</label>
                </div>
                {auditForm.action_completed && (
                  <div>
                    <label className={labelCls}>Completed Date</label>
                    <input type="date" value={auditForm.action_completed_date} onChange={e => setAuditForm(f => ({ ...f, action_completed_date: e.target.value }))} className={inputCls} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div>
          <label className={labelCls}>Discrepancy</label>
          <textarea value={auditForm.discrepancy} onChange={e => setAuditForm(f => ({ ...f, discrepancy: e.target.value }))} rows={2}
            placeholder="Note any discrepancy from the catalogue record…"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>
        <div>
          <label className={labelCls} data-learn="audit.notes">Notes</label>
          <textarea value={auditForm.notes} onChange={e => setAuditForm(f => ({ ...f, notes: e.target.value }))} rows={2}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
        </div>
        <div>
          <label className={labelCls}>Supporting Documents</label>
          <StagedDocumentPicker relatedToType="audit_record" value={stagedDocs} onChange={setStagedDocs} />
        </div>
        {stagedUploadProgress && (
          <div>
            <div className="flex justify-between text-xs font-mono text-stone-400 dark:text-stone-500 mb-1">
              <span>Uploading documents…</span>
              <span>{stagedUploadProgress.done} / {stagedUploadProgress.total}</span>
            </div>
            <div className="h-1 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div className="h-full bg-stone-900 dark:bg-white rounded-full transition-all duration-300"
                style={{ width: `${(stagedUploadProgress.done / stagedUploadProgress.total) * 100}%` }} />
            </div>
          </div>
        )}
        <button type="button" onClick={addAudit} disabled={submitting}
          className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save audit record →'}
        </button>
      </div>}

      {form.last_inventoried && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Last Inventoried</div>
          <p className="text-sm text-stone-900 dark:text-stone-100">{new Date(form.last_inventoried).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}{form.inventoried_by && ` by ${form.inventoried_by}`}</p>
        </div>
      )}

      {auditLoaded && auditHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Audit History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Date</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">By</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Outcome</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Location Found</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Condition</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Action</th>
            </tr></thead>
            <tbody>
              {auditHistory.map(h => (
                <tr key={h.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRecord(h)}>
                  <td className="px-6 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{new Date(h.inventoried_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.inventoried_by}</td>
                  <td className="px-4 py-3">
                    {h.inventory_outcome && (
                      <span className={`text-xs font-mono px-2 py-1 rounded-full ${h.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{h.inventory_outcome}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{h.location_confirmed}</td>
                  <td className="px-4 py-3">{h.condition_confirmed && <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[h.condition_confirmed] || 'bg-stone-100 text-stone-500'}`}>{h.condition_confirmed}</span>}</td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">
                    {h.action_required && (
                      <span className={h.action_completed ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-amber-600 dark:text-amber-400'}>{h.action_required}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{new Date(selectedRecord.inventoried_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                {selectedRecord.inventoried_by && <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mt-0.5">By {selectedRecord.inventoried_by}</div>}
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              {selectedRecord.inventory_outcome && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Outcome</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedRecord.inventory_outcome === 'Present and correct' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{selectedRecord.inventory_outcome}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedRecord.location_confirmed && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Location Found</div>
                    <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.location_confirmed}</div>
                  </div>
                )}
                {selectedRecord.condition_confirmed && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Condition</div>
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[selectedRecord.condition_confirmed] || 'bg-stone-100 text-stone-500'}`}>{selectedRecord.condition_confirmed}</span>
                  </div>
                )}
              </div>
              {selectedRecord.action_required && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Action Required</div>
                  <div className={`text-sm ${selectedRecord.action_completed ? 'text-stone-400 dark:text-stone-500 line-through' : 'text-amber-700 dark:text-amber-400'}`}>{selectedRecord.action_required}</div>
                  {selectedRecord.action_completed && selectedRecord.action_completed_date && (
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">Completed {new Date(selectedRecord.action_completed_date).toLocaleDateString('en-GB')}</div>
                  )}
                </div>
              )}
              {selectedRecord.discrepancy && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Discrepancy</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.discrepancy}</div>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.notes}</div>
                </div>
              )}
              {selectedRecordDocs.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Supporting Documents</div>
                  <div className="space-y-1.5">
                    {selectedRecordDocs.map(doc => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-2.5 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                        <span className="text-stone-400">📎</span>
                        <span className="truncate">{doc.label || doc.file_name}</span>
                        {doc.document_type && <span className="ml-auto text-stone-300 dark:text-stone-600 shrink-0">{doc.document_type}</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
