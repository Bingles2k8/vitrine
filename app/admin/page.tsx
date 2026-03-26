import { notFound } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const PLAN_ORDER = ['community', 'hobbyist', 'professional', 'institution'] as const
const PLAN_COLOURS: Record<string, string> = {
  community:    'bg-gray-100 text-gray-700',
  hobbyist:     'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  institution:  'bg-amber-100 text-amber-700',
}
const PLAN_MRR: Record<string, number> = {
  community: 0,
  hobbyist: 5,
  professional: 79,
  institution: 349,
}

function subStatus(plan: string, stripeSubId: string | null, pastDue: boolean) {
  if (plan === 'community' && !stripeSubId) return { label: 'free',      cls: 'text-gray-400' }
  if (plan === 'community' && stripeSubId)  return { label: 'cancelled', cls: 'text-gray-400 line-through' }
  if (pastDue)                              return { label: 'past due',  cls: 'text-red-500 font-medium' }
  return                                           { label: 'active',    cls: 'text-green-600' }
}

export default async function AdminPage() {
  // ── Gate: must be logged in and match ADMIN_USER_ID ───────────────
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminUserId = process.env.ADMIN_USER_ID
  if (!user || !adminUserId || user.id !== adminUserId) {
    notFound()
  }

  // ── Service role client (bypasses RLS) ────────────────────────────
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ── Fetch all data in parallel ─────────────────────────────────────
  const [
    { data: museums },
    { data: { users: authUsers } },
    { data: objects },
    { data: activities },
  ] = await Promise.all([
    admin
      .from('museums')
      .select('id, name, slug, plan, owner_id, created_at, discoverable, payment_past_due, stripe_subscription_id')
      .order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('objects').select('museum_id'),
    admin.from('activity_log').select('museum_id, created_at').order('created_at', { ascending: false }),
  ])

  // ── Build lookup maps ──────────────────────────────────────────────
  const emailByOwnerId = new Map(authUsers?.map(u => [u.id, u.email ?? '—']))

  const objCountByMuseum = (objects ?? []).reduce<Record<string, number>>((acc, obj) => {
    if (obj.museum_id) acc[obj.museum_id] = (acc[obj.museum_id] ?? 0) + 1
    return acc
  }, {})

  // First entry per museum_id in the already-desc-sorted list is the latest
  const lastActivityByMuseum = new Map<string, string>()
  for (const a of (activities ?? [])) {
    if (a.museum_id && !lastActivityByMuseum.has(a.museum_id)) {
      lastActivityByMuseum.set(a.museum_id, a.created_at)
    }
  }

  const rows = museums ?? []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com'

  // ── Summary stats ──────────────────────────────────────────────────
  const planCounts = PLAN_ORDER.reduce<Record<string, number>>((acc, p) => {
    acc[p] = rows.filter(m => m.plan === p).length
    return acc
  }, {})
  const pastDueCount  = rows.filter(m => m.payment_past_due).length
  const paidCount     = rows.filter(m => m.plan !== 'community').length
  const totalObjects  = objects?.length ?? 0
  const mrr           = rows.reduce((sum, m) => sum + (PLAN_MRR[m.plan] ?? 0), 0)

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Vitrine Admin</h1>
          <span className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
          <StatCard label="Museums" value={rows.length} />
          <StatCard label="Paid" value={paidCount} sub={`${rows.length > 0 ? Math.round(paidCount / rows.length * 100) : 0}%`} />
          <StatCard label="MRR" text={`£${mrr}`} highlight={mrr > 0} />
          <StatCard label="Objects" value={totalObjects} />
          <StatCard label="Community" value={planCounts.community} />
          <StatCard label="Hobbyist" value={planCounts.hobbyist} />
          <StatCard label="Professional" value={planCounts.professional} />
          <StatCard label="Institution" value={planCounts.institution} highlight={planCounts.institution > 0} />
        </div>

        {pastDueCount > 0 && (
          <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            ⚠ {pastDueCount} museum{pastDueCount > 1 ? 's' : ''} with payment past due
          </div>
        )}

        {/* Quick links */}
        <div className="mb-6">
          <a
            href="/admin/blog"
            className="inline-block text-sm text-gray-600 border border-gray-200 rounded px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Manage Blog Posts →
          </a>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Museum</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Objects</th>
                <th className="px-4 py-3">Signed up</th>
                <th className="px-4 py-3">Last active</th>
                <th className="px-4 py-3 text-center">Discoverable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(m => {
                const objCount   = objCountByMuseum[m.id] ?? 0
                const isEmpty    = objCount === 0
                const lastActive = lastActivityByMuseum.get(m.id)
                const status     = subStatus(m.plan, m.stripe_subscription_id, m.payment_past_due)

                return (
                  <tr key={m.id} className={`transition-colors ${isEmpty ? 'opacity-50 hover:opacity-100' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <a
                        href={`${siteUrl}/museum/${m.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:underline"
                      >
                        {m.name ?? '—'}
                      </a>
                      <div className="text-xs text-gray-400 font-mono">{m.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLOURS[m.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.plan}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${status.cls}`}>{status.label}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{emailByOwnerId.get(m.owner_id) ?? '—'}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${isEmpty ? 'text-gray-400' : 'text-gray-700'}`}>{objCount}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {lastActive
                        ? new Date(lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{m.discoverable ? '✓' : ''}</td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No museums yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-gray-300 text-right">{rows.length} row{rows.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, text, sub, highlight }: {
  label: string
  value?: number
  text?: string
  sub?: string
  highlight?: boolean
}) {
  const display = text ?? value?.toString() ?? '0'
  const isHighlighted = highlight && (value ?? 0) > 0 || highlight && !!text
  return (
    <div className={`rounded-lg border p-4 ${isHighlighted ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}>
      <div className={`text-2xl font-bold tabular-nums ${isHighlighted ? 'text-amber-700' : 'text-gray-900'}`}>
        {display}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}
