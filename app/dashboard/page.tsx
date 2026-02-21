'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [museum, setMuseum] = useState<any>(null)
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

      const { data: artifacts } = await supabase
        .from('artifacts')
        .select('*')
        .eq('museum_id', museum.id)
        .order('created_at', { ascending: false })

      setMuseum(museum)
      setArtifacts(artifacts || [])
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

  return (
    <div className="min-h-screen bg-stone-50 flex">

      <aside className="w-56 bg-white border-r border-stone-200 flex flex-col fixed top-0 left-0 bottom-0">
        <div className="p-5 border-b border-stone-200">
          <span className="font-serif text-xl italic text-stone-900">Vitrine<span className="text-amber-600">.</span></span>
        </div>
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
              {museum.logo_emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-900 truncate">{museum.name}</div>
              <div className="text-xs text-amber-600 tracking-wide uppercase">{museum.plan} plan</div>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2">Collections</div>
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-stone-900 text-white text-xs font-mono mb-1 cursor-pointer">
            <span>⬡</span> Artifacts
          </div>
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Website</div>
          <div onClick={() => router.push('/dashboard/site')} className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50">
            <span>◫</span> Site Builder
          </div>
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">People</div>
          <div onClick={() => router.push('/dashboard/staff')} className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50">
            <span>◉</span> Staff & Roles
          </div>
          <div className="text-xs tracking-widest uppercase text-stone-300 px-2 py-2 mt-2">Data</div>
          <div onClick={() => router.push('/dashboard/analytics')} className="flex items-center gap-2 px-3 py-2 rounded text-stone-500 text-xs font-mono mb-1 cursor-pointer hover:bg-stone-50">
            <span>◈</span> Analytics
          </div>
        </nav>
        <div className="p-4 border-t border-stone-200">
          <button onClick={handleSignOut} className="w-full text-left text-xs font-mono text-stone-400 hover:text-stone-900 transition-colors">
            Sign out →
          </button>
        </div>
      </aside>

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 bg-white flex items-center justify-between px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900">Collection</span>
          <button
            onClick={() => router.push('/dashboard/artifacts/new')}
            className="bg-stone-900 text-white text-xs font-mono px-4 py-2 rounded"
          >
            + Add Artifact
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Artifacts', value: artifacts.length, sub: artifacts.length === 0 ? 'Add your first item' : `${artifacts.length} in collection` },
              { label: 'On Display', value: statusCount('On Display'), sub: artifacts.length ? `${Math.round(statusCount('On Display')/artifacts.length*100)}% of collection` : '—' },
              { label: 'On Loan', value: statusCount('On Loan'), sub: '—' },
              { label: 'In Restoration', value: statusCount('Restoration'), sub: '—' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-stone-200 rounded-lg p-5">
                <div className="text-xs uppercase tracking-widest text-stone-400 mb-2">{s.label}</div>
                <div className="font-serif text-4xl text-stone-900">{s.value}</div>
                <div className="text-xs text-stone-400 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {artifacts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-lg flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🏛️</div>
              <div className="font-serif text-2xl italic text-stone-900 mb-2">Your collection is empty</div>
              <p className="text-sm text-stone-400 mb-6">Add your first artifact to get started.</p>
              <button
                onClick={() => router.push('/dashboard/artifacts/new')}
                className="bg-stone-900 text-white text-xs font-mono px-5 py-2.5 rounded"
              >
                + Add your first artifact
              </button>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-6 py-3">Artifact</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Year</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Medium</th>
                    <th className="text-left text-xs uppercase tracking-widest text-stone-400 font-normal px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {artifacts.map(a => (
                    <tr key={a.id} className="border-b border-stone-100 hover:bg-stone-50 cursor-pointer" onClick={() => router.push(`/dashboard/artifacts/${a.id}`)}>
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
                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                          a.status === 'On Display' ? 'bg-emerald-50 text-emerald-700' :
                          a.status === 'On Loan' ? 'bg-amber-50 text-amber-700' :
                          a.status === 'Restoration' ? 'bg-red-50 text-red-600' :
                          'bg-stone-100 text-stone-500'
                        }`}>{a.status}</span>
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