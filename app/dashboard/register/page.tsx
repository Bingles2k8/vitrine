'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'
import { TableSkeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'

const ACQ_METHODS = ['Purchase', 'Gift', 'Bequest', 'Transfer', 'Found', 'Fieldwork', 'Exchange', 'Unknown']

export default function AccessionRegisterPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [specificSearch, setSpecificSearch] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      const { data: objects } = await supabase
        .from('objects')
        .select('id, title, accession_no, acquisition_date, acquisition_method, acquisition_source, acquisition_authorised_by, accession_register_confirmed, emoji, status, description, medium, physical_materials, artist, maker_name')
        .eq('museum_id', museum.id)
        .is('deleted_at', null)
        .not('accession_no', 'is', null)
        .order('acquisition_date', { ascending: true, nullsFirst: false })
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setObjects(objects || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function toggleConfirmed(id: string, current: boolean, object: any) {
    if (!current) {
      const missing = []
      if (!object.acquisition_date) missing.push('Acquisition Date')
      if (!object.acquisition_method) missing.push('Acquisition Method')
      if (!object.acquisition_source) missing.push('Source')
      if (!object.acquisition_authorised_by) missing.push('Authorised By')
      if (missing.length > 0) {
        toast(`Missing fields: ${missing.join(', ')}. Complete the acquisition record before confirming.`, 'error')
        return
      }
    }
    await supabase.from('objects').update({ accession_register_confirmed: !current }).eq('id', id)
    setObjects(prev => prev.map(a => a.id === id ? { ...a, accession_register_confirmed: !current } : a))
  }

  if (loading) return (
    <DashboardShell museum={null} activePath="/dashboard/register" onSignOut={() => {}}>
      <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
      <div className="p-8 space-y-6">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </DashboardShell>
  )

  if (!getPlan(museum?.plan).compliance) {
    return (
      <DashboardShell museum={museum} activePath="/dashboard/register" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Accession Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Accession Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Maintain a formal accession register for your collection. Available on Professional, Institution, and Enterprise plans.</p>
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

  const years = Array.from(new Set(
    objects.map(a => a.acquisition_date?.slice(0, 4)).filter(Boolean)
  )).sort((a, b) => b.localeCompare(a))

  const rawQ = searchQuery.trim()
  const isQuoted = rawQ.startsWith('"') && rawQ.endsWith('"') && rawQ.length > 2
  const isSpecific = specificSearch || isQuoted
  const q = isQuoted ? rawQ.slice(1, -1).toLowerCase() : rawQ.toLowerCase()
  const filtered = objects.filter(a => {
    const matchYear = !yearFilter || a.acquisition_date?.startsWith(yearFilter)
    const matchMethod = methodFilter === 'All' || a.acquisition_method === methodFilter
    let matchSearch = true
    if (q) {
      if (isSpecific) {
        matchSearch = !!(a.title?.toLowerCase().includes(q) || a.accession_no?.toLowerCase().includes(q))
      } else {
        matchSearch = !!(
          a.title?.toLowerCase().includes(q) ||
          a.accession_no?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.medium?.toLowerCase().includes(q) ||
          a.physical_materials?.toLowerCase().includes(q) ||
          a.artist?.toLowerCase().includes(q) ||
          a.maker_name?.toLowerCase().includes(q)
        )
      }
    }
    return matchYear && matchMethod && matchSearch
  })

  const confirmed = objects.filter(a => a.accession_register_confirmed).length

  return (
    <DashboardShell museum={museum} activePath="/dashboard/register" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-between px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Accession Register</span>
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate min-w-0">{confirmed} of {objects.length} register entries confirmed</span>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Total Accessions</div>
              <div className="font-serif text-4xl text-stone-900 dark:text-stone-100">{objects.length}</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Register Confirmed</div>
              <div className={`font-serif text-4xl ${confirmed < objects.length ? 'text-amber-600' : 'text-emerald-700'}`}>{confirmed}</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">Unconfirmed</div>
              <div className={`font-serif text-4xl ${objects.length - confirmed > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{objects.length - confirmed}</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search objects… or use "quotes" for specific search'
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-400"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs font-mono text-stone-500 dark:text-stone-400 cursor-pointer whitespace-nowrap select-none">
              <input type="checkbox" checked={specificSearch} onChange={e => setSpecificSearch(e.target.checked)} className="rounded border-stone-300 dark:border-stone-600 accent-stone-900" />
              Specific search
            </label>
          </div>

          {/* Filters */}
          <div className="flex gap-3 items-center flex-wrap">
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
          {objects.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">📋</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No accession numbers assigned</div>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Assign accession numbers to objects in the collection to populate the register.</p>
              <button onClick={() => router.push('/dashboard')} className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-mono px-5 py-2.5 rounded">
                Go to Collection →
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-x-auto">
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
                      onClick={() => router.push(`/dashboard/objects/${a.id}?tab=acquisition`)}>
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
                          onClick={() => toggleConfirmed(a.id, a.accession_register_confirmed, a)}
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
            Procedure 2: Acquisition & Accessioning. Each row that has been formally entered into your accession register should be marked confirmed. Click any row to open the acquisition record.
          </p>
        </div>
    </DashboardShell>
  )
}
