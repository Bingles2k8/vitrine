'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
const labelCls = 'block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5'

interface ComplianceRow {
  procedure: string
  metric: string
  numerator: number
  denominator: number
  link: string
}

function ProgressBar({ pct }: { pct: number }) {
  const colour = pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono w-10 text-right ${pct >= 80 ? 'text-emerald-700' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
        {pct}%
      </span>
    </div>
  )
}

export default function DocumentationPlanPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [metrics, setMetrics] = useState<ComplianceRow[]>([])

  const [planForm, setPlanForm] = useState({
    plan_reference: '',
    plan_date: '',
    responsible_person: '',
    documentation_standards: 'Spectrum 5.1',
    systems_in_use: 'Vitrine',
    review_date: '',
    backlog_notes: '',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result

      // Fetch everything needed for compliance metrics.
      // Use select('*') and maybeSingle() to be resilient before SQL migrations are run.
      const [
        { data: artifacts },
        { data: entryRecords },
        { data: locationHistory },
        { data: conditionAssessments },
        { data: activeLoans },
        { data: exits },
        { data: docPlan },
        { data: valuationArtifacts },
        { data: artifactImageIds },
        { data: openRisks },
        { data: emergencyPlans },
        { data: insurancePolicies },
        { data: damageReports },
      ] = await Promise.all([
        supabase.from('artifacts').select('*').eq('museum_id', museum.id),
        supabase.from('entry_records').select('artifact_id').eq('museum_id', museum.id),
        supabase.from('location_history').select('artifact_id').eq('museum_id', museum.id),
        supabase.from('condition_assessments').select('artifact_id').eq('museum_id', museum.id),
        supabase.from('loans').select('id, agreement_reference').eq('museum_id', museum.id).eq('status', 'Active'),
        supabase.from('object_exits').select('id').eq('museum_id', museum.id),
        supabase.from('documentation_plans').select('*').eq('museum_id', museum.id).maybeSingle(),
        supabase.from('valuations').select('artifact_id').eq('museum_id', museum.id),
        supabase.from('artifact_images').select('artifact_id').eq('museum_id', museum.id),
        supabase.from('risk_register').select('id').eq('museum_id', museum.id).eq('status', 'Open'),
        supabase.from('emergency_plans').select('id, status').eq('museum_id', museum.id),
        supabase.from('insurance_policies').select('id, status').eq('museum_id', museum.id),
        supabase.from('damage_reports').select('id, status').eq('museum_id', museum.id),
      ])

      const all = artifacts || []
      const total = all.length
      const deacc = all.filter(a => a.status === 'Deaccessioned').length
      const twelveMonthsAgo = new Date(); twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
      const cutoff = twelveMonthsAgo.toISOString().slice(0, 10)

      const entryIds = new Set((entryRecords || []).map((e: any) => e.artifact_id).filter(Boolean))
      const locationIds = new Set((locationHistory || []).map((l: any) => l.artifact_id))
      const conditionIds = new Set((conditionAssessments || []).map((c: any) => c.artifact_id))
      const activeLoansWithAgreement = (activeLoans || []).filter((l: any) => l.agreement_reference?.trim()).length
      const activeLoanTotal = (activeLoans || []).length
      const valuedIds = new Set((valuationArtifacts || []).map((v: any) => v.artifact_id).filter(Boolean))
      const imageIds = new Set((artifactImageIds || []).map((i: any) => i.artifact_id).filter(Boolean))

      const rows: ComplianceRow[] = [
        {
          procedure: '★1 Object Entry',
          metric: 'Objects with entry record',
          numerator: all.filter(a => entryIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard/entry',
        },
        {
          procedure: '★2 Acquisition',
          metric: 'Accession numbers assigned',
          numerator: all.filter(a => a.accession_no?.trim()).length,
          denominator: total,
          link: '/dashboard/register',
        },
        {
          procedure: '★2 Acquisition',
          metric: 'Ethics checks complete',
          numerator: all.filter(a => a.ethics_art_loss_register && a.ethics_cites && a.ethics_dealing_act && a.ethics_human_remains).length,
          denominator: total,
          link: '/dashboard',
        },
        {
          procedure: '★2 Acquisition',
          metric: 'Accession register confirmed',
          numerator: all.filter(a => !!a.accession_register_confirmed).length,
          denominator: total,
          link: '/dashboard/register',
        },
        {
          procedure: '★3 Location',
          metric: 'Current location recorded',
          numerator: all.filter(a => a.current_location?.trim()).length,
          denominator: total,
          link: '/dashboard',
        },
        {
          procedure: '★3 Location',
          metric: 'Location history logged',
          numerator: all.filter(a => locationIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard',
        },
        {
          procedure: '★4 Inventory',
          metric: 'Inventoried in last 12 months',
          numerator: all.filter(a => a.last_inventoried && a.last_inventoried >= cutoff).length,
          denominator: total,
          link: '/dashboard/audit',
        },
        {
          procedure: '★5 Cataloguing',
          metric: 'Description filled',
          numerator: all.filter(a => a.description?.trim()).length,
          denominator: total,
          link: '/dashboard',
        },
        {
          procedure: '★5 Cataloguing',
          metric: 'Image uploaded',
          numerator: all.filter(a => a.image_url?.trim() || imageIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard',
        },
        {
          procedure: '★6 Object Exit',
          metric: 'Exit records for deaccessioned objects',
          numerator: Math.min(exits?.length || 0, deacc),
          denominator: deacc,
          link: '/dashboard/exits',
        },
        {
          procedure: '★7/8 Loans',
          metric: 'Active loans with agreement reference',
          numerator: activeLoansWithAgreement,
          denominator: activeLoanTotal,
          link: '/dashboard/loans',
        },
        {
          procedure: 'Condition',
          metric: 'Condition recorded',
          numerator: all.filter(a => a.condition_grade?.trim()).length,
          denominator: total,
          link: '/dashboard/audit',
        },
        {
          procedure: 'Valuation',
          metric: 'Objects with valuation',
          numerator: all.filter(a => valuedIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard/valuation',
        },
        {
          procedure: 'Risk Management',
          metric: 'Open risks in register',
          numerator: (openRisks || []).length,
          denominator: 0,
          link: '/dashboard/risk',
        },
        {
          procedure: 'Emergency Planning',
          metric: 'Active emergency plans',
          numerator: (emergencyPlans || []).filter((p: any) => p.status === 'Active').length,
          denominator: Math.max((emergencyPlans || []).length, 1),
          link: '/dashboard/emergency',
        },
        {
          procedure: 'Insurance & Indemnity',
          metric: 'Active insurance policies',
          numerator: (insurancePolicies || []).filter((p: any) => p.status === 'Active').length,
          denominator: Math.max((insurancePolicies || []).length, 1),
          link: '/dashboard/insurance',
        },
        {
          procedure: 'Damage & Loss',
          metric: 'Open damage reports',
          numerator: (damageReports || []).filter((r: any) => r.status === 'Open' || r.status === 'Under Investigation').length,
          denominator: 0,
          link: '/dashboard/damage',
        },
      ]

      setMetrics(rows)
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)

      if (docPlan) {
        setPlan(docPlan)
        setPlanForm({
          plan_reference: docPlan.plan_reference || '',
          plan_date: docPlan.plan_date || '',
          responsible_person: docPlan.responsible_person || '',
          documentation_standards: docPlan.documentation_standards || 'Spectrum 5.1',
          systems_in_use: docPlan.systems_in_use || 'Vitrine',
          review_date: docPlan.review_date || '',
          backlog_notes: docPlan.backlog_notes || '',
        })
      }
      setLoading(false)
      } catch (err) {
        console.error('Documentation plan load error:', err)
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function savePlan() {
    if (!museum) return
    setSaving(true)
    const payload = { ...planForm, museum_id: museum.id, updated_at: new Date().toISOString() }
    if (plan) {
      await supabase.from('documentation_plans').update(payload).eq('id', plan.id)
    } else {
      const { data } = await supabase.from('documentation_plans').insert(payload).select().single()
      if (data) setPlan(data)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  const overall = metrics.length > 0
    ? Math.round(metrics.filter(m => m.denominator > 0).reduce((sum, m) => sum + (m.numerator / m.denominator) * 100, 0) / metrics.filter(m => m.denominator > 0).length)
    : 0

  // Group rows by procedure
  const grouped: Record<string, ComplianceRow[]> = {}
  for (const row of metrics) {
    if (!grouped[row.procedure]) grouped[row.procedure] = []
    grouped[row.procedure].push(row)
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/docs" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Documentation Plan</span>
        </div>

        <div className="p-8 space-y-8">
          {/* Overall compliance score */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 flex items-center gap-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Overall Compliance Score</div>
              <div className={`font-serif text-6xl ${overall >= 80 ? 'text-emerald-700' : overall >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {overall}%
              </div>
              <div className="text-xs text-stone-400 dark:text-stone-500 mt-1 font-mono">Spectrum 5.1 — 9 Primary Procedures</div>
            </div>
            <div className="flex-1">
              <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overall >= 80 ? 'bg-emerald-500' : overall >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${overall}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs font-mono text-stone-300 dark:text-stone-600">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>

          {/* Procedure-by-procedure breakdown */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Compliance by Procedure</div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Procedure</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Metric</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3 w-12">Done</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3 w-12">Total</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3 w-48">Progress</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((row, i) => {
                  const pct = row.denominator > 0 ? Math.round((row.numerator / row.denominator) * 100) : 100
                  const showProcedure = i === 0 || metrics[i - 1].procedure !== row.procedure
                  return (
                    <tr key={i} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800">
                      <td className="px-6 py-3">
                        {showProcedure && (
                          <span className="text-xs font-mono text-stone-600 dark:text-stone-400">{row.procedure}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{row.metric}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{row.numerator}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-400 dark:text-stone-500">{row.denominator}</td>
                      <td className="px-4 py-3">
                        {row.denominator > 0 ? <ProgressBar pct={pct} /> : <span className="text-xs font-mono text-stone-300 dark:text-stone-600">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pct < 100 && row.denominator > 0 && (
                          <button onClick={() => router.push(row.link)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                            View backlog →
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Documentation Plan Settings */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-6">
            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Documentation Plan — Spectrum Procedure 9</div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Plan Reference</label>
                <input type="text" value={planForm.plan_reference} onChange={e => setPlanForm(f => ({ ...f, plan_reference: e.target.value }))} className={inputCls} placeholder="e.g. DOC-2025-01" />
              </div>
              <div>
                <label className={labelCls}>Plan Date</label>
                <input type="date" value={planForm.plan_date} onChange={e => setPlanForm(f => ({ ...f, plan_date: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Next Review Date</label>
                <input type="date" value={planForm.review_date} onChange={e => setPlanForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Responsible Person</label>
                <input type="text" value={planForm.responsible_person} onChange={e => setPlanForm(f => ({ ...f, responsible_person: e.target.value }))} className={inputCls} placeholder="Name or role" />
              </div>
              <div>
                <label className={labelCls}>Documentation Standards</label>
                <input type="text" value={planForm.documentation_standards} onChange={e => setPlanForm(f => ({ ...f, documentation_standards: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Systems in Use</label>
                <input type="text" value={planForm.systems_in_use} onChange={e => setPlanForm(f => ({ ...f, systems_in_use: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Backlog Notes &amp; Priorities</label>
              <textarea rows={4} value={planForm.backlog_notes} onChange={e => setPlanForm(f => ({ ...f, backlog_notes: e.target.value }))} className={inputCls} placeholder="Describe documentation backlogs by procedure, priorities, and resources allocated…" />
            </div>

            <div className="flex items-center gap-4">
              <button onClick={savePlan} disabled={saving} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded disabled:opacity-40">
                {saving ? 'Saving…' : 'Save Documentation Plan'}
              </button>
              {saved && <span className="text-xs font-mono text-emerald-600">Saved ✓</span>}
              {plan?.updated_at && !saved && (
                <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                  Last saved {new Date(plan.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
