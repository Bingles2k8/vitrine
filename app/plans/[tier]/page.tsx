import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PLANS, PLAN_ORDER, PlanId } from '@/lib/plans'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export function generateStaticParams() {
  return PLAN_ORDER.map(tier => ({ tier }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tier: string }>
}) {
  const { tier } = await params
  if (!PLAN_ORDER.includes(tier as PlanId)) return {}
  const id = tier as PlanId
  const detail = PLAN_DETAILS[id]
  const plan = PLANS[id]
  const priceText = detail.priceDisplay === 'Free'
    ? 'free'
    : detail.priceDisplay === 'Custom'
    ? 'custom pricing'
    : `${detail.priceDisplay}${detail.priceNote ?? ''}`
  return buildPageMetadata({
    title: `${plan.label} Plan – ${detail.tagline.replace(/\.$/, '')}`,
    description: detail.desc,
    path: `/plans/${id}`,
    keywords: ['vitrine pricing', `vitrine ${id} plan`, 'collection management pricing', priceText],
  })
}

const PLAN_DETAILS: Record<PlanId, {
  tagline: string
  desc: string
  ctaHref: string
  cta: string
  priceDisplay: string
  priceNote: string | null
}> = {
  community: {
    tagline: 'Start cataloguing for free.',
    desc: 'Get your collection online without spending a penny. Perfect for village museums, heritage societies, and passionate individuals who want to share what they care for.',
    ctaHref: '/signup',
    cta: 'Start free →',
    priceDisplay: 'Free',
    priceNote: null,
  },
  hobbyist: {
    tagline: 'More room to grow.',
    desc: 'You\'ve outgrown a spreadsheet. Hobbyist gives you a proper catalogue and a beautiful public-facing website — for less than a museum entry ticket per month.',
    ctaHref: '/signup',
    cta: 'Get started →',
    priceDisplay: '£5',
    priceNote: '/ month',
  },
  professional: {
    tagline: 'Everything a working museum needs.',
    desc: 'A full-featured platform for regional museums: compliance tools, analytics, staff accounts, and an event-ticketing system — all under one roof.',
    ctaHref: '/signup',
    cta: 'Get started →',
    priceDisplay: '£79',
    priceNote: '/ month',
  },
  institution: {
    tagline: 'Built for serious collections.',
    desc: 'Scale to 100,000 objects with unlimited staff accounts and 10 GB document storage — built for regional and national collections.',
    ctaHref: '/signup',
    cta: 'Get started →',
    priceDisplay: '£349',
    priceNote: '/ month',
  },
  enterprise: {
    tagline: 'No limits. Full service.',
    desc: 'Unlimited objects, unlimited staff, and unlimited document storage. Talk to us about what you need.',
    ctaHref: '/contact/enterprise',
    cta: 'Contact us →',
    priceDisplay: 'Custom',
    priceNote: null,
  },
}

const STAT_LABELS: Record<PlanId, Array<{ label: string; value: string }>> = {
  community:    [{ label: 'Collection items', value: 'Up to 100' }, { label: 'Staff accounts', value: '1' }, { label: 'Images per object', value: '1' }],
  hobbyist:     [{ label: 'Collection items', value: 'Up to 500' }, { label: 'Staff accounts', value: '1' }, { label: 'Images per object', value: '3' }],
  professional: [{ label: 'Collection items', value: 'Up to 5,000' }, { label: 'Staff accounts', value: 'Up to 10' }, { label: 'Images per object', value: '10' }],
  institution:  [{ label: 'Collection items', value: 'Up to 100,000' }, { label: 'Staff accounts', value: 'Unlimited' }, { label: 'Images per object', value: '10' }],
  enterprise:   [{ label: 'Collection items', value: 'Unlimited' }, { label: 'Staff accounts', value: 'Unlimited' }, { label: 'Images per object', value: '10' }],
}

// ── UI Mockups ────────────────────────────────────────────────────────────────

function MockupShell({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-stone-900 px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs font-mono text-stone-600">{url}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

function CollectionMockup() {
  return (
    <MockupShell url="vitrine.app/dashboard/objects">
      <div className="bg-stone-900 flex">
        <div className="w-40 border-r border-white/5 p-3 flex-shrink-0">
          <div className="text-amber-500 font-serif italic text-base mb-4 px-2">Vitrine.</div>
          <div className="text-xs text-stone-600 uppercase tracking-widest px-2 mb-2">Collections</div>
          <div className="bg-white/10 text-white text-xs font-mono px-3 py-2 rounded mb-1">⬡ Objects</div>
          <div className="text-stone-600 text-xs font-mono px-3 py-2 mb-1">◫ Site Builder</div>
          <div className="text-stone-600 text-xs font-mono px-3 py-2">◈ Analytics</div>
        </div>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-300 font-mono">Objects</span>
            <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">+ Add object</span>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
            <div className="grid grid-cols-4 gap-3 px-4 py-2 border-b border-white/5">
              {['Object', 'Year', 'Medium', 'Status'].map(h => (
                <div key={h} className="text-xs text-stone-600 uppercase tracking-widest">{h}</div>
              ))}
            </div>
            {[
              ['🏺', 'The Portland Vase', '25 CE', 'Cameo glass', 'On Display', 'emerald'],
              ['🖼️', 'The Arnolfini Portrait', '1434', 'Oil on canvas', 'On Display', 'emerald'],
              ['💎', "Tippoo's Tiger", '1793', 'Wood & metal', 'On Loan', 'amber'],
              ['🗿', 'Rosetta Stone Cast', '196 BCE', 'Granodiorite', 'Restoration', 'stone'],
            ].map(([emoji, title, year, medium, status, color]) => (
              <div key={title} className="grid grid-cols-4 gap-3 px-4 py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{emoji}</span>
                  <span className="text-xs text-stone-300 truncate">{title}</span>
                </div>
                <div className="text-xs font-mono text-stone-500">{year}</div>
                <div className="text-xs text-stone-500 truncate">{medium}</div>
                <div>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400'
                    : color === 'amber' ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-stone-500/10 text-stone-500'
                  }`}>{status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockupShell>
  )
}

function SiteBuilderMockup() {
  return (
    <MockupShell url="vitrine.app/dashboard/site-builder">
      <div className="bg-stone-900 flex">
        <div className="w-40 border-r border-white/5 p-3 flex-shrink-0">
          <div className="text-amber-500 font-serif italic text-base mb-4 px-2">Vitrine.</div>
          <div className="text-stone-600 text-xs font-mono px-3 py-2 mb-1">⬡ Objects</div>
          <div className="bg-white/10 text-white text-xs font-mono px-3 py-2 rounded mb-1">◫ Site Builder</div>
          <div className="text-stone-600 text-xs font-mono px-3 py-2">◈ Analytics</div>
          <div className="mt-4 border-t border-white/5 pt-3 space-y-1">
            <div className="text-xs text-stone-600 uppercase tracking-widest px-2 mb-2">Pages</div>
            <div className="bg-amber-500/10 text-amber-400 text-xs font-mono px-3 py-1.5 rounded">Home</div>
            <div className="text-stone-500 text-xs font-mono px-3 py-1.5">Collection</div>
            <div className="text-stone-500 text-xs font-mono px-3 py-1.5">About</div>
            <div className="text-stone-500 text-xs font-mono px-3 py-1.5">Visit</div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-300 font-mono">Home page</span>
            <div className="flex gap-2">
              <span className="text-xs font-mono border border-white/10 text-stone-400 px-3 py-1 rounded">Preview</span>
              <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">Publish</span>
            </div>
          </div>
          <div className="border border-white/8 rounded-lg overflow-hidden">
            <div className="bg-stone-800 px-4 py-3 flex items-center justify-between border-b border-white/5">
              <span className="font-serif italic text-sm text-stone-300">Westfield Museum<span className="text-amber-500">.</span></span>
              <div className="flex gap-4 text-xs text-stone-500 font-mono">
                <span>Collection</span><span>About</span><span>Visit</span>
              </div>
            </div>
            <div className="bg-stone-800/50 p-4">
              <div className="mb-3">
                <div className="h-2 w-2/3 bg-stone-700 rounded mb-2" />
                <div className="h-2 w-1/2 bg-stone-700/50 rounded" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['🏺', '🖼️', '💎'].map((e, i) => (
                  <div key={i} className="bg-stone-700/40 rounded-lg p-3 aspect-square flex items-center justify-center">
                    <span className="text-2xl">{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  )
}

function AnalyticsMockup({ advanced }: { advanced?: boolean }) {
  const bars = [
    { label: 'Mon', v: 60 }, { label: 'Tue', v: 85 }, { label: 'Wed', v: 72 },
    { label: 'Thu', v: 90 }, { label: 'Fri', v: 78 }, { label: 'Sat', v: 95 }, { label: 'Sun', v: 68 },
  ]
  return (
    <MockupShell url="vitrine.app/dashboard/analytics">
      <div className="bg-stone-900 p-5">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Page views', value: advanced ? '48,291' : '3,842', delta: '+12%' },
            { label: 'Visitors', value: advanced ? '19,104' : '1,247', delta: '+8%' },
            { label: 'Avg. time', value: '2m 34s', delta: '+5%' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="text-xs text-stone-500 mb-1">{s.label}</div>
              <div className="font-serif text-2xl text-white">{s.value}</div>
              <div className="text-xs text-emerald-400 font-mono mt-1">{s.delta} this week</div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/5 rounded-lg p-4">
          <div className="text-xs text-stone-500 font-mono mb-4">Page views — last 7 days</div>
          <div className="flex items-end gap-2 h-20">
            {bars.map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-amber-500/70"
                  style={{ height: `${b.v}%` }}
                />
                <span className="text-xs text-stone-600 font-mono">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        {advanced && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="text-xs text-stone-500 mb-2">Top objects</div>
              {['Portland Vase', 'Arnolfini Portrait', "Tippoo's Tiger"].map(o => (
                <div key={o} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                  <span className="text-stone-400 truncate">{o}</span>
                  <span className="text-stone-600 font-mono ml-2">{Math.floor(Math.random() * 400 + 100)}</span>
                </div>
              ))}
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-3">
              <div className="text-xs text-stone-500 mb-2">Traffic sources</div>
              {[['Direct', '42%'], ['Search', '31%'], ['Social', '27%']].map(([src, pct]) => (
                <div key={src} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
                  <span className="text-stone-400">{src}</span>
                  <span className="text-amber-400 font-mono">{pct}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MockupShell>
  )
}

function ComplianceMockup() {
  return (
    <MockupShell url="vitrine.app/dashboard/compliance">
      <div className="bg-stone-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-mono text-stone-300">Collections compliance</span>
          <span className="text-xs font-mono bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full">87% complete</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 mb-5">
          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '87%' }} />
        </div>
        <div className="space-y-2">
          {[
            { label: 'Provenance documented', objects: 142, done: 131, ok: true },
            { label: 'Acquisition method recorded', objects: 142, done: 142, ok: true },
            { label: 'Conservation status logged', objects: 142, done: 118, ok: true },
            { label: 'Rights & reproduction status', objects: 142, done: 89, ok: false },
            { label: 'Loans agreement on file', objects: 12, done: 12, ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-4 py-3">
              <span className={`text-sm flex-shrink-0 ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                {item.ok ? '✓' : '!'}
              </span>
              <span className="text-sm text-stone-300 flex-1">{item.label}</span>
              <span className="text-xs font-mono text-stone-600">{item.done}/{item.objects}</span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  )
}

function StaffMockup() {
  return (
    <MockupShell url="vitrine.app/dashboard/staff">
      <div className="bg-stone-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-mono text-stone-300">Staff & roles</span>
          <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">+ Invite</span>
        </div>
        <div className="space-y-2">
          {[
            { name: 'Sarah Mitchell', role: 'Admin', initials: 'SM', active: true },
            { name: 'James Okafor', role: 'Curator', initials: 'JO', active: true },
            { name: 'Priya Sharma', role: 'Registrar', initials: 'PS', active: true },
            { name: 'Tom Elliot', role: 'Volunteer', initials: 'TE', active: false },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 text-xs font-mono flex items-center justify-center flex-shrink-0">
                {s.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-stone-200">{s.name}</div>
                <div className="text-xs text-stone-500 font-mono">{s.role}</div>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${s.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-stone-500/10 text-stone-500'}`}>
                {s.active ? 'Active' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MockupShell>
  )
}

function TicketingMockup() {
  return (
    <MockupShell url="vitrine.app/dashboard/events">
      <div className="bg-stone-900 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-mono text-stone-300">Upcoming events</span>
          <span className="text-xs font-mono bg-amber-500 text-stone-950 px-3 py-1 rounded">+ New event</span>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Behind the Collection', date: '14 Mar 2026', capacity: 40, booked: 37, type: 'Guided tour' },
            { title: 'Conservation Talk', date: '22 Mar 2026', capacity: 60, booked: 24, type: 'Lecture' },
            { title: 'Family Open Day', date: '5 Apr 2026', capacity: 200, booked: 89, type: 'Public event' },
          ].map(ev => {
            const pct = Math.round((ev.booked / ev.capacity) * 100)
            return (
              <div key={ev.title} className="bg-white/5 border border-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm text-stone-200">{ev.title}</div>
                    <div className="text-xs text-stone-500 font-mono">{ev.date} · {ev.type}</div>
                  </div>
                  <span className="text-xs font-mono text-amber-400">{ev.booked}/{ev.capacity}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full ${pct > 85 ? 'bg-amber-500' : 'bg-emerald-500/60'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </MockupShell>
  )
}

function VisitInfoMockup() {
  return (
    <MockupShell url="westfieldmuseum.vitrine.app/visit">
      <div className="bg-stone-800/60 p-5">
        <div className="bg-stone-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="bg-stone-700/50 h-24 flex items-center justify-center">
            <span className="text-stone-500 text-xs font-mono">Museum exterior photo</span>
          </div>
          <div className="p-4">
            <h3 className="font-serif italic text-lg text-stone-200 mb-1">Plan your visit</h3>
            <p className="text-xs text-stone-500 mb-4">Westfield Museum · Open Tuesday – Sunday</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Opening hours', value: '10:00 – 17:00' },
                { label: 'Admission', value: 'Free entry' },
                { label: 'Address', value: '12 Market St' },
                { label: 'Accessibility', value: 'Step-free access' },
              ].map(item => (
                <div key={item.label} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-stone-600 uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="text-sm text-stone-300">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockupShell>
  )
}

// ── Feature section layout ────────────────────────────────────────────────────

function FeatureSection({
  label, title, desc, bullets, mockup, flip,
}: {
  label: string
  title: string
  desc: string
  bullets: string[]
  mockup: React.ReactNode
  flip?: boolean
}) {
  return (
    <div className={`flex flex-col gap-12 ${flip ? 'lg:flex-row-reverse' : 'lg:flex-row'} lg:items-center`}>
      <div className="lg:w-2/5 flex-shrink-0">
        <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">{label}</p>
        <h3 className="font-serif text-3xl italic font-normal mb-4">{title}</h3>
        <p className="text-stone-400 font-light leading-relaxed mb-6">{desc}</p>
        <ul className="space-y-2.5">
          {bullets.map(b => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-stone-300">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">✓</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:flex-1 min-w-0">{mockup}</div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PlanPage({ params }: { params: Promise<{ tier: string }> }) {
  const { tier } = await params
  const planId = tier as PlanId
  if (!PLANS[planId]) notFound()

  const plan = PLANS[planId]
  const details = PLAN_DETAILS[planId]
  const stats = STAT_LABELS[planId]

  const isEnterprise = planId === 'enterprise'
  const hasFull = plan.fullMode
  const hasAnalytics = plan.analytics
  const hasCompliance = plan.compliance
  const hasTicketing = plan.ticketing
  const hasVisitInfo = plan.visitInfo
  const hasStaff = (plan.staff === null || (plan.staff !== null && plan.staff > 1))

  const pageUrl = `${SITE_URL}/plans/${planId}`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${SITE_URL}/#pricing` },
      { '@type': 'ListItem', position: 3, name: `${plan.label} Plan`, item: pageUrl },
    ],
  }

  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `Vitrine – ${plan.label} Plan`,
    url: pageUrl,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any (Web Browser)',
    description: details.desc,
    offers: {
      '@type': 'Offer',
      name: plan.label,
      price: details.priceDisplay === 'Free' ? '0' : details.priceDisplay === 'Custom' ? undefined : details.priceDisplay.replace('£', ''),
      priceCurrency: 'GBP',
      url: pageUrl,
    },
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={offerSchema} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">Vitrine<span className="text-amber-500">.</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-stone-400 hover:text-white transition-colors font-mono">Sign in</Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row lg:items-center lg:gap-16">
          <div className="lg:w-2/5 flex-shrink-0 mb-16 lg:mb-0">
            <Link href="/#pricing" className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors mb-8">
              ← All plans
            </Link>
            <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">{plan.label}</p>
            <h1 className="font-serif text-6xl italic font-normal mb-3 leading-none">
              {details.priceDisplay}
              {details.priceNote && (
                <span className="text-stone-500 text-2xl not-italic font-light ml-2">{details.priceNote}</span>
              )}
            </h1>
            <p className="text-xl font-light text-stone-300 mb-3">{details.tagline}</p>
            <p className="text-stone-400 font-light leading-relaxed mb-8">{details.desc}</p>
            <Link
              href={details.ctaHref}
              className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-8 py-3 rounded transition-colors"
            >
              {details.cta}
            </Link>
          </div>
          <div className="lg:flex-1 min-w-0">
            <CollectionMockup />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
          {stats.map(s => (
            <div key={s.label} className="bg-stone-900/50 border border-white/8 rounded-xl p-6 text-center">
              <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">{s.label}</p>
              <p className="font-serif text-3xl italic text-white">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature sections */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-32">

          {/* Collection catalogue — all plans */}
          <FeatureSection
            label="Collection management"
            title="Your entire collection, beautifully catalogued."
            desc="Every object gets its own rich record — images, provenance, medium, dimensions, acquisition history, and custom fields. Search and filter across your whole catalogue in an instant."
            bullets={[
              `Up to ${plan.objects === null ? 'unlimited' : plan.objects.toLocaleString()} collection objects`,
              `${plan.imagesPerObject} ${plan.imagesPerObject === 1 ? 'image' : 'images'} per object`,
              'Full text search and filtering',
              'Custom fields and categories',
              'Bulk import via CSV',
            ]}
            mockup={<CollectionMockup />}
            flip={false}
          />

          {/* Public website — all plans */}
          <FeatureSection
            label="Public website"
            title={hasFull ? 'A complete public-facing website.' : 'A beautiful online presence.'}
            desc={
              hasFull
                ? 'Your Vitrine site is a full multi-page museum website — home, collection browser, about, visit info, and more. No developer required.'
                : 'Get a professional collection website that you can customise with your logo, colours, and content. Share your collection with the world.'
            }
            bullets={
              hasFull
                ? [
                    'Home, collection, about, and visit pages',
                    'Fully branded to your museum',
                    'Mobile-optimised and accessible',
                    'SEO-ready out of the box',
                  ]
                : [
                    'Public collection browsing page',
                    'Custom logo and colour scheme',
                    'Mobile-optimised layout',
                    'Object detail pages',
                  ]
            }
            mockup={<SiteBuilderMockup />}
            flip={true}
          />

          {/* Visit info — Professional+ */}
          {hasVisitInfo && (
            <FeatureSection
              label="Visitor information"
              title="Tell visitors everything they need to know."
              desc="Add opening hours, admission prices, accessibility information, and directions directly to your public website. Keep it updated without touching any code."
              bullets={[
                'Opening hours and admission details',
                'Accessibility and facilities information',
                'Directions and transport links',
                'Seasonal closures and special notices',
                'Managed from your dashboard',
              ]}
              mockup={<VisitInfoMockup />}
              flip={false}
            />
          )}

          {/* Compliance — Professional+ */}
          {hasCompliance && (
            <FeatureSection
              label="Collections compliance"
              title="Stay on top of your obligations."
              desc="Vitrine tracks provenance, rights, conservation status, and loan agreements across your entire collection — so you can demonstrate due diligence at any time."
              bullets={[
                'Provenance and acquisition tracking',
                'Rights and reproduction status',
                'Conservation condition records',
                'Loan and transfer agreements',
                'Compliance progress dashboard',
                plan.documentStorageMb === null ? 'Unlimited document storage' : `${plan.documentStorageMb! >= 1024 ? plan.documentStorageMb! / 1024 + ' GB' : plan.documentStorageMb + ' MB'} document storage`,
              ]}
              mockup={<ComplianceMockup />}
              flip={true}
            />
          )}

          {/* Analytics — Professional+ */}
          {hasAnalytics && (
            <FeatureSection
              label="Analytics"
              title="Understand who visits your site."
              desc="See how many people are visiting your collection site, which objects are most popular, and how your audience is growing week on week."
              bullets={[
                'Page views and visitor counts',
                'Most-viewed objects',
                'Weekly trend charts',
              ]}
              mockup={<AnalyticsMockup advanced={false} />}
              flip={hasCompliance}
            />
          )}

          {/* Staff — Professional+ */}
          {hasStaff && (
            <FeatureSection
              label="Staff & roles"
              title="Collaborate with your whole team."
              desc={
                plan.staff === null
                  ? 'Add as many staff members as you need. Assign roles — Admin, Curator, Registrar, Volunteer — so everyone has exactly the right level of access.'
                  : `Add up to ${plan.staff} team members. Assign roles so curators, registrars, and volunteers each have exactly the right level of access.`
              }
              bullets={[
                plan.staff === null ? 'Unlimited staff accounts' : `Up to ${plan.staff} staff accounts`,
                'Role-based access control',
                'Admin, Curator, Registrar, and Volunteer roles',
                'Email invitations',
                'Activity log per staff member',
              ]}
              mockup={<StaffMockup />}
              flip={!hasCompliance}
            />
          )}

          {/* Ticketing — Professional+ */}
          {hasTicketing && (
            <FeatureSection
              label="Event ticketing"
              title="Sell tickets and manage events."
              desc="Create events, set capacity limits, and accept online bookings directly through your Vitrine website. Track attendance and send confirmation emails — all included."
              bullets={[
                'Unlimited events',
                'Capacity management and waiting lists',
                'Online booking via your public site',
                'Automated confirmation emails',
                'Attendance tracking dashboard',
              ]}
              mockup={<TicketingMockup />}
              flip={true}
            />
          )}

        </div>
      </section>

      {/* Guide CTA */}
      {(() => {
        const guideHref = hasFull ? '/guide/professional' : '/guide/essentials'
        const guideLabel = hasFull ? 'Professional guide' : 'Essentials guide'
        return (
          <section className="py-16 px-6 border-t border-white/5">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 bg-stone-900/50 border border-white/8 rounded-2xl px-8 py-7">
              <div>
                <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">Step-by-step guide</p>
                <h3 className="font-serif text-2xl italic font-normal mb-1">Want to see exactly how it works?</h3>
                <p className="text-stone-400 text-sm font-light">Detailed walkthroughs for every feature on the {plan.label} plan.</p>
              </div>
              <Link
                href={guideHref}
                className="flex-shrink-0 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-mono text-sm px-6 py-3 rounded transition-colors whitespace-nowrap"
              >
                Read the {guideLabel} →
              </Link>
            </div>
          </section>
        )
      })()}

      {/* Bottom CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">{plan.label}</p>
          <h2 className="font-serif text-5xl italic font-normal mb-4">Ready to get started?</h2>
          <p className="text-stone-400 font-light text-lg mb-8">Join museums and collectors already using Vitrine.</p>
          <Link
            href={details.ctaHref}
            className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-10 py-3.5 rounded transition-colors"
          >
            {details.cta}
          </Link>
          {!isEnterprise && (
            <p className="text-xs text-stone-600 mt-4 font-mono">No credit card required · Cancel any time</p>
          )}
          <div className="mt-6">
            <Link href="/#pricing" className="text-xs font-mono text-stone-600 hover:text-stone-400 transition-colors">
              ← Compare all plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-serif italic text-stone-600">Vitrine<span className="text-amber-500">.</span></span>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-stone-600 hover:text-stone-400 font-mono transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-stone-600 hover:text-stone-400 font-mono transition-colors">Terms</Link>
          </div>
          <span className="text-xs text-stone-700 font-mono">© 2026 Composition Limited.</span>
        </div>
      </footer>

    </div>
  )
}
