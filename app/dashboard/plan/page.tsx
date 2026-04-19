'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { PLANS, PLAN_ORDER, getPlan, type PlanId } from '@/lib/plans'
import { getMuseumForUser } from '@/lib/get-museum'
import { CardGridSkeleton } from '@/components/Skeleton'
import { formatSize } from '@/lib/formatSize'

const CHECK = '✓'
const CROSS = '—'

function UsageRow({ label, used, limit, format, note }: {
  label: string
  used: number
  limit: number | null
  format?: (n: number) => string
  note?: string
}) {
  const display = format ?? ((n: number) => n.toLocaleString())
  if (limit === null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600 dark:text-stone-400">{label}</span>
        <span className="font-mono text-stone-500 dark:text-stone-400">{display(used)} / Unlimited</span>
      </div>
    )
  }
  const pct = Math.min(100, (used / limit) * 100)
  const barColor = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-stone-400 dark:bg-stone-500'
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-stone-600 dark:text-stone-400">{label}</span>
        <span className="font-mono text-stone-500 dark:text-stone-400">{display(used)} / {display(limit)}</span>
      </div>
      <div className="h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {note && <div className="text-xs text-stone-400 dark:text-stone-500 font-mono mt-1">{note}</div>}
    </div>
  )
}

export default function PlanPage() {
  const [museum, setMuseum] = useState<any>(null)
  const [isOwner, setIsOwner] = useState(true)
  const [staffAccess, setStaffAccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [checkoutResult, setCheckoutResult] = useState<'success' | 'cancelled' | null>(null)
  const [pollingForPlan, setPollingForPlan] = useState(false)
  const [pollingTimedOut, setPollingTimedOut] = useState(false)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollAttemptsRef = useRef(0)
  const [objectCount, setObjectCount] = useState(0)
  const [trashedCount, setTrashedCount] = useState(0)
  const [staffCount, setStaffCount] = useState(0)
  const [storageUsedBytes, setStorageUsedBytes] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutParam = params.get('checkout') as 'success' | 'cancelled' | null
    if (checkoutParam) {
      setCheckoutResult(checkoutParam)
      window.history.replaceState({}, '', '/dashboard/plan')
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const result = await getMuseumForUser(supabase)
      if (!result) { router.push('/onboarding'); return }
      const { museum, isOwner, staffAccess } = result
      setMuseum(museum)
      setIsOwner(isOwner)
      setStaffAccess(staffAccess)

      const [{ count: objCount }, { count: trashed }] = await Promise.all([
        supabase.from('objects').select('id', { count: 'exact', head: true }).eq('museum_id', museum.id),
        supabase.from('objects').select('id', { count: 'exact', head: true }).eq('museum_id', museum.id).not('deleted_at', 'is', null),
      ])
      setObjectCount(objCount ?? 0)
      setTrashedCount(trashed ?? 0)

      const { count: sCount } = await supabase
        .from('staff_members')
        .select('id', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
      setStaffCount((sCount ?? 0) + 1)

      if (getPlan(museum.plan).documentStorageMb) {
        setStorageUsedBytes(museum.storage_used_bytes ?? 0)
      }

      setLoading(false)

      // If returning from a successful checkout but the webhook hasn't fired yet,
      // poll until the plan updates in the database (race condition with Stripe webhooks).
      // Note: if webhook already fired before page loaded, museum.plan will already be updated
      // and we skip polling — show "Subscription activated!" immediately.
      if (checkoutParam === 'success' && museum.plan === 'community') {
        setPollingForPlan(true)
        pollAttemptsRef.current = 0
        pollIntervalRef.current = setInterval(async () => {
          pollAttemptsRef.current++
          const polledResult = await getMuseumForUser(supabase)
          if (polledResult && polledResult.museum.plan !== 'community') {
            clearInterval(pollIntervalRef.current!)
            setMuseum(polledResult.museum)
            setPollingForPlan(false)
            return
          }
          if (pollAttemptsRef.current >= 8) {
            clearInterval(pollIntervalRef.current!)
            setPollingForPlan(false)
            setPollingTimedOut(true)
          }
        }, 2000)
      }
    }
    load()

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  async function handleUpgrade(planId: PlanId) {
    setActionLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
        setActionLoading(null)
      }
    } catch {
      alert('Something went wrong')
      setActionLoading(null)
    }
  }

  async function handleManageSubscription() {
    setActionLoading('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Something went wrong')
        setActionLoading(null)
      }
    } catch {
      alert('Something went wrong')
      setActionLoading(null)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <DashboardShell museum={null} activePath="/dashboard/plan" onSignOut={() => {}}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950" />
        <div className="p-8 space-y-6">
          <CardGridSkeleton cards={4} />
        </div>
      </DashboardShell>
    )
  }

  const currentPlan = museum?.plan || 'community'

  return (
    <DashboardShell museum={museum} activePath="/dashboard/plan" onSignOut={handleSignOut} isOwner={isOwner} staffAccess={staffAccess}>
        <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 md:px-8 sticky top-0">
          <span className="font-serif text-lg italic text-stone-900 dark:text-stone-100">Plans &amp; Pricing</span>
        </div>

        <div className="p-4 md:p-8 max-w-5xl">
          {checkoutResult === 'success' && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
              {pollingForPlan ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-mono">Activating your plan…</p>
              ) : pollingTimedOut ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-mono">
                  Your plan is activating — this can take a moment.{' '}
                  <button onClick={() => window.location.reload()} className="underline hover:no-underline">
                    Refresh the page
                  </button>{' '}if it does not update shortly.
                </p>
              ) : (
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-mono">Subscription activated!</p>
              )}
            </div>
          )}
          {checkoutResult === 'cancelled' && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <p className="text-sm text-stone-500 dark:text-stone-400 font-mono">
                Checkout cancelled. You can upgrade at any time.
              </p>
            </div>
          )}
          {museum?.pending_downgrade_plan && (
            <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300 font-mono">
                Your subscription is scheduled to be downgraded to{' '}
                <span className="font-medium capitalize">
                  {PLANS[museum.pending_downgrade_plan as PlanId]?.label ?? museum.pending_downgrade_plan}
                </span>
                {museum.pending_downgrade_date && (
                  <> on {new Date(museum.pending_downgrade_date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}</>
                )}
                .{' '}You can cancel this change from{' '}
                <button
                  onClick={handleManageSubscription}
                  className="underline hover:no-underline"
                >
                  your billing portal
                </button>.
              </p>
            </div>
          )}

          {/* Current Usage */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg p-6 mb-8">
            <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-4">
              Current Usage — {getPlan(currentPlan).label} plan
            </div>
            <div className="space-y-4">
              <UsageRow label="Objects" used={objectCount} limit={getPlan(currentPlan).objects} note={trashedCount > 0 ? `${(objectCount - trashedCount).toLocaleString()} in collection · ${trashedCount.toLocaleString()} in bin` : undefined} />
              {getPlan(currentPlan).fullMode && <UsageRow label="Staff accounts" used={staffCount} limit={getPlan(currentPlan).staff} />}
              {getPlan(currentPlan).documentStorageMb ? (
                <UsageRow
                  label="Storage"
                  used={storageUsedBytes}
                  limit={getPlan(currentPlan).documentStorageMb !== null ? getPlan(currentPlan).documentStorageMb! * 1024 * 1024 : null}
                  format={formatSize}
                />
              ) : null}
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              You are currently on the <span className="font-medium text-stone-900 dark:text-stone-100 capitalize">{currentPlan}</span> plan.
              {currentPlan === 'community' ? (
                <span> Upgrade to unlock more features and higher collection limits.</span>
              ) : currentPlan !== 'enterprise' ? (
                <span> Manage your subscription or switch plans below.</span>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {PLAN_ORDER.map(id => {
              const p = PLANS[id]
              const isCurrent = currentPlan === id
              const isComingSoon = id === 'institution' || id === 'enterprise'
              const isPendingTarget = museum?.pending_downgrade_plan === id
              const isDowngrade = PLAN_ORDER.indexOf(id) < PLAN_ORDER.indexOf(currentPlan as PlanId)

              return (
                <div
                  key={id}
                  className={`rounded-xl border-2 p-6 bg-white dark:bg-stone-900 transition-all ${
                    isCurrent
                      ? 'border-stone-900 dark:border-white shadow-lg'
                      : isPendingTarget
                        ? 'border-amber-400 dark:border-amber-600'
                        : 'border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {isCurrent && (
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-3">Current plan</div>
                  )}
                  {isPendingTarget && !isCurrent && (
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400 mb-3">Pending downgrade</div>
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

                  <div className="mt-auto space-y-2">
                    {isCurrent ? (
                      <>
                        <div className="w-full text-center text-xs font-mono py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500">
                          Current plan
                        </div>
                        {currentPlan !== 'community' && currentPlan !== 'enterprise' && isOwner && (
                          <button
                            onClick={handleManageSubscription}
                            disabled={actionLoading !== null}
                            className="w-full text-xs font-mono py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === 'manage' ? 'Redirecting…' : 'Manage subscription'}
                          </button>
                        )}
                      </>
                    ) : isComingSoon ? (
                      <span className="block w-full text-center text-xs font-mono py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-400 dark:text-stone-500 cursor-default">
                        Coming soon
                      </span>
                    ) : id === 'community' ? (
                      currentPlan !== 'community' && isOwner ? (
                        <>
                          <button
                            onClick={handleManageSubscription}
                            disabled={actionLoading !== null}
                            className="w-full text-xs font-mono py-2 rounded border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === 'manage' ? 'Redirecting…' : 'Downgrade'}
                          </button>
                          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-1 text-center leading-relaxed">
                            Takes effect at end of billing cycle. Please ensure your account meets this plan&apos;s limits or excess data may be removed without warning.
                          </p>
                        </>
                      ) : null
                    ) : isOwner ? (
                      museum?.stripe_subscription_id ? (
                        <>
                          <button
                            onClick={handleManageSubscription}
                            disabled={actionLoading !== null}
                            className="w-full text-xs font-mono py-2 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === 'manage' ? 'Redirecting…' : isDowngrade ? 'Downgrade' : 'Upgrade →'}
                          </button>
                          {isDowngrade && (
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-1 text-center leading-relaxed">
                              Takes effect at end of billing cycle. Please ensure your account meets this plan&apos;s limits or excess data may be removed without warning.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleUpgrade(id)}
                            disabled={actionLoading !== null}
                            className="w-full text-xs font-mono py-2 rounded bg-stone-900 dark:bg-white text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === id ? 'Redirecting…' : isDowngrade ? 'Downgrade' : 'Upgrade →'}
                          </button>
                          {isDowngrade && (
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-1 text-center leading-relaxed">
                              Takes effect at end of billing cycle. Please ensure your account meets this plan&apos;s limits or excess data may be removed without warning.
                            </p>
                          )}
                        </>
                      )
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {currentPlan !== 'community' && currentPlan !== 'enterprise' && museum?.stripe_subscription_id && (
            <p className="mt-4 text-xs text-stone-400 dark:text-stone-500 font-mono">
              When changing plans, you&apos;ll receive a prorated credit for any unused time on your current plan.
            </p>
          )}

          {/* Feature comparison table */}
          <div className="mt-10 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800">
              <div className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Feature Comparison</div>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left font-normal text-stone-400 dark:text-stone-500 px-6 py-3 uppercase tracking-widest w-1/3"></th>
                  <th colSpan={2} className="text-center font-normal text-stone-400 dark:text-stone-500 px-4 py-2 uppercase tracking-widest border-l border-stone-200 dark:border-stone-700">For collectors</th>
                  <th colSpan={3} className="text-center font-normal text-stone-400 dark:text-stone-500 px-4 py-2 uppercase tracking-widest border-l border-stone-200 dark:border-stone-700">For institutions</th>
                </tr>
                <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                  <th className="text-left font-normal text-stone-400 dark:text-stone-500 px-6 py-3 uppercase tracking-widest">Feature</th>
                  {PLAN_ORDER.map((id, i) => (
                    <th key={id} className={`text-center font-normal px-4 py-3 uppercase tracking-widest ${currentPlan === id ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'} ${i === 0 || i === 2 ? 'border-l border-stone-200 dark:border-stone-700' : ''}`}>
                      {PLANS[id].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  type Row = { label: string; values: (string | boolean)[] }
                  type Group = { group: string } | Row
                  const rows: Group[] = [
                    { group: 'Collection' },
                    { label: 'Collection items', values: PLAN_ORDER.map(id => PLANS[id].objects === null ? 'Unlimited' : PLANS[id].objects!.toLocaleString()) },
                    { label: 'Photos per object', values: PLAN_ORDER.map(id => PLANS[id].imagesPerObject === null ? 'Unlimited' : String(PLANS[id].imagesPerObject)) },
                    { label: 'Wishlist', values: PLAN_ORDER.map(id => PLANS[id].wishlist) },
                    { label: 'Collections compliance tools', values: PLAN_ORDER.map(id => PLANS[id].compliance) },
                    { label: 'Document storage', values: PLAN_ORDER.map(id => {
                      const mb = PLANS[id].documentStorageMb
                      if (mb === null) return 'Unlimited'
                      if (mb === 0) return false
                      if (mb >= 1024) return `${mb / 1024} GB`
                      return `${mb} MB`
                    }) },

                    { group: 'Public site' },
                    { label: 'Public website', values: PLAN_ORDER.map(() => true) },
                    { label: 'Site customisation', values: PLAN_ORDER.map(id => PLANS[id].fullMode ? 'Full' : 'Basic') },
                    { label: 'Custom slug', values: PLAN_ORDER.map(id => PLANS[id].changeSlug) },
                    { label: 'Hide Vitrine branding', values: PLAN_ORDER.map(id => PLANS[id].hideVitrineBranding) },
                    { label: 'Visit & event pages', values: PLAN_ORDER.map(id => PLANS[id].visitInfo) },
                    { label: 'Event ticketing', values: PLAN_ORDER.map(id => PLANS[id].ticketing) },

                    { group: 'Insights & team' },
                    { label: 'Analytics', values: PLAN_ORDER.map(id => PLANS[id].analytics) },
                    { label: 'Visitor analytics', values: PLAN_ORDER.map(id => PLANS[id].visitorAnalytics) },
                    { label: 'Staff accounts', values: PLAN_ORDER.map(id => PLANS[id].staff === null ? 'Unlimited' : PLANS[id].staff === 1 ? '1 (owner)' : `Up to ${PLANS[id].staff}`) },
                    { label: 'Staff management', values: PLAN_ORDER.map(id => PLANS[id].fullMode) },
                  ]
                  let dataRowIdx = 0
                  return rows.map((r, rowIdx) => {
                    if ('group' in r) {
                      return (
                        <tr key={`g-${rowIdx}`} className="bg-stone-50/50 dark:bg-stone-800/30">
                          <td colSpan={PLAN_ORDER.length + 1} className="px-6 py-2 text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500 font-mono">
                            {r.group}
                          </td>
                        </tr>
                      )
                    }
                    const zebra = dataRowIdx % 2 === 1
                    dataRowIdx += 1
                    return (
                      <tr key={r.label} className={`border-b border-stone-100 dark:border-stone-800 last:border-0 ${zebra ? 'bg-stone-50/40 dark:bg-stone-800/20' : ''}`}>
                        <td className="px-6 py-3 text-left text-stone-600 dark:text-stone-400">{r.label}</td>
                        {r.values.map((val, i) => (
                          <td key={i} className={`px-4 py-3 text-center ${i === 0 || i === 2 ? 'border-l border-stone-100 dark:border-stone-800' : ''}`}>
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
                    )
                  })
                })()}
              </tbody>
            </table>
          </div>
        </div>
    </DashboardShell>
  )
}
