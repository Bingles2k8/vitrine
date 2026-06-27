export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSideClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { DeleteUserButton } from '../DeleteUserModal'
import { TestAccountToggle } from '../TestAccountToggle'

const PLAN_COLOURS: Record<string, string> = {
  community:    'bg-gray-100 text-gray-700',
  hobbyist:     'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  institution:  'bg-amber-100 text-amber-700',
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateOnly(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeSince(value: string | null | undefined) {
  if (!value) return null
  const diffMs = Date.now() - new Date(value).getTime()
  const days = Math.floor(diffMs / 86_400_000)
  if (days < 1) {
    const hours = Math.floor(diffMs / 3_600_000)
    if (hours < 1) {
      const mins = Math.floor(diffMs / 60_000)
      return `${mins} min ago`
    }
    return `${hours}h ago`
  }
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years !== 1 ? 's' : ''} ago`
}

export default async function AdminMuseumDetailPage({
  params,
}: {
  params: Promise<{ museumId: string }>
}) {
  const { museumId } = await params

  // ── Gate: admin only ──────────────────────────────────────────────
  const supabase = await createServerSideClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminUserId = process.env.ADMIN_USER_ID
  if (!user || !adminUserId || user.id !== adminUserId) {
    notFound()
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // ── Load museum (all columns) ─────────────────────────────────────
  const { data: museum } = await admin
    .from('museums')
    .select('*')
    .eq('id', museumId)
    .maybeSingle()

  if (!museum) notFound()

  // ── Load related data in parallel ─────────────────────────────────
  const [
    ownerRes,
    objectsRes,
    activityRes,
    staffRes,
    loansRes,
    pageViewsRes,
  ] = await Promise.all([
    admin.auth.admin.getUserById(museum.owner_id),
    admin.from('objects').select('id, created_at, deleted_at', { count: 'exact' }).eq('museum_id', museumId),
    admin.from('activity_log').select('id, action, created_at', { count: 'exact' }).eq('museum_id', museumId).order('created_at', { ascending: false }).limit(15),
    admin.from('staff_members').select('id, name, email, role, department, access, created_at, user_id, invited_at').eq('museum_id', museumId).order('created_at', { ascending: true }),
    admin.from('loans').select('id, status', { count: 'exact' }).eq('museum_id', museumId),
    admin.from('page_views').select('id', { count: 'exact', head: true }).eq('museum_id', museumId),
  ])

  const ownerUser = ownerRes.data?.user ?? null
  const objectsTotal = objectsRes.count ?? 0
  const objectsLive = (objectsRes.data ?? []).filter(o => !o.deleted_at).length
  const objectsTrashed = (objectsRes.data ?? []).filter(o => !!o.deleted_at).length
  const firstObjectAt = (objectsRes.data ?? [])
    .map(o => o.created_at)
    .sort()[0] ?? null
  const activitiesTotal = activityRes.count ?? 0
  const recentActivity = activityRes.data ?? []
  const staff = staffRes.data ?? []
  const activeLoans = (loansRes.data ?? []).filter(l => l.status === 'Active').length
  const totalLoans = loansRes.count ?? 0
  const pageViewsTotal = pageViewsRes.count ?? 0

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vitrinecms.com'
  const publicMuseumUrl = `${siteUrl}/museum/${museum.slug}`

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center gap-1 mb-6">
          ← Back to admin
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold tracking-tight">{museum.name ?? '—'}</h1>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLOURS[museum.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                {museum.plan}
              </span>
              <TestAccountToggle museumId={museum.id} isTest={!!museum.is_test_account} />
            </div>
            <div className="text-sm text-gray-500 font-mono">
              <a href={publicMuseumUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {publicMuseumUrl} ↗
              </a>
            </div>
          </div>
          <DeleteUserButton
            museumId={museum.id}
            museumName={museum.name ?? museum.slug}
            slug={museum.slug}
            ownerEmail={ownerUser?.email ?? '—'}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <Stat label="Live objects" value={objectsLive} />
          <Stat label="Trashed" value={objectsTrashed} muted />
          <Stat label="Staff" value={staff.length} />
          <Stat label="Active loans" value={activeLoans} sub={totalLoans > activeLoans ? `${totalLoans} total` : undefined} />
        </div>

        <div className="space-y-8">
          <Section title="Owner account">
            <DL>
              <Row k="Email" v={ownerUser?.email ?? '—'} />
              <Row k="User ID" v={<code className="text-xs">{museum.owner_id}</code>} />
              <Row k="Signed up" v={`${fmtDate(ownerUser?.created_at)}${timeSince(ownerUser?.created_at) ? ` · ${timeSince(ownerUser?.created_at)}` : ''}`} />
              <Row k="Last sign-in" v={ownerUser?.last_sign_in_at ? `${fmtDate(ownerUser.last_sign_in_at)} · ${timeSince(ownerUser.last_sign_in_at)}` : '—'} />
              <Row k="Email confirmed" v={ownerUser?.email_confirmed_at ? fmtDate(ownerUser.email_confirmed_at) : <span className="text-amber-600">Not confirmed</span>} />
              <Row k="Phone" v={ownerUser?.phone || '—'} />
              <Row k="Provider" v={ownerUser?.app_metadata?.provider ?? '—'} />
              {ownerUser?.app_metadata?.providers && Array.isArray(ownerUser.app_metadata.providers) && ownerUser.app_metadata.providers.length > 1 && (
                <Row k="All providers" v={(ownerUser.app_metadata.providers as string[]).join(', ')} />
              )}
              <Row k="Banned" v={ownerUser?.banned_until ? <span className="text-red-600">Until {fmtDate(ownerUser.banned_until)}</span> : 'No'} />
            </DL>
          </Section>

          <Section title="Museum">
            <DL>
              <Row k="Name" v={museum.name ?? '—'} />
              <Row k="Slug" v={<code className="text-xs">{museum.slug}</code>} />
              <Row k="Tagline" v={museum.tagline || '—'} />
              <Row k="Plan" v={museum.plan} />
              <Row k="Test account" v={museum.is_test_account ? 'Yes' : 'No'} />
              <Row k="Created" v={`${fmtDate(museum.created_at)} · ${timeSince(museum.created_at)}`} />
              <Row k="Template" v={museum.template || '—'} />
              <Row k="Discoverable" v={museum.discoverable ? `Yes — ${museum.collection_category || '(no category)'}` : 'No'} />
              <Row k="Dark mode" v={museum.dark_mode ? 'Yes' : 'No'} />
              <Row k="Hide Vitrine branding" v={museum.hide_vitrine_branding ? 'Yes' : 'No'} />
            </DL>
          </Section>

          <Section title="Contact / location">
            <DL>
              <Row k="Contact email" v={museum.contact_email || '—'} />
              <Row k="Contact phone" v={museum.contact_phone || '—'} />
              <Row k="Address" v={museum.address ? <pre className="whitespace-pre-wrap font-sans text-sm">{museum.address}</pre> : '—'} />
              <Row k="Opening hours" v={museum.opening_hours ? <pre className="whitespace-pre-wrap font-sans text-sm">{museum.opening_hours}</pre> : '—'} />
              <Row k="Website" v={museum.social_website ? <a href={museum.social_website} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline">{museum.social_website}</a> : '—'} />
              <Row k="Instagram" v={museum.social_instagram || '—'} />
              <Row k="Twitter" v={museum.social_twitter || '—'} />
              <Row k="Facebook" v={museum.social_facebook || '—'} />
            </DL>
          </Section>

          <Section title="Billing">
            <DL>
              <Row k="Stripe customer" v={museum.stripe_customer_id ? <code className="text-xs">{museum.stripe_customer_id}</code> : '—'} />
              <Row k="Stripe subscription" v={museum.stripe_subscription_id ? <code className="text-xs">{museum.stripe_subscription_id}</code> : '—'} />
              <Row k="Payment past due" v={museum.payment_past_due ? <span className="text-red-600 font-medium">Yes</span> : 'No'} />
              <Row k="Ever paid" v={museum.ever_paid ? 'Yes' : 'No'} />
              <Row k="Trial used at" v={fmtDate(museum.trial_used_at)} />
              <Row k="Locked at" v={museum.locked_at ? `${fmtDate(museum.locked_at)} — ${museum.lock_reason ?? '(no reason)'}` : 'Not locked'} />
              <Row k="Scheduled deletion" v={museum.scheduled_deletion_at ? <span className="text-red-600">{fmtDate(museum.scheduled_deletion_at)}</span> : '—'} />
              <Row k="Deletion warning 30d" v={fmtDate(museum.deletion_warning_30d_sent_at)} />
              <Row k="Deletion warning 7d" v={fmtDate(museum.deletion_warning_7d_sent_at)} />
            </DL>
          </Section>

          <Section title="Activity">
            <DL>
              <Row k="Total objects (incl. trashed)" v={objectsTotal} />
              <Row k="First object added" v={firstObjectAt ? `${fmtDateOnly(firstObjectAt)} · ${timeSince(firstObjectAt)}` : '—'} />
              <Row k="Activity log entries" v={activitiesTotal} />
              <Row k="Page views (public site)" v={pageViewsTotal} />
            </DL>
            {recentActivity.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Latest activity</div>
                <ul className="text-sm divide-y divide-gray-100 border border-gray-200 rounded-md">
                  {recentActivity.map(a => (
                    <li key={a.id} className="px-3 py-2 flex justify-between gap-4">
                      <span className="text-gray-700">{a.action}</span>
                      <span className="text-gray-400 text-xs whitespace-nowrap">{fmtDate(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          {staff.length > 0 && (
            <Section title={`Staff members (${staff.length})`}>
              <div className="overflow-x-auto rounded-md border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2">Dept</th>
                      <th className="px-3 py-2">Access</th>
                      <th className="px-3 py-2">Joined</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staff.map(s => (
                      <tr key={s.id}>
                        <td className="px-3 py-2">{s.name || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.email || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.role || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.department || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{s.access || '—'}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{fmtDateOnly(s.created_at)}</td>
                        <td className="px-3 py-2 text-xs">
                          {s.user_id
                            ? <span className="text-green-600">Active</span>
                            : <span className="text-amber-600">Invited</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section title="Branding">
            <DL>
              <Row k="Logo emoji" v={museum.logo_emoji || '—'} />
              <Row k="Logo image" v={museum.logo_image_url ? <a href={museum.logo_image_url} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline text-xs break-all">{museum.logo_image_url}</a> : '—'} />
              <Row k="Hero image" v={museum.hero_image_url ? <a href={museum.hero_image_url} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline text-xs break-all">{museum.hero_image_url}</a> : '—'} />
              <Row k="Primary colour" v={museum.primary_color ? <span className="inline-flex items-center gap-2"><span className="inline-block w-4 h-4 rounded border border-gray-200" style={{ background: museum.primary_color }} /><code className="text-xs">{museum.primary_color}</code></span> : '—'} />
              <Row k="Accent colour" v={museum.accent_color ? <span className="inline-flex items-center gap-2"><span className="inline-block w-4 h-4 rounded border border-gray-200" style={{ background: museum.accent_color }} /><code className="text-xs">{museum.accent_color}</code></span> : '—'} />
              <Row k="Heading font" v={museum.heading_font || '—'} />
            </DL>
          </Section>
        </div>

        <div className="mt-12 text-xs text-gray-300">
          Museum ID: <code>{museum.id}</code>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">{title}</h2>
      {children}
    </section>
  )
}

function DL({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-x-6 gap-y-2 text-sm">{children}</dl>
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-gray-900 break-words">{v ?? '—'}</dd>
    </>
  )
}

function Stat({ label, value, sub, muted }: { label: string; value: number | string; sub?: string; muted?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${muted ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
      <div className={`text-2xl font-bold tabular-nums ${muted ? 'text-gray-500' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}
