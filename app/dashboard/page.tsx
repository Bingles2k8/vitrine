'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const STATUS_STYLES: Record<string, string> = {
  'Entry':         'bg-blue-50 text-blue-600',
  'On Display':    'bg-emerald-50 text-emerald-700',
  'Storage':       'bg-stone-100 text-stone-500',
  'On Loan':       'bg-amber-50 text-amber-700',
  'Restoration':   'bg-red-50 text-red-600',
  'Deaccessioned': 'bg-stone-200 text-stone-400',
}

export default function Dashboard() {
  const [museum, setMuseum] = useState<any>(null)
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: museum } = await supabase
        .from('museums')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!museum) { router.push('/onboarding'); return }

      const [{ data: artifacts }, { data: activeLoans }] = await Promise.all([
        supabase.from('artifacts').select('*').eq('museum_id', museum.id).order('created_at', { ascending: false }),
        supabase.from('loans').select('*').eq('museum_id', museum.id).eq('status', 'Active'),
      ])

      setMuseum(museum)
      setArtifacts(artifacts || [])
      setLoans(activeLoans || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="font-mono text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  const statusCount = (s: string) => artifacts.filter(a => a.status === s).length

  const today = new Date().toISOString().slice(0, 10)
  const loanByArtifact: Record<string, any> = Object.fromEntries(loans.map(l => [l.artifact_id, l]))
  const overdueDays = (loan: any) => loan?.loan_end_date && loan.loan_end_date < today
    ? Math.floor((new Date(today).getTime() - new Date(loan.loan_end_date).getTime()) / 86400000)
    : 0

  // null = show all; a status string = show only that status
  const CARDS = [
    { label: 'Total Objects', filterKey: null,           value: artifacts.length,             sub: artifacts.length === 0 ? 'Add your first item' : `${artifacts.length} in collection` },
    { label: 'On Display',    filterKey: 'On Display',   value: statusCount('On Display'),    sub: artifacts.length ? `${Math.round(statusCount('On Display')/artifacts.length*100)}% of collection` : '—' },
    { label: 'On Loan',       filterKey: 'On Loan',      value: statusCount('On Loan'),       sub: '—' },
    { label: 'In Restoration',filterKey: 'Restoration',  value: statusCount('Restoration'),   sub: '—' },
    { label: 'Deaccessioned', filterKey: 'Deaccessioned',value: statusCount('Deaccessioned'), sub: '—' },
  ]

  const visibleArtifacts = filter ? artifacts.filter(a => a.status === filter) : artifacts

  return (
    <div className="min-h-screen bg-stone-50 flex">

      <Sidebar museum={museum} activePath="/dashboard" onSignOut={handleSignOut} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900">Collection</span>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-5 gap-4 mb-8">
            {CARDS.map(card => {
              const active = filter === card.filterKey
              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => setFilter(card.filterKey)}
                  className={`text-left rounded-lg p-5 border transition-all ${
                    active
                      ? 'bg-stone-900 border-stone-900'
                      : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-sm'
                  }`}
                >
                  <div className={`text-xs uppercase tracking-widest mb-2 ${active ? 'text-stone-400' : 'text-stone-400'}`}>{card.label}</div>
                  <div className={`font-serif text-4xl ${active ? 'text-white' : 'text-stone-900'}`}>{card.value}</div>
                  <div className={`text-xs mt-1 ${active ? 'text-stone-400' : 'text-stone-400'}`}>{card.sub}</div>
                </button>
              )
            })}
          </div>

          {artifacts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🏛️</div>
              <div className="font-serif text-2xl italic text-stone-900 mb-2">Your collection is empty</div>
              <p className="text-sm text-stone-400 mb-6">Log an object in the Entry Register to begin.</p>
              <button
                onClick={() => router.push('/dashboard/entry')}
                className="bg-stone-900 text-white text-xs font-mono px-5 py-2.5 rounded"
              >
                + New Entry Record
              </button>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              {filter && (
                <div className="px-6 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                  <span className="text-xs font-mono text-stone-500">
                    Showing {visibleArtifacts.length} {visibleArtifacts.length === 1 ? 'object' : 'objects'} — {filter}
                  </span>
                  <button
                    onClick={() => setFilter(null)}
                    className="text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    Show all objects ×
                  </button>
                </div>
              )}
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Year</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Medium</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleArtifacts.map(a => (
                    <tr
                      key={a.id}
                      className={`border-b border-stone-100 hover:bg-stone-50 cursor-pointer ${a.status === 'Deaccessioned' ? 'opacity-50' : ''}`}
                      onClick={() => router.push(`/dashboard/artifacts/${a.id}`)}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-stone-100 flex items-center justify-center text-lg">{a.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900">{a.title}</div>
                            <div className="text-xs text-stone-400">{a.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500">{a.year}</td>
                      <td className="px-4 py-3 text-xs text-stone-500">{a.medium}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const loan = loanByArtifact[a.id]
                          const days = a.status === 'On Loan' ? overdueDays(loan) : 0
                          if (days > 0) {
                            return (
                              <div className="relative group/tt inline-block">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); router.push('/dashboard/loans') }}
                                  className="text-xs font-mono px-2 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                  Loan Overdue
                                </button>
                                <div className="absolute bottom-full left-0 mb-2 w-60 p-3 bg-stone-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tt:opacity-100 group-hover/tt:visible transition-all z-50 pointer-events-none">
                                  <div className="font-medium text-red-400 mb-1">Loan overdue</div>
                                  <div className="text-stone-300">Expected: {new Date(loan.loan_end_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                  <div className="text-stone-300">{days} day{days !== 1 ? 's' : ''} overdue</div>
                                  <div className="text-stone-500 mt-2">Click to view loan details →</div>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <span className={`text-xs font-mono px-2 py-1 rounded-full ${STATUS_STYLES[a.status] || 'bg-stone-100 text-stone-500'}`}>
                              {a.status}
                            </span>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                  {visibleArtifacts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-stone-400">
                        No objects with status "{filter}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
