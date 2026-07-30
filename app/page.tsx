import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import HomeMockup from '@/components/HomeMockup'
import HomeSections from '@/components/HomeSections'

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

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="pt-40 pb-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-3xl lg:max-w-xl lg:flex-shrink-0">

            <h1 className="font-mono text-xs text-amber-500 uppercase tracking-widest mb-5">
              Collection management software for museums &amp; collectors
            </h1>
            <p className="font-serif text-4xl sm:text-6xl lg:text-8xl italic font-normal leading-none tracking-tight mb-6">
              Your collection,<br />
              <span className="text-amber-500">beautifully</span><br />
              managed.
            </p>

            <p className="text-lg text-stone-400 font-light leading-relaxed max-w-xl mb-10">
              An easy-to-use Collection Management System<br />with a beautiful public website built in.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors">
                Start for free →
              </Link>
              <Link href="/discover" className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-6 py-3 rounded transition-colors">
                Browse examples
              </Link>
            </div>
            <p className="text-xs text-stone-600 mt-4 font-mono">Free plan available · No credit card required</p>
          </div>

          <HomeMockup className="mt-20 lg:mt-0 lg:absolute lg:left-[50%] lg:right-[-25%]" />
        </div>
      </section>

      <HomeSections featured={featured} />

      <PublicFooter />
    </div>
  )
}
