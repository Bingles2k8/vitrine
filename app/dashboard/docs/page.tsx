'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'
import StagedDocumentPicker, { StagedDoc } from '@/components/StagedDocumentPicker'

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

const PLAN_SECTIONS = [
  { value: '', label: '— No specific section —' },
  { value: 'identity', label: 'Plan Identity' },
  { value: 'standards', label: 'Standards & Legal Framework' },
  { value: 'systems', label: 'Systems & Infrastructure' },
  { value: 'assessment', label: 'Current State Assessment' },
  { value: 'improvement', label: 'Improvement Plan' },
]

const PLAN_DOC_TYPES = [
  'Documentation Plan', 'Policy Document', 'Procedures Manual',
  'Legal Policy', 'Data Protection Policy', 'Freedom of Information Policy',
  'Accreditation Evidence', 'System Documentation', 'Training Record',
  'Audit Report', 'Ethics Policy', 'Other',
]

const BACKLOG_PROCEDURES = [
  'Proc 1 — Object Entry', 'Proc 2 — Acquisition', 'Proc 3 — Location',
  'Proc 4 — Inventory', 'Proc 5 — Cataloguing', 'Proc 6 — Object Exit',
  'Proc 7/8 — Loans', 'Proc 9 — Documentation Plan', 'Proc 10 — Use of Collections',
  'Proc 11 — Condition', 'Proc 12 — Conservation', 'Proc 13 — Valuation',
  'Proc 14 — Insurance', 'Proc 15 — Emergency', 'Proc 16 — Damage & Loss',
  'Proc 17 — Disposal', 'Proc 18 — Rights', 'Proc 19 — Reproduction',
  'Proc 20 — Collections Review', 'Proc 21 — Audit',
]

export default function DocumentationPlanPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [allPlans, setAllPlans] = useState<any[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ identity: true, standards: true, systems: true, assessment: true, improvement: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [metrics, setMetrics] = useState<ComplianceRow[]>([])
  const [backlogs, setBacklogs] = useState<any[]>([])
  const [backlogForm, setBacklogForm] = useState({ procedure_name: BACKLOG_PROCEDURES[0], backlog_count: '', target_date: '', priority: 'Medium', notes: '' })

  const emptyPlanForm = {
    plan_reference: '',
    plan_date: '',
    review_date: '',
    responsible_person: '',
    documentation_standards: '',
    accreditation_scheme: '',
    legal_framework: '',
    ethical_framework: '',
    systems_in_use: '',
    system_maintenance: '',
    access_permissions: '',
    scope_documented_pct: '',
    collection_overview: '',
    documentation_gaps: '',
    backlog_notes: '',
    specific_objectives: '',
    priority_order: '',
    resources_allocated: '',
    target_completion_dates: '',
  }

  const [planForm, setPlanForm] = useState(emptyPlanForm)

  const [planDocs, setPlanDocs] = useState<any[]>([])
  const [planDocsLoaded, setPlanDocsLoaded] = useState(false)
  const [stagedDocs, setStagedDocs] = useState<StagedDoc[]>([])
  const [showDocForm, setShowDocForm] = useState(false)
  const [docLabel, setDocLabel] = useState('')
  const [docType, setDocType] = useState('')
  const [docSection, setDocSection] = useState('')
  const [docNotes, setDocNotes] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

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

      const [
        { data: objects },
        { data: entryRecords },
        { data: locationHistory },
        { data: conditionAssessments },
        { data: activeLoans },
        { data: exits },
        { data: docPlan },
        { data: valuationObjects },
        { data: objectImageIds },
        { data: openRisks },
        { data: emergencyPlans },
        { data: insurancePolicies },
        { data: damageReports },
        { data: collectionUseRecords },
        { data: disposalRecords },
        { data: collectionReviews },
        { data: auditExercises },
        { data: rightsRecords },
        { data: reproductionRequests },
        { data: conservationTreatments },
      ] = await Promise.all([
        supabase.from('objects').select('*').eq('museum_id', museum.id).is('deleted_at', null),
        supabase.from('entry_records').select('object_id').eq('museum_id', museum.id),
        supabase.from('location_history').select('object_id').eq('museum_id', museum.id),
        supabase.from('condition_assessments').select('object_id').eq('museum_id', museum.id),
        supabase.from('loans').select('id, agreement_reference').eq('museum_id', museum.id).eq('status', 'Active'),
        supabase.from('object_exits').select('id, object_id').eq('museum_id', museum.id),
        supabase.from('documentation_plans').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false }),
        supabase.from('valuations').select('object_id').eq('museum_id', museum.id),
        supabase.from('object_images').select('object_id').eq('museum_id', museum.id),
        supabase.from('risk_register').select('id').eq('museum_id', museum.id).eq('status', 'Open'),
        supabase.from('emergency_plans').select('id, status').eq('museum_id', museum.id),
        supabase.from('insurance_policies').select('id, status').eq('museum_id', museum.id),
        supabase.from('damage_reports').select('id, status').eq('museum_id', museum.id),
        supabase.from('collection_use_records').select('id, status').eq('museum_id', museum.id),
        supabase.from('disposal_records').select('id, status').eq('museum_id', museum.id),
        supabase.from('collection_reviews').select('id, status').eq('museum_id', museum.id),
        supabase.from('audit_exercises').select('id, status').eq('museum_id', museum.id),
        supabase.from('rights_records').select('object_id').eq('museum_id', museum.id),
        supabase.from('reproduction_requests').select('object_id').eq('museum_id', museum.id),
        supabase.from('conservation_treatments').select('object_id').eq('museum_id', museum.id),
      ])

      const all = objects || []
      const total = all.length
      const deacc = all.filter(a => a.status === 'Deaccessioned').length
      const deaccIds = new Set(all.filter(a => a.status === 'Deaccessioned').map((a: any) => a.id))
      const twelveMonthsAgo = new Date(); twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
      const cutoff = twelveMonthsAgo.toISOString().slice(0, 10)

      const entryIds = new Set((entryRecords || []).map((e: any) => e.object_id).filter(Boolean))
      const locationIds = new Set((locationHistory || []).map((l: any) => l.object_id))
      const conditionIds = new Set((conditionAssessments || []).map((c: any) => c.object_id))
      const activeLoansWithAgreement = (activeLoans || []).filter((l: any) => l.agreement_reference?.trim()).length
      const activeLoanTotal = (activeLoans || []).length
      const valuedIds = new Set((valuationObjects || []).map((v: any) => v.object_id).filter(Boolean))
      const imageIds = new Set((objectImageIds || []).map((i: any) => i.object_id).filter(Boolean))
      const rightsIds = new Set((rightsRecords || []).map((r: any) => r.object_id).filter(Boolean))
      const reproIds = new Set((reproductionRequests || []).map((r: any) => r.object_id).filter(Boolean))
      const conservationIds = new Set((conservationTreatments || []).map((c: any) => c.object_id).filter(Boolean))

      const rows: ComplianceRow[] = [
        // Primary procedures (★)
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
          link: '/dashboard/register',
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
          numerator: (exits || []).filter((e: any) => deaccIds.has(e.object_id)).length,
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
        // Secondary procedures
        {
          procedure: '9 Documentation Plan',
          metric: 'Plan created',
          numerator: (docPlan || []).some((p: any) => p.status === 'Active') ? 1 : 0,
          denominator: 1,
          link: '/dashboard/docs',
        },
        {
          procedure: '10 Use of Collections',
          metric: 'Use requests tracked',
          numerator: (collectionUseRecords || []).length,
          denominator: 0,
          link: '/dashboard/collections-use',
        },
        {
          procedure: '11 Condition',
          metric: 'Condition recorded',
          numerator: all.filter(a => a.condition_grade?.trim()).length,
          denominator: total,
          link: '/dashboard/audit',
        },
        {
          procedure: '12 Conservation',
          metric: 'Objects with treatment record',
          numerator: all.filter(a => conservationIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard/conservation',
        },
        {
          procedure: '13 Valuation',
          metric: 'Objects with valuation',
          numerator: all.filter(a => valuedIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard/valuation',
        },
        {
          procedure: '14 Insurance & Indemnity',
          metric: 'Active insurance policies',
          numerator: (insurancePolicies || []).filter((p: any) => p.status === 'Active').length,
          denominator: Math.max((insurancePolicies || []).length, 1),
          link: '/dashboard/insurance',
        },
        {
          procedure: '15 Emergency Planning',
          metric: 'Active emergency plans',
          numerator: (emergencyPlans || []).filter((p: any) => p.status === 'Active').length,
          denominator: Math.max((emergencyPlans || []).length, 1),
          link: '/dashboard/emergency',
        },
        {
          procedure: '16 Damage & Loss',
          metric: 'Open damage reports',
          numerator: (damageReports || []).filter((r: any) => r.status === 'Open' || r.status === 'Under Investigation').length,
          denominator: 0,
          link: '/dashboard/damage',
        },
        {
          procedure: '17 Disposal',
          metric: 'Disposal records tracked',
          numerator: (disposalRecords || []).length,
          denominator: 0,
          link: '/dashboard/disposal',
        },
        {
          procedure: '18 Rights',
          metric: 'Objects with rights record',
          numerator: all.filter(a => rightsIds.has(a.id)).length,
          denominator: total,
          link: '/dashboard',
        },
        {
          procedure: '19 Reproduction',
          metric: 'Reproduction requests logged',
          numerator: (reproductionRequests || []).length,
          denominator: 0,
          link: '/dashboard',
        },
        {
          procedure: '20 Collections Review',
          metric: 'Reviews conducted',
          numerator: (collectionReviews || []).filter((r: any) => r.status === 'Completed').length,
          denominator: Math.max((collectionReviews || []).length, 1),
          link: '/dashboard/collections-review',
        },
        {
          procedure: '21 Audit',
          metric: 'Audit exercises completed',
          numerator: (auditExercises || []).filter((a: any) => a.status === 'Completed').length,
          denominator: Math.max((auditExercises || []).length, 1),
          link: '/dashboard/audit',
        },
        {
          procedure: 'Risk Management',
          metric: 'Open risks in register',
          numerator: (openRisks || []).length,
          denominator: 0,
          link: '/dashboard/risk',
        },
      ]

      setMetrics(rows)
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)

      const plans = docPlan || []
      setAllPlans(plans)
      const activePlan = plans.find((p: any) => p.status === 'Active') || null
      if (activePlan) {
        setPlan(activePlan)
        // Load backlogs and documents for the active plan
        const [{ data: backlogData }, { data: docPlanDocs }] = await Promise.all([
          supabase.from('documentation_plan_backlogs').select('*').eq('plan_id', activePlan.id).order('priority', { ascending: true }),
          supabase.from('documentation_plan_documents').select('*').eq('plan_id', activePlan.id).is('deleted_at', null).order('created_at', { ascending: false }),
        ])
        setBacklogs(backlogData || [])
        setPlanDocs(docPlanDocs || [])
      }
      setPlanDocsLoaded(true)
      setLoading(false)
      } catch (err) {
        console.error('Documentation plan load error:', err)
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (stagedDocs.length === 0) return
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [stagedDocs.length])

  function handleBack() {
    if (stagedDocs.length > 0) {
      if (!window.confirm('You have unsaved documents staged. Discard them and go back?')) return
      setStagedDocs([])
    }
    setEditMode(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function hydratePlanForm(p: any) {
    setPlanForm({
      plan_reference: p.plan_reference || '',
      plan_date: p.plan_date || '',
      review_date: p.review_date || '',
      responsible_person: p.responsible_person || '',
      documentation_standards: p.documentation_standards || '',
      accreditation_scheme: p.accreditation_scheme || '',
      legal_framework: p.legal_framework || '',
      ethical_framework: p.ethical_framework || '',
      systems_in_use: p.systems_in_use || '',
      system_maintenance: p.system_maintenance || '',
      access_permissions: p.access_permissions || '',
      scope_documented_pct: p.scope_documented_pct?.toString() || '',
      collection_overview: p.collection_overview || '',
      documentation_gaps: p.documentation_gaps || '',
      backlog_notes: p.backlog_notes || '',
      specific_objectives: p.specific_objectives || '',
      priority_order: p.priority_order || '',
      resources_allocated: p.resources_allocated || '',
      target_completion_dates: p.target_completion_dates || '',
    })
  }

  function openAllSections() {
    setOpenSections({ identity: true, standards: true, systems: true, assessment: true, improvement: true })
  }

  function startCreatePlan() {
    setPlan(null)
    setPlanForm(emptyPlanForm)
    openAllSections()
    setEditMode(true)
    setPlanDocs([])
    setStagedDocs([])
    setBacklogs([])
  }

  async function startEditPlan(p: any) {
    setPlan(p)
    hydratePlanForm(p)
    openAllSections()
    setEditMode(true)
    // Load backlogs and docs for this plan
    const [{ data: backlogData }, { data: docPlanDocs }] = await Promise.all([
      supabase.from('documentation_plan_backlogs').select('*').eq('plan_id', p.id).order('priority', { ascending: true }),
      supabase.from('documentation_plan_documents').select('*').eq('plan_id', p.id).is('deleted_at', null).order('created_at', { ascending: false }),
    ])
    setBacklogs(backlogData || [])
    setPlanDocs(docPlanDocs || [])
  }

  async function archivePlan(id: string) {
    await supabase.from('documentation_plans').update({ status: 'Archived' }).eq('id', id)
    setAllPlans(prev => prev.map(p => p.id === id ? { ...p, status: 'Archived' } : p))
    if (plan?.id === id) { setPlan(null); setEditMode(false) }
  }

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function savePlan() {
    if (!museum) return
    setSaving(true)
    const payload = {
      ...planForm,
      museum_id: museum.id,
      status: 'Active',
      updated_at: new Date().toISOString(),
      scope_documented_pct: planForm.scope_documented_pct ? parseFloat(planForm.scope_documented_pct) : null,
    }
    if (plan) {
      await supabase.from('documentation_plans').update(payload).eq('id', plan.id)
      const updated = { ...plan, ...payload }
      setPlan(updated)
      setAllPlans(prev => prev.map(p => p.id === plan.id ? updated : p))
    } else {
      const { data } = await supabase.from('documentation_plans').insert(payload).select().single()
      if (data) {
        setPlan(data)
        setAllPlans(prev => [data, ...prev])
        if (stagedDocs.length > 0) {
          const userId = (await supabase.auth.getUser()).data.user?.id ?? null
          const uploaded: any[] = []
          for (const doc of stagedDocs) {
            const ext = doc.file.name.split('.').pop()
            const path = `${museum.id}/doc-plans/documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
            const { error: stErr } = await supabase.storage.from('object-documents').upload(path, doc.file)
            if (stErr) continue
            const { data: { publicUrl } } = supabase.storage.from('object-documents').getPublicUrl(path)
            const { data: docRecord } = await supabase.from('documentation_plan_documents').insert({
              plan_id: data.id, museum_id: museum.id,
              section: null,
              label: doc.label || doc.file.name, document_type: doc.docType || 'Other',
              file_url: publicUrl, file_name: doc.file.name,
              file_size: doc.file.size, mime_type: doc.file.type,
              uploaded_by: userId,
            }).select().single()
            if (docRecord) uploaded.push(docRecord)
          }
          setPlanDocs(uploaded)
          setStagedDocs([])
        }
      }
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  async function addBacklog() {
    if (!plan || !backlogForm.procedure_name) return
    setSaving(true)
    const { data } = await supabase.from('documentation_plan_backlogs').insert({
      plan_id: plan.id,
      museum_id: museum.id,
      procedure_name: backlogForm.procedure_name,
      backlog_count: backlogForm.backlog_count ? parseInt(backlogForm.backlog_count) : 0,
      target_date: backlogForm.target_date || null,
      priority: backlogForm.priority,
      notes: backlogForm.notes || null,
    }).select().single()
    if (data) setBacklogs(prev => [...prev, data])
    setBacklogForm({ procedure_name: BACKLOG_PROCEDURES[0], backlog_count: '', target_date: '', priority: 'Medium', notes: '' })
    setSaving(false)
  }

  async function deleteBacklog(id: string) {
    await supabase.from('documentation_plan_backlogs').delete().eq('id', id)
    setBacklogs(prev => prev.filter(b => b.id !== id))
  }

  async function uploadPlanDoc() {
    if (!docFile || !plan) return
    if (docFile.size > 20 * 1024 * 1024) { setDocError('File exceeds 20 MB limit'); return }
    setDocUploading(true); setDocError(null)
    const ext = docFile.name.split('.').pop()
    const path = `${museum.id}/doc-plans/documents/${Date.now()}.${ext}`
    const { error: storageError } = await supabase.storage.from('object-documents').upload(path, docFile)
    if (storageError) { setDocError(storageError.message); setDocUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('object-documents').getPublicUrl(path)
    const { data: doc, error: dbError } = await supabase.from('documentation_plan_documents').insert({
      plan_id: plan.id, museum_id: museum.id,
      section: docSection || null,
      label: docLabel || docFile.name, document_type: docType || 'Other',
      notes: docNotes || null, file_url: publicUrl, file_name: docFile.name,
      file_size: docFile.size, mime_type: docFile.type,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    }).select().single()
    if (dbError) { setDocError(dbError.message); setDocUploading(false); return }
    setPlanDocs(prev => [doc, ...prev])
    setDocLabel(''); setDocType(''); setDocSection(''); setDocNotes(''); setDocFile(null)
    setShowDocForm(false); setDocUploading(false)
  }

  async function deletePlanDoc(doc: any) {
    const path = doc.file_url.split('/object-documents/')[1]
    if (path) await supabase.storage.from('object-documents').remove([path])
    await supabase.from('documentation_plan_documents').delete().eq('id', doc.id)
    setPlanDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/docs" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/docs" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Documentation Plan</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Documentation Plan is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track documentation compliance and standards across your collection. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  const scorableMetrics = metrics.filter(m => m.denominator > 0)
  const overall = scorableMetrics.length > 0
    ? Math.round(scorableMetrics.reduce((sum, m) => sum + (m.numerator / m.denominator) * 100, 0) / scorableMetrics.length)
    : 0

  return (
    <DashboardShell museum={museum} activePath="/dashboard/docs" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Documentation Plan</span>
        </div>

        <div className="p-4 md:p-8 space-y-8">
          {/* Overall compliance score */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 flex items-center gap-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Overall Compliance Score</div>
              <div className={`font-serif text-6xl ${overall >= 80 ? 'text-emerald-700' : overall >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {overall}%
              </div>
              <div className="text-xs text-stone-400 dark:text-stone-500 mt-1 font-mono">21 Standard Procedures</div>
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
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
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
                        {row.denominator > 0 ? <ProgressBar pct={pct} /> : <span className="text-xs font-mono text-stone-300 dark:text-stone-600">{row.numerator > 0 ? `${row.numerator} tracked` : 'N/A'}</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pct < 100 && row.denominator > 0 && (
                          <button onClick={() => router.push(row.link)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                            View backlog →
                          </button>
                        )}
                        {row.denominator === 0 && row.numerator > 0 && (
                          <button onClick={() => router.push(row.link)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                            View →
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Documentation Plan — summary card or create button */}
          {!editMode && (
            <>
              {plan ? (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 flex items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Active</span>
                      <span className="font-serif italic text-stone-900 dark:text-stone-100">{plan.plan_reference || 'Documentation Plan'}</span>
                    </div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 font-mono">
                      {plan.plan_date && `Dated ${new Date(plan.plan_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                      {plan.responsible_person && ` · ${plan.responsible_person}`}
                    </div>
                    {plan.updated_at && (
                      <div className="text-xs text-stone-300 dark:text-stone-600 font-mono">Last saved {new Date(plan.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => startEditPlan(plan)} className="text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">
                        Edit plan →
                      </button>
                      <button onClick={startCreatePlan} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 px-4 py-2 rounded transition-colors">
                        + New plan
                      </button>
                    </div>
                  )}
                </div>
              ) : canEdit ? (
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-8 text-center">
                  <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">No documentation plan has been created yet. Create one to formally document your collection standards, systems, and improvement commitments.</p>
                  <button onClick={startCreatePlan} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">
                    Create Documentation Plan →
                  </button>
                </div>
              ) : null}
            </>
          )}

          {/* Documentation Plan — accordion form */}
          {editMode && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Documentation Plan — Procedure 9</div>
                  <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{plan ? `Editing ${plan.plan_reference || 'plan'}` : 'Creating new plan'}</p>
                </div>
                <button onClick={handleBack} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                  ← Back
                </button>
              </div>

              {/* Section: Plan Identity */}
              <div className="border-b border-stone-100 dark:border-stone-800">
                <button onClick={() => toggleSection('identity')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Plan Identity</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Reference, dates, and responsible person</div>
                  </div>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${openSections.identity ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openSections.identity && (
                  <div className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className={labelCls}>Plan Reference</label>
                        <input type="text" value={planForm.plan_reference} onChange={e => setPlanForm(f => ({ ...f, plan_reference: e.target.value }))} className={inputCls} placeholder="e.g. DOC-2026-01" />
                      </div>
                      <div>
                        <label className={labelCls}>Plan Date</label>
                        <input type="date" value={planForm.plan_date} onChange={e => setPlanForm(f => ({ ...f, plan_date: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Next Review Date</label>
                        <input type="date" value={planForm.review_date} onChange={e => setPlanForm(f => ({ ...f, review_date: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Responsible Person</label>
                        <input type="text" value={planForm.responsible_person} onChange={e => setPlanForm(f => ({ ...f, responsible_person: e.target.value }))} className={inputCls} placeholder="Name or role" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Standards & Legal Framework */}
              <div className="border-b border-stone-100 dark:border-stone-800">
                <button onClick={() => toggleSection('standards')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Standards &amp; Legal Framework</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Documentation standards, accreditation, legal and ethical obligations</div>
                  </div>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${openSections.standards ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openSections.standards && (
                  <div className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Documentation Standards</label>
                        <input type="text" value={planForm.documentation_standards} onChange={e => setPlanForm(f => ({ ...f, documentation_standards: e.target.value }))} className={inputCls} placeholder="e.g. Spectrum 5.1, MA Code of Ethics" />
                      </div>
                      <div>
                        <label className={labelCls}>Accreditation Scheme</label>
                        <input type="text" value={planForm.accreditation_scheme} onChange={e => setPlanForm(f => ({ ...f, accreditation_scheme: e.target.value }))} className={inputCls} placeholder="e.g. Arts Council England Accreditation" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Legal Obligations</label>
                        <textarea rows={4} value={planForm.legal_framework} onChange={e => setPlanForm(f => ({ ...f, legal_framework: e.target.value }))} className={`${inputCls} resize-none`} placeholder="How the museum handles data protection, freedom of information, export controls, and other legal requirements relating to collections information…" />
                      </div>
                      <div>
                        <label className={labelCls}>Ethical Obligations</label>
                        <textarea rows={4} value={planForm.ethical_framework} onChange={e => setPlanForm(f => ({ ...f, ethical_framework: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Ethical framework applied to collections information, e.g. treatment of sensitive records, human remains, repatriation…" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Systems & Infrastructure */}
              <div className="border-b border-stone-100 dark:border-stone-800">
                <button onClick={() => toggleSection('systems')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Systems &amp; Infrastructure</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Documentation systems in use, maintenance, and access controls</div>
                  </div>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${openSections.systems ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openSections.systems && (
                  <div className="px-6 pb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Systems in Use</label>
                        <textarea rows={3} value={planForm.systems_in_use} onChange={e => setPlanForm(f => ({ ...f, systems_in_use: e.target.value }))} className={`${inputCls} resize-none`} placeholder="List all systems: CMS, paper registers, spreadsheets, databases, image stores…" />
                      </div>
                      <div>
                        <label className={labelCls}>System Maintenance</label>
                        <textarea rows={3} value={planForm.system_maintenance} onChange={e => setPlanForm(f => ({ ...f, system_maintenance: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Backup schedules, security measures, software updates, data integrity checks…" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Access &amp; Permissions</label>
                      <textarea rows={2} value={planForm.access_permissions} onChange={e => setPlanForm(f => ({ ...f, access_permissions: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Who has access to collection records and at what level, and how permissions are managed…" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Current State Assessment */}
              <div className="border-b border-stone-100 dark:border-stone-800">
                <button onClick={() => toggleSection('assessment')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Current State Assessment</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Scope of documentation, known gaps, and backlog summary</div>
                  </div>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${openSections.assessment ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openSections.assessment && (
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className={labelCls}>Scope Documented (%)</label>
                      <div className="flex items-center gap-3">
                        <input type="number" step="0.01" min="0" max="100" value={planForm.scope_documented_pct} onChange={e => setPlanForm(f => ({ ...f, scope_documented_pct: e.target.value }))} className="w-32 border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" placeholder="e.g. 65.50" />
                        <p className="text-xs text-stone-400 dark:text-stone-500">Your own assessment of what percentage of the collection is adequately documented.</p>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Collection Overview</label>
                      <textarea rows={3} value={planForm.collection_overview} onChange={e => setPlanForm(f => ({ ...f, collection_overview: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Describe the overall scope and nature of the collection, what documentation is held, and in what formats…" />
                    </div>
                    <div>
                      <label className={labelCls}>Known Gaps &amp; Weaknesses</label>
                      <textarea rows={4} value={planForm.documentation_gaps} onChange={e => setPlanForm(f => ({ ...f, documentation_gaps: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Known gaps in documentation, areas of weakness, and records that are incomplete or not to current standards…" />
                    </div>
                    <div>
                      <label className={labelCls}>Backlog Summary</label>
                      <textarea rows={3} value={planForm.backlog_notes} onChange={e => setPlanForm(f => ({ ...f, backlog_notes: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Prose summary of documentation backlogs by procedure area. Use the Backlog by Procedure section below to log specific counts and targets." />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Improvement Plan */}
              <div className="border-b border-stone-100 dark:border-stone-800">
                <button onClick={() => toggleSection('improvement')} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Improvement Plan</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Objectives, priorities, resources, and target dates</div>
                  </div>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${openSections.improvement ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {openSections.improvement && (
                  <div className="px-6 pb-6 space-y-4">
                    <div>
                      <label className={labelCls}>Specific Objectives</label>
                      <textarea rows={4} value={planForm.specific_objectives} onChange={e => setPlanForm(f => ({ ...f, specific_objectives: e.target.value }))} className={`${inputCls} resize-none`} placeholder="What will be achieved — specific, measurable objectives for the plan period…" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Priority Order</label>
                        <input type="text" value={planForm.priority_order} onChange={e => setPlanForm(f => ({ ...f, priority_order: e.target.value }))} className={inputCls} placeholder="e.g. Cataloguing > Inventory > Location records" />
                      </div>
                      <div>
                        <label className={labelCls}>Resources Allocated</label>
                        <input type="text" value={planForm.resources_allocated} onChange={e => setPlanForm(f => ({ ...f, resources_allocated: e.target.value }))} className={inputCls} placeholder="e.g. 2 FTE, £5,000 budget, 3 volunteers" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Target Completion Dates</label>
                      <textarea rows={3} value={planForm.target_completion_dates} onChange={e => setPlanForm(f => ({ ...f, target_completion_dates: e.target.value }))} className={`${inputCls} resize-none`} placeholder="Key milestones and target completion dates for each objective…" />
                    </div>
                  </div>
                )}
              </div>

              {/* Section: Supporting Documents */}
              <div className="border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">Supporting Documents</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">Written plan, policy documents, procedures manuals, accreditation evidence</div>
                  </div>
                  {plan && (
                    <button onClick={() => setShowDocForm(v => !v)} className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors shrink-0 ml-4">
                      {showDocForm ? 'Cancel' : '+ Add document'}
                    </button>
                  )}
                </div>

                {/* Creating: stage docs now, upload on save */}
                {!plan && (
                  <div className="px-6 pb-6 space-y-3">
                    <p className="text-xs text-stone-400 dark:text-stone-500">Attach files below — they'll be uploaded when you create the plan.</p>
                    <StagedDocumentPicker relatedToType="doc_plan" value={stagedDocs} onChange={setStagedDocs} />
                  </div>
                )}

                {/* Editing: immediate upload (plan already exists) */}
                {plan && showDocForm && (
                  <div className="px-6 pb-6 space-y-4 border-t border-stone-100 dark:border-stone-800 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Label *</label>
                        <input value={docLabel} onChange={e => setDocLabel(e.target.value)} placeholder="e.g. Documentation Plan 2026" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Document Type</label>
                        <select value={docType} onChange={e => setDocType(e.target.value)} className={inputCls}>
                          <option value="">— Select type —</option>
                          {PLAN_DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Section</label>
                        <select value={docSection} onChange={e => setDocSection(e.target.value)} className={inputCls}>
                          {PLAN_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>File</label>
                        <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv"
                          onChange={e => setDocFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-stone-500 dark:text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-stone-100 file:text-stone-700 dark:file:bg-stone-800 dark:file:text-stone-300 hover:file:bg-stone-200 dark:hover:file:bg-stone-700 cursor-pointer" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Notes</label>
                      <input value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Optional notes about this document…" className={inputCls} />
                    </div>
                    {docError && <p className="text-xs text-red-500">{docError}</p>}
                    <button onClick={uploadPlanDoc} disabled={!docFile || docUploading}
                      className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded disabled:opacity-40">
                      {docUploading ? 'Uploading…' : 'Upload document →'}
                    </button>
                  </div>
                )}
                {plan && planDocs.length === 0 && !showDocForm && (
                  <div className="px-6 pb-6 text-xs text-stone-400 dark:text-stone-500">No documents attached yet.</div>
                )}
                {plan && planDocs.length > 0 && (
                  <div className="px-6 pb-4 space-y-2">
                    {planDocs.map(d => (
                      <div key={d.id} className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-stone-800 first:border-t-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-stone-900 dark:text-stone-100 hover:underline truncate">{d.label}</a>
                            {d.section && (
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 shrink-0">
                                {PLAN_SECTIONS.find(s => s.value === d.section)?.label || d.section}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{d.document_type || ''}{d.file_size ? ` · ${Math.round(d.file_size / 1024)} KB` : ''}</div>
                        </div>
                        <button onClick={() => deletePlanDoc(d)} className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors ml-4 shrink-0">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save footer */}
              <div className="flex items-center gap-4 px-6 py-4 bg-stone-50 dark:bg-stone-800/50">
                <button onClick={savePlan} disabled={saving} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded disabled:opacity-40">
                  {saving ? 'Saving…' : plan ? 'Save changes' : 'Create Documentation Plan'}
                </button>
                {saved && <span className="text-xs font-mono text-emerald-600">Saved ✓</span>}
                {plan?.updated_at && !saved && (
                  <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                    Last saved {new Date(plan.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* All Documentation Plans — history table */}
          {allPlans.length > 0 && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">All Documentation Plans</div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Reference</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Responsible Person</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Last Updated</th>
                    <th className="px-4 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody>
                  {allPlans.map(p => (
                    <tr key={p.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                      <td className="px-6 py-3 text-sm text-stone-900 dark:text-stone-100 font-mono">{p.plan_reference || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${p.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{p.plan_date ? new Date(p.plan_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{p.responsible_person || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-400 dark:text-stone-500">{p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && (
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => startEditPlan(p)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Edit</button>
                            {p.status === 'Active' && (
                              <button onClick={() => archivePlan(p.id)} className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">Archive</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Backlog by Procedure */}
          {plan && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Backlog by Procedure</div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className={labelCls}>Procedure</label>
                  <select value={backlogForm.procedure_name} onChange={e => setBacklogForm(f => ({ ...f, procedure_name: e.target.value }))} className={inputCls}>
                    {BACKLOG_PROCEDURES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Backlog Count</label>
                  <input type="number" min="0" value={backlogForm.backlog_count} onChange={e => setBacklogForm(f => ({ ...f, backlog_count: e.target.value }))} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>Target Date</label>
                  <input type="date" value={backlogForm.target_date} onChange={e => setBacklogForm(f => ({ ...f, target_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={backlogForm.priority} onChange={e => setBacklogForm(f => ({ ...f, priority: e.target.value }))} className={inputCls}>
                    {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <button type="button" onClick={addBacklog} disabled={saving} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2.5 rounded disabled:opacity-40">
                  Add backlog
                </button>
              </div>

              {backlogs.length > 0 && (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-700">
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal py-2">Procedure</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal py-2">Backlog</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal py-2">Target</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal py-2">Priority</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal py-2">Notes</th>
                      <th className="py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {backlogs.map(b => (
                      <tr key={b.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 text-sm text-stone-700 dark:text-stone-300">{b.procedure_name}</td>
                        <td className="py-2 text-sm font-mono text-stone-600 dark:text-stone-400">{b.backlog_count}</td>
                        <td className="py-2 text-xs font-mono text-stone-500 dark:text-stone-400">{b.target_date ? new Date(b.target_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}</td>
                        <td className="py-2">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${b.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' : b.priority === 'Low' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400'}`}>
                            {b.priority}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-stone-400 dark:text-stone-500">{b.notes || '—'}</td>
                        <td className="py-2">
                          <button onClick={() => deleteBacklog(b.id)} className="text-xs font-mono text-red-400 hover:text-red-600 transition-colors">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {backlogs.length === 0 && (
                <p className="text-xs text-stone-400 dark:text-stone-500">No backlogs recorded. Add procedure-specific backlogs to track documentation gaps.</p>
              )}
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
