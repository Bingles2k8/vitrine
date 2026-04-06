'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { CardGridSkeleton } from '@/components/Skeleton'

interface ObjectItem {
  id: string
  title: string
  artist: string
  medium: string
  status: string
  emoji: string
  created_at: string
  acquisition_value: number | null
  insured_value: number | null
}

const STATUS_STYLES: Record<string, string> = {
  'Entry':         'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  'On Display':    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  'Storage':       'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  'On Loan':       'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  'Restoration':   'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  'Deaccessioned': 'bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-500',
}

const STATUS_COLORS: Record<string, string> = {
  'Entry':         '#2563eb',
  'On Display':    '#059669',
  'Storage':       '#a8a29e',
  'On Loan':       '#d97706',
  'Restoration':   '#dc2626',
  'Deaccessioned': '#78716c',
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-stone-500 dark:text-stone-400 truncate flex-shrink-0">{label}</div>
      <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="w-6 text-xs font-mono text-stone-400 dark:text-stone-500 text-right flex-shrink-0">{value}</div>
    </div>
  )
}

function BreakdownCard({ title, data, color }: { title: string; data: [string, number][]; color: string }) {
  const max = data[0]?.[1] ?? 0
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
      <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-5">{title}</div>
      {data.length === 0 ? (
        <p className="text-xs text-stone-300 dark:text-stone-600 font-mono">No data yet</p>
      ) : (
        <div className="space-y-3">
          {data.map(([label, value]) => (
            <Bar key={label} label={label || '—'} value={value} max={max} color={color} />
          ))}
        </div>
      )}
    </div>
  )
}

const ALL_STATUSES = ['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration', 'Deaccessioned']

function ExportModal({ onClose }: { onClose: () => void }) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [medium, setMedium] = useState('')
  const [acquiredFrom, setAcquiredFrom] = useState('')
  const [acquiredTo, setAcquiredTo] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)

  function toggleStatus(s: string) {
    setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function buildUrl() {
    const params = new URLSearchParams()
    if (selectedStatuses.length > 0) params.set('status', selectedStatuses.join(','))
    if (medium.trim()) params.set('medium', medium.trim())
    if (acquiredFrom) params.set('acquired_from', acquiredFrom)
    if (acquiredTo) params.set('acquired_to', acquiredTo)
    if (includeDeleted) params.set('include_deleted', 'true')
    const qs = params.toString()
    return `/api/export/objects${qs ? '?' + qs : ''}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Export Collection</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xl leading-none">×</button>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Filter by Status</div>
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">Leave all unchecked to export every status.</p>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map(s => (
              <button key={s} type="button" onClick={() => toggleStatus(s)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${selectedStatuses.includes(s) ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Medium (partial match)</label>
          <input value={medium} onChange={e => setMedium(e.target.value)} placeholder="e.g. Oil, Watercolour"
            className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Acquired from</label>
            <input type="date" value={acquiredFrom} onChange={e => setAcquiredFrom(e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1.5">Acquired to</label>
            <input type="date" value={acquiredTo} onChange={e => setAcquiredTo(e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 rounded px-3 py-2 text-sm text-stone-900 dark:text-stone-100 outline-none focus:border-stone-900 dark:focus:border-stone-400 transition-colors bg-white dark:bg-stone-950" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={includeDeleted} onChange={e => setIncludeDeleted(e.target.checked)}
            className="rounded border-stone-300 dark:border-stone-600 accent-stone-900 dark:accent-white" />
          <span className="text-xs text-stone-500 dark:text-stone-400">Include deleted / binned objects</span>
        </label>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-xs font-mono px-4 py-2.5 rounded hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Cancel
          </button>
          <a href={buildUrl()} download onClick={onClose}
            className="flex-1 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-4 py-2.5 rounded text-center hover:bg-stone-700 dark:hover:bg-stone-100 transition-colors">
            Download CSV ↓
          </a>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [objects, setObjects] = useState<ObjectItem[]>([])
  const [trashedCount, setTrashedCount] = useState(0)
  const [pageViews, setPageViews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showExport, setShowExport] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const [{ data: objects }, { data: views }, { count: trashed }] = await Promise.all([
        supabase.from('objects').select('id, title, artist, medium, status, emoji, created_at, acquisition_value, insured_value').eq('museum_id', museum.id).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('page_views').select('page_type, object_id, viewed_at').eq('museum_id', museum.id).gte('viewed_at', thirtyDaysAgo).order('viewed_at', { ascending: false }),
        supabase.from('objects').select('id', { count: 'exact', head: true }).eq('museum_id', museum.id).not('deleted_at', 'is', null),
      ])
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setObjects(objects || [])
      setTrashedCount(trashed ?? 0)
      setPageViews(views || [])
      setLoading(false)
    }
    load()
  }, [])

  const byStatus = useMemo(() => {
    const order = ['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration', 'Deaccessioned']
    const counts: Record<string, number> = {}
    objects.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return order.filter(s => counts[s]).map(s => [s, counts[s]] as [string, number])
  }, [objects])

  const byMonth = useMemo(() => {
    const counts: Record<string, number> = {}
    objects.forEach(a => {
      const month = a.created_at?.slice(0, 7)
      if (month) counts[month] = (counts[month] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [objects])

  const byArtist = useMemo(() => {
    const counts: Record<string, number> = {}
    objects.forEach(a => { if (a.artist) counts[a.artist] = (counts[a.artist] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [objects])

  const totalValue = useMemo(() => objects.reduce((sum, a) => sum + (a.insured_value ?? 0), 0), [objects])
  const totalCost = useMemo(() => objects.reduce((sum, a) => sum + (a.acquisition_value ?? 0), 0), [objects])

  const topByValue = useMemo(() => {
    return [...objects]
      .filter(a => a.insured_value != null && a.insured_value > 0)
      .sort((a, b) => (b.insured_value ?? 0) - (a.insured_value ?? 0))
      .slice(0, 5)
  }, [objects])

  function formatMonth(ym: string) {
    const [y, m] = ym.split('-')
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]} ${y.slice(2)}`
  }

  // Visitor analytics computed values
  const viewsByDay = useMemo(() => {
    const counts: Record<string, number> = {}
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      counts[d.toISOString().slice(0, 10)] = 0
    }
    pageViews.forEach(v => {
      const day = v.viewed_at.slice(0, 10)
      if (day in counts) counts[day] = (counts[day] || 0) + 1
    })
    return Object.entries(counts)
  }, [pageViews])

  const topObjects = useMemo(() => {
    const counts: Record<string, number> = {}
    pageViews.filter(v => v.object_id).forEach(v => { counts[v.object_id] = (counts[v.object_id] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({
      object: objects.find(a => a.id === id),
      count,
    })).filter(x => x.object)
  }, [pageViews, objects])

  const pageTypeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    pageViews.forEach(v => { counts[v.page_type] = (counts[v.page_type] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [pageViews])

  const maxDayViews = Math.max(...viewsByDay.map(([, v]) => v), 1)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/analytics" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <CardGridSkeleton cards={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).analytics) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/analytics" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Analytics</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◈</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Analytics is a paid feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Understand your collection with value tracking, status breakdowns, acquisition trends, and more. Available from £5/mo on the Hobbyist plan.</p>
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

  const maxMonth = Math.max(...byMonth.map(([, v]) => v), 1)
  const plan = getPlan(museum?.plan)
  const hasVisitorAnalytics = plan.visitorAnalytics  // Professional+
  const hasExport = plan.visitorAnalytics            // Professional+

  return (
    <DashboardShell museum={museum} activePath="/dashboard/analytics" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Analytics</span>
          {hasExport && (
            <button onClick={() => setShowExport(true)}
              className="text-xs font-mono px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
              Export CSV ↓
            </button>
          )}
        </div>

        {objects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-5xl mb-4">📊</div>
            <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No data yet</div>
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Add objects to your collection to see analytics.</p>
            <button onClick={() => router.push('/dashboard/objects/new')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded">+ Add your first object</button>
          </div>
        ) : (
          <div className="p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Total Objects</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{objects.length + trashedCount}</div>
              </div>
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Collection Value</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">
                  {totalValue > 0 ? `£${totalValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—'}
                </div>
              </div>
            </div>

            {(totalValue > 0 || totalCost > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Collection Value', value: totalValue },
                  { label: 'Acquisition Cost', value: totalCost },
                  { label: totalValue >= totalCost ? 'Total Gain' : 'Total Loss', value: Math.abs(totalValue - totalCost), gain: totalValue >= totalCost },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                    <div className={`font-serif text-4xl ${s.gain === false ? 'text-red-500 dark:text-red-400' : s.gain === true ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'}`}>
                      £{s.value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-5">Collection Status</div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                {byStatus.map(([label, value]) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[label] || '#a8a29e' }} />
                    <div className="flex-1 text-xs text-stone-500 dark:text-stone-400">{label}</div>
                    <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((value / objects.length) * 100)}%`, background: STATUS_COLORS[label] || '#a8a29e' }} />
                    </div>
                    <div className="text-xs font-mono text-stone-400 dark:text-stone-500 w-12 text-right flex-shrink-0">
                      {value} <span className="text-stone-300 dark:text-stone-600">({Math.round((value / objects.length) * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {byArtist.length > 0 && (
              <BreakdownCard title="By Artist / Maker" data={byArtist} color="#4338ca" />
            )}

            {topByValue.length > 0 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-5">Top Objects by Value</div>
                <div className="space-y-3">
                  {topByValue.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity" onClick={() => router.push(`/dashboard/objects/${a.id}`)}>
                      <div className="w-5 text-xs font-mono text-stone-300 dark:text-stone-600 text-right flex-shrink-0">{i + 1}</div>
                      <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base flex-shrink-0">{a.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-stone-900 dark:text-stone-100 truncate">{a.title}</div>
                        {a.artist && <div className="text-xs text-stone-400 dark:text-stone-500 truncate">{a.artist}</div>}
                      </div>
                      <div className="text-sm font-mono text-stone-700 dark:text-stone-300 flex-shrink-0">
                        £{(a.insured_value ?? 0).toLocaleString('en-GB')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {byMonth.length > 1 && (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-5">Items Added by Month</div>
                <div className="flex items-end gap-3 h-28">
                  {byMonth.map(([month, count]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{count}</div>
                      <div className="w-full rounded-t bg-stone-900 dark:bg-stone-100" style={{ height: `${Math.round((count / maxMonth) * 72)}px`, minHeight: '4px' }} />
                      <div className="text-xs font-mono text-stone-400 dark:text-stone-500 whitespace-nowrap">{formatMonth(month)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visitor analytics — Professional+ only */}
            {hasVisitorAnalytics && <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">Public Site Visitors</div>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-5">Last 30 days. New visits start tracking once this section is live.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Views', value: pageViews.length },
                  { label: 'Today', value: viewsByDay.find(([d]) => d === new Date().toISOString().slice(0, 10))?.[1] ?? 0 },
                  { label: 'Object Views', value: pageViews.filter(v => v.page_type === 'object').length },
                  { label: 'Page Types', value: pageTypeBreakdown.length },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">{s.label}</div>
                    <div className="font-serif text-3xl text-stone-900 dark:text-stone-100">{s.value}</div>
                  </div>
                ))}
              </div>

              {pageViews.length === 0 ? (
                <p className="text-xs text-stone-300 dark:text-stone-600 font-mono">No visitor data yet — views start tracking once your public site is visited.</p>
              ) : (
                <>
                  {/* Views per day chart */}
                  <div className="mb-6">
                    <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mb-3">Views per day (last 14 days)</div>
                    <div className="flex items-end gap-1 h-16">
                      {viewsByDay.map(([day, count]) => (
                        <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${count} views`}>
                          <div className="w-full rounded-t bg-stone-900 dark:bg-stone-100" style={{ height: `${Math.round((count / maxDayViews) * 48)}px`, minHeight: count > 0 ? '3px' : '0' }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{viewsByDay[0]?.[0]?.slice(5)}</span>
                      <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{viewsByDay[viewsByDay.length - 1]?.[0]?.slice(5)}</span>
                    </div>
                  </div>

                  {/* Top objects + page types */}
                  <div className="grid grid-cols-2 gap-6">
                    {topObjects.length > 0 && (
                      <div>
                        <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mb-3">Top objects</div>
                        <div className="space-y-2">
                          {topObjects.map(({ object, count }) => object && (
                            <div key={object.id} className="flex items-center gap-2">
                              <span className="text-base">{object.emoji}</span>
                              <span className="flex-1 text-xs text-stone-600 dark:text-stone-400 truncate">{object.title}</span>
                              <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pageTypeBreakdown.length > 0 && (
                      <div>
                        <div className="text-xs font-mono text-stone-400 dark:text-stone-500 mb-3">By page type</div>
                        <div className="space-y-2">
                          {pageTypeBreakdown.map(([type, count]) => (
                            <div key={type} className="flex items-center gap-2">
                              <span className="flex-1 text-xs text-stone-600 dark:text-stone-400 capitalize">{type}</span>
                              <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>}

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Recently Added</div>
              </div>
              <table className="w-full">
                <tbody>
                  {objects.slice(0, 5).map(a => (
                    <tr key={a.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer" onClick={() => router.push(`/dashboard/objects/${a.id}`)}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base flex-shrink-0">{a.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{a.title}</div>
                            <div className="text-xs text-stone-400 dark:text-stone-500">{a.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 dark:text-stone-500">{a.medium}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[a.status] || 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'}`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-300 dark:text-stone-600 text-right pr-6">
                        {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </DashboardShell>
  )
}
