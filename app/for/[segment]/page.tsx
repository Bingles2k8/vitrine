import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { segments, getSegment } from '@/lib/segments'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { MockupListView, MockupDetailView } from '@/components/SegmentMockup'

export function generateStaticParams() {
  return segments.map((s) => ({ segment: s.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params
  const data = getSegment(segment)
  if (!data) return {}
  return buildPageMetadata({
    title: data.metaTitle,
    description: data.metaDescription,
    path: `/for/${data.slug}`,
    keywords: data.keywords,
  })
}

export default async function SegmentPage({
  params,
}: {
  params: Promise<{ segment: string }>
}) {
  const { segment } = await params
  const data = getSegment(segment)
  if (!data) notFound()

  const pageUrl = `${SITE_URL}/for/${data.slug}`

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `Vitrine for ${data.name}`,
    url: pageUrl,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any (Web Browser)',
    description: data.schemaDescription,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'GBP',
      lowPrice: '0',
      highPrice: '5',
      offerCount: 2,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: `${SITE_URL}/for` },
      { '@type': 'ListItem', position: 3, name: data.name, item: pageUrl },
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
      <JsonLd data={webAppSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <PublicNav />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li>Collections</li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">{data.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl italic font-normal leading-tight mb-6">
            {data.h1}
          </h1>
          <p className="text-lg text-stone-300 leading-relaxed max-w-2xl mb-8">
            {data.answerCapsule}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors"
            >
              Start for free →
            </Link>
            <Link
              href="/#pricing"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-6 py-3 rounded transition-colors"
            >
              See pricing
            </Link>
          </div>
        </section>

        {/* List view mockup */}
        <div className="mb-16" aria-hidden="true">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-4 font-mono">
            Your collection in Vitrine
          </p>
          <MockupListView items={data.mockListItems} collectionName={data.name} />
        </div>

        {/* Pain points */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            Why {data.collectorNoun}s choose Vitrine
          </h2>
          <div className="space-y-8">
            {data.painPoints.map((point) => (
              <div key={point.heading}>
                <h3 className="text-lg font-medium text-white mb-2">{point.heading}</h3>
                <p className="text-stone-400 leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            Features for {data.collectorNoun}s
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {data.features.map((feature) => (
              <div key={feature.name} className="border border-white/8 rounded-lg p-5">
                <h3 className="font-medium text-white mb-1">{feature.name}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Detail view mockup */}
        <div className="mb-16" aria-hidden="true">
          <p className="text-xs uppercase tracking-widest text-stone-600 mb-4 font-mono">
            Item detail view
          </p>
          <MockupDetailView detail={data.mockDetail} />
        </div>

        {/* How to steps */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            How to catalog your {data.items} with Vitrine
          </h2>
          <ol className="space-y-6">
            {data.steps.map((step, i) => (
              <li key={step.heading} className="flex gap-5">
                <span className="flex-shrink-0 w-8 h-8 rounded-full border border-amber-500/40 text-amber-500 font-mono text-sm flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-medium text-white mb-1">{step.heading}</h3>
                  <p className="text-stone-400 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Comparison table */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-6">
            Vitrine vs other {data.items} tools
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pr-6 text-stone-400 font-medium">Tool</th>
                  <th className="text-left py-3 text-stone-400 font-medium">Limitation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5">
                  <td className="py-3 pr-6 font-medium text-amber-500">Vitrine</td>
                  <td className="py-3 text-stone-300">Web-based, free to start, full cataloguing with public collection page</td>
                </tr>
                {data.competitors.map((comp) => (
                  <tr key={comp.name} className="border-b border-white/5">
                    <td className="py-3 pr-6 font-medium text-stone-300">{comp.name}</td>
                    <td className="py-3 text-stone-500">{comp.weakness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-16 p-8 border border-white/10 rounded-lg">
          <h2 className="text-2xl font-medium text-white mb-4">
            Pricing for {data.collectorNoun}s
          </h2>
          <div className="space-y-3 mb-6 text-stone-400">
            <p><span className="text-white font-medium">Community</span> — Free. Up to 100 items, public collection page, core cataloguing.</p>
            <p><span className="text-white font-medium">Hobbyist</span> — £5/month. Up to 500 items, public collection page, core cataloguing tools.</p>
            <p><span className="text-white font-medium">Professional</span> — £79/month. Up to 5,000 items, full dashboard, CSV import, analytics, event ticketing, compliance tools, and staff accounts.</p>
          </div>
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors inline-block"
          >
            Start free →
          </Link>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            Frequently asked questions
          </h2>
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
        <section className="p-8 border border-white/10 rounded-lg text-center">
          <h2 className="text-2xl font-medium text-white mb-3">
            Start cataloguing your {data.items}
          </h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto">
            Free to start. No credit card required. Your collection stays private until you choose to share it.
          </p>
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-8 py-3 rounded transition-colors inline-block"
          >
            Create your free account →
          </Link>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
