'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

export default function LoansPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Out' | 'In' | 'Overdue'>('All')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: loans } = await supabase
        .from('loans')
        .select('*, artifacts(title, accession_no, emoji)')
        .eq('museum_id', museum.id)
        .order('loan_end_date', { ascending: true, nullsFirst: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setLoans(loans || [])
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
        <Sidebar museum={museum} activePath="/dashboard/loans" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />
        <main className="ml-56 flex-1 flex flex-col">
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Loans Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Loans Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track incoming and outgoing loans with full audit trails. Available on Professional, Institution, and Enterprise plans.</p>
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

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = (l: any) => l.status === 'Active' && l.loan_end_date && l.loan_end_date < today

  const active = loans.filter(l => l.status === 'Active')
  const activeOut = active.filter(l => l.direction === 'Out')
  const activeIn = active.filter(l => l.direction === 'In')
  const overdue = active.filter(isOverdue)
  const returnedThisYear = loans.filter(l => l.status === 'Returned' && l.loan_end_date?.startsWith(new Date().getFullYear().toString()))

  const filtered = loans.filter(l => {
    if (filter === 'Out') return l.direction === 'Out' && l.status === 'Active'
    if (filter === 'In') return l.direction === 'In' && l.status === 'Active'
    if (filter === 'Overdue') return isOverdue(l)
    return true
  })

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/loans" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Loans Register</span>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Active Loans Out', value: activeOut.length },
              { label: 'Active Loans In', value: activeIn.length },
              { label: 'Overdue', value: overdue.length },
              { label: 'Returned This Year', value: returnedThisYear.length },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${s.label === 'Overdue' && s.value > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['All', 'Out', 'In', 'Overdue'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-xs font-mono border transition-all ${filter === f ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                {f === 'All' ? 'All Loans' : f === 'Out' ? 'Loans Out' : f === 'In' ? 'Loans In' : 'Overdue'}
              </button>
            ))}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">⇄</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No loans recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Open an object and go to the Loans tab to record a loan.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Institution</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Direction</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Start</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Return</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => {
                    const overdueLoan = isOverdue(l)
                    return (
                      <tr key={l.id} className={`border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 ${overdueLoan ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{l.artifacts?.emoji}</div>
                            <div>
                              <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{l.artifacts?.title}</div>
                              <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{l.artifacts?.accession_no}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-700 dark:text-stone-300">{l.borrowing_institution}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">Loan {l.direction}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                          {l.loan_start_date ? new Date(l.loan_start_date).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {l.loan_end_date ? (
                            <span className={overdueLoan ? 'text-amber-600 font-medium' : 'text-stone-500 dark:text-stone-400'}>
                              {new Date(l.loan_end_date).toLocaleDateString('en-GB')}
                              {overdueLoan && ' ⚠'}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                            l.status === 'Active' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                            l.status === 'Returned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                            'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                          }`}>{l.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => router.push(`/dashboard/artifacts/${l.artifact_id}?tab=loans`)}
                            className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
