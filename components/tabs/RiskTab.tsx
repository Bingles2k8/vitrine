'use client'

import { useEffect, useState } from 'react'
import { inputCls, labelCls, sectionTitle, RISK_TYPES, RISK_SEVERITIES, RISK_LIKELIHOODS, RISK_SEVERITY_STYLES } from '@/components/tabs/shared'
import { useToast } from '@/components/Toast'

interface RiskTabProps {
  canEdit: boolean
  artifact: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

export default function RiskTab({ canEdit, artifact, museum, supabase, logActivity }: RiskTabProps) {
  const [riskHistory, setRiskHistory] = useState<any[]>([])
  const [riskLoaded, setRiskLoaded] = useState(false)
  const [riskForm, setRiskForm] = useState({ risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('risk_register').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
      .then(({ data }: any) => { setRiskHistory(data || []); setRiskLoaded(true) })
  }, [artifact.id])

  async function addRisk() {
    if (!riskForm.risk_type || !riskForm.description || submitting) return
    setSubmitting(true)
    const { error } = await supabase.from('risk_register').insert({
      ...riskForm, review_date: riskForm.review_date || null,
      artifact_id: artifact.id, museum_id: museum.id,
    })
    if (error) { toast(error.message, 'error'); setSubmitting(false); return }
    setRiskForm({ risk_type: '', description: '', severity: 'Medium', likelihood: 'Medium', mitigation: '', review_date: '', responsible_person: '', notes: '' })
    const { data } = await supabase.from('risk_register').select('*').eq('artifact_id', artifact.id).order('created_at', { ascending: false })
    setRiskHistory(data || [])
    logActivity('risk_added', `Recorded ${riskForm.risk_type} risk for "${artifact.title}"`)
    setSubmitting(false)
  }

  async function updateRiskStatus(id: string, status: string) {
    const { error } = await supabase.from('risk_register').update({ status }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setRiskHistory(h => h.map(r => r.id === id ? { ...r, status } : r))
  }

  return (
    <>

      {canEdit && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
          <div className={sectionTitle}>Add Risk</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Risk Type *</label>
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
            <label className={labelCls}>Description *</label>
            <textarea value={riskForm.description} onChange={e => setRiskForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the risk…" className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Severity</label>
              <select value={riskForm.severity} onChange={e => setRiskForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                {RISK_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Likelihood</label>
              <select value={riskForm.likelihood} onChange={e => setRiskForm(f => ({ ...f, likelihood: e.target.value }))} className={inputCls}>
                {RISK_LIKELIHOODS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Review Date</label>
              <input type="date" value={riskForm.review_date} onChange={e => setRiskForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Mitigation</label>
            <textarea value={riskForm.mitigation} onChange={e => setRiskForm(f => ({ ...f, mitigation: e.target.value }))} rows={2} placeholder="Steps taken or planned to mitigate…" className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={riskForm.notes} onChange={e => setRiskForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <button type="button" onClick={addRisk} disabled={!riskForm.risk_type || !riskForm.description || submitting}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded disabled:opacity-40">
            {submitting ? 'Saving…' : 'Add risk →'}
          </button>
        </div>
      )}

      {riskLoaded && riskHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800"><div className={sectionTitle} style={{marginBottom:0}}>Risk History</div></div>
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
                <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800">
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.risk_type}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${RISK_SEVERITY_STYLES[r.severity] || RISK_SEVERITY_STYLES.Medium}`}>{r.severity}</span></td>
                  <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.likelihood}</td>
                  <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{r.review_date ? new Date(r.review_date).toLocaleDateString('en-GB') : '—'}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-mono px-2 py-1 rounded-full ${r.status === 'Closed' ? 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' : r.status === 'Mitigated' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{r.status}</span></td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
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
    </>
  )
}
