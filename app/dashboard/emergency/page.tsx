'use client'

import { useEffect, useState, Fragment } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

const PLAN_TYPES = ['General', 'Fire', 'Flood', 'Theft', 'Pest', 'Environmental', 'Structural']
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

const EMPTY_FORM = {
  plan_title: '', plan_type: 'General', responsible_person: '',
  emergency_contacts: '', evacuation_procedures: '', salvage_priorities: '',
  alternative_storage: '', recovery_procedures: '',
  last_review_date: '', next_review_date: '', notes: '',
}

export default function EmergencyPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [allObjects, setAllObjects] = useState<any[]>([])
  const [eventObjects, setEventObjects] = useState<Record<string, any[]>>({})
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [objectPickerEventId, setObjectPickerEventId] = useState<string | null>(null)
  const [objectSearchQ, setObjectSearchQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Draft' | 'Active' | 'Under Review' | 'Archived'>('All')
  const [showForm, setShowForm] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [eventForm, setEventForm] = useState(EMPTY_EVENT)
  const [saving, setSaving] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const [{ data: plans }, { data: evts }, { data: objs }, { data: eoLinks }] = await Promise.all([
        supabase.from('emergency_plans').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false }),
        supabase.from('emergency_events').select('*').eq('museum_id', museum.id).order('event_date', { ascending: false }),
        supabase.from('objects').select('id, title, accession_no, emoji').eq('museum_id', museum.id).eq('deleted', false).order('title'),
        supabase.from('emergency_event_objects').select('*, objects(id, title, accession_no, emoji)').eq('museum_id', museum.id),
      ])
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setPlans(plans || [])
      setEvents(evts || [])
      setAllObjects(objs || [])
      // build map: event_id → [object records]
      const map: Record<string, any[]> = {}
      for (const link of (eoLinks || [])) {
        if (!map[link.event_id]) map[link.event_id] = []
        map[link.event_id].push(link)
      }
      setEventObjects(map)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function addPlan() {
    if (!form.plan_title) return
    setSaving(true)
    await supabase.from('emergency_plans').insert({
      ...form,
      last_review_date: form.last_review_date || null,
      next_review_date: form.next_review_date || null,
      museum_id: museum.id,
    })
    const { data } = await supabase
      .from('emergency_plans')
      .select('*')
      .eq('museum_id', museum.id)
      .order('created_at', { ascending: false })
    setPlans(data || [])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('emergency_plans').update({ status }).eq('id', id)
    setPlans(p => p.map(x => x.id === id ? { ...x, status } : x))
  }

  async function addEvent() {
    if (!eventForm.event_reference || !eventForm.event_date || !eventForm.description) return
    setSavingEvent(true)
    await supabase.from('emergency_events').insert({
      ...eventForm,
      plan_id: eventForm.plan_id || null,
      response_taken: eventForm.response_taken || null,
      damage_summary: eventForm.damage_summary || null,
      lessons_learned: eventForm.lessons_learned || null,
      notes: eventForm.notes || null,
      museum_id: museum.id,
    })
    const { data } = await supabase.from('emergency_events').select('*').eq('museum_id', museum.id).order('event_date', { ascending: false })
    setEvents(data || [])
    setEventForm(EMPTY_EVENT)
    setShowEventForm(false)
    setSavingEvent(false)
  }

  async function addObjectToEvent(eventId: string, objectId: string) {
    await supabase.from('emergency_event_objects').insert({ event_id: eventId, object_id: objectId, museum_id: museum.id })
    const obj = allObjects.find(o => o.id === objectId)
    if (obj) setEventObjects(m => ({ ...m, [eventId]: [...(m[eventId] || []), { event_id: eventId, object_id: objectId, objects: obj }] }))
  }

  async function removeObjectFromEvent(eventId: string, objectId: string) {
    await supabase.from('emergency_event_objects').delete().eq('event_id', eventId).eq('object_id', objectId)
    setEventObjects(m => ({ ...m, [eventId]: (m[eventId] || []).filter(l => l.object_id !== objectId) }))
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/emergency" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
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
  const today = new Date().toISOString().slice(0, 10)

  const activePlans = plans.filter(p => p.status === 'Active')
  const overdueReview = plans.filter(p => p.status !== 'Archived' && p.next_review_date && p.next_review_date <= today)

  const filtered = plans.filter(p => filter === 'All' || p.status === filter)

  return (
    <DashboardShell museum={museum} activePath="/dashboard/emergency" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Emergency Plans</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Emergency Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Emergency Events</h2>
              {canEdit && (
                <button onClick={() => setShowEventForm(s => !s)}
                  className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">
                  {showEventForm ? 'Cancel' : '+ Log event'}
                </button>
              )}
            </div>

            {showEventForm && canEdit && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
                <div className="text-sm font-mono text-stone-500 dark:text-stone-400">Log emergency event</div>
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
                  <button onClick={addEvent} disabled={savingEvent || !eventForm.event_reference || !eventForm.event_date || !eventForm.description}
                    className="px-4 py-2 text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 transition-colors">
                    {savingEvent ? 'Saving…' : 'Log event'}
                  </button>
                </div>
              </div>
            )}

            {events.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Event</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                      <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Objects</th>
                      <th className="px-4 py-3"></th>
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
                            <td className="px-6 py-3">
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{ev.event_reference}</div>
                              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{ev.description}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{ev.event_type}</td>
                            <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-GB') : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-mono px-2 py-1 rounded-full ${ev.status === 'Closed' || ev.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : ev.status === 'Open' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>{ev.status}</span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">{affectedObjects.length || '—'}</td>
                            <td className="px-4 py-3 text-right text-xs font-mono text-stone-400">{isExpanded ? '▲' : '▼'}</td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                              <td colSpan={6} className="px-6 py-4 space-y-3">
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
              <button onClick={() => setShowForm(s => !s)}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-sm font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors">
                {showForm ? 'Cancel' : '+ Add plan'}
              </button>
            </div>
          )}

          {/* Add form */}
          {showForm && canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-sm font-mono text-stone-500 dark:text-stone-400 mb-2">New emergency plan</div>
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
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Additional notes…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={addPlan} disabled={saving || !form.plan_title}
                  className="px-4 py-2 text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 transition-colors">
                  {saving ? 'Saving…' : 'Add plan'}
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
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Plan</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Responsible</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Next Review</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const overdue = p.next_review_date && p.next_review_date <= today && p.status !== 'Archived'
                    return (
                      <tr key={p.id} className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${overdue ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{p.plan_title}</div>
                          {p.notes && <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{p.notes}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{p.plan_type}</td>
                        <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{p.responsible_person || '—'}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {p.next_review_date ? (
                            <span className={overdue ? 'text-amber-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                              {new Date(p.next_review_date).toLocaleDateString('en-GB')}
                              {overdue && ' ⚠'}
                            </span>
                          ) : <span className="text-stone-400 dark:text-stone-500">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[p.status] || STATUS_STYLES.Draft}`}>
                            {p.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
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
                            </div>
                          </td>
                        )}
                      </tr>
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
