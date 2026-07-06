'use client'

import { useEffect, useState, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { checkStorageQuota } from '@/lib/storageUsage'
import { uploadToR2, deleteFromR2 } from '@/lib/r2-upload'
import { TableSkeleton } from '@/components/Skeleton'

const PLAN_TYPES = ['General', 'Fire', 'Flood', 'Theft', 'Pest', 'Environmental', 'Structural']
const EMERGENCY_DOC_TYPES = ['Emergency Plan Document', 'Evacuation Map', 'Salvage Priority List', 'Contact List', 'Recovery Procedures', 'Training Record', 'Drill Report', 'Other']
const EVENT_TYPES = ['Fire', 'Flood', 'Theft', 'Vandalism', 'Pest', 'Environmental Incident', 'Structural Damage', 'Power Failure', 'Water Damage', 'Other']

const EMPTY_EVENT = {
  event_reference: '', event_type: 'Fire', event_date: '', plan_id: '',
  description: '', response_taken: '', damage_summary: '', lessons_learned: '', status: 'Open', notes: '',
}

const STATUS_STYLES: Record<string, string> = {
  Draft:            'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Active:           'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Under Review':   'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Archived:         'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

function isTestOverdue(dateStr: string | null): boolean {
  if (!dateStr) return true
  const tested = new Date(dateStr)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 1)
  return tested < cutoff
}

const EMPTY_FORM = {
  plan_title: '', plan_type: 'General', responsible_person: '',
  emergency_contacts: '', evacuation_procedures: '', salvage_priorities: '',
  alternative_storage: '', recovery_procedures: '',
  last_review_date: '', next_review_date: '',
  plan_last_tested: '', salvage_equipment_location: '', notes: '',
}

interface Museum {
  id: string
  plan: string
  [key: string]: unknown
}

interface EmergencyPlan {
  id: string
  plan_title: string
  plan_type: string | null
  responsible_person: string | null
  emergency_contacts: string | null
  evacuation_procedures: string | null
  salvage_priorities: string | null
  alternative_storage: string | null
  recovery_procedures: string | null
  last_review_date: string | null
  next_review_date: string | null
  plan_last_tested: string | null
  salvage_equipment_location: string | null
  status: string
  notes: string | null
}

interface SalvagePriority {
  id: string
  plan_id: string
  object_id: string
  priority_rank: number
  salvage_notes: string | null
  objects?: MuseumObject | null
}

interface EmergencyEvent {
  id: string
  event_reference: string
  event_type: string | null
  event_date: string | null
  plan_id: string | null
  description: string | null
  response_taken: string | null
  damage_summary: string | null
  lessons_learned: string | null
  status: string
  notes: string | null
}

interface MuseumObject {
  id: string
  title: string | null
  accession_no: string | null
  emoji: string | null
}

interface EventObjectLink {
  event_id: string
  object_id: string
  objects?: MuseumObject | null
}

interface PlanDocument {
  id: string
  plan_id: string
  label: string | null
  document_type: string | null
  file_url: string
  file_name: string | null
}

export default function EmergencyPage() {
  const [museum, setMuseum] = useState<Museum | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [plans, setPlans] = useState<EmergencyPlan[]>([])
  const [events, setEvents] = useState<EmergencyEvent[]>([])
  const [allObjects, setAllObjects] = useState<MuseumObject[]>([])
  const [eventObjects, setEventObjects] = useState<Record<string, EventObjectLink[]>>({})
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [objectPickerEventId, setObjectPickerEventId] = useState<string | null>(null)
  const [objectSearchQ, setObjectSearchQ] = useState('')
  const [salvagePriorities, setSalvagePriorities] = useState<Record<string, SalvagePriority[]>>({})
  const [priorityPickerPlanId, setPriorityPickerPlanId] = useState<string | null>(null)
  const [prioritySearchQ, setPrioritySearchQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Draft' | 'Active' | 'Under Review' | 'Archived'>('All')
  const [showForm, setShowForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [eventForm, setEventForm] = useState(EMPTY_EVENT)
  const [saving, setSaving] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [planDocs, setPlanDocs] = useState<Record<string, PlanDocument[]>>({})
  const [showDocForm, setShowDocForm] = useState<string | null>(null)
  const [docLabel, setDocLabel] = useState('')
  const [docType, setDocType] = useState('')
  const [docNotes, setDocNotes] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)
  const [pendingDocInfo, setPendingDocInfo] = useState<{ planId: string; label: string; fileName: string } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const [{ data: plans }, { data: evts }, { data: objs }, { data: eoLinks }, { data: eDocs }, { data: salvagePris }] = await Promise.all([
        supabase.from('emergency_plans').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false }),
        supabase.from('emergency_events').select('*').eq('museum_id', museum.id).order('event_date', { ascending: false }),
        supabase.from('objects').select('id, title, accession_no, emoji').eq('museum_id', museum.id).is('deleted_at', null).order('title'),
        supabase.from('emergency_event_objects').select('*, objects(id, title, accession_no, emoji)').eq('museum_id', museum.id),
        supabase.from('emergency_plan_documents').select('*').eq('museum_id', museum.id).is('deleted_at', null),
        supabase.from('emergency_salvage_priorities').select('*, objects(id, title, accession_no, emoji)').eq('museum_id', museum.id).order('priority_rank', { ascending: true }),
      ])
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setPlans(plans || [])
      setEvents(evts || [])
      setAllObjects(objs || [])
      // build map: event_id → [object records]
      const map: Record<string, EventObjectLink[]> = {}
      for (const link of (eoLinks || [])) {
        if (!map[link.event_id]) map[link.event_id] = []
        map[link.event_id].push(link)
      }
      setEventObjects(map)
      const docsMap: Record<string, PlanDocument[]> = {}
      for (const d of (eDocs || [])) {
        if (!docsMap[d.plan_id]) docsMap[d.plan_id] = []
        docsMap[d.plan_id].push(d)
      }
      setPlanDocs(docsMap)
      const salvageMap: Record<string, SalvagePriority[]> = {}
      for (const sp of (salvagePris || [])) {
        if (!salvageMap[sp.plan_id]) salvageMap[sp.plan_id] = []
        salvageMap[sp.plan_id].push(sp)
      }
      setSalvagePriorities(salvageMap)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function uploadEmergencyDoc(planId: string) {
    if (!docFile || !museum) return
    if (docFile.size > 20 * 1024 * 1024) return
    setDocUploading(true)
    setDocError(null)
    setPendingDocInfo({ planId, label: docLabel || docFile.name, fileName: docFile.name })
    const withinQuota = await checkStorageQuota(supabase, museum.id, museum.plan, docFile.size)
    if (!withinQuota) { setDocError('Storage limit reached for your plan'); setPendingDocInfo(null); setDocUploading(false); return }
    const ext = docFile.name.split('.').pop()
    const path = `${museum.id}/emergency/documents/${Date.now()}.${ext}`
    let publicUrl: string
    try { publicUrl = await uploadToR2('object-documents', path, docFile) } catch { setPendingDocInfo(null); setDocUploading(false); return }
    const { data: doc } = await supabase.from('emergency_plan_documents').insert({
      plan_id: planId, museum_id: museum.id,
      label: docLabel || docFile.name, document_type: docType || 'Other',
      notes: docNotes || null, file_url: publicUrl, file_name: docFile.name,
      file_size: docFile.size, mime_type: docFile.type,
      uploaded_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    }).select().single()
    if (doc) setPlanDocs(m => ({ ...m, [planId]: [doc, ...(m[planId] || [])] }))
    setPendingDocInfo(null)
    setDocLabel(''); setDocType(''); setDocNotes(''); setDocFile(null)
    setShowDocForm(null); setDocUploading(false)
  }

  async function deleteEmergencyDoc(doc: PlanDocument) {
    await deleteFromR2('object-documents', doc.file_url)
    await supabase.from('emergency_plan_documents').delete().eq('id', doc.id)
    setPlanDocs(m => ({ ...m, [doc.plan_id]: (m[doc.plan_id] || []).filter(d => d.id !== doc.id) }))
  }

  async function savePlan() {
    if (!form.plan_title || !museum) return
    setSaving(true)
    const payload = {
      ...form,
      last_review_date: form.last_review_date || null,
      next_review_date: form.next_review_date || null,
      plan_last_tested: form.plan_last_tested || null,
      salvage_equipment_location: form.salvage_equipment_location || null,
    }
    if (editingPlanId) {
      await supabase.from('emergency_plans').update(payload).eq('id', editingPlanId)
    } else {
      await supabase.from('emergency_plans').insert({ ...payload, museum_id: museum.id })
    }
    const { data } = await supabase
      .from('emergency_plans')
      .select('*')
      .eq('museum_id', museum.id)
      .order('created_at', { ascending: false })
    setPlans(data || [])
    setForm(EMPTY_FORM)
    setEditingPlanId(null)
    setShowForm(false)
    setSaving(false)
  }

  function openPlanEdit(p: EmergencyPlan) {
    setForm({
      plan_title: p.plan_title || '',
      plan_type: p.plan_type || 'General',
      responsible_person: p.responsible_person || '',
      emergency_contacts: p.emergency_contacts || '',
      evacuation_procedures: p.evacuation_procedures || '',
      salvage_priorities: p.salvage_priorities || '',
      alternative_storage: p.alternative_storage || '',
      recovery_procedures: p.recovery_procedures || '',
      last_review_date: p.last_review_date || '',
      next_review_date: p.next_review_date || '',
      plan_last_tested: p.plan_last_tested || '',
      salvage_equipment_location: p.salvage_equipment_location || '',
      notes: p.notes || '',
    })
    setEditingPlanId(p.id)
    setShowForm(true)
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this emergency plan? This cannot be undone.')) return
    await supabase.from('emergency_plans').delete().eq('id', id)
    setPlans(p => p.filter(x => x.id !== id))
    if (editingPlanId === id) { setEditingPlanId(null); setShowForm(false); setForm(EMPTY_FORM) }
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('emergency_plans').update({ status }).eq('id', id)
    setPlans(p => p.map(x => x.id === id ? { ...x, status } : x))
  }

  async function saveEvent() {
    if (!eventForm.event_reference || !eventForm.event_date || !eventForm.description || !museum) return
    setSavingEvent(true)
    const payload = {
      ...eventForm,
      plan_id: eventForm.plan_id || null,
      response_taken: eventForm.response_taken || null,
      damage_summary: eventForm.damage_summary || null,
      lessons_learned: eventForm.lessons_learned || null,
      notes: eventForm.notes || null,
    }
    if (editingEventId) {
      await supabase.from('emergency_events').update(payload).eq('id', editingEventId)
    } else {
      await supabase.from('emergency_events').insert({ ...payload, museum_id: museum.id })
    }
    const { data } = await supabase.from('emergency_events').select('*').eq('museum_id', museum.id).order('event_date', { ascending: false })
    setEvents(data || [])
    setEventForm(EMPTY_EVENT)
    setEditingEventId(null)
    setShowEventForm(false)
    setSavingEvent(false)
  }

  function openEventEdit(ev: EmergencyEvent) {
    setEventForm({
      event_reference: ev.event_reference || '',
      event_type: ev.event_type || 'Fire',
      event_date: ev.event_date || '',
      plan_id: ev.plan_id || '',
      description: ev.description || '',
      response_taken: ev.response_taken || '',
      damage_summary: ev.damage_summary || '',
      lessons_learned: ev.lessons_learned || '',
      status: ev.status || 'Open',
      notes: ev.notes || '',
    })
    setEditingEventId(ev.id)
    setShowEventForm(true)
  }

  async function updateEventStatus(id: string, status: string) {
    await supabase.from('emergency_events').update({ status }).eq('id', id)
    setEvents(e => e.map(x => x.id === id ? { ...x, status } : x))
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this emergency event? This cannot be undone.')) return
    await supabase.from('emergency_events').delete().eq('id', id)
    setEvents(e => e.filter(x => x.id !== id))
    if (editingEventId === id) { setEditingEventId(null); setShowEventForm(false); setEventForm(EMPTY_EVENT) }
  }

  async function addObjectToEvent(eventId: string, objectId: string) {
    if (!museum) return
    await supabase.from('emergency_event_objects').insert({ event_id: eventId, object_id: objectId, museum_id: museum.id })
    const obj = allObjects.find(o => o.id === objectId)
    if (obj) setEventObjects(m => ({ ...m, [eventId]: [...(m[eventId] || []), { event_id: eventId, object_id: objectId, objects: obj }] }))
  }

  async function removeObjectFromEvent(eventId: string, objectId: string) {
    await supabase.from('emergency_event_objects').delete().eq('event_id', eventId).eq('object_id', objectId)
    setEventObjects(m => ({ ...m, [eventId]: (m[eventId] || []).filter(l => l.object_id !== objectId) }))
  }

  async function addSalvagePriority(planId: string, objectId: string) {
    if (!museum) return
    const existing = salvagePriorities[planId] || []
    const nextRank = existing.length ? Math.max(...existing.map(p => p.priority_rank)) + 1 : 1
    const { data } = await supabase.from('emergency_salvage_priorities').insert({
      museum_id: museum.id, plan_id: planId, object_id: objectId, priority_rank: nextRank, salvage_notes: null,
    }).select('*, objects(id, title, accession_no, emoji)').single()
    if (data) setSalvagePriorities(m => ({ ...m, [planId]: [...(m[planId] || []), data] }))
  }

  async function updateSalvagePriorityRank(planId: string, id: string, rank: number) {
    if (!Number.isFinite(rank)) return
    await supabase.from('emergency_salvage_priorities').update({ priority_rank: rank }).eq('id', id)
    setSalvagePriorities(m => ({ ...m, [planId]: (m[planId] || []).map(p => p.id === id ? { ...p, priority_rank: rank } : p) }))
  }

  function setSalvagePriorityNotesLocal(planId: string, id: string, notes: string) {
    setSalvagePriorities(m => ({ ...m, [planId]: (m[planId] || []).map(p => p.id === id ? { ...p, salvage_notes: notes } : p) }))
  }

  async function saveSalvagePriorityNotes(id: string, notes: string) {
    await supabase.from('emergency_salvage_priorities').update({ salvage_notes: notes || null }).eq('id', id)
  }

  async function removeSalvagePriority(planId: string, id: string) {
    await supabase.from('emergency_salvage_priorities').delete().eq('id', id)
    setSalvagePriorities(m => ({ ...m, [planId]: (m[planId] || []).filter(p => p.id !== id) }))
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/emergency" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan ?? '').compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/emergency" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Emergency Plans</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Emergency Plans is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Create and manage emergency response plans for your collection. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-xs font-mono px-5 py-2.5 rounded transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'
  const today = new Date().toISOString().slice(0, 10)

  const activePlans = plans.filter(p => p.status === 'Active')
  const overdueReview = plans.filter(p => p.status !== 'Archived' && p.next_review_date && p.next_review_date <= today)

  const filtered = plans.filter(p => filter === 'All' || p.status === filter)

  return (
    <DashboardShell museum={museum} activePath="/dashboard/emergency" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Emergency Plans</span>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          {/* Emergency Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Emergency Events</h2>
              {canEdit && (
                <button onClick={() => { setShowEventForm(s => !s); setEditingEventId(null); setEventForm(EMPTY_EVENT) }}
                  className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-xs font-mono px-4 py-2 rounded transition-colors">
                  {showEventForm ? 'Cancel' : '+ Log event'}
                </button>
              )}
            </div>

            {showEventForm && canEdit && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                <div className="text-sm font-mono text-stone-500 dark:text-stone-400">{editingEventId ? 'Edit emergency event' : 'Log emergency event'}</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Reference *</label>
                    <input value={eventForm.event_reference} onChange={e => setEventForm(f => ({ ...f, event_reference: e.target.value }))} placeholder="e.g. EVT-2026-001" className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Event Type *</label>
                    <select value={eventForm.event_type} onChange={e => setEventForm(f => ({ ...f, event_type: e.target.value }))} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                      {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Event Date *</label>
                    <input type="date" value={eventForm.event_date} onChange={e => setEventForm(f => ({ ...f, event_date: e.target.value }))} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Description *</label>
                  <textarea value={eventForm.description} onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Response Taken</label>
                    <textarea value={eventForm.response_taken} onChange={e => setEventForm(f => ({ ...f, response_taken: e.target.value }))} rows={2} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Damage Summary</label>
                    <textarea value={eventForm.damage_summary} onChange={e => setEventForm(f => ({ ...f, damage_summary: e.target.value }))} rows={2} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Lessons Learned</label>
                  <textarea value={eventForm.lessons_learned} onChange={e => setEventForm(f => ({ ...f, lessons_learned: e.target.value }))} rows={2} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Linked Plan</label>
                    <select value={eventForm.plan_id} onChange={e => setEventForm(f => ({ ...f, plan_id: e.target.value }))} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                      <option value="">— None —</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.plan_title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Status</label>
                    <select value={eventForm.status} onChange={e => setEventForm(f => ({ ...f, status: e.target.value }))} className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                      {['Open', 'Under Investigation', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={saveEvent} disabled={savingEvent || !eventForm.event_reference || !eventForm.event_date || !eventForm.description}
                    className="px-4 py-2 text-xs font-mono bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 rounded disabled:opacity-40 transition-colors">
                    {savingEvent ? 'Saving…' : editingEventId ? 'Save changes' : 'Log event'}
                  </button>
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Event</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Type</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Date</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Status</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Objects</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => {
                      const affectedObjects = eventObjects[ev.id] || []
                      const isExpanded = expandedEventId === ev.id
                      const showPicker = objectPickerEventId === ev.id
                      const filteredObjs = allObjects.filter(o => {
                        const already = affectedObjects.some(a => a.object_id === o.id)
                        if (already) return false
                        if (!objectSearchQ) return true
                        return o.title?.toLowerCase().includes(objectSearchQ.toLowerCase()) || o.accession_no?.toLowerCase().includes(objectSearchQ.toLowerCase())
                      })
                      return (
                        <Fragment key={ev.id}>
                          <tr className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer" onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{ev.event_reference}</div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{ev.description}</div>
                            </td>
                            <td className="px-4 py-4 text-xs text-stone-500 dark:text-stone-400">{ev.event_type}</td>
                            <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">{ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB') : '—'}</td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-mono px-2 py-1 rounded-full ${ev.status === 'Closed' || ev.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : ev.status === 'Open' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>{ev.status}</span>
                            </td>
                            <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">{affectedObjects.length || '—'}</td>
                            <td className="px-4 py-4 text-right text-xs font-mono text-stone-400">{isExpanded ? '▲' : '▼'}</td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                              <td colSpan={6} className="px-6 py-4 space-y-3">
                                {canEdit && (
                                  <div className="flex items-center gap-2 flex-wrap pb-3 mb-1 border-b border-stone-200 dark:border-stone-700">
                                    <button type="button" onClick={() => openEventEdit(ev)}
                                      className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 transition-colors">Edit</button>
                                    {ev.status === 'Open' && (
                                      <button type="button" onClick={() => updateEventStatus(ev.id, 'Under Investigation')}
                                        className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 transition-colors">Mark under investigation</button>
                                    )}
                                    {ev.status === 'Under Investigation' && (
                                      <button type="button" onClick={() => updateEventStatus(ev.id, 'Resolved')}
                                        className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 transition-colors">Mark resolved</button>
                                    )}
                                    {ev.status === 'Resolved' && (
                                      <button type="button" onClick={() => updateEventStatus(ev.id, 'Closed')}
                                        className="text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 transition-colors">Close</button>
                                    )}
                                    <button type="button" onClick={() => deleteEvent(ev.id)}
                                      className="text-xs font-mono text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded px-3 py-1.5 transition-colors ml-auto">Delete</button>
                                  </div>
                                )}
                                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Affected Objects</div>
                                {affectedObjects.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {affectedObjects.map(link => (
                                      <div key={link.object_id} className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2 py-1">
                                        <span className="text-xs text-stone-700 dark:text-stone-300">{link.objects?.emoji} {link.objects?.title}</span>
                                        {canEdit && <button type="button" onClick={() => removeObjectFromEvent(ev.id, link.object_id)} className="text-stone-400 hover:text-red-500 ml-1 text-xs">×</button>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {canEdit && (
                                  showPicker ? (
                                    <div className="space-y-2">
                                      <input value={objectSearchQ} onChange={e => setObjectSearchQ(e.target.value)} placeholder="Search objects…" className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none" />
                                      <div className="max-h-40 overflow-y-auto space-y-1">
                                        {filteredObjs.slice(0, 20).map(o => (
                                          <button key={o.id} type="button" onClick={() => { addObjectToEvent(ev.id, o.id); setObjectPickerEventId(null); setObjectSearchQ('') }} className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300">
                                            {o.emoji} {o.title} {o.accession_no && <span className="text-stone-400 font-mono text-xs ml-1">{o.accession_no}</span>}
                                          </button>
                                        ))}
                                        {filteredObjs.length === 0 && <div className="text-xs text-stone-400 px-3 py-2">No matching objects</div>}
                                      </div>
                                      <button type="button" onClick={() => { setObjectPickerEventId(null); setObjectSearchQ('') }} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">Cancel</button>
                                    </div>
                                  ) : (
                                    <button type="button" onClick={() => { setObjectPickerEventId(ev.id); setObjectSearchQ(''); setExpandedEventId(ev.id) }} className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800">+ Add affected object</button>
                                  )
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {events.length === 0 && !showEventForm && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center justify-center py-10 text-center">
                <p className="text-sm text-stone-400 dark:text-stone-500">No emergency events logged. Use the Log event button to record an incident.</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Plans', value: plans.length, warn: plans.length === 0 },
              { label: 'Active Plans', value: activePlans.length, warn: activePlans.length === 0 },
              { label: 'Overdue Reviews', value: overdueReview.length, warn: overdueReview.length > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn && s.value === 0 && s.label !== 'Overdue Reviews' ? 'text-amber-600' : s.warn && s.value > 0 && s.label === 'Overdue Reviews' ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {canEdit && (
            <div className="flex justify-end">
              <button onClick={() => { setShowForm(s => !s); setEditingPlanId(null); setForm(EMPTY_FORM) }}
                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-sm font-mono px-5 py-2.5 rounded transition-colors">
                {showForm ? 'Cancel' : '+ Add plan'}
              </button>
            </div>
          )}

          {/* Add form */}
          {showForm && canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-sm font-mono text-stone-500 dark:text-stone-400 mb-2">{editingPlanId ? 'Edit emergency plan' : 'New emergency plan'}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Plan Title *</label>
                  <input value={form.plan_title} onChange={e => setForm(f => ({ ...f, plan_title: e.target.value }))}
                    placeholder="e.g. Fire Emergency Response"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Plan Type</label>
                  <select value={form.plan_type} onChange={e => setForm(f => ({ ...f, plan_type: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {PLAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Responsible Person</label>
                  <input value={form.responsible_person} onChange={e => setForm(f => ({ ...f, responsible_person: e.target.value }))}
                    placeholder="Name"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Emergency Contacts</label>
                  <input value={form.emergency_contacts} onChange={e => setForm(f => ({ ...f, emergency_contacts: e.target.value }))}
                    placeholder="Key contacts and phone numbers"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Evacuation Procedures</label>
                <textarea value={form.evacuation_procedures} onChange={e => setForm(f => ({ ...f, evacuation_procedures: e.target.value }))}
                  rows={2} placeholder="Steps for evacuating collections…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Salvage Priorities</label>
                <textarea value={form.salvage_priorities} onChange={e => setForm(f => ({ ...f, salvage_priorities: e.target.value }))}
                  rows={2} placeholder="Priority order for salvaging objects…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Alternative Storage</label>
                  <input value={form.alternative_storage} onChange={e => setForm(f => ({ ...f, alternative_storage: e.target.value }))}
                    placeholder="Backup storage location"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Recovery Procedures</label>
                  <input value={form.recovery_procedures} onChange={e => setForm(f => ({ ...f, recovery_procedures: e.target.value }))}
                    placeholder="Post-disaster recovery steps"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Last Review Date</label>
                  <input type="date" value={form.last_review_date} onChange={e => setForm(f => ({ ...f, last_review_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Next Review Date</label>
                  <input type="date" value={form.next_review_date} onChange={e => setForm(f => ({ ...f, next_review_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Plan Last Tested</label>
                  <input type="date" value={form.plan_last_tested} onChange={e => setForm(f => ({ ...f, plan_last_tested: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Salvage Equipment Location</label>
                  <input value={form.salvage_equipment_location} onChange={e => setForm(f => ({ ...f, salvage_equipment_location: e.target.value }))}
                    placeholder="Where salvage kit / equipment is stored"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Additional notes…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={savePlan} disabled={saving || !form.plan_title}
                  className="px-4 py-2 text-xs font-mono bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 rounded disabled:opacity-40 transition-colors">
                  {saving ? 'Saving…' : editingPlanId ? 'Save changes' : 'Add plan'}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Draft', 'Active', 'Under Review', 'Archived'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Plans' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⚡</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No emergency plans</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Use the Add plan button to create your first emergency plan.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Plan</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Responsible</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Next Review</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Status</th>
                    {canEdit && <th className="px-4 py-4"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const overdue = p.next_review_date && p.next_review_date <= today && p.status !== 'Archived'
                    const isPlanExpanded = expandedPlanId === p.id
                    const planPriorities = (salvagePriorities[p.id] || []).slice().sort((a, b) => a.priority_rank - b.priority_rank)
                    const showPriorityPicker = priorityPickerPlanId === p.id
                    const filteredPriorityObjs = allObjects.filter(o => {
                      const already = planPriorities.some(a => a.object_id === o.id)
                      if (already) return false
                      if (!prioritySearchQ) return true
                      return o.title?.toLowerCase().includes(prioritySearchQ.toLowerCase()) || o.accession_no?.toLowerCase().includes(prioritySearchQ.toLowerCase())
                    })
                    const testOverdue = isTestOverdue(p.plan_last_tested)
                    return (
                      <Fragment key={p.id}>
                      <tr className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${overdue ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{p.plan_title}</div>
                          {p.notes && <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{p.notes}</div>}
                        </td>
                        <td className="px-4 py-4 text-xs text-stone-500 dark:text-stone-400">{p.plan_type}</td>
                        <td className="px-4 py-4 text-xs text-stone-500 dark:text-stone-400">{p.responsible_person || '—'}</td>
                        <td className="px-4 py-4 text-xs font-mono">
                          {p.next_review_date ? (
                            <span className={overdue ? 'text-amber-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                              {new Date(p.next_review_date).toLocaleDateString('en-GB')}
                              {overdue && ' ⚠'}
                            </span>
                          ) : <span className="text-stone-400 dark:text-stone-500">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[p.status] || STATUS_STYLES.Draft}`}>
                            {p.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {p.status === 'Draft' && (
                                <button onClick={() => updateStatus(p.id, 'Active')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Activate
                                </button>
                              )}
                              {p.status === 'Active' && (
                                <button onClick={() => updateStatus(p.id, 'Under Review')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Review
                                </button>
                              )}
                              {p.status === 'Under Review' && (
                                <button onClick={() => updateStatus(p.id, 'Active')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Approve
                                </button>
                              )}
                              {p.status !== 'Archived' && (
                                <button onClick={() => updateStatus(p.id, 'Archived')}
                                  className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                  Archive
                                </button>
                              )}
                              <button onClick={() => openPlanEdit(p)}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                Edit
                              </button>
                              <button onClick={() => deletePlan(p.id)}
                                className="text-xs font-mono text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                                Delete
                              </button>
                              <button type="button" onClick={() => setExpandedPlanId(isPlanExpanded ? null : p.id)}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                {isPlanExpanded ? '▲' : '▼'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {isPlanExpanded && (
                        <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                          <td colSpan={canEdit ? 6 : 5} className="px-6 py-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pb-3 mb-1 border-b border-stone-200 dark:border-stone-700">
                              <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                                <span className="text-stone-400 dark:text-stone-500">Last tested:</span>{' '}
                                {p.plan_last_tested ? new Date(p.plan_last_tested).toLocaleDateString('en-GB') : '—'}
                                {testOverdue && <span className="ml-2 text-amber-600">test overdue</span>}
                              </div>
                              {p.salvage_equipment_location && (
                                <div className="text-xs font-mono text-stone-500 dark:text-stone-400">
                                  <span className="text-stone-400 dark:text-stone-500">Salvage equipment:</span> {p.salvage_equipment_location}
                                </div>
                              )}
                            </div>
                            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Salvage Priorities</div>
                            {planPriorities.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                {planPriorities.map(sp => (
                                  <div key={sp.id} className="flex items-center gap-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded px-2.5 py-1.5">
                                    <input type="number" min={1} value={sp.priority_rank}
                                      disabled={!canEdit}
                                      onChange={e => updateSalvagePriorityRank(p.id, sp.id, parseInt(e.target.value, 10))}
                                      className="w-14 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded px-2 py-1 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:opacity-60" />
                                    <span className="text-xs text-stone-700 dark:text-stone-300 shrink-0">{sp.objects?.emoji} {sp.objects?.title}</span>
                                    {sp.objects?.accession_no && <span className="text-stone-400 font-mono text-xs shrink-0">{sp.objects.accession_no}</span>}
                                    {canEdit ? (
                                      <input value={sp.salvage_notes || ''}
                                        onChange={e => setSalvagePriorityNotesLocal(p.id, sp.id, e.target.value)}
                                        onBlur={e => saveSalvagePriorityNotes(sp.id, e.target.value)}
                                        placeholder="Salvage notes (optional)"
                                        className="flex-1 min-w-0 text-xs border border-stone-200 dark:border-stone-700 rounded px-2 py-1 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                                    ) : (
                                      sp.salvage_notes && <span className="flex-1 min-w-0 truncate text-xs text-stone-500 dark:text-stone-400">{sp.salvage_notes}</span>
                                    )}
                                    {canEdit && <button type="button" onClick={() => removeSalvagePriority(p.id, sp.id)} className="text-stone-400 hover:text-red-500 text-xs shrink-0 ml-auto">×</button>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {canEdit && (
                              showPriorityPicker ? (
                                <div className="space-y-2 mb-3">
                                  <input value={prioritySearchQ} onChange={e => setPrioritySearchQ(e.target.value)} placeholder="Search objects…" className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none" />
                                  <div className="max-h-40 overflow-y-auto space-y-1">
                                    {filteredPriorityObjs.slice(0, 20).map(o => (
                                      <button key={o.id} type="button" onClick={() => { addSalvagePriority(p.id, o.id); setPriorityPickerPlanId(null); setPrioritySearchQ('') }} className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300">
                                        {o.emoji} {o.title} {o.accession_no && <span className="text-stone-400 font-mono text-xs ml-1">{o.accession_no}</span>}
                                      </button>
                                    ))}
                                    {filteredPriorityObjs.length === 0 && <div className="text-xs text-stone-400 px-3 py-2">No matching objects</div>}
                                  </div>
                                  <button type="button" onClick={() => { setPriorityPickerPlanId(null); setPrioritySearchQ('') }} className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100">Cancel</button>
                                </div>
                              ) : (
                                <button type="button" onClick={() => { setPriorityPickerPlanId(p.id); setPrioritySearchQ('') }} className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 mb-3">+ Add salvage priority</button>
                              )
                            )}
                            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Supporting Documents</div>
                            {((planDocs[p.id] || []).length > 0 || (pendingDocInfo && pendingDocInfo.planId === p.id)) && (
                              <div className="space-y-1.5 mb-3">
                                {pendingDocInfo && pendingDocInfo.planId === p.id && (
                                  <div className="flex items-center gap-2 opacity-50">
                                    <div className="flex-1 flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700 rounded px-2.5 py-1.5 bg-white dark:bg-stone-900">
                                      <span className="text-stone-400">📎</span>
                                      <span className="truncate">{pendingDocInfo.label}</span>
                                      <span className="text-stone-400 dark:text-stone-500 ml-auto shrink-0">Uploading…</span>
                                    </div>
                                  </div>
                                )}
                                {(planDocs[p.id] || []).map(doc => (
                                  <div key={doc.id} className="flex items-center gap-2">
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                      className="flex-1 flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-stone-700 rounded px-2.5 py-1.5 hover:bg-white dark:hover:bg-stone-900 transition-colors bg-white dark:bg-stone-900">
                                      <span className="text-stone-400">📎</span>
                                      <span className="truncate">{doc.label || doc.file_name}</span>
                                      {doc.document_type && <span className="ml-auto text-stone-300 dark:text-stone-600 shrink-0">{doc.document_type}</span>}
                                    </a>
                                    {canEdit && (
                                      <button type="button" onClick={() => deleteEmergencyDoc(doc)}
                                        className="text-xs font-mono text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0">Remove</button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {canEdit && (
                              showDocForm === p.id ? (
                                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded p-3 space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">Label</label>
                                      <input value={docLabel} onChange={e => setDocLabel(e.target.value)} placeholder={docFile?.name || 'Document label'} className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-stone-400 dark:text-stone-500 mb-1">Type</label>
                                      <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                                        <option value="">— Optional —</option>
                                        {EMERGENCY_DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                    </div>
                                  </div>
                                  <input value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Notes (optional)" className="w-full border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-xs outline-none focus:border-stone-900 dark:focus:border-stone-400 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100" />
                                  <div className="flex items-center gap-2">
                                    <label className="flex-1 flex items-center gap-2 border border-dashed border-stone-300 dark:border-stone-600 rounded px-2 py-1.5 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                                      <span className="text-xs font-mono text-stone-400">{docFile ? docFile.name : 'Choose file…'}</span>
                                      <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.csv" className="hidden" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
                                    </label>
                                    <button type="button" onClick={() => uploadEmergencyDoc(p.id)} disabled={!docFile || docUploading}
                                      className="text-xs font-mono px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 rounded disabled:opacity-40 transition-colors shrink-0">
                                      {docUploading ? 'Uploading…' : 'Upload'}
                                    </button>
                                    <button type="button" onClick={() => { setShowDocForm(null); setDocLabel(''); setDocType(''); setDocNotes(''); setDocFile(null); setDocError(null) }}
                                      className="text-xs font-mono text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 shrink-0">Cancel</button>
                                  </div>
                                  {docError && <p className="text-xs text-red-500 font-mono">{docError}</p>}
                                </div>
                              ) : (
                                <button type="button" onClick={() => setShowDocForm(p.id)}
                                  className="text-xs font-mono text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800">+ Attach document</button>
                              )
                            )}
                          </td>
                        </tr>
                      )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
