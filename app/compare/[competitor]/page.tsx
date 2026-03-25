import { notFound } from 'next/navigation'
import Link from 'next/link'
import { competitors, getCompetitor } from '@/lib/competitors'
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

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">
            Vitrine<span className="text-amber-500">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm text-stone-400 hover:text-white transition-colors">Discover</Link>
            <Link href="/#features" className="text-sm text-stone-400 hover:text-white transition-colors">Features</Link>
            <Link href="/#pricing" className="text-sm text-stone-400 hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-stone-400 hover:text-white transition-colors font-mono">
              Sign in
            </Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li>Compare</li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">{data.name} Alternative</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="font-serif text-5xl md:text-6xl italic font-normal leading-tight mb-6">
            {data.h1}
          </h1>
          <p className="text-lg text-stone-300 leading-relaxed max-w-2xl">
            {data.answerCapsule}
          </p>
        </section>

        {/* Feature comparison table */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-6">
            Quick comparison: Vitrine vs {data.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 pr-6 text-stone-400 font-medium w-1/3">Feature</th>
                  <th className="text-left py-3 pr-6 text-amber-500 font-medium w-1/3">Vitrine</th>
                  <th className="text-left py-3 text-stone-400 font-medium w-1/3">{data.name}</th>
                </tr>
              </thead>
              <tbody>
                {data.featureComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5">
                    <td className="py-3 pr-6 text-stone-400">{row.feature}</td>
                    <td className="py-3 pr-6 text-stone-200">{row.vitrine}</td>
                    <td className="py-3 text-stone-500">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Where competitor falls short */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            Where {data.name} falls short
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

        {/* Why switch to Vitrine */}
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

        {/* Pricing comparison */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-6">Pricing comparison</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-amber-500/30 rounded-lg p-6">
              <p className="text-xs uppercase tracking-widest text-amber-500 font-mono mb-3">Vitrine</p>
              <p className="text-3xl font-medium text-white mb-1">Free</p>
              <p className="text-stone-400 text-sm mb-4">Community plan — up to 100 items</p>
              <p className="text-3xl font-medium text-white mb-1">£5<span className="text-lg text-stone-400">/month</span></p>
              <p className="text-stone-400 text-sm">Hobbyist plan — up to 500 items</p>
            </div>
            <div className="border border-white/10 rounded-lg p-6">
              <p className="text-xs uppercase tracking-widest text-stone-500 font-mono mb-3">{data.name}</p>
              <p className="text-3xl font-medium text-stone-300 mb-1">{data.competitorPrice}</p>
              <p className="text-stone-500 text-sm">{data.competitorPriceNote}</p>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors inline-block"
            >
              Start free with Vitrine →
            </Link>
          </div>
        </section>

        {/* Migration guide */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">
            How to migrate from {data.name} to Vitrine
          </h2>
          <ol className="space-y-6">
            {data.migrationSteps.map((step, i) => (
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
        <section className="p-8 border border-white/10 rounded-lg text-center">
          <h2 className="text-2xl font-medium text-white mb-3">
            Ready to switch from {data.name}?
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

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
          <span className="font-serif italic">Vitrine<span className="text-amber-500">.</span></span>
          <div className="flex flex-wrap gap-6">
            <Link href="/about" className="hover:text-stone-300 transition-colors">About</Link>
            <Link href="/faq" className="hover:text-stone-300 transition-colors">FAQ</Link>
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
