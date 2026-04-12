'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, RISK_TYPES, RISK_SEVERITIES, RISK_LIKELIHOODS, RISK_SEVERITY_STYLES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'
import StagedDocumentPicker, { StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadToR2 } from '@/lib/r2-upload'

interface RiskTabProps {
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function RiskTab({ canEdit, object, museum, supabase, logActivity }: RiskTabProps) {
  const [riskHistory, setRiskHistory] = useState<any[]>([])
  const [riskLoaded, setRiskLoaded] = useState(false)
  const [riskForm, setRiskForm] = useState({ risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' })
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [stagedUploadProgress, setStagedUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [selectedRecordDocs, setSelectedRecordDocs] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('risk_register').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setRiskHistory(data || []); setRiskLoaded(true) })
  }, [object.id])

  useEffect(() => {
    if (!selectedRecord) { setSelectedRecordDocs([]); return }
    supabase.from('object_documents').select('*')
      .eq('related_to_type', 'risk')
      .eq('related_to_id', selectedRecord.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }: any) => setSelectedRecordDocs(data || []))
  }, [selectedRecord?.id])

  async function addRisk() {
    if (!riskForm.risk_type || !riskForm.description || submitting) return
    setSubmitting(true)
    const { data: riskRecord, error } = await supabase.from('risk_register').insert({
      ...riskForm, review_date: riskForm.review_date || null,
      object_id: object.id, museum_id: museum.id,
    }).select().single()
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }

    if (stagedDocs.length > 0 && riskRecord) {
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null
      setStagedUploadProgress({ done: 0, total: stagedDocs.length })
      let done = 0
      for (const doc of stagedDocs) {
        const ext = doc.file.name.split('.').pop()
        const path = `${museum.id}/risks/documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        let publicUrl: string
        try { publicUrl = await uploadToR2('object-documents', path, doc.file) } catch { done++; setStagedUploadProgress({ done, total: stagedDocs.length }); continue }
        await supabase.from('object_documents').insert({
          object_id: object.id, museum_id: museum.id,
          related_to_type: 'risk', related_to_id: riskRecord.id,
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

    setRiskForm({ risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' })
    setStagedDocs([])
    const { data } = await supabase.from('risk_register').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setRiskHistory(data || [])
    logActivity('risk_added', `Recorded ${riskForm.risk_type} risk for "${object.title}"`)
    setSubmitting(false)
  }

  async function updateRiskStatus(id: string, status: string) {
    const { error } = await supabase.from('risk_register').update({ status }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setRiskHistory(h => h.map(r => r.id === id ? { ...r, status } : r))
    if (selectedRecord?.id === id) setSelectedRecord((r: any) => ({ ...r, status }))
  }

  return (
    <>
      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Add Risk</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} data-learn="risk.type">Risk Type <span className="text-red-400">*</span></label>
              <select value={riskForm.risk_type} onChange={e => setRiskForm(f => ({ ...f, risk_type: e.target.value }))} className={inputCls}>
                <option value="">Select type…</option>
                {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Responsible Person</label>
              <input value={riskForm.responsible_person} onChange={e => setRiskForm(f => ({ ...f, responsible_person: e.target.value }))} placeholder="Name" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls} data-learn="risk.description">Description <span className="text-red-400">*</span></label>
            <textarea value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the risk…" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls} data-learn="risk.severity">Severity</label>
              <select value={riskForm.severity} onChange={e => setRiskForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                {RISK_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} data-learn="risk.likelihood">Likelihood</label>
              <select value={riskForm.likelihood} onChange={e => setRiskForm(f => ({ ...f, likelihood: e.target.value }))} className={inputCls}>
                {RISK_LIKELIHOODS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} data-learn="risk.review_date">Review Date</label>
              <input type="date" value={riskForm.review_date} onChange={e => setRiskForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls} data-learn="risk.mitigation">Mitigation</label>
            <textarea value={riskForm.mitigation} onChange={e => setRiskForm(f => ({ ...f, mitigation: e.target.value }))} rows={2} placeholder="Steps taken or planned to mitigate…" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={riskForm.notes} onChange={e => setRiskForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Supporting Documents</label>
            <StagedDocumentPicker relatedToType="risk" value={stagedDocs} onChange={setStagedDocs} />
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
          <button type="button" onClick={addRisk} disabled={!riskForm.risk_type || !riskForm.description || submitting}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
            {submitting ? 'Saving\u2026' : 'Add risk \u2192'}
          </button>
        </div>
      )}

      {riskLoaded && riskHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{ marginBottom: 0 }}>Risk Register</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Type</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Severity</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Likelihood</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Review Date</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3"></th>}
            </tr></thead>
            <tbody>
              {riskHistory.map(r => (
                <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRecord(r)}>
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.risk_type}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${RISK_SEVERITY_STYLES[r.severity] || RISK_SEVERITY_STYLES.Medium}`}>{r.severity}</span></td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.likelihood}</td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.review_date ? new Date(r.review_date).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${r.status === 'Closed' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : r.status === 'Mitigated' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{r.status}</span></td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'Open' && <button type="button" onClick={() => updateRiskStatus(r.id, 'Mitigated')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Mitigate</button>}
                        {r.status !== 'Closed' && <button type="button" onClick={() => updateRiskStatus(r.id, 'Closed')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Close</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {riskLoaded && riskHistory.length === 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">⚑</div>
          <p className="text-sm text-stone-400 dark:text-stone-500">No risks recorded for this object.</p>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{selectedRecord.risk_type}</div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded-full mt-1 inline-block ${selectedRecord.status === 'Closed' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : selectedRecord.status === 'Mitigated' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{selectedRecord.status}</span>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Description</div>
                <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Severity</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${RISK_SEVERITY_STYLES[selectedRecord.severity] || RISK_SEVERITY_STYLES.Medium}`}>{selectedRecord.severity}</span>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Likelihood</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.likelihood}</div>
                </div>
              </div>
              {selectedRecord.responsible_person && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Responsible Person</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.responsible_person}</div>
                </div>
              )}
              {selectedRecord.review_date && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Review Date</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{new Date(selectedRecord.review_date).toLocaleDateString('en-GB')}</div>
                </div>
              )}
              {selectedRecord.mitigation && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Mitigation</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.mitigation}</div>
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
              {canEdit && selectedRecord.status !== 'Closed' && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-3">
                  {selectedRecord.status === 'Open' && (
                    <button type="button" onClick={() => updateRiskStatus(selectedRecord.id, 'Mitigated')} className="text-xs font-mono text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded px-3 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors">Mark mitigated</button>
                  )}
                  <button type="button" onClick={() => updateRiskStatus(selectedRecord.id, 'Closed')} className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Close risk</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
