'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'
import SearchFilterBar, { FilterState, EMPTY_FILTERS, SortBy } from '@/components/SearchFilterBar'

const TEMP_REASONS = new Set(['Outgoing loan', 'Conservation', 'Photography'])

export default function ObjectExitsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [exits, setExits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [sortBy, setSortBy] = useState<SortBy>('')
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
        .select('*, objects(title, accession_no, emoji, description, medium, physical_materials, artist, maker_name, object_type, status, created_at, production_date, acquisition_method, accession_register_confirmed)')
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

  const mediumOptions = Array.from(new Set(exits.map(e => e.objects?.medium).filter(Boolean))).sort() as string[]
  const objectTypeOptions = Array.from(new Set(exits.map(e => e.objects?.object_type).filter(Boolean))).sort() as string[]
  const artistOptions = [] as string[]

  const q = searchQuery.trim().toLowerCase()
  const displayedExits = exits
    .filter(e => {
      if (filters.dateFrom && (e.exit_date || '') < filters.dateFrom) return false
      if (filters.dateTo && (e.exit_date || '') > filters.dateTo) return false
      if (filters.medium && e.objects?.medium !== filters.medium) return false
      if (filters.objectType && e.objects?.object_type !== filters.objectType) return false
      if (filters.status && e.objects?.status !== filters.status) return false
      if (filters.accessionStatus === 'confirmed' && !e.objects?.accession_register_confirmed) return false
      if (filters.accessionStatus === 'unconfirmed' && e.objects?.accession_register_confirmed) return false
      if (filters.acquisitionMethod && e.objects?.acquisition_method !== filters.acquisitionMethod) return false
      if (!q) return true
      return (
        e.objects?.title?.toLowerCase().includes(q) ||
        e.objects?.accession_no?.toLowerCase().includes(q) ||
        e.recipient_name?.toLowerCase().includes(q) ||
        e.objects?.description?.toLowerCase().includes(q) ||
        e.objects?.medium?.toLowerCase().includes(q) ||
        e.objects?.physical_materials?.toLowerCase().includes(q) ||
        e.objects?.artist?.toLowerCase().includes(q) ||
        e.objects?.maker_name?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'alpha') return (a.objects?.title || '').localeCompare(b.objects?.title || '')
      if (sortBy === 'date_added') return (b.objects?.created_at || '').localeCompare(a.objects?.created_at || '')
      if (sortBy === 'date_made') return (b.objects?.production_date || '').localeCompare(a.objects?.production_date || '')
      return 0
    })

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
          <SearchFilterBar
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            filters={filters} onFiltersChange={setFilters}
            sortBy={sortBy} onSortChange={setSortBy}
            isFullMode={true}
            mediumOptions={mediumOptions} objectTypeOptions={objectTypeOptions} artistOptions={artistOptions}
            placeholder="Search objects…"
          />

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
                        onClick={() => e.object_id && router.push(`/dashboard/objects/${e.object_id}?tab=exits`)}
                      >
                        <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{e.exit_number}</td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                          {new Date(e.exit_date + 'T00:00:00').toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{e.objects?.emoji}</span>
                            <div>
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{e.objects?.title}</div>
                              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{e.objects?.accession_no}</div>
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
