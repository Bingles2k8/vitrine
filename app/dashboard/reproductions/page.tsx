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

interface ReproObjectRow {
  id: string
  title: string | null
  accession_no: string | null
  emoji: string | null
}

interface ReproRequestRow {
  id: string
  object_id: string
  requester_name: string
  requester_org: string | null
  purpose: string | null
  status: string
  request_date: string
  reproduction_type: string | null
  fee: number | null
  fee_currency: string | null
  credit_line: string | null
  notes: string | null
  created_at: string
  objects: ReproObjectRow | null
}

const REPRO_SELECT = '*, objects(id, title, accession_no, emoji)'

export default function ReproductionsRegisterPage() {
  const [museum, setMuseum] = useState<Museum | null>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [records, setRecords] = useState<ReproRequestRow[]>([])
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
        .from('reproduction_requests')
        .select(REPRO_SELECT)
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setRecords((records as ReproRequestRow[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/reproductions" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={5} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan ?? '').compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/reproductions" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Reproduction Requests</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">The Reproduction Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track requests to photograph, reproduce, and publish your objects — with approvals, fees, and licence terms — across the whole collection. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
      </DashboardShell>
    )
  }

  const pending = records.filter(r => r.status === 'Pending' || r.status === 'Requested')
  const approved = records.filter(r => r.status === 'Approved')

  // Total fees — only summable when all fee-bearing requests share one currency.
  const feeRecords = records.filter(r => r.fee != null)
  const currencies = Array.from(new Set(feeRecords.map(r => r.fee_currency || 'GBP')))
  const feeTotal = feeRecords.reduce((sum, r) => sum + (r.fee || 0), 0)
  const feesMixed = currencies.length > 1
  const feesLabel = feeRecords.length === 0
    ? 'Total Fees'
    : feesMixed
      ? 'Fees Charged (mixed)'
      : `Total Fees (${currencies[0]})`
  const feesValue = feeRecords.length === 0
    ? '—'
    : feesMixed
      ? `${feeRecords.length} req.`
      : feeTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const q = searchQuery.trim().toLowerCase()
  const filteredRecords = records.filter(r => {
    if (!q) return true
    return (
      r.objects?.title?.toLowerCase().includes(q) ||
      r.objects?.accession_no?.toLowerCase().includes(q) ||
      r.requester_name?.toLowerCase().includes(q) ||
      r.requester_org?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q)
    )
  })

  function statusBadge(status: string) {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
      case 'Declined': return 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
      default: return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
    }
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/reproductions" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Reproduction Requests</span>
        </div>

        <div className="p-6 md:p-10 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Requests', value: records.length },
              { label: 'Pending', value: pending.length },
              { label: 'Approved', value: approved.length },
              { label: feesLabel, value: feesValue },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-5 py-3">
            <p className="text-xs text-stone-500 dark:text-stone-400">A cross-collection register of every reproduction request. To log a new request, or to approve or decline one, open the relevant object and use its <span className="font-medium text-stone-600 dark:text-stone-300">Rights</span> tab.</p>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by object, requester, or purpose…"
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Table */}
          {records.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📷</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No reproduction requests yet</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Log requests from an object&apos;s Rights tab and they will appear here.</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No matching requests</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Try a different search term.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-100/70 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-4">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Requester</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Purpose</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Status</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Requested</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-4">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{r.requester_name}</div>
                        {r.requester_org && <div className="text-xs text-stone-400 dark:text-stone-500">{r.requester_org}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-700 dark:text-stone-300">{r.purpose || '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${statusBadge(r.status)}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {r.request_date ? new Date(r.request_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-stone-600 dark:text-stone-400">
                        {r.fee != null ? `${r.fee_currency || 'GBP'} ${Number(r.fee).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </DashboardShell>
  )
}
