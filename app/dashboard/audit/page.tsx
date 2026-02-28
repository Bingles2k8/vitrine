'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

export default function AuditPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<any[]>([])
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
      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('id, title, accession_no, emoji, status, current_location, last_inventoried, inventoried_by')
        .eq('museum_id', museum.id)
        .order('last_inventoried', { ascending: true, nullsFirst: true })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setArtifacts(artifacts || [])
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

  if (!getPlan(museum?.plan).compliance) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
        <Sidebar museum={museum} activePath="/dashboard/audit" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />
        <main className="ml-56 flex-1 flex flex-col">
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Audit &amp; Inventory</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Audit &amp; Inventory is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Run collection audits and track inventory checks. Available on Professional, Institution, and Enterprise plans.</p>
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

  const today = new Date()
  const oneYearAgo = new Date(today); oneYearAgo.setFullYear(today.getFullYear() - 1)
  const oneYearAgoStr = oneYearAgo.toISOString().slice(0, 10)
  const thisYearStr = today.getFullYear().toString()

  const neverInventoried = artifacts.filter(a => !a.last_inventoried)
  const inventoriedThisYear = artifacts.filter(a => a.last_inventoried?.startsWith(thisYearStr))
  const overdue = artifacts.filter(a => a.last_inventoried && a.last_inventoried < oneYearAgoStr)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/audit" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Audit & Inventory</span>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Never Inventoried', value: neverInventoried.length, warn: neverInventoried.length > 0 },
              { label: 'Inventoried This Year', value: inventoriedThisYear.length, warn: false },
              { label: 'Overdue (> 12 months)', value: overdue.length, warn: overdue.length > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.warn && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500">Objects sorted by last inventoried date — never-inventoried items appear first. Best practice recommends annual inventory checks. Click any row to record an audit.</p>

          {/* Table */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Location</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Last Inventoried</th>
                  <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map(a => {
                  const isNever = !a.last_inventoried
                  const isOld = a.last_inventoried && a.last_inventoried < oneYearAgoStr

                  return (
                    <tr key={a.id} onClick={() => router.push(`/dashboard/artifacts/${a.id}?tab=audit`)}
                      className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer ${isNever || isOld ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{a.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{a.title}</div>
                            <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{a.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-stone-500 dark:text-stone-400">{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{a.current_location || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {isNever ? (
                          <span className="text-amber-600">Never</span>
                        ) : isOld ? (
                          <span className="text-amber-600">{new Date(a.last_inventoried).toLocaleDateString('en-GB')} ⚠</span>
                        ) : (
                          <span className="text-stone-500 dark:text-stone-400">{new Date(a.last_inventoried).toLocaleDateString('en-GB')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{a.inventoried_by || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
