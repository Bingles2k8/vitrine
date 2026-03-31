'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

const inputCls = 'w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'

const MOVE_TYPES = ['All', 'Permanent', 'Temporary', 'Return']

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB')
}

function exportCsv(rows: any[]) {
  const headers = ['Date', 'Object', 'Accession No.', 'Location', 'Move Type', 'Expected Return', 'Moved By', 'Notes']
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.moved_at ? new Date(r.moved_at).toLocaleDateString('en-GB') : '',
      `"${(r.objects?.title || '').replace(/"/g, '""')}"`,
      r.objects?.accession_no || '',
      `"${(r.locations?.name || r.location_name || '').replace(/"/g, '""')}"`,
      r.move_type || '',
      r.expected_return_date ? fmt(r.expected_return_date) : '',
      `"${(r.moved_by || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ].join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `location-register-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function LocationsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  const [objects, setObjects] = useState<any[]>([])
  const [tab, setTab] = useState<'movements' | 'current'>('movements')
  const [search, setSearch] = useState('')
  const [moveTypeFilter, setMoveTypeFilter] = useState('All')
  const today = new Date().toISOString().slice(0, 10)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result

      const [{ data: movs }, { data: objs }] = await Promise.all([
        supabase
          .from('location_history')
          .select('*, objects(id, title, accession_no, emoji), locations(name, location_code)')
          .eq('museum_id', museum.id)
          .order('moved_at', { ascending: false }),
        supabase
          .from('objects')
          .select('id, title, accession_no, emoji, current_location, status')
          .eq('museum_id', museum.id)
          .is('deleted_at', null)
          .order('title'),
      ])

      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setMovements(movs || [])
      setObjects(objs || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const overdue = useMemo(() =>
    movements.filter(m =>
      m.expected_return_date && m.expected_return_date < today
    ),
    [movements, today]
  )

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        m.objects?.title?.toLowerCase().includes(q) ||
        m.objects?.accession_no?.toLowerCase().includes(q) ||
        m.locations?.name?.toLowerCase().includes(q) ||
        m.moved_by?.toLowerCase().includes(q)
      const matchType = moveTypeFilter === 'All' || m.move_type === moveTypeFilter
      return matchSearch && matchType
    })
  }, [movements, search, moveTypeFilter])

  // Group objects by current location for the "current" tab
  const byLocation = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const obj of objects) {
      const loc = obj.current_location || 'No location recorded'
      if (!map.has(loc)) map.set(loc, [])
      map.get(loc)!.push(obj)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [objects])

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/locations" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6"><TableSkeleton rows={8} cols={5} /></div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/locations" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Location Register</span>
        </div>
        <div className="p-8 max-w-lg">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <div className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">Professional feature</div>
            <p className="text-sm text-amber-800 dark:text-amber-300 mb-4">The Location Register is available on Professional and above. Track every movement across your collection and identify overdue temporary moves.</p>
            <button onClick={() => router.push('/dashboard/plan')} className="text-sm font-mono bg-amber-900 dark:bg-amber-200 text-white dark:text-amber-900 px-4 py-2 rounded">View plans →</button>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell museum={museum} activePath="/dashboard/locations" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      {/* Header */}
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Location Register</span>
      </div>

      <div className="p-4 md:p-8 space-y-6 max-w-6xl">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total movements', value: movements.length },
            { label: 'Objects with history', value: new Set(movements.map(m => m.object_id)).size },
            { label: 'Overdue returns', value: overdue.length, warn: overdue.length > 0 },
            { label: 'Unique locations', value: byLocation.length },
          ].map(s => (
            <div key={s.label} className={`rounded-lg border p-4 ${s.warn ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900'}`}>
              <div className={`text-2xl font-mono font-medium ${s.warn ? 'text-amber-700 dark:text-amber-300' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-amber-600 dark:text-amber-400 mt-0.5">⚠</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
                  {overdue.length} overdue temporary {overdue.length === 1 ? 'move' : 'moves'}
                </div>
                <div className="space-y-1">
                  {overdue.slice(0, 5).map(m => (
                    <div key={m.id} className="text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <span>{m.objects?.emoji || '📦'}</span>
                      <span className="font-medium">{m.objects?.title || 'Unknown object'}</span>
                      {m.objects?.accession_no && <span className="font-mono text-amber-600 dark:text-amber-500">({m.objects.accession_no})</span>}
                      <span>— expected return {fmt(m.expected_return_date)}</span>
                    </div>
                  ))}
                  {overdue.length > 5 && <div className="text-xs text-amber-600 dark:text-amber-500">+{overdue.length - 5} more</div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-stone-200 dark:border-stone-700">
          {(['movements', 'current'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px ${tab === t ? 'border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100' : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>
              {t === 'movements' ? 'Movement Register' : 'Current Locations'}
            </button>
          ))}
        </div>

        {tab === 'movements' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search object or location…"
                className="border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 w-64"
              />
              <div className="flex gap-1 flex-wrap">
                {MOVE_TYPES.map(t => (
                  <button key={t} onClick={() => setMoveTypeFilter(t)}
                    className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${moveTypeFilter === t ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={() => exportCsv(filteredMovements)}
                className="ml-auto text-xs font-mono border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 px-3 py-1.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                Export CSV →
              </button>
            </div>

            {filteredMovements.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 py-8 text-center">No movements recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
                      {['Date', 'Object', 'Location', 'Move Type', 'Expected Return', 'Moved By'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {filteredMovements.map(m => {
                      const isOverdue = m.expected_return_date && m.expected_return_date < today
                      return (
                        <tr key={m.id} className={`hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${isOverdue ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}`}>
                          <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400 whitespace-nowrap">
                            {m.moved_at ? new Date(m.moved_at).toLocaleDateString('en-GB') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => router.push(`/dashboard/objects/${m.object_id}?tab=location`)}
                              className="flex items-center gap-2 text-left hover:underline">
                              <span>{m.objects?.emoji || '📦'}</span>
                              <span className="text-stone-900 dark:text-stone-100 font-medium">{m.objects?.title || '—'}</span>
                              {m.objects?.accession_no && <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{m.objects.accession_no}</span>}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-stone-700 dark:text-stone-300">
                            {m.locations?.name || '—'}
                            {m.locations?.location_code && <span className="ml-1 text-xs font-mono text-stone-400 dark:text-stone-500">({m.locations.location_code})</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                              m.move_type === 'Temporary' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                              m.move_type === 'Return' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                              'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                            }`}>
                              {m.move_type || 'Permanent'}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-xs font-mono whitespace-nowrap ${isOverdue ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-stone-500 dark:text-stone-400'}`}>
                            {m.expected_return_date ? fmt(m.expected_return_date) : '—'}
                            {isOverdue && <span className="ml-1">⚠</span>}
                          </td>
                          <td className="px-4 py-3 text-stone-500 dark:text-stone-400 text-xs">{m.moved_by || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'current' && (
          <div className="space-y-4">
            {byLocation.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 py-8 text-center">No objects with location data yet.</p>
            ) : (
              byLocation.map(([location, objs]) => (
                <div key={location} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
                    <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{location}</div>
                    <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{objs.length} {objs.length === 1 ? 'object' : 'objects'}</div>
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {objs.map((obj: any) => (
                      <button key={obj.id} onClick={() => router.push(`/dashboard/objects/${obj.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <span>{obj.emoji || '📦'}</span>
                        <span className="text-sm text-stone-900 dark:text-stone-100 flex-1">{obj.title}</span>
                        {obj.accession_no && <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{obj.accession_no}</span>}
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                          obj.status === 'On Display' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          obj.status === 'On Loan' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                          'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                        }`}>{obj.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
