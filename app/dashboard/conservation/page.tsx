'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

export default function ConservationPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [treatments, setTreatments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Active' | 'Completed' | 'Cancelled'>('All')
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
        .select('*, artifacts(title, accession_no, emoji, status)')
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

  async function updateStatus(id: string, status: string) {
    await supabase.from('conservation_treatments').update({ status }).eq('id', id)
    setTreatments(t => t.map(tr => tr.id === id ? { ...tr, status } : tr))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  const thisYear = new Date().getFullYear().toString()
  const active = treatments.filter(t => t.status === 'Active')
  const completedThisYear = treatments.filter(t => t.status === 'Completed' && t.end_date?.startsWith(thisYear))
  const inRestoration = treatments.filter(t => t.status === 'Active' && t.artifacts?.status === 'Restoration')

  const filtered = treatments.filter(t => filter === 'All' || t.status === filter)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/conservation" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Conservation Register</span>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
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
          <div className="flex gap-2">
            {(['All', 'Active', 'Completed', 'Cancelled'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Treatments' : f}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⚗</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No conservation treatments recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Open an object and go to the Conservation tab to record a treatment.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Treatment Type</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Conservator</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Start</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">End</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{t.artifacts?.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{t.artifacts?.title}</div>
                            <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{t.artifacts?.accession_no}</div>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          {t.status === 'Active' && (
                            <>
                              <button onClick={() => updateStatus(t.id, 'Completed')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-emerald-700 transition-colors">Complete</button>
                              <button onClick={() => updateStatus(t.id, 'Cancelled')} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors">Cancel</button>
                            </>
                          )}
                          <button onClick={() => router.push(`/dashboard/artifacts/${t.artifact_id}?tab=conservation`)} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">View →</button>
                        </div>
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
