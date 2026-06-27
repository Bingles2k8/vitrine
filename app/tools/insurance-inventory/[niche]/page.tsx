import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import ToolShell from '../../ToolShell'
import InsuranceInventoryBuilder from '../InsuranceInventoryBuilder'
import { NICHES, NICHE_SLUGS, faqsFor } from '../niches'

export function generateStaticParams() {
  return NICHE_SLUGS.map((niche) => ({ niche }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const { niche: slug } = await params
  const niche = NICHES[slug]
  if (!niche) return {}
  return buildPageMetadata({
    title: `Free ${niche.h1}`,
    description: niche.intro,
    path: `/tools/insurance-inventory/${slug}`,
    keywords: niche.keywords,
  })
}

export default async function Page({ params }: { params: Promise<{ niche: string }> }) {
  const { niche: slug } = await params
  const niche = NICHES[slug]
  if (!niche) notFound()

  const faqs = faqsFor(niche)
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: niche.h1,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
          url: `${SITE_URL}/tools/insurance-inventory/${slug}`,
          description: niche.intro,
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
      <ToolShell
        title={niche.h1}
        intro={niche.intro}
        crumbs={[{ label: 'Insurance inventory', href: '/tools/insurance-inventory' }]}
        faqs={faqs}
      >
        <InsuranceInventoryBuilder niche={niche} />
      </ToolShell>
    </>
  )
}
