'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

const PLAN_TYPES = ['General', 'Fire', 'Flood', 'Theft', 'Pest', 'Environmental', 'Structural']

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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Draft' | 'Active' | 'Under Review' | 'Archived'>('All')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: plans } = await supabase
        .from('emergency_plans')
        .select('*')
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setPlans(plans || [])
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/emergency" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
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
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Emergency Plans</span>
          {canEdit && (
            <button onClick={() => setShowForm(s => !s)}
              className="text-xs font-mono px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              {showForm ? 'Cancel' : '+ Add plan'}
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
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

          {/* Add form */}
          {showForm && canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-sm font-mono text-stone-500 dark:text-stone-400 mb-2">New emergency plan</div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
          <div className="flex gap-2">
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
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
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
