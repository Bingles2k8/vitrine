'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, DAMAGE_TYPES, DAMAGE_SEVERITIES, DAMAGE_SEVERITY_STYLES, CURRENCIES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'
import { getPlan } from '@/lib/plans'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'

interface DamageTabProps {
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

const OBJECT_STATUSES_AFTER = ['Intact — no treatment needed', 'Awaiting conservation', 'Under conservation', 'Repaired', 'Irreparable — retained', 'Write-off']

export default function DamageTab({ canEdit, object, museum, supabase, logActivity }: DamageTabProps) {
  const [damageHistory, setDamageHistory] = useState<any[]>([])
  const [damageLoaded, setDamageLoaded] = useState(false)
  const [damageForm, setDamageForm] = useState({ incident_date: '', discovered_date: '', discovered_by: '', damage_type: 'Accidental', severity: 'Minor', description: '', cause: '', location_at_incident: '', repair_estimate: '', repair_currency: 'GBP', insurance_claim_ref: '', insurance_notified: false, police_report_ref: '', insurance_claim_outcome: '', object_status_after_event: '', reported_to_governing_body: false, action_taken: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const { toast } = useToast()
  const canAttach = canEdit && getPlan(museum.plan).compliance

  useEffect(() => {
    supabase.from('damage_reports').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setDamageHistory(data || []); setDamageLoaded(true) })
  }, [object.id])

  async function addDamage() {
    if (!damageForm.incident_date || !damageForm.discovered_by || !damageForm.description || submitting) return
    setSubmitting(true)
    const year = new Date().getFullYear()
    const existingCount = damageHistory.filter(r => r.report_number?.startsWith(`DR-${year}-`)).length
    const reportNumber = `DR-${year}-${String(existingCount + 1).padStart(3, '0')}`
    const { error } = await supabase.from('damage_reports').insert({
      ...damageForm, report_number: reportNumber,
      repair_estimate: damageForm.repair_estimate ? Number(damageForm.repair_estimate) : null,
      police_report_ref: damageForm.police_report_ref || null,
      insurance_claim_outcome: damageForm.insurance_claim_outcome || null,
      object_status_after_event: damageForm.object_status_after_event || null,
      object_id: object.id, museum_id: museum.id,
    })
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    const newRecord = await supabase.from('damage_reports').select('id').eq('report_number', reportNumber).single()
    if (stagedDocs.length > 0 && newRecord.data) {
      const failed = await uploadStagedDocs(supabase, stagedDocs, object.id, museum.id, 'damage', newRecord.data.id)
      if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
      setStagedDocs([])
    }
    setDamageForm({ incident_date: '', discovered_date: '', discovered_by: '', damage_type: 'Accidental', severity: 'Minor', description: '', cause: '', location_at_incident: '', repair_estimate: '', repair_currency: 'GBP', insurance_claim_ref: '', insurance_notified: false, police_report_ref: '', insurance_claim_outcome: '', object_status_after_event: '', reported_to_governing_body: false, action_taken: '', notes: '' })
    const { data } = await supabase.from('damage_reports').select('*').eq('object_id', object.id).order('created_at', { ascending: false })
    setDamageHistory(data || [])
    logActivity('damage_reported', `Reported ${damageForm.damage_type} damage to "${object.title}"`)
    setSubmitting(false)
  }

  async function updateDamageStatus(id: string, status: string) {
    const { error } = await supabase.from('damage_reports').update({ status }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setDamageHistory(h => h.map(r => r.id === id ? { ...r, status } : r))
    if (selectedRecord?.id === id) setSelectedRecord((r: any) => ({ ...r, status }))
  }

  const statusStyle = (status: string) =>
    status === 'Closed' || status === 'Write-off' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
    : status === 'Repaired' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
    : status === 'Under Investigation' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'

  return (
    <>
      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Report Damage</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Incident Date <span className="text-red-400">*</span></label>
              <input type="date" value={damageForm.incident_date} onChange={e => setDamageForm(f => ({ ...f, incident_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Discovered Date</label>
              <input type="date" value={damageForm.discovered_date} onChange={e => setDamageForm(f => ({ ...f, discovered_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Discovered By <span className="text-red-400">*</span></label>
              <input value={damageForm.discovered_by} onChange={e => setDamageForm(f => ({ ...f, discovered_by: e.target.value }))} placeholder="Name" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Damage Type</label>
              <select value={damageForm.damage_type} onChange={e => setDamageForm(f => ({ ...f, damage_type: e.target.value }))} className={inputCls}>
                {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Severity</label>
              <select value={damageForm.severity} onChange={e => setDamageForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                {DAMAGE_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description <span className="text-red-400">*</span></label>
            <textarea value={damageForm.description} onChange={e => setDamageForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the damage or loss…" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cause</label>
              <input value={damageForm.cause} onChange={e => setDamageForm(f => ({ ...f, cause: e.target.value }))} placeholder="Known or suspected cause" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location at Time of Incident</label>
              <input value={damageForm.location_at_incident} onChange={e => setDamageForm(f => ({ ...f, location_at_incident: e.target.value }))} placeholder="Where the object was" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Repair Estimate</label>
              <input type="number" step="0.01" min="0" value={damageForm.repair_estimate} onChange={e => setDamageForm(f => ({ ...f, repair_estimate: e.target.value }))} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select value={damageForm.repair_currency} onChange={e => setDamageForm(f => ({ ...f, repair_currency: e.target.value }))} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Insurance Claim Ref</label>
              <input value={damageForm.insurance_claim_ref} onChange={e => setDamageForm(f => ({ ...f, insurance_claim_ref: e.target.value }))} placeholder="Claim reference" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Insurance Claim Outcome</label>
              <input value={damageForm.insurance_claim_outcome} onChange={e => setDamageForm(f => ({ ...f, insurance_claim_outcome: e.target.value }))} placeholder="e.g. Settled, Pending, Denied" className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <input type="checkbox" checked={damageForm.insurance_notified} onChange={e => setDamageForm(f => ({ ...f, insurance_notified: e.target.checked }))} className="rounded border-stone-300" />
            Insurance provider notified
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Police Report Ref</label>
              <input value={damageForm.police_report_ref} onChange={e => setDamageForm(f => ({ ...f, police_report_ref: e.target.value }))} placeholder="Crime reference number" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Object Status After Event</label>
              <select value={damageForm.object_status_after_event} onChange={e => setDamageForm(f => ({ ...f, object_status_after_event: e.target.value }))} className={inputCls}>
                <option value="">— Select —</option>
                {OBJECT_STATUSES_AFTER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
            <input type="checkbox" checked={damageForm.reported_to_governing_body} onChange={e => setDamageForm(f => ({ ...f, reported_to_governing_body: e.target.checked }))} className="rounded border-stone-300" />
            Reported to governing body
          </label>
          <div>
            <label className={labelCls}>Action Taken</label>
            <textarea value={damageForm.action_taken} onChange={e => setDamageForm(f => ({ ...f, action_taken: e.target.value }))} rows={2} placeholder="Immediate steps taken…" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={damageForm.notes} onChange={e => setDamageForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
          </div>
          {canAttach && (
            <div>
              <label className={labelCls}>Supporting Documents</label>
              <StagedDocumentPicker relatedToType="damage" value={stagedDocs} onChange={setStagedDocs} />
            </div>
          )}
          <button type="button" onClick={addDamage} disabled={!damageForm.incident_date || !damageForm.discovered_by || !damageForm.description || submitting}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50">
            {submitting ? 'Saving\u2026' : 'Save report \u2192'}
          </button>
        </div>
      )}

      {damageLoaded && damageHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{ marginBottom: 0 }}>Damage History</div></div>
          <table className="w-full">
            <thead><tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Report</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Severity</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
              <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3"></th>}
            </tr></thead>
            <tbody>
              {damageHistory.map(r => (
                <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer" onClick={() => setSelectedRecord(r)}>
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium font-mono text-stone-900 dark:text-stone-100">{r.report_number}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.damage_type}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${DAMAGE_SEVERITY_STYLES[r.severity] || DAMAGE_SEVERITY_STYLES.Minor}`}>{r.severity}</span></td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.incident_date ? new Date(r.incident_date).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${statusStyle(r.status)}`}>{r.status}</span></td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {r.status === 'Open' && <button type="button" onClick={() => updateDamageStatus(r.id, 'Under Investigation')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Investigate</button>}
                        {(r.status === 'Open' || r.status === 'Under Investigation') && <button type="button" onClick={() => updateDamageStatus(r.id, 'Repaired')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Repaired</button>}
                        {r.status !== 'Closed' && r.status !== 'Write-off' && <button type="button" onClick={() => updateDamageStatus(r.id, 'Closed')} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Close</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {damageLoaded && damageHistory.length === 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">⚠</div>
          <p className="text-sm text-stone-400 dark:text-stone-500">No damage reports for this object.</p>
        </div>
      )}

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRecord(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-6 border-b border-stone-200 dark:border-stone-700">
              <div>
                <div className="font-serif text-lg italic text-stone-900 dark:text-stone-100">{selectedRecord.damage_type} Damage</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{selectedRecord.report_number}</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${statusStyle(selectedRecord.status)}`}>{selectedRecord.status}</span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xl leading-none ml-4">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Incident Date</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{selectedRecord.incident_date ? new Date(selectedRecord.incident_date).toLocaleDateString('en-GB') : '—'}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Severity</div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-full ${DAMAGE_SEVERITY_STYLES[selectedRecord.severity] || DAMAGE_SEVERITY_STYLES.Minor}`}>{selectedRecord.severity}</span>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Description</div>
                <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.description}</div>
              </div>
              {selectedRecord.discovered_by && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Discovered By</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.discovered_by}{selectedRecord.discovered_date ? ` on ${new Date(selectedRecord.discovered_date).toLocaleDateString('en-GB')}` : ''}</div>
                </div>
              )}
              {selectedRecord.cause && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Cause</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.cause}</div>
                </div>
              )}
              {selectedRecord.location_at_incident && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Location at Incident</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.location_at_incident}</div>
                </div>
              )}
              {selectedRecord.repair_estimate && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Repair Estimate</div>
                  <div className="text-sm font-mono text-stone-700 dark:text-stone-300">{selectedRecord.repair_currency} {parseFloat(selectedRecord.repair_estimate).toFixed(2)}</div>
                </div>
              )}
              {(selectedRecord.insurance_claim_ref || selectedRecord.insurance_notified) && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Insurance</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">
                    {selectedRecord.insurance_notified ? 'Provider notified' : 'Provider not notified'}
                    {selectedRecord.insurance_claim_ref ? ` — Ref: ${selectedRecord.insurance_claim_ref}` : ''}
                    {selectedRecord.insurance_claim_outcome ? ` — ${selectedRecord.insurance_claim_outcome}` : ''}
                  </div>
                </div>
              )}
              {selectedRecord.object_status_after_event && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Object Status After Event</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300">{selectedRecord.object_status_after_event}</div>
                </div>
              )}
              {selectedRecord.action_taken && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Action Taken</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.action_taken}</div>
                </div>
              )}
              {selectedRecord.notes && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">{selectedRecord.notes}</div>
                </div>
              )}
              {canEdit && selectedRecord.status !== 'Closed' && selectedRecord.status !== 'Write-off' && (
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex gap-3 flex-wrap">
                  {selectedRecord.status === 'Open' && <button type="button" onClick={() => updateDamageStatus(selectedRecord.id, 'Under Investigation')} className="text-xs font-mono text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded px-3 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors">Under investigation</button>}
                  {(selectedRecord.status === 'Open' || selectedRecord.status === 'Under Investigation') && <button type="button" onClick={() => updateDamageStatus(selectedRecord.id, 'Repaired')} className="text-xs font-mono text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">Mark repaired</button>}
                  <button type="button" onClick={() => updateDamageStatus(selectedRecord.id, 'Closed')} className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">Close report</button>
                </div>
              )}
              {canAttach && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">Documents</div>
                  <DocumentAttachments objectId={object.id} museumId={museum.id} relatedToType="damage" relatedToId={selectedRecord.id} canEdit={canEdit} canAttach={canAttach} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
