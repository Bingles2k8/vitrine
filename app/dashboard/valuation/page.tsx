'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { getMuseumForUser } from '@/lib/get-museum'
import { getPlan } from '@/lib/plans'

export default function ValuationPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [valuations, setValuations] = useState<any[]>([])
  const [artifactCount, setArtifactCount] = useState(0)
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
      const [{ data: vals }, { count }] = await Promise.all([
        supabase
          .from('valuations')
          .select('*, artifacts(title, accession_no, emoji)')
          .eq('museum_id', museum.id)
          .order('valuation_date', { ascending: false }),
        supabase
          .from('artifacts')
          .select('*', { count: 'exact', head: true })
          .eq('museum_id', museum.id),
      ])
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
      setValuations(vals || [])
      setArtifactCount(count ?? 0)
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
      <DashboardShell museum={museum} activePath="/dashboard/valuation" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
            <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Valuation Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="text-5xl mb-5">◉</div>
              <h2 className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-3">Valuation Register is a Professional feature</h2>
              <p className="text-sm text-stone-400 dark:text-stone-500 mb-6">Track valuations and insurance values for your collection. Available on Professional, Institution, and Enterprise plans.</p>
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

  // Compute per-object latest valuation (first occurrence per artifact_id since ordered desc)
  const latestByArtifact = new Map<string, any>()
  for (const v of valuations) {
    if (!latestByArtifact.has(v.artifact_id)) latestByArtifact.set(v.artifact_id, v)
  }
  const objectsValued = latestByArtifact.size
  const objectsWithoutValuation = Math.max(0, artifactCount - objectsValued)
  const totalValue = Array.from(latestByArtifact.values()).reduce((sum, v) => sum + parseFloat(v.value || 0), 0)

  const formatCurrency = (value: number, currency: string) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency || 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  return (
    <DashboardShell museum={museum} activePath="/dashboard/valuation" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Valuation Register</span>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Objects Valued', value: objectsValued },
              { label: 'Total Collection Value', value: totalValue > 0 ? formatCurrency(totalValue, 'GBP') : '—' },
              { label: 'Objects Without Valuation', value: objectsWithoutValuation, warn: objectsWithoutValuation > 0 },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">{s.label}</div>
                <div className={`font-serif text-4xl ${(s as any).warn && (s.value as number) > 0 ? 'text-amber-600' : 'text-stone-900 dark:text-stone-100'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500">Best practice recommends recording a current valuation for every object. Click any row to open the object's Valuation tab.</p>

          {/* Table */}
          {valuations.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">◈</div>
              <div className="font-serif text-2xl italic text-stone-900 dark:text-stone-100 mb-2">No valuations recorded</div>
              <p className="text-sm text-stone-400 dark:text-stone-500">Open an object and go to the Valuation tab to record a valuation.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-6 py-3">Object</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Value</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Method</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Purpose</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Valuer</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-normal px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {valuations.map(v => (
                    <tr key={v.id}
                      onClick={() => router.push(`/dashboard/artifacts/${v.artifact_id}?tab=valuation`)}
                      className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-base">{v.artifacts?.emoji}</div>
                          <div>
                            <div className="text-sm font-medium text-stone-900 dark:text-stone-100">{v.artifacts?.title}</div>
                            <div className="text-xs font-mono text-stone-400 dark:text-stone-500">{v.artifacts?.accession_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-stone-900 dark:text-stone-100">
                        {formatCurrency(parseFloat(v.value), v.currency || 'GBP')}
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.method || '—'}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.purpose || '—'}</td>
                      <td className="px-4 py-3 text-xs text-stone-500 dark:text-stone-400">{v.valuer || '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-stone-500 dark:text-stone-400">
                        {v.valuation_date ? new Date(v.valuation_date).toLocaleDateString('en-GB') : '—'}
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
