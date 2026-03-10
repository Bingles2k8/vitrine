'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

const TEMP_REASONS = new Set(['Outgoing loan', 'Conservation', 'Photography'])

export default function ObjectExitsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [exits, setExits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: exits } = await supabase
        .from('object_exits')
        .select('*, artifacts(title, accession_no, emoji)')
        .eq('museum_id', museum.id)
        .order('exit_date', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setExits(exits || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/exits" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/exits" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Object Exit</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Object Exit is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Record and track objects leaving your care. Available on Professional, Institution, and Enterprise plans.</p>
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

  const todayStr = today
  const temporary = exits.filter(e => e.expected_return_date)
  const permanent = exits.filter(e => !e.expected_return_date)
  const overdue = temporary.filter(e => e.expected_return_date < todayStr)

  const displayedExits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return exits
    return exits.filter(e =>
      e.artifacts?.title?.toLowerCase().includes(q) ||
      e.artifacts?.accession_no?.toLowerCase().includes(q) ||
      e.recipient_name?.toLowerCase().includes(q)
    )
  }, [exits, searchQuery])

  function exitStatus(e: any) {
    if (!e.expected_return_date) return { label: 'Permanent', cls: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400' }
    if (e.expected_return_date < todayStr) return { label: 'Overdue', cls: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' }
    return { label: 'Temporary', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' }
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/exits" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Object Exit Register</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Exits', value: exits.length },
              { label: 'Temporary', value: temporary.length },
              { label: 'Permanent', value: permanent.length },
              { label: 'Overdue Returns', value: overdue.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Overdue Returns' && s.value > 0 ? 'text-red-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">Exit records are created and edited on each object&apos;s page under the Exits tab. Click a row below to view the object.</p>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by object name, accession number, or recipient…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {/* Table */}
          {exits.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">↗</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No exit records yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Record every object that leaves your premises from the object&apos;s page.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Exit No.</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Exit Reason</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Recipient</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Receipt</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Expected Return</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedExits.map(e => {
                    const status = exitStatus(e)
                    return (
                      <tr key={e.id}
                        className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer ${status.label === 'Overdue' ? 'bg-red-50/20' : ''}`}
                        onClick={() => e.artifact_id && router.push(`/dashboard/artifacts/${e.artifact_id}?tab=exits`)}
                      >
                        <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{e.exit_number}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                          {new Date(e.exit_date + 'T00:00:00').toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{e.artifacts?.emoji}</span>
                            <div>
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{e.artifacts?.title}</div>
                              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{e.artifacts?.accession_no}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{e.exit_reason}</td>
                        <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{e.recipient_name}</td>
                        <td className="px-4 py-3">
                          {e.signed_receipt
                            ? <span className="text-xs font-mono text-emerald-600">✓ Signed</span>
                            : <span className="text-xs font-mono text-amber-600">Pending</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                          {e.expected_return_date ? new Date(e.expected_return_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${status.cls}`}>{status.label}</span>
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
