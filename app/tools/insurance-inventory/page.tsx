import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import ToolShell from '../ToolShell'
import InsuranceInventoryBuilder from './InsuranceInventoryBuilder'
import { GENERIC_NICHE, faqsFor, NICHES, NICHE_SLUGS } from './niches'
import Link from 'next/link'

export const metadata = buildPageMetadata({
  title: 'Free Collection Insurance Inventory Generator',
  description:
    'A free tool to document any collection for insurance. List items with condition, value and photos, then download a clean insurer-ready PDF and a CSV. Runs entirely in your browser.',
  path: '/tools/insurance-inventory',
  keywords: GENERIC_NICHE.keywords,
})

export default function Page() {
  const faqs = faqsFor(GENERIC_NICHE)
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Collection Insurance Inventory Generator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
          url: `${SITE_URL}/tools/insurance-inventory`,
          description: metadata.description as string,
          publisher: { '@type': 'Organization', name: 'Vitrine', url: SITE_URL },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }}
      />
      <ToolShell title={GENERIC_NICHE.h1} intro={GENERIC_NICHE.intro} faqs={faqs}>
        <InsuranceInventoryBuilder niche={GENERIC_NICHE} />

        {/* Per-niche links for SEO + navigation */}
        <section className="mt-14">
          <h2 className="text-sm uppercase tracking-widest text-stone-500 mb-4">Tailored versions</h2>
          <div className="flex flex-wrap gap-2">
            {NICHE_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/tools/insurance-inventory/${slug}`}
                className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-stone-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
              >
                {NICHES[slug].collectionNoun.replace(/^\w/, (c) => c.toUpperCase())}
              </Link>
            ))}
          </div>
        </section>
      </ToolShell>
    </>
  )
}
