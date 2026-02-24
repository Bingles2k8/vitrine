'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { PLANS, PLAN_ORDER, type PlanId } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'

const CHECK = '✓'
const CROSS = '✕'

export default function PlanPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
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
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="font-mono text-sm text-stone-400">Loading…</p>
      </div>
    )
  }

  const currentPlan = museum?.plan || 'community'

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex">
      <Sidebar museum={museum} activePath="/dashboard/plan" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess} />

      <main className="ml-56 flex-1 flex flex-col">
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Plans &amp; Pricing</span>
        </div>

        <div className="p-8 max-w-5xl">
          <div className="mb-8">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              You are currently on the <span className="font-medium text-stone-900 dark:text-stone-100 capitalize">{currentPlan}</span> plan.
              {currentPlan !== 'enterprise' && (
                <span> Upgrade to unlock more features and higher collection limits.</span>
              )}
            </p>
            <p className="text-xs font-mono text-amber-600 mt-2">Payment processing coming soon — contact us to upgrade now.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {PLAN_ORDER.map(id => {
              const p = PLANS[id]
              const isCurrent = currentPlan === id
              const isEnterprise = id === 'enterprise'

              return (
                <div
                  key={id}
                  className={`rounded-xl border-2 p-6 bg-white dark:bg-stone-900 transition-all ${
                    isCurrent
                      ? 'border-stone-900 dark:border-white shadow-lg'
                      : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {isCurrent && (
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-3">Current plan</div>
                  )}
                  <div className="text-xs font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-1">{p.label}</div>
                  <div className="text-2xl font-serif text-stone-900 dark:text-stone-100 mb-4">{p.price}</div>

                  <ul className="space-y-2 mb-6">
                    {p.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">{CHECK}</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    {isCurrent ? (
                      <div className="w-full text-center text-xs font-mono py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500">
                        Current plan
                      </div>
                    ) : isEnterprise ? (
                      <a
                        href="mailto:hello@vitrine.app?subject=Enterprise%20Plan%20Enquiry"
                        className="block w-full text-center text-xs font-mono py-2 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
                      >
                        Contact us →
                      </a>
                    ) : (
                      <button
                        disabled
                        className="w-full text-xs font-mono py-2 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 opacity-50 cursor-not-allowed"
                        title="Payment processing coming soon"
                      >
                        Upgrade →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Feature comparison table */}
          <div className="mt-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Feature Comparison</div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left font-normal text-stone-400 dark:text-stone-500 px-6 py-3 uppercase tracking-widest">Feature</th>
                  {PLAN_ORDER.map(id => (
                    <th key={id} className={`text-center font-normal px-4 py-3 uppercase tracking-widest ${currentPlan === id ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'}`}>
                      {PLANS[id].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Collection items', values: ['150', '5,000', '100,000', 'Unlimited'] },
                  { label: 'Staff accounts', values: ['1 (owner)', '10', 'Unlimited', 'Unlimited'] },
                  { label: 'Public website', values: [true, true, true, true] },
                  { label: 'Site customisation', values: ['Basic', 'Full', 'Full', 'Full'] },
                  { label: 'Spectrum compliance tools', values: [false, true, true, true] },
                  { label: 'Analytics', values: [false, true, true, true] },
                  { label: 'Staff management', values: [false, true, true, true] },
                  { label: 'Priority support', values: [false, false, true, true] },
                ].map(row => (
                  <tr key={row.label} className="border-b border-stone-100 dark:border-stone-800 last:border-0">
                    <td className="px-6 py-3 text-stone-600 dark:text-stone-400">{row.label}</td>
                    {row.values.map((val, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {typeof val === 'boolean' ? (
                          <span className={val ? 'text-emerald-500' : 'text-stone-300 dark:text-stone-600'}>
                            {val ? CHECK : CROSS}
                          </span>
                        ) : (
                          <span className={`font-mono ${currentPlan === PLAN_ORDER[i] ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
