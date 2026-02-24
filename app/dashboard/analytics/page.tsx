'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getPlan } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'

interface Artifact {
  id: string
  title: string
  artist: string
  medium: string
  culture: string
  status: string
  emoji: string
  created_at: string
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

export default function AnalyticsPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: artifacts } = await supabase.from('artifacts').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setArtifacts(artifacts || [])
      setLoading(false)
    }
    load()
  }, [])

  const byStatus = useMemo(() => {
    const order = ['Entry', 'On Display', 'Storage', 'On Loan', 'Restoration', 'Deaccessioned']
    const counts: Record<string, number> = {}
    artifacts.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return order.filter(s => counts[s]).map(s => [s, counts[s]] as [string, number])
  }, [artifacts])

  const byMedium = useMemo(() => {
    const counts: Record<string, number> = {}
    artifacts.forEach(a => { if (a.medium) counts[a.medium] = (counts[a.medium] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [artifacts])

  const byCulture = useMemo(() => {
    const counts: Record<string, number> = {}
    artifacts.forEach(a => { if (a.culture) counts[a.culture] = (counts[a.culture] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [artifacts])

  const byMonth = useMemo(() => {
    const counts: Record<string, number> = {}
    artifacts.forEach(a => {
      const month = a.created_at?.slice(0, 7)
      if (month) counts[month] = (counts[month] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [artifacts])

  function formatMonth(ym: string) {
    const [y, m] = ym.split('-')
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1]} ${y.slice(2)}`
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  if (!getPlan(museum?.plan).analytics) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
        <Sidebar museum={museum} activePath="/dashboard/analytics" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />
        <main className="ml-56 flex-1 flex flex-col">
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Analytics</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◈</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Analytics is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Understand your collection with status breakdowns, acquisition trends, medium analysis, and more. Available on Professional, Institution, and Enterprise plans.</p>
              <button
                onClick={() => router.push('/dashboard/plan')}
                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
              >
                View plans →
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const maxMonth = Math.max(...byMonth.map(([, v]) => v), 1)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/analytics" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Analytics</span>
          <a href="/api/export/artifacts" download
            className="text-xs font-mono px-3 py-1.5 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
            Export CSV ↓
          </a>
        </div>

        {artifacts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-5xl mb-4">📊</div>
            <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No data yet</div>
            <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Add objects to your collection to see analytics.</p>
            <button onClick={() => router.push('/dashboard/artifacts/new')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded">+ Add your first object</button>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Objects', value: artifacts.length },
                { label: 'On Display', value: artifacts.filter(a => a.status === 'On Display').length },
                { label: 'Mediums', value: new Set(artifacts.map(a => a.medium).filter(Boolean)).size },
                { label: 'Cultures', value: new Set(artifacts.map(a => a.culture).filter(Boolean)).size },
              ].map(s => (
                <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                  <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                  <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-5">Collection Status</div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                {byStatus.map(([label, value]) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[label] || '#a8a29e' }} />
                    <div className="flex-1 text-xs text-stone-500 dark:text-stone-400">{label}</div>
                    <div className="flex-1 bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((value / artifacts.length) * 100)}%`, background: STATUS_COLORS[label] || '#a8a29e' }} />
                    </div>
                    <div className="text-xs font-mono text-stone-400 dark:text-stone-500 w-12 text-right flex-shrink-0">
                      {value} <span className="text-stone-300 dark:text-stone-600">({Math.round((value / artifacts.length) * 100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <BreakdownCard title="By Medium" data={byMedium} color="#1c1917" />
              <BreakdownCard title="By Culture / Origin" data={byCulture} color="#92400e" />
            </div>

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

            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Recently Added</div>
              </div>
              <table className="w-full">
                <tbody>
                  {artifacts.slice(0, 5).map(a => (
                    <tr key={a.id} className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer" onClick={() => router.push(`/dashboard/artifacts/${a.id}`)}>
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
      </main>
    </div>
  )
}
