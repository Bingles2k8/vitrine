'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'

export default function ConservationPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [treatments, setTreatments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All')
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
      const { data: treatments } = await supabase
        .from('conservation_treatments')
        .select('*, objects(title, accession_no, emoji, status)')
        .eq('museum_id', museum.id)
        .order('start_date', { ascending: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setTreatments(treatments || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/conservation" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/conservation" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Conservation</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Conservation is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track conservation treatments and condition assessments. Available on Professional, Institution, and Enterprise plans.</p>
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

  const thisYear = new Date().getFullYear().toString()
  const active = treatments.filter(t => t.status === 'Active')
  const completedThisYear = treatments.filter(t => t.status === 'Completed' && t.end_date?.startsWith(thisYear))
  const inRestoration = treatments.filter(t => t.status === 'Active' && t.objects?.status === 'Restoration')

  const q = searchQuery.trim().toLowerCase()
  const filtered = treatments.filter(t => {
    if (filter !== 'All' && t.status !== filter) return false
    if (!q) return true
    return (
      t.objects?.title?.toLowerCase().includes(q) ||
      t.objects?.accession_no?.toLowerCase().includes(q)
    )
  })

  return (
    <DashboardShell museum={museum} activePath="/dashboard/conservation" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Conservation Register</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Active Treatments', value: active.length },
              { label: 'Completed This Year', value: completedThisYear.length },
              { label: 'In Restoration Status', value: inRestoration.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'Active', 'Completed', 'Cancelled'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Treatments' : f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by object name or accession number…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⚗</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No conservation treatments recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Open an object and go to the Conservation tab to record a treatment.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Treatment Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Conservator</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Start</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">End</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} onClick={() => router.push(`/dashboard/objects/${t.object_id}?tab=conservation`)}
                      className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{t.objects?.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t.objects?.title}</div>
                            <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{t.objects?.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{t.treatment_type}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{t.conservator || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {t.start_date ? new Date(t.start_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {t.end_date ? new Date(t.end_date).toLocaleDateString('en-GB') : <span className="text-amber-600">Ongoing</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                          t.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                          'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                        }`}>{t.status}</span>
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
