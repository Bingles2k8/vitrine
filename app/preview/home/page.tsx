import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import HomeMockup from '@/components/HomeMockup'
import HomeSections from '@/components/HomeSections'
import { buildPageMetadata } from '@/lib/seo'
import { getFeaturedCollections } from '@/app/design/_lib'
import ClockHero from './ClockHero'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Preview — homepage with the time-of-day hero',
  description: 'The live homepage with the raymarched aisle in front of it. Not indexed.',
  path: '/preview/home',
  noIndex: true,
})

/**
 * The real homepage with the shelf hero in front of it.
 *
 * Everything below the fold is the same HomeSections component app/page.tsx
 * renders, so this is the actual page rather than a mock-up of it — real
 * collections, real pricing, real footer. Swapping it in for good means
 * replacing the hero section in app/page.tsx with <ClockHero /> and moving the
 * dashboard mock down a block, exactly as it is here.
 */
export default async function HomePreview() {
  const featured = await getFeaturedCollections()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <PublicNav />

      <ClockHero />

      {/* The dashboard mock loses its place in the hero, so it gets its own
          block directly under it. */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <HomeMockup />
        </div>
      </section>

      <HomeSections featured={featured} />

      <PublicFooter />
    </div>
  )
}
