'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getMuseumForUser } from '@/lib/get-museum'

const ACQ_METHODS = ['Purchase', 'Gift', 'Bequest', 'Transfer', 'Found', 'Fieldwork', 'Exchange', 'Unknown']

export default function AccessionRegisterPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
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
        .select('id, title, accession_no, acquisition_date, acquisition_method, acquisition_source, acquisition_authorised_by, accession_register_confirmed, emoji, status')
        .eq('museum_id', museum.id)
        .not('accession_no', 'is', null)
        .order('acquisition_date', { ascending: true, nullsFirst: false })
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

  async function toggleConfirmed(id: string, current: boolean) {
    await supabase.from('artifacts').update({ accession_register_confirmed: !current }).eq('id', id)
    setArtifacts(prev => prev.map(a => a.id === id ? { ...a, accession_register_confirmed: !current } : a))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <p className="font-mono text-sm text-stone-400 dark:text-stone-500">Loading…</p>
    </div>
  )

  const years = Array.from(new Set(
    artifacts.map(a => a.acquisition_date?.slice(0, 4)).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a))

  const filtered = artifacts.filter(a => {
    const matchYear = !yearFilter || a.acquisition_date?.startsWith(yearFilter)
    const matchMethod = methodFilter === 'All' || a.acquisition_method === methodFilter
    return matchYear && matchMethod
  })

  const confirmed = artifacts.filter(a => a.accession_register_confirmed).length

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/register" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Accession Register</span>
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">{confirmed} of {artifacts.length} register entries confirmed</span>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Total Accessions</div>
              <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{artifacts.length}</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Register Confirmed</div>
              <div className={`font-serif text-4xl ${confirmed < artifacts.length ? 'text-amber-600' : 'text-emerald-700'}`}>{confirmed}</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Unconfirmed</div>
              <div className={`font-serif text-4xl ${artifacts.length - confirmed > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{artifacts.length - confirmed}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 items-center">
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
              className="border border-stone-200 dark:border-stone-700 rounded px-3 py-1.5 text-xs font-mono bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 outline-none focus:border-stone-900 dark:focus:border-stone-400">
              <option value="">All years</option>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
            <div className="flex items-center gap-1">
              {['All', ...ACQ_METHODS].map(m => (
                <button key={m} onClick={() => setMethodFilter(m)}
                  className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${methodFilter === m ? 'bg-stone-900 text-white border-stone-900 dark:bg-white dark:text-stone-900 dark:border-white' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
                  {m}
                </button>
              ))}
            </div>
            {(yearFilter || methodFilter !== 'All') && (
              <button onClick={() => { setYearFilter(''); setMethodFilter('All') }} className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 underline underline-offset-2">
                Clear filters
              </button>
            )}
            <span className="ml-auto text-xs font-mono text-stone-400 dark:text-stone-500">{filtered.length} accession{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Register table */}
          {artifacts.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📋</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No accession numbers assigned</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Assign accession numbers to objects in the collection to populate the register.</p>
              <button onClick={() => router.push('/dashboard')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded">
                Go to Collection →
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Accession No.</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Acquisition Date</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Method</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Source</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Authorised By</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Register ✓</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                      onClick={() => router.push(`/dashboard/artifacts/${a.id}?tab=acquisition`)}>
                      <td className="px-6 py-3 text-xs font-mono text-stone-600 dark:text-stone-400">{a.accession_no}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{a.emoji}</span>
                          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">{a.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {a.acquisition_date ? new Date(a.acquisition_date + 'T00:00:00').toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{a.acquisition_method || '—'}</td>
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{a.acquisition_source || '—'}</td>
                      <td className="px-4 py-3 text-xs text-stone-600 dark:text-stone-400">{a.acquisition_authorised_by || '—'}</td>
                      <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                        <button
                          onClick={() => toggleConfirmed(a.id, a.accession_register_confirmed)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            a.accession_register_confirmed
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-stone-300 dark:border-stone-600 hover:border-stone-600 dark:hover:border-stone-400'
                          }`}
                          title={a.accession_register_confirmed ? 'Mark as unconfirmed' : 'Mark as confirmed'}
                        >
                          {a.accession_register_confirmed && (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-stone-400 dark:text-stone-500 font-mono">
            Spectrum 5.1 — Procedure 2: Acquisition & Accessioning. Each row that has been formally entered into your accession register should be marked confirmed. Click any row to open the acquisition record.
          </p>
        </div>
      </main>
    </div>
  )
}
