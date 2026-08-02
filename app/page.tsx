import { createClient } from '@supabase/supabase-js'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import HomeMockup from '@/components/HomeMockup'
import HomeSections from '@/components/HomeSections'
import ClockHero from '@/components/hero/ClockHero'

export const revalidate = 3600

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
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={organizationSchema} />

      <PublicNav />

      <ClockHero />

      {/* The product shot the old hero carried alongside the copy. The aisle
          needs the whole frame, so it stands on its own below it. */}
      <section className="relative overflow-hidden px-6 pb-28 pt-4">
        <div className="mx-auto max-w-6xl">
          <HomeMockup />
        </div>
      </section>

      <HomeSections featured={featured} />

      <PublicFooter />
    </div>
  )
}
