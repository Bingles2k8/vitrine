import Link from 'next/link'
import { PLANS, PLAN_ORDER, PlanId } from '@/lib/plans'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata = buildPageMetadata({
  title: 'Pricing – Collection Management Software Plans',
  description:
    'Vitrine pricing: free for small collections, £5/month for hobbyists, £79/month for working museums, £349/month for large institutions. No credit card required to start.',
  path: '/plans',
  keywords: [
    'vitrine pricing',
    'collection management software pricing',
    'museum software pricing',
    'collection app cost',
    'free collection management software',
  ],
})

const PRICE_NUMBER: Record<PlanId, string | null> = {
  community: '0',
  hobbyist: '5',
  professional: '79',
  institution: '349',
  enterprise: null,
}

const TAGLINES: Record<PlanId, string> = {
  community: 'Start cataloguing for free.',
  hobbyist: 'More room to grow.',
  professional: 'Everything a working museum needs.',
  institution: 'Built for serious collections.',
  enterprise: 'No limits. Full service.',
}

const PRICING_FAQS = [
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. The Community plan is permanently free and includes core cataloguing features for small collections. No credit card is required to sign up. You can upgrade to a paid plan at any time as your collection grows.',
  },
  {
    question: 'Which Vitrine plan do I need?',
    answer:
      'Community (free) covers up to 100 objects — ideal for trying Vitrine or cataloguing a small personal collection. Hobbyist (£5/month) covers up to 1,000 objects with analytics, CSV import, and full site customisation. Professional (£79/month) adds compliance tools, event ticketing, visitor analytics, and 10 staff accounts for working museums. Institution (£349/month) scales to 100,000 objects with unlimited staff.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'The Professional plan comes with a 30-day free trial — cancel anytime during the trial and you pay nothing. The Community plan is free forever, so you can also evaluate Vitrine without a trial.',
  },
  {
    question: 'Do you offer discounts for non-profit organisations?',
    answer:
      'Yes. Registered charities and non-profit cultural organisations can apply for a discount on Professional and Institution plans. Contact us via the enterprise enquiry form with details of your organisation.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'You can export all your data as CSV before cancelling. After cancellation, your account and data are retained for 30 days, during which you can reactivate. After 30 days, data is permanently deleted in accordance with our privacy policy.',
  },
]

function formatStorage(mb: number | null): string {
  if (mb === null) return 'Unlimited'
  if (mb === 0) return '—'
  if (mb >= 1024) return `${mb / 1024} GB`
  return `${mb} MB`
}

function Check() {
  return <span className="text-emerald-400">✓</span>
}

function Dash() {
  return <span className="text-stone-600">—</span>
}

export default function PlansPage() {
  const pageUrl = `${SITE_URL}/plans`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: pageUrl },
    ],
  }

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Vitrine',
    url: pageUrl,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any (Web Browser)',
    description:
      'Collection management software for museums, galleries, and collectors. Free to start, with plans from £5/month.',
    offers: PLAN_ORDER.filter((id) => PRICE_NUMBER[id] !== null).map((id) => ({
      '@type': 'Offer',
      name: `${PLANS[id].label} Plan`,
      price: PRICE_NUMBER[id],
      priceCurrency: 'GBP',
      url: `${SITE_URL}/plans/${id}`,
    })),
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  const comparisonRows: Array<{
    label: string
    value: (id: PlanId) => React.ReactNode
  }> = [
    {
      label: 'Collection items',
      value: (id) => (PLANS[id].objects === null ? 'Unlimited' : PLANS[id].objects!.toLocaleString()),
    },
    {
      label: 'Staff accounts',
      value: (id) => (PLANS[id].staff === null ? 'Unlimited' : String(PLANS[id].staff)),
    },
    {
      label: 'Images per object',
      value: (id) => String(PLANS[id].imagesPerObject),
    },
    {
      label: 'Document storage',
      value: (id) => formatStorage(PLANS[id].documentStorageMb),
    },
    {
      label: 'Public collection website',
      value: () => <Check />,
    },
    {
      label: 'Analytics & CSV import',
      value: (id) => (PLANS[id].analytics ? <Check /> : <Dash />),
    },
    {
      label: 'Visitor analytics',
      value: (id) => (PLANS[id].visitorAnalytics ? <Check /> : <Dash />),
    },
    {
      label: 'Compliance procedures',
      value: (id) => (PLANS[id].compliance ? <Check /> : <Dash />),
    },
    {
      label: 'Event ticketing',
      value: (id) => (PLANS[id].ticketing ? <Check /> : <Dash />),
    },
    {
      label: '“Plan your visit” pages',
      value: (id) => (PLANS[id].visitInfo ? <Check /> : <Dash />),
    },
    {
      label: 'Wishlist',
      value: (id) => (PLANS[id].wishlist ? <Check /> : <Dash />),
    },
    {
      label: 'Remove Vitrine branding',
      value: (id) => (PLANS[id].hideVitrineBranding ? <Check /> : <Dash />),
    },
  ]

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={appSchema} />
      <JsonLd data={faqSchema} />

      <PublicNav />

      {/* Hero */}
      <section className="pt-40 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative text-center">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="font-serif text-5xl sm:text-6xl italic font-normal leading-none tracking-tight mb-6">
            Simple pricing for every collection.
          </h1>
          <p className="text-lg text-stone-400 font-light leading-relaxed max-w-2xl mx-auto">
            Free for small collections. £5/month for serious hobbyists.
            Museum-grade plans from £79/month. No credit card required to start.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id]
            return (
              <div
                key={id}
                className={`flex flex-col border rounded-xl p-6 ${
                  plan.featured ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/8 bg-stone-900/40'
                }`}
              >
                {plan.featured && (
                  <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-3">Most popular</p>
                )}
                <h2 className="font-serif text-2xl italic mb-1">{plan.label}</h2>
                <p className="font-mono text-sm text-stone-300 mb-4">{plan.price}</p>
                <p className="text-sm text-stone-400 font-light leading-relaxed mb-5">{TAGLINES[id]}</p>
                <ul className="text-sm text-stone-400 font-light space-y-2 mb-6">
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-amber-500/70">·</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto space-y-2">
                  {plan.comingSoon ? (
                    <span className="block text-center font-mono text-xs px-4 py-2.5 rounded border border-white/10 text-stone-500 cursor-default">
                      Coming soon
                    </span>
                  ) : (
                    <Link
                      href={id === 'enterprise' ? '/contact/enterprise' : '/signup'}
                      className={`block text-center font-mono text-xs px-4 py-2.5 rounded transition-colors ${
                        plan.featured
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                          : 'border border-white/10 hover:border-white/25 text-stone-300'
                      }`}
                    >
                      {id === 'enterprise' ? 'Contact us →' : 'Get started →'}
                    </Link>
                  )}
                  <Link
                    href={`/plans/${id}`}
                    className="block text-center font-mono text-xs text-stone-500 hover:text-stone-300 transition-colors py-1"
                  >
                    Plan details
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Comparison table */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl italic mb-8">Compare plans</h2>
          <div className="overflow-x-auto border border-white/8 rounded-xl">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/8 bg-stone-900/60">
                  <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-stone-500 font-normal">
                    Feature
                  </th>
                  {PLAN_ORDER.map((id) => (
                    <th key={id} className="px-4 py-3 font-normal whitespace-nowrap">
                      <span className="font-serif italic text-base">{PLANS[id].label}</span>
                      <span className="block font-mono text-xs text-stone-500 mt-0.5">{PLANS[id].price}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? 'bg-stone-900/30' : ''}>
                    <td className="px-4 py-3 text-stone-300 font-light">{row.label}</td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="px-4 py-3 text-stone-400 font-light whitespace-nowrap">
                        {row.value(id)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-stone-600 font-light mt-4">
            All prices in GBP. Professional includes a 30-day free trial. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing FAQs */}
      <section className="pb-28 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl italic mb-8">Pricing questions</h2>
          <div className="space-y-8">
            {PRICING_FAQS.map((f) => (
              <div key={f.question}>
                <h3 className="text-lg font-light text-stone-200 mb-2">{f.question}</h3>
                <p className="text-stone-400 font-light leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
          <p className="text-stone-400 font-light mt-10">
            More questions? See the <Link href="/faq" className="text-amber-500 hover:text-amber-400">full FAQ</Link> or{' '}
            <Link href="/contact/enterprise" className="text-amber-500 hover:text-amber-400">get in touch</Link>.
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
