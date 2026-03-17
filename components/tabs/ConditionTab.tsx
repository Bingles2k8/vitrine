'use client'

import { useState, useEffect, Fragment } from 'react'
import { inputCls, labelCls, sectionTitle, CONDITION_GRADES, CONDITION_STYLES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'

interface ConditionTabProps {
  form: Record<string, any>
  set: (field: string, value: any) => void
  canEdit: boolean
  object: any
  museum: any
  supabase: any
  logActivity: (actionType: string, description: string) => Promise<void>
}

const REASONS_FOR_CHECK = ['Acquisition', 'Loan out', 'Loan return', 'Display change', 'Routine', 'Damage suspected', 'Conservation', 'Insurance', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export default function ConditionTab({ form, set, canEdit, object, museum, supabase, logActivity }: ConditionTabProps) {
  const [conditionHistory, setConditionHistory] = useState<any[]>([])
  const [conditionLoaded, setConditionLoaded] = useState(false)
  const [conditionForm, setConditionForm] = useState({ grade: '', assessed_at: '', assessor: '', notes: '', reason_for_check: '', long_description: '', specific_issues: '', location_on_object: '', hazard_note: '', recommendations: '', priority: '', next_check_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [docsAssessmentId, setDocsAssessmentId] = useState<string | null>(null)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const canAttach = canEdit && getPlan(museum.plan).compliance
  const { toast } = useToast()

  useEffect(() => {
    if (!object.id) return
    supabase
      .from('condition_assessments')
      .select('*')
      .eq('object_id', object.id)
      .order('assessed_at', { ascending: false })
      .then(({ data }: any) => {
        setConditionHistory(data || [])
        setConditionLoaded(true)
      })
  }, [object.id])

  async function addCondition() {
    if (!conditionForm.grade || !conditionForm.assessed_at) return
    setSubmitting(true)
    try {
      const year = new Date().getFullYear()
      const count = conditionHistory.filter(h => h.assessment_reference?.startsWith(`CC-${year}-`)).length
      const assessmentRef = `CC-${year}-${String(count + 1).padStart(3, '0')}`

      const { data: newAssessment, error: insertErr } = await supabase.from('condition_assessments').insert({
        assessment_reference: assessmentRef,
        grade: conditionForm.grade,
        assessed_at: conditionForm.assessed_at,
        assessor: conditionForm.assessor,
        notes: conditionForm.notes,
        reason_for_check: conditionForm.reason_for_check || null,
        long_description: conditionForm.long_description || null,
        specific_issues: conditionForm.specific_issues || null,
        location_on_object: conditionForm.location_on_object || null,
        hazard_note: conditionForm.hazard_note || null,
        recommendations: conditionForm.recommendations || null,
        priority: conditionForm.priority || null,
        next_check_date: conditionForm.next_check_date || null,
        object_id: object.id,
        museum_id: museum.id,
      }).select('id').single()
      if (insertErr) throw insertErr

      await supabase.from('objects').update({
        condition_grade: conditionForm.grade,
        condition_date: conditionForm.assessed_at,
        condition_assessor: conditionForm.assessor,
      }).eq('id', object.id)

      set('condition_grade', conditionForm.grade)
      set('condition_date', conditionForm.assessed_at)
      set('condition_assessor', conditionForm.assessor)

      if (stagedDocs.length > 0) {
        const failed = await uploadStagedDocs(supabase, stagedDocs, object.id, museum.id, 'condition_assessment', newAssessment.id)
        if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
        setStagedDocs([])
      }
      setConditionForm({ grade: '', assessed_at: '', assessor: '', notes: '', reason_for_check: '', long_description: '', specific_issues: '', location_on_object: '', hazard_note: '', recommendations: '', priority: '', next_check_date: '' })

      const { data } = await supabase
        .from('condition_assessments')
        .select('*')
        .eq('object_id', object.id)
        .order('assessed_at', { ascending: false })
      setConditionHistory(data || [])

      await logActivity('condition_assessment', `Condition assessed as ${conditionForm.grade}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Log Condition Assessment */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Log Condition Assessment</div>

        <div>
          <label className={labelCls}>Condition Grade *</label>
          <div className="flex gap-2 flex-wrap">
            {CONDITION_GRADES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setConditionForm({ ...conditionForm, grade: g })}
                disabled={!canEdit}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                  conditionForm.grade === g
                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white'
                    : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Assessment Date *</label>
            <input
              type="date"
              value={conditionForm.assessed_at}
              onChange={e => setConditionForm({ ...conditionForm, assessed_at: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className={labelCls}>Assessor</label>
            <input
              value={conditionForm.assessor}
              onChange={e => setConditionForm({ ...conditionForm, assessor: e.target.value })}
              className={inputCls}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Reason for Check</label>
          <select value={conditionForm.reason_for_check} onChange={e => setConditionForm({ ...conditionForm, reason_for_check: e.target.value })} className={inputCls} disabled={!canEdit}>
            <option value="">— Select —</option>
            {REASONS_FOR_CHECK.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Detailed Description</label>
          <textarea value={conditionForm.long_description} onChange={e => setConditionForm({ ...conditionForm, long_description: e.target.value })} rows={2} placeholder="Detailed condition description..." className={`${inputCls} resize-none`} disabled={!canEdit} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Specific Issues</label>
            <textarea value={conditionForm.specific_issues} onChange={e => setConditionForm({ ...conditionForm, specific_issues: e.target.value })} rows={2} placeholder="e.g. flaking paint, crack in base..." className={`${inputCls} resize-none`} disabled={!canEdit} />
          </div>
          <div>
            <label className={labelCls}>Location on Object</label>
            <input value={conditionForm.location_on_object} onChange={e => setConditionForm({ ...conditionForm, location_on_object: e.target.value })} placeholder="e.g. upper left corner, base" className={inputCls} disabled={!canEdit} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Hazard Note</label>
          <input value={conditionForm.hazard_note} onChange={e => setConditionForm({ ...conditionForm, hazard_note: e.target.value })} placeholder="Any hazardous materials or handling risks" className={inputCls} disabled={!canEdit} />
        </div>
        <div>
          <label className={labelCls}>Recommendations</label>
          <textarea value={conditionForm.recommendations} onChange={e => setConditionForm({ ...conditionForm, recommendations: e.target.value })} rows={2} placeholder="Recommended actions..." className={`${inputCls} resize-none`} disabled={!canEdit} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Priority</label>
            <select value={conditionForm.priority} onChange={e => setConditionForm({ ...conditionForm, priority: e.target.value })} className={inputCls} disabled={!canEdit}>
              <option value="">— Select —</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Next Check Date</label>
            <input type="date" value={conditionForm.next_check_date} onChange={e => setConditionForm({ ...conditionForm, next_check_date: e.target.value })} className={inputCls} disabled={!canEdit} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={conditionForm.notes}
            onChange={e => setConditionForm({ ...conditionForm, notes: e.target.value })}
            rows={3}
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            disabled={!canEdit}
          />
        </div>

        {canAttach && (
          <div>
            <label className={labelCls}>Supporting Documents</label>
            <StagedDocumentPicker relatedToType="condition_assessment" value={stagedDocs} onChange={setStagedDocs} />
          </div>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={addCondition}
            disabled={submitting || !conditionForm.grade || !conditionForm.assessed_at}
            className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
          >
            {submitting ? 'Saving\u2026' : 'Log assessment \u2192'}
          </button>
        )}
      </div>

      {/* Current Condition */}
      {form.condition_grade && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Current Condition</div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[form.condition_grade] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
              {form.condition_grade}
            </span>
            {form.condition_date && (
              <span className="text-xs text-stone-400 dark:text-stone-500">
                Assessed {new Date(form.condition_date).toLocaleDateString('en-GB')}
              </span>
            )}
            {form.condition_assessor && (
              <span className="text-xs text-stone-400 dark:text-stone-500">
                by {form.condition_assessor}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Assessment History */}
      {conditionLoaded && conditionHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Assessment History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Date</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Grade</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Assessor</th>
                  <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">Notes</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {conditionHistory.map((h: any) => (
                  <Fragment key={h.id}>
                    <tr className="border-b border-stone-100 dark:border-stone-800">
                      <td className="py-2 pr-4 text-stone-500 dark:text-stone-400 font-mono text-xs">
                        {new Date(h.assessed_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${CONDITION_STYLES[h.grade] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                          {h.grade}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-stone-500 dark:text-stone-400">{h.assessor}</td>
                      <td className="py-2 pr-4 text-stone-500 dark:text-stone-400">{h.notes}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => setDocsAssessmentId(docsAssessmentId === h.id ? null : h.id)}
                          className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap"
                        >
                          {docsAssessmentId === h.id ? 'Hide docs' : 'Documents'}
                        </button>
                      </td>
                    </tr>
                    {docsAssessmentId === h.id && (
                      <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                        <td colSpan={5} className="py-3 px-2">
                          <DocumentAttachments
                            objectId={object.id}
                            museumId={museum.id}
                            relatedToType="condition_assessment"
                            relatedToId={h.id}
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
        </div>
      )}
    </>
  )
}
