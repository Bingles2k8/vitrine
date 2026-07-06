'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

interface Museum {
  id: string
  plan: string
}

interface RightsObjectRow {
  id: string
  title: string | null
  accession_no: string | null
  emoji: string | null
}

interface RightsRecordRow {
  id: string
  object_id: string | null
  rights_reference: string
  rights_type: string
  rights_status: string
  rights_holder: string | null
  expiry_date: string | null
  licence_terms: string | null
  restrictions: string | null
  notes: string | null
  created_at: string
  objects: RightsObjectRow | null
}

const RIGHTS_SELECT = '*, objects(id, title, accession_no, emoji)'

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function RightsRegisterPage() {
  const [museum, setMuseum] = useState<Museum | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [records, setRecords] = useState<RightsRecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: records } = await supabase
        .from('rights_records')
        .select(RIGHTS_SELECT)
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setRecords((records as RightsRecordRow[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/rights" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={5} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan ?? '').compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/rights" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Rights Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">The Rights Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track copyright, licences, rights holders, and expiry dates across your whole collection in one register. Available on Professional, Institution, and Enterprise plans.</p>
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

  const active = records.filter(r => r.rights_status === 'Active')
  const expiringSoon = records.filter(r => {
    if (!r.expiry_date) return false
    const d = daysUntil(r.expiry_date)
    return d >= 0 && d <= 90
  })
  const expired = records.filter(r => {
    if (!r.expiry_date) return false
    return daysUntil(r.expiry_date) < 0
  })

  const q = searchQuery.trim().toLowerCase()
  const filteredRecords = records.filter(r => {
    if (!q) return true
    return (
      r.objects?.title?.toLowerCase().includes(q) ||
      r.objects?.accession_no?.toLowerCase().includes(q) ||
      r.rights_holder?.toLowerCase().includes(q) ||
      r.rights_reference?.toLowerCase().includes(q)
    )
  })

  function statusBadge(status: string) {
    switch (status) {
      case 'Active': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      case 'Expired': return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
      default: return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
    }
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/rights" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Rights Register</span>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: records.length },
              { label: 'Active', value: active.length },
              { label: 'Expiring ≤ 90 days', value: expiringSoon.length },
              { label: 'Expired', value: expired.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">A cross-collection register of every rights record. To add a new rights record, open the relevant object and use its <span className="font-medium text-stone-600 dark:text-stone-300">Rights</span> tab.</p>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by object, accession no., rights holder, or reference…"
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Table */}
          {records.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">©</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No rights records yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Add rights records from an object&apos;s Rights tab and they will appear here.</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No matching records</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Try a different search term.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Reference</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Holder</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Status</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => {
                    const days = r.expiry_date ? daysUntil(r.expiry_date) : null
                    const expiryCls = days === null ? 'text-stone-500 dark:text-stone-400'
                      : days < 0 ? 'text-red-600 dark:text-red-400 font-medium'
                      : days <= 90 ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : 'text-stone-500 dark:text-stone-400'
                    return (
                    <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                      <td className="px-6 py-4">
                        {r.object_id ? (
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/objects/${r.object_id}?tab=rights`)}
                            className="flex items-center gap-2 text-left group"
                          >
                            <span className="text-base">{r.objects?.emoji}</span>
                            <div>
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:underline">{r.objects?.title || 'Untitled'}</div>
                              {r.objects?.accession_no && <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{r.objects.accession_no}</div>}
                            </div>
                          </button>
                        ) : (
                          <span className="text-sm text-stone-400 dark:text-stone-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-stone-600 dark:text-stone-400">{r.rights_reference}</td>
                      <td className="px-4 py-4 text-sm text-stone-700 dark:text-stone-300">{r.rights_type}</td>
                      <td className="px-4 py-4 text-sm text-stone-700 dark:text-stone-300">{r.rights_holder || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${statusBadge(r.rights_status)}`}>{r.rights_status}</span>
                      </td>
                      <td className={`px-4 py-4 text-xs font-mono ${expiryCls}`}>
                        {r.expiry_date ? new Date(r.expiry_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}
                      </td>
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
