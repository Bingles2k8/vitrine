import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { competitors, getCompetitor, type FeatureIcon } from '@/lib/competitors'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export function generateStaticParams() {
  return competitors.map((c) => ({ competitor: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ competitor: string }>
}) {
  const { competitor } = await params
  const data = getCompetitor(competitor)
  if (!data) return {}
  return buildPageMetadata({
    title: data.metaTitle,
    description: data.metaDescription,
    path: `/compare/${data.slug}`,
    keywords: data.keywords,
  })
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.09l6.793-6.793a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CrossIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.293 5.293a1 1 0 011.414 0L10 8.586l3.293-3.293a1 1 0 111.414 1.414L11.414 10l3.293 3.293a1 1 0 01-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function DashIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-4 h-4 flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect x="4" y="9" width="12" height="2" rx="1" />
    </svg>
  )
}

function FeatureCell({ icon, text, isVitrine }: { icon: FeatureIcon; text: string; isVitrine: boolean }) {
  const textColor = isVitrine ? 'text-stone-100' : 'text-stone-400'
  return (
    <span className={`inline-flex items-start gap-2 ${textColor}`}>
      {icon === 'check' && <CheckIcon className={`${isVitrine ? 'text-amber-400' : 'text-stone-500'} mt-0.5`} />}
      {icon === 'cross' && <CrossIcon className="text-stone-600 mt-0.5" />}
      {icon === 'neutral' && <DashIcon className="text-stone-600 mt-0.5" />}
      <span>{text}</span>
    </span>
  )
}

export default async function CompetitorPage({
  params,
}: {
  params: Promise<{ competitor: string }>
}) {
  const { competitor } = await params
  const data = getCompetitor(competitor)
  if (!data) notFound()

  const pageUrl = `${SITE_URL}/compare/${data.slug}`
  const today = new Date().toISOString().split('T')[0]

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.metaTitle,
    description: data.metaDescription,
    datePublished: today,
    dateModified: today,
    author: { '@type': 'Organization', name: 'Vitrine', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Vitrine',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Compare', item: `${SITE_URL}/compare` },
      { '@type': 'ListItem', position: 3, name: data.metaTitle, item: pageUrl },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <PublicNav />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li><Link href="/compare" className="hover:text-stone-300 transition-colors">Compare</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">{data.name} Alternative</li>
          </ol>
        </nav>

        {/* Shutdown banner (Delicious Library only) */}
        {data.shutdownBanner && (
          <div className="mb-10 border-l-4 border-amber-500 bg-amber-500/10 rounded-r-lg p-5 flex items-start gap-4">
            <div className="bg-amber-500 text-stone-950 rounded-full w-7 h-7 flex items-center justify-center font-bold text-base flex-shrink-0">
              !
            </div>
            <p className="text-amber-50 font-medium leading-relaxed pt-0.5">{data.shutdownBanner}</p>
          </div>
        )}

        {/* Hero */}
        <section className="mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl italic font-normal leading-tight mb-6">
            {data.h1}
          </h1>
          <p className="text-lg text-stone-300 leading-relaxed max-w-2xl mb-8">
            {data.answerCapsule}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors inline-block"
            >
              Try it free, no card needed
            </Link>
            <a
              href="#comparison"
              className="text-sm text-stone-400 hover:text-stone-200 transition-colors font-mono px-3 py-3"
            >
              See full comparison ↓
            </a>
          </div>
          <p className="text-xs text-stone-500 mt-3 font-mono">
            Free forever up to 100 items.
          </p>
        </section>

        {/* Social proof strip (real, verifiable facts) */}
        <div className="mb-16 border-t border-b border-white/5 py-4">
          <p className="text-sm text-stone-400 text-center">
            {data.socialProofLine}
          </p>
        </div>

        {/* Feature comparison table */}
        <section id="comparison" className="mb-10 scroll-mt-24">
          <h2 className="text-2xl font-medium text-white mb-6">
            Vitrine vs {data.name}: side by side
          </h2>
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left py-4 px-5 text-stone-400 font-medium w-1/3">Feature</th>
                  <th className="text-left py-4 px-5 text-amber-400 font-medium w-1/3 bg-amber-500/[0.04]">Vitrine</th>
                  <th className="text-left py-4 px-5 text-stone-400 font-medium w-1/3">{data.name}</th>
                </tr>
              </thead>
              <tbody>
                {data.featureComparison.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i === data.featureComparison.length - 1 ? '' : 'border-b border-white/5'}
                  >
                    <td className="py-3 px-5 text-stone-400">{row.feature}</td>
                    <td className="py-3 px-5 bg-amber-500/[0.04]">
                      <FeatureCell icon={row.vitrineIcon} text={row.vitrine} isVitrine={true} />
                    </td>
                    <td className="py-3 px-5">
                      <FeatureCell icon={row.competitorIcon} text={row.competitor} isVitrine={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Post-table CTA (highest-intent moment) */}
        <section className="mb-16 p-5 border border-amber-500/30 bg-amber-500/[0.03] rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-stone-200 text-sm">Convinced? Start free up to 100 items.</p>
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-5 py-2.5 rounded transition-colors inline-block whitespace-nowrap self-start sm:self-auto"
          >
            Start free →
          </Link>
        </section>

        {/* Why switch to Vitrine (positive first) */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            Why collectors switch to Vitrine
          </h2>
          <div className="space-y-8">
            {data.whySwitchPoints.map((p) => (
              <div key={p.heading} className="border-l-2 border-amber-500/40 pl-6">
                <h3 className="text-lg font-medium text-white mb-2">{p.heading}</h3>
                <p className="text-stone-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Where competitor struggles */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            {data.weaknessesHeading}
          </h2>
          <div className="space-y-8">
            {data.weaknesses.map((w) => (
              <div key={w.heading}>
                <h3 className="text-lg font-medium text-white mb-2">{w.heading}</h3>
                <p className="text-stone-400 leading-relaxed">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing comparison */}
        <section className="mb-6">
          <h2 className="text-2xl font-medium text-white mb-6">Pricing comparison</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-amber-500/40 rounded-lg p-6 bg-amber-500/[0.03]">
              <p className="text-xs uppercase tracking-widest text-amber-400 font-mono mb-3">Vitrine</p>
              <p className="text-3xl font-medium text-white mb-1">Free</p>
              <p className="text-stone-400 text-sm mb-4">Community plan, up to 100 items</p>
              <p className="text-3xl font-medium text-white mb-1">£5<span className="text-lg text-stone-400">/month</span></p>
              <p className="text-stone-400 text-sm">Hobbyist plan, up to 1,000 items</p>
              {data.vitrineAnnualPrice && (
                <p className="text-xs text-amber-400/80 font-mono mt-4 pt-4 border-t border-amber-500/20">
                  {data.vitrineAnnualPrice}
                </p>
              )}
            </div>
            <div className="border border-white/10 rounded-lg p-6">
              <p className="text-xs uppercase tracking-widest text-stone-500 font-mono mb-3">{data.name}</p>
              <p className="text-3xl font-medium text-stone-300 mb-1">{data.competitorPrice}</p>
              <p className="text-stone-500 text-sm">{data.competitorPriceNote}</p>
              {data.competitorAnnualPrice && (
                <p className="text-xs text-stone-500 font-mono mt-4 pt-4 border-t border-white/5">
                  {data.competitorAnnualPrice}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Savings callout (prominent) */}
        {data.savingsLine && (
          <div className="mb-10 p-5 border-2 border-amber-500/50 bg-amber-500/[0.06] rounded-lg flex items-center gap-4">
            <div className="bg-amber-500 text-stone-950 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
              <CheckIcon className="w-5 h-5" />
            </div>
            <p className="text-amber-50 font-medium text-base">{data.savingsLine}</p>
          </div>
        )}

        {/* CTA + risk reversal */}
        <section className="mb-16 p-6 border border-white/10 rounded-lg bg-white/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-white font-medium mb-1">Start on the free plan</p>
              <p className="text-stone-400 text-sm">No credit card. Cancel anytime. Export to CSV whenever you like.</p>
            </div>
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors inline-block whitespace-nowrap"
            >
              Create your account →
            </Link>
          </div>
        </section>

        {/* Migration guide (collapsible) */}
        <section className="mb-16">
          <details className="group border border-white/10 rounded-lg">
            <summary className="cursor-pointer list-none p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div>
                <h2 className="text-lg font-medium text-white">
                  How to migrate from {data.name}
                </h2>
                <p className="text-stone-400 text-sm mt-1">Most collections move over in an evening. Tap to see the steps.</p>
              </div>
              <span className="text-stone-500 font-mono text-sm flex-shrink-0 ml-4 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-5 pb-6 pt-2 border-t border-white/5">
              <ol className="space-y-6 mt-4">
                {data.migrationSteps.map((step, i) => (
                  <li key={step.heading} className="flex gap-5">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full border border-amber-500/40 text-amber-400 font-mono text-sm flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-white mb-1">{step.heading}</h3>
                      <p className="text-stone-400 leading-relaxed text-sm">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">Frequently asked questions</h2>
          <div className="space-y-8">
            {data.faqs.map((faq) => (
              <div key={faq.question} className="border-b border-white/5 pb-8">
                <h3 className="text-lg font-medium text-white mb-3">{faq.question}</h3>
                <p className="text-stone-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="p-8 border border-amber-500/30 bg-amber-500/[0.03] rounded-lg text-center">
          {data.whyNow && (
            <p className="text-amber-400/90 text-sm mb-4 italic">{data.whyNow}</p>
          )}
          <h2 className="text-2xl font-medium text-white mb-3">
            Ready to switch from {data.name}?
          </h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto">
            Free to start, no credit card needed. Your collection stays private until you choose to share it.
          </p>
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-8 py-3 rounded transition-colors inline-block"
          >
            Switch from {data.name} →
          </Link>
          <p className="text-xs text-stone-500 mt-4 font-mono">
            Export to CSV anytime · Cancel in one click · Free up to 100 items
          </p>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
