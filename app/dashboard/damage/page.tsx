'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

const DAMAGE_TYPES = ['Accidental', 'Environmental', 'Theft', 'Vandalism', 'Pest', 'Handling', 'Transit', 'Unknown']
const SEVERITIES = ['Minor', 'Moderate', 'Significant', 'Severe', 'Total Loss']
const STATUSES = ['Open', 'Under Investigation', 'Repaired', 'Claimed', 'Closed', 'Write-off']
const CURRENCIES = ['GBP', 'USD', 'EUR', 'CHF', 'AUD', 'CAD', 'JPY']

const SEVERITY_STYLES: Record<string, string> = {
  'Total Loss':  'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  Severe:        'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  Significant:   'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Moderate:      'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  Minor:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}

const STATUS_STYLES: Record<string, string> = {
  Open:                   'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Under Investigation':  'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400',
  Repaired:               'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Claimed:                'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Closed:                 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'Write-off':            'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
}

const EMPTY_FORM = {
  artifact_id: '', incident_date: '', discovered_date: '', discovered_by: '',
  damage_type: 'Accidental', severity: 'Minor', description: '', cause: '',
  location_at_incident: '', repair_estimate: '', repair_currency: 'GBP',
  insurance_claim_ref: '', insurance_notified: false,
  investigation_notes: '', action_taken: '', reported_by: '', notes: '',
}

export default function DamagePage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('All')
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
      const [{ data: reports }, { data: artifacts }] = await Promise.all([
        supabase.from('damage_reports')
          .select('*, artifacts(title, accession_no, emoji)')
          .eq('museum_id', museum.id)
          .order('created_at', { ascending: false }),
        supabase.from('artifacts')
          .select('id, title, accession_no, emoji')
          .eq('museum_id', museum.id)
          .order('title'),
      ])
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setReports(reports || [])
      setArtifacts(artifacts || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function generateReportNumber() {
    const year = new Date().getFullYear()
    const existing = reports.filter(r => r.report_number?.startsWith(`DR-${year}-`))
    const next = existing.length + 1
    return `DR-${year}-${String(next).padStart(3, '0')}`
  }

  async function addReport() {
    if (!form.incident_date || !form.discovered_by || !form.description) return
    setSaving(true)
    await supabase.from('damage_reports').insert({
      ...form,
      report_number: generateReportNumber(),
      artifact_id: form.artifact_id || null,
      repair_estimate: form.repair_estimate ? Number(form.repair_estimate) : null,
      museum_id: museum.id,
    })
    const { data } = await supabase
      .from('damage_reports')
      .select('*, artifacts(title, accession_no, emoji)')
      .eq('museum_id', museum.id)
      .order('created_at', { ascending: false })
    setReports(data || [])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('damage_reports').update({ status }).eq('id', id)
    setReports(r => r.map(x => x.id === id ? { ...x, status } : x))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  const canEdit = isOwner || staffAccess === 'Admin' || staffAccess === 'Editor'

  const openReports = reports.filter(r => r.status === 'Open' || r.status === 'Under Investigation')
  const thisYear = reports.filter(r => r.incident_date?.startsWith(String(new Date().getFullYear())))
  const totalRepairCost = reports.filter(r => r.repair_estimate).reduce((sum, r) => sum + (r.repair_estimate || 0), 0)

  const filtered = reports.filter(r => filter === 'All' || r.status === filter)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/damage" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Damage & Loss Reports</span>
          {canEdit && (
            <button onClick={() => setShowForm(s => !s)}
              className="text-xs font-mono px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              {showForm ? 'Cancel' : '+ Add report'}
            </button>
          )}
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Open Reports', value: String(openReports.length), warn: openReports.length > 0 },
              { label: 'Incidents This Year', value: String(thisYear.length), warn: false },
              { label: 'Est. Repair Costs', value: totalRepairCost > 0 ? `£${totalRepairCost.toLocaleString()}` : '—', warn: false },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Add form */}
          {showForm && canEdit && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 space-y-4">
              <div className="text-sm font-mono text-stone-500 dark:text-stone-400 mb-2">New damage report</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Linked Object</label>
                  <select value={form.artifact_id} onChange={e => setForm(f => ({ ...f, artifact_id: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    <option value="">None (general)</option>
                    {artifacts.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.title} ({a.accession_no})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Incident Date *</label>
                  <input type="date" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Discovered Date *</label>
                  <input type="date" value={form.discovered_date} onChange={e => setForm(f => ({ ...f, discovered_date: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Discovered By *</label>
                  <input value={form.discovered_by} onChange={e => setForm(f => ({ ...f, discovered_by: e.target.value }))}
                    placeholder="Name"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Damage Type</label>
                  <select value={form.damage_type} onChange={e => setForm(f => ({ ...f, damage_type: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {DAMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Severity</label>
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Describe the damage or loss…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Cause</label>
                  <input value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))}
                    placeholder="Known or suspected cause"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Location at Time of Incident</label>
                  <input value={form.location_at_incident} onChange={e => setForm(f => ({ ...f, location_at_incident: e.target.value }))}
                    placeholder="Where the object was"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Repair Estimate</label>
                  <input type="number" value={form.repair_estimate} onChange={e => setForm(f => ({ ...f, repair_estimate: e.target.value }))}
                    placeholder="0.00"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Currency</label>
                  <select value={form.repair_currency} onChange={e => setForm(f => ({ ...f, repair_currency: e.target.value }))}
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Insurance Claim Ref</label>
                  <input value={form.insurance_claim_ref} onChange={e => setForm(f => ({ ...f, insurance_claim_ref: e.target.value }))}
                    placeholder="Claim reference number"
                    className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                <input type="checkbox" checked={form.insurance_notified} onChange={e => setForm(f => ({ ...f, insurance_notified: e.target.checked }))}
                  className="rounded border-stone-300" />
                Insurance provider notified
              </label>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Action Taken</label>
                <textarea value={form.action_taken} onChange={e => setForm(f => ({ ...f, action_taken: e.target.value }))}
                  rows={2} placeholder="Immediate steps taken…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Additional notes…"
                  className="w-full text-sm border border-stone-200 dark:border-stone-700 rounded px-3 py-2 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-400 resize-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={addReport} disabled={saving || !form.incident_date || !form.discovered_by || !form.description}
                  className="px-4 py-2 text-xs font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-100 disabled:opacity-40 transition-colors">
                  {saving ? 'Saving…' : 'Add report'}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['All', ...STATUSES].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Reports' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⚠</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No damage reports</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Use the Add report button to log a damage or loss incident.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Report</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Severity</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    {canEdit && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800">
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium font-mono text-stone-900 dark:text-stone-100">{r.report_number}</div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.artifacts ? (
                          <button onClick={() => router.push(`/dashboard/artifacts/${r.artifact_id}`)}
                            className="flex items-center gap-2 text-left hover:opacity-70 transition-opacity">
                            <span className="text-base">{r.artifacts.emoji}</span>
                            <div>
                              <div className="text-xs font-medium text-stone-900 dark:text-stone-100">{r.artifacts.title}</div>
                              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{r.artifacts.accession_no}</div>
                            </div>
                          </button>
                        ) : (
                          <span className="text-xs text-stone-400 dark:text-stone-500 italic">General</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{r.damage_type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.Minor}`}>
                          {r.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {new Date(r.incident_date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[r.status] || STATUS_STYLES.Open}`}>
                          {r.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {r.status === 'Open' && (
                              <button onClick={() => updateStatus(r.id, 'Under Investigation')}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                Investigate
                              </button>
                            )}
                            {(r.status === 'Open' || r.status === 'Under Investigation') && (
                              <button onClick={() => updateStatus(r.id, 'Repaired')}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                Repaired
                              </button>
                            )}
                            {r.status !== 'Closed' && r.status !== 'Write-off' && (
                              <button onClick={() => updateStatus(r.id, 'Closed')}
                                className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
