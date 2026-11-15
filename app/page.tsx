import { createClient } from '@supabase/supabase-js'
import { Newsreader } from 'next/font/google'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import styles from './afterhours.module.css'
import Nav from '@/components/afterhours/Nav'
import Footer from '@/components/afterhours/Footer'
import Hero from '@/components/afterhours/Hero'
import Pricing from '@/components/afterhours/Pricing'
import { Closing, Features, Featured, Who } from '@/components/afterhours/Sections'

export const revalidate = 3600

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
})

export const metadata = buildPageMetadata({
  title: 'Vitrine – Collection Management App for Museums & Collectors',
  description:
    'Vitrine gives every museum, gallery, and collector a professional collection CMS and public website. Catalog, organise, and showcase your collection. Free to start.',
  path: '/',
  keywords: [
    'collection management software',
    'museum CMS',
    'collection tracker',
    'catalog my collection',
    'collection management app',
    'collection organiser',
  ],
})

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Vitrine',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'Vitrine is a modern collection management platform for museums, galleries, and hobbyist collectors.',
      sameAs: ['https://www.instagram.com/vitrinecms/'],
    },
    {
      '@type': 'WebSite',
      name: 'Vitrine',
      url: SITE_URL,
      publisher: { '@type': 'Organization', name: 'Vitrine', url: SITE_URL },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/discover?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      // Declares both SoftwareApplication (the common query target) and its
      // WebApplication subtype so the entity matches "software" and "app" queries.
      '@type': ['SoftwareApplication', 'WebApplication'],
      name: 'Vitrine',
      url: SITE_URL,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any (Web Browser)',
      description:
        'Catalog, organise, and showcase your collections with Vitrine. The modern collection management platform for museums and collectors.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'GBP',
        lowPrice: '0',
        highPrice: '349',
        offerCount: 4,
      },
    },
  ],
}

type FeaturedCollection = {
  name: string
  slug: string
  count: number
  preview_image: string | null
  preview_emoji: string
}

async function getFeaturedCollections(): Promise<FeaturedCollection[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: museums } = await supabase
      .from('museums')
      .select('id, name, slug')
      .eq('discoverable', true)
      .is('locked_at', null)
      .limit(10)

    if (!museums?.length) return []

    const results: FeaturedCollection[] = []

    for (const museum of museums) {
      if (results.length >= 4) break

      const { count } = await supabase
        .from('objects')
        .select('*', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
        .eq('show_on_site', true)
        .is('deleted_at', null)

      if (!count) continue

      const { data: obj } = await supabase
        .from('objects')
        .select('image_url, emoji')
        .eq('museum_id', museum.id)
        .eq('show_on_site', true)
        .is('deleted_at', null)
        .not('image_url', 'is', null)
        .limit(1)
        .maybeSingle()

      results.push({
        name: museum.name,
        slug: museum.slug,
        count,
        preview_image: obj?.image_url ?? null,
        preview_emoji: obj?.emoji ?? '🏛️',
      })
    }

    return results
  } catch {
    return []
  }
}

export default async function Home() {
  const featured = await getFeaturedCollections()

  return (
    <div className={`${styles.root} ${newsreader.variable}`}>
      <JsonLd data={organizationSchema} />
      <div className="grain" aria-hidden="true" />

      <Nav />
      <Hero />
      <Featured featured={featured} />
      <Features />
      <Who />
      <Pricing />
      <Closing />
      <Footer />
    </div>
  )
}
