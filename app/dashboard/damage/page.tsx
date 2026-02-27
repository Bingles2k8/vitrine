'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

const STATUSES = ['Open', 'Under Investigation', 'Repaired', 'Claimed', 'Closed', 'Write-off']

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

export default function DamagePage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('All')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: reports } = await supabase
        .from('damage_reports')
        .select('*, artifacts(title, accession_no, emoji)')
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setReports(reports || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  const openReports = reports.filter(r => r.status === 'Open' || r.status === 'Under Investigation')
  const thisYear = reports.filter(r => r.incident_date?.startsWith(String(new Date().getFullYear())))
  const totalRepairCost = reports.filter(r => r.repair_estimate).reduce((sum, r) => sum + (r.repair_estimate || 0), 0)
  // Use the most common currency for the summary, defaulting to GBP
  const summaryCurrency = reports.find(r => r.repair_estimate)?.repair_currency || 'GBP'

  const filtered = reports.filter(r => filter === 'All' || r.status === filter)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/damage" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Damage & Loss Reports</span>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Open Reports', value: String(openReports.length), warn: openReports.length > 0 },
              { label: 'Incidents This Year', value: String(thisYear.length), warn: false },
              { label: 'Est. Repair Costs', value: totalRepairCost > 0 ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: summaryCurrency, minimumFractionDigits: 0 }).format(totalRepairCost) : '—', warn: false },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Damage reports are created and managed on each object&apos;s page under the Damage tab. Click an object-linked report below to view it.</p>
          </div>

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
              <p className="text-sm text-stone-400 dark:text-stone-500">Add damage reports from each object&apos;s Damage tab.</p>
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
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${r.artifact_id ? 'cursor-pointer' : ''}`}
                      onClick={() => r.artifact_id && router.push(`/dashboard/artifacts/${r.artifact_id}?tab=damage`)}
                    >
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium font-mono text-stone-900 dark:text-stone-100">{r.report_number}</div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 max-w-xs truncate">{r.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.artifacts ? (
                          <div className="flex items-center gap-2">
                            <span className="text-base">{r.artifacts.emoji}</span>
                            <div>
                              <div className="text-xs font-medium text-stone-900 dark:text-stone-100">{r.artifacts.title}</div>
                              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{r.artifacts.accession_no}</div>
                            </div>
                          </div>
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
