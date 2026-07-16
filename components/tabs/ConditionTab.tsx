'use client'

import { useState, useEffect, Fragment } from 'react'
import { inputCls, labelCls, sectionTitle, CONDITION_GRADES, CONDITION_STYLES } from '@/components/tabs/shared'
import { getPlan } from '@/lib/plans'
import { useToast } from '@/components/Toast'
import DocumentAttachments from '@/components/DocumentAttachments'
import StagedDocumentPicker, { type StagedDoc } from '@/components/StagedDocumentPicker'
import { uploadStagedDocs } from '@/lib/uploadStagedDocs'
import { insertWithReference } from '@/lib/nextReference'
import AutocompleteInput from '@/components/AutocompleteInput'
import type { SupabaseClient } from '@supabase/supabase-js'

interface ConditionAssessment {
  id: string
  assessment_reference: string | null
  grade: string
  assessed_at: string
  assessor: string | null
  notes: string | null
  reason_for_check: string | null
  long_description: string | null
  hazard_note: string | null
  recommendations: string | null
  next_check_date: string | null
  location_on_object: string | null
  priority: string | null
}

type ConditionForm = {
  grade: string
  assessed_at: string
  assessor: string
  notes: string
  reason_for_check: string
  other_reason: string
  long_description: string
  hazard_note: string
  recommendations: string
  next_check_date: string
  location_on_object: string
  priority: string
}

interface ConditionTabProps {
  form: Record<string, string | number | boolean | null | undefined>
  set: (field: string, value: string | number | boolean | null) => void
  canEdit: boolean
  object: { id: string; [key: string]: unknown }
  museum: { id: string; plan: string; [key: string]: unknown }
  supabase: SupabaseClient
  logActivity: (actionType: string, description: string) => Promise<void>
}

const REASONS_FOR_CHECK = ['Acquisition', 'Loan out', 'Loan return', 'Display change', 'Routine', 'Damage suspected', 'Conservation', 'Insurance', 'Other']
const CONDITION_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const OTHER_REASON_SUGGESTIONS = ['Pest inspection', 'Environmental check', 'Pre-loan', 'Post-loan', 'Before photography', 'After photography', 'Emergency', 'Staff training', 'Insurance renewal', 'Public exhibition']
const today = new Date().toISOString().split('T')[0]

export default function ConditionTab({ form, set, canEdit, object, museum, supabase, logActivity }: ConditionTabProps) {
  const [conditionHistory, setConditionHistory] = useState<ConditionAssessment[]>([])
  const [conditionLoaded, setConditionLoaded] = useState(false)
  const [conditionForm, setConditionForm] = useState({ grade: '', assessed_at: today, assessor: '', notes: '', reason_for_check: '', other_reason: '', long_description: '', hazard_note: '', recommendations: '', next_check_date: '', location_on_object: '', priority: '' })
  const [submitting, setSubmitting] = useState(false)
  const [docsAssessmentId, setDocsAssessmentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<ConditionForm>({ grade: '', assessed_at: today, assessor: '', notes: '', reason_for_check: '', other_reason: '', long_description: '', hazard_note: '', recommendations: '', next_check_date: '', location_on_object: '', priority: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const canAttach = canEdit && (getPlan(museum.plan).compliance || getPlan(museum.plan).advancedCustomisation)
  const { toast } = useToast()

  useEffect(() => {
    if (!object.id) return
    supabase
      .from('condition_assessments')
      .select('*')
      .eq('object_id', object.id)
      .order('assessed_at', { ascending: false })
      .then(({ data }: { data: ConditionAssessment[] | null }) => {
        setConditionHistory(data || [])
        setConditionLoaded(true)
      })
  }, [object.id])

  async function addCondition() {
    if (!conditionForm.grade || !conditionForm.assessed_at) return
    setSubmitting(true)
    try {
      const effectiveReason = conditionForm.reason_for_check === 'Other' ? (conditionForm.other_reason || 'Other') : conditionForm.reason_for_check

      const { data: newAssessment, error: insertErr } = await insertWithReference(
        supabase,
        { table: 'condition_assessments', column: 'assessment_reference', prefix: 'CC', museumId: museum.id },
        assessmentRef => ({
          assessment_reference: assessmentRef,
          grade: conditionForm.grade,
          assessed_at: conditionForm.assessed_at,
          assessor: conditionForm.assessor,
          notes: conditionForm.notes,
          reason_for_check: effectiveReason || null,
          long_description: conditionForm.long_description || null,
          hazard_note: conditionForm.hazard_note || null,
          recommendations: conditionForm.recommendations || null,
          next_check_date: conditionForm.next_check_date || null,
          location_on_object: conditionForm.location_on_object || null,
          priority: conditionForm.priority || null,
          object_id: object.id,
          museum_id: museum.id,
        })
      )
      if (insertErr) throw insertErr

      // Only overwrite the object snapshot if this assessment is not older than the current snapshot,
      // so a backdated assessment can't clobber a newer one.
      const currentSnapshotDate = form.condition_date as string | null | undefined
      if (!currentSnapshotDate || conditionForm.assessed_at >= currentSnapshotDate) {
        await supabase.from('objects').update({
          condition_grade: conditionForm.grade,
          condition_date: conditionForm.assessed_at,
          condition_assessor: conditionForm.assessor,
          hazard_note: conditionForm.hazard_note || null,
        }).eq('id', object.id)

        set('condition_grade', conditionForm.grade)
        set('condition_date', conditionForm.assessed_at)
        set('condition_assessor', conditionForm.assessor)
        set('hazard_note', conditionForm.hazard_note || '')
      }

      if (stagedDocs.length > 0 && newAssessment) {
        const failed = await uploadStagedDocs(stagedDocs, object.id, museum.id, 'condition_assessment', newAssessment.id)
        if (failed.length > 0) toast(`Failed to attach: ${failed.join(', ')}`, 'error')
        setStagedDocs([])
      }
      setConditionForm({ grade: '', assessed_at: today, assessor: '', notes: '', reason_for_check: '', other_reason: '', long_description: '', hazard_note: '', recommendations: '', next_check_date: '', location_on_object: '', priority: '' })

      const { data } = await supabase
        .from('condition_assessments')
        .select('*')
        .eq('object_id', object.id)
        .order('assessed_at', { ascending: false })
      setConditionHistory(data || [])

      await logActivity('condition_assessment', `Condition assessed as ${conditionForm.grade}`)
    } catch (err: any) {
      toast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(h: ConditionAssessment) {
    setDocsAssessmentId(null)
    const isKnownReason = h.reason_for_check ? REASONS_FOR_CHECK.includes(h.reason_for_check) : true
    setEditForm({
      grade: h.grade || '',
      assessed_at: h.assessed_at || today,
      assessor: h.assessor || '',
      notes: h.notes || '',
      reason_for_check: h.reason_for_check ? (isKnownReason ? h.reason_for_check : 'Other') : '',
      other_reason: h.reason_for_check && !isKnownReason ? h.reason_for_check : '',
      long_description: h.long_description || '',
      hazard_note: h.hazard_note || '',
      recommendations: h.recommendations || '',
      location_on_object: h.location_on_object || '',
      priority: h.priority || '',
      next_check_date: h.next_check_date || '',
    })
    setEditingId(h.id)
  }

  async function saveEdit(h: ConditionAssessment) {
    if (!editForm.grade || !editForm.assessed_at || savingEdit) return
    setSavingEdit(true)
    try {
      const effectiveReason = editForm.reason_for_check === 'Other' ? (editForm.other_reason || 'Other') : editForm.reason_for_check
      const changedFields = {
        grade: editForm.grade,
        assessed_at: editForm.assessed_at,
        assessor: editForm.assessor || null,
        notes: editForm.notes || null,
        reason_for_check: effectiveReason || null,
        long_description: editForm.long_description || null,
        hazard_note: editForm.hazard_note || null,
        recommendations: editForm.recommendations || null,
        next_check_date: editForm.next_check_date || null,
        location_on_object: editForm.location_on_object || null,
        priority: editForm.priority || null,
      }
      const { error: updErr } = await supabase.from('condition_assessments').update(changedFields).eq('id', h.id)
      if (updErr) { toast(updErr.message, 'error'); return }
      setConditionHistory(hist => hist.map(x => (x.id === h.id ? { ...x, ...changedFields } : x)))
      setEditingId(null)
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteCondition(h: ConditionAssessment) {
    if (!confirm('Delete this assessment? This cannot be undone.')) return
    const { error: delErr } = await supabase.from('condition_assessments').delete().eq('id', h.id)
    if (delErr) { toast(delErr.message, 'error'); return }
    setConditionHistory(hist => hist.filter(x => x.id !== h.id))
    if (editingId === h.id) setEditingId(null)
    if (docsAssessmentId === h.id) setDocsAssessmentId(null)
  }

  // condition_assessments INSERT is gated on museum_has_compliance_plan() in
  // RLS, so on Community/Hobbyist this form could only ever fail at the
  // database. Show the register read-only there instead of a dead form (X2/O6).
  // The object's own condition snapshot below is unaffected and still works.
  const canLogAssessment = getPlan(museum.plan).compliance

  return (
    <>
      {/* Log Condition Assessment */}
      {!canLogAssessment ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Condition Assessment Register</div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-2">
            Formal condition assessments — with assessor, re-check dates and supporting
            documents — are part of the Professional plan. You can still record this
            object&apos;s current condition below.
          </p>
        </div>
      ) : (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
        <div className={sectionTitle}>Log Condition Assessment</div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="condition.grade">Condition Grade <span className="text-red-400">*</span></label>
            <select
              value={conditionForm.grade}
              onChange={e => setConditionForm(f => ({ ...f, grade: e.target.value }))}
              className={inputCls}
              disabled={!canEdit}
            >
              <option value="">— Select grade —</option>
              {CONDITION_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} data-learn="condition.assessed_at">Assessment Date <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={conditionForm.assessed_at}
              onChange={e => setConditionForm(f => ({ ...f, assessed_at: e.target.value }))}
              className={inputCls}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} data-learn="condition.assessor">Assessor</label>
          <input
            value={conditionForm.assessor}
            onChange={e => setConditionForm(f => ({ ...f, assessor: e.target.value }))}
            className={inputCls}
            disabled={!canEdit}
          />
        </div>

        {getPlan(museum.plan).fullMode && (
          <>
            <div>
              <label className={labelCls} data-learn="condition.reason_for_check">Reason for Check</label>
              <select value={conditionForm.reason_for_check} onChange={e => setConditionForm(f => ({ ...f, reason_for_check: e.target.value, other_reason: '' }))} className={inputCls} disabled={!canEdit}>
                <option value="">— Select —</option>
                {REASONS_FOR_CHECK.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {conditionForm.reason_for_check === 'Other' && (
              <div>
                <label className={labelCls}>Specify reason</label>
                <AutocompleteInput
                  value={conditionForm.other_reason}
                  onChange={v => setConditionForm(f => ({ ...f, other_reason: v }))}
                  staticList={OTHER_REASON_SUGGESTIONS}
                  placeholder="Describe the reason…"
                  className={inputCls}
                />
              </div>
            )}
          </>
        )}

        <div>
          <label className={labelCls} data-learn="condition.long_description">Detailed Description</label>
          <textarea value={conditionForm.long_description} onChange={e => setConditionForm(f => ({ ...f, long_description: e.target.value }))} rows={2} placeholder="Detailed condition description..." className={`${inputCls} resize-none`} disabled={!canEdit} />
        </div>

        <div>
          <label className={labelCls} data-learn="condition.hazard_note">Hazard Note</label>
          <input value={conditionForm.hazard_note} onChange={e => setConditionForm(f => ({ ...f, hazard_note: e.target.value }))} placeholder="Any hazardous materials or handling risks" className={inputCls} disabled={!canEdit} />
        </div>

        <div>
          <label className={labelCls} data-learn="condition.recommendations">Recommendations</label>
          <textarea value={conditionForm.recommendations} onChange={e => setConditionForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} placeholder="Recommended actions..." className={`${inputCls} resize-none`} disabled={!canEdit} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} data-learn="condition.next_check_date">Next Check Date</label>
            <input type="date" value={conditionForm.next_check_date} onChange={e => setConditionForm(f => ({ ...f, next_check_date: e.target.value }))} className={inputCls} disabled={!canEdit} />
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select value={conditionForm.priority} onChange={e => setConditionForm(f => ({ ...f, priority: e.target.value }))} className={inputCls} disabled={!canEdit}>
              <option value="">— Not set —</option>
              {CONDITION_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Location on Object</label>
          <input value={conditionForm.location_on_object} onChange={e => setConditionForm(f => ({ ...f, location_on_object: e.target.value }))} placeholder="Where on the object is the issue — e.g. lower left corner, reverse, base" className={inputCls} disabled={!canEdit} />
        </div>

        <div>
          <label className={labelCls} data-learn="condition.notes">Notes</label>
          <textarea
            value={conditionForm.notes}
            onChange={e => setConditionForm(f => ({ ...f, notes: e.target.value }))}
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
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
          >
            {submitting ? 'Saving\u2026' : 'Log assessment \u2192'}
          </button>
        )}
      </div>
      )}

      {/* Current Condition */}
      {form.condition_grade && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
          <div className={sectionTitle}>Current Condition</div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono px-2 py-1 rounded-full ${CONDITION_STYLES[form.condition_grade as string] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
              {form.condition_grade}
            </span>
            {form.condition_date && (
              <span className="text-xs text-stone-400 dark:text-stone-500">
                Assessed {new Date(form.condition_date as string).toLocaleDateString('en-GB')}
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
                {conditionHistory.map(h => (
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
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            type="button"
                            onClick={() => setDocsAssessmentId(docsAssessmentId === h.id ? null : h.id)}
                            className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap"
                          >
                            {docsAssessmentId === h.id ? 'Hide docs' : 'Documents'}
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => (editingId === h.id ? setEditingId(null) : startEdit(h))}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 whitespace-nowrap"
                              >
                                {editingId === h.id ? 'Cancel' : 'Edit'}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteCondition(h)}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 dark:hover:text-red-400 whitespace-nowrap"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editingId === h.id && canEdit && (
                      <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                        <td colSpan={5} className="py-4 px-2">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className={labelCls}>Condition Grade <span className="text-red-400">*</span></label>
                                <select value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} className={inputCls}>
                                  <option value="">— Select grade —</option>
                                  {CONDITION_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className={labelCls}>Assessment Date <span className="text-red-400">*</span></label>
                                <input type="date" value={editForm.assessed_at} onChange={e => setEditForm(f => ({ ...f, assessed_at: e.target.value }))} className={inputCls} />
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Assessor</label>
                              <input value={editForm.assessor} onChange={e => setEditForm(f => ({ ...f, assessor: e.target.value }))} className={inputCls} />
                            </div>
                            {getPlan(museum.plan).fullMode && (
                              <>
                                <div>
                                  <label className={labelCls}>Reason for Check</label>
                                  <select value={editForm.reason_for_check} onChange={e => setEditForm(f => ({ ...f, reason_for_check: e.target.value, other_reason: '' }))} className={inputCls}>
                                    <option value="">— Select —</option>
                                    {REASONS_FOR_CHECK.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </div>
                                {editForm.reason_for_check === 'Other' && (
                                  <div>
                                    <label className={labelCls}>Specify reason</label>
                                    <AutocompleteInput
                                      value={editForm.other_reason}
                                      onChange={v => setEditForm(f => ({ ...f, other_reason: v }))}
                                      staticList={OTHER_REASON_SUGGESTIONS}
                                      placeholder="Describe the reason…"
                                      className={inputCls}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                            <div>
                              <label className={labelCls}>Detailed Description</label>
                              <textarea value={editForm.long_description} onChange={e => setEditForm(f => ({ ...f, long_description: e.target.value }))} rows={2} placeholder="Detailed condition description..." className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                              <label className={labelCls}>Hazard Note</label>
                              <input value={editForm.hazard_note} onChange={e => setEditForm(f => ({ ...f, hazard_note: e.target.value }))} placeholder="Any hazardous materials or handling risks" className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Recommendations</label>
                              <textarea value={editForm.recommendations} onChange={e => setEditForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} placeholder="Recommended actions..." className={`${inputCls} resize-none`} />
                            </div>
                            <div>
                              <label className={labelCls}>Location on Object</label>
                              <input value={editForm.location_on_object} onChange={e => setEditForm(f => ({ ...f, location_on_object: e.target.value }))} placeholder="Where on the object is the issue" className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Priority</label>
                              <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))} className={inputCls}>
                                <option value="">— Not set —</option>
                                {CONDITION_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Next Check Date</label>
                              <input type="date" value={editForm.next_check_date} onChange={e => setEditForm(f => ({ ...f, next_check_date: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Notes</label>
                              <textarea
                                value={editForm.notes}
                                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                rows={3}
                                className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors resize-none bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                              />
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => saveEdit(h)}
                                disabled={savingEdit || !editForm.grade || !editForm.assessed_at}
                                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-6 py-2.5 rounded disabled:opacity-50"
                              >
                                {savingEdit ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                disabled={savingEdit}
                                className="border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 text-sm font-mono px-6 py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    {docsAssessmentId === h.id && (
                      <tr className="border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                        <td colSpan={5} className="py-4 px-2">
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
