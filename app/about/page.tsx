import Link from 'next/link'
import type { Metadata } from 'next'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { PLANS } from '@/lib/plans'
import CollectorTrack from './CollectorTrack'
import MuseumTrack from './MuseumTrack'

/**
 * Two audiences, one page.
 *
 * The track is a URL parameter rather than client state so the page stays a
 * server component (it carries two JSON-LD blocks and per-track metadata),
 * so each view is a shareable link, and so both are crawlable as whole
 * documents rather than one document with half its content behind a click.
 *
 * Canonical points at /about for both — the collector view is the default and
 * the higher-volume audience, and two near-identical pages competing for the
 * same query helps nobody.
 *
 * Plan copy discipline for this page is in docs/about-page-plan.md §3. In
 * short: no standards or compliance claim, no custom-domain promise, and no
 * prices — limits are stable and live here, prices live on /plans.
 */

type Track = 'collectors' | 'museums'

function resolveTrack(value: string | string[] | undefined): Track {
  return value === 'museums' ? 'museums' : 'collectors'
}

const META: Record<Track, { title: string; description: string; keywords: string[] }> = {
  collectors: {
    title: 'About Vitrine – Collection Management for Collectors',
    description:
      'Vitrine catalogues any collection, from coins and cards to vinyl, watches and wine, and gives it a public website. 21 collection types, collection sets, a public directory, and a free plan.',
    keywords: [
      'about vitrine',
      'collection management software',
      'collection organiser app',
      'collection catalogue website',
    ],
  },
  museums: {
    title: 'About Vitrine – Collection Management for Museums & Galleries',
    description:
      "Vitrine runs a museum's documentation: entry, accessioning, loans, conservation, valuation, insurance and disposal, plus a public website with event ticketing.",
    keywords: [
      'about vitrine',
      'museum collection management system',
      'museum documentation software',
      'gallery collection database',
    ],
  },
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ for?: string | string[] }>
}): Promise<Metadata> {
  const track = resolveTrack((await searchParams).for)
  const m = META[track]
  return buildPageMetadata({
    title: m.title,
    description: m.description,
    // Both tracks canonicalise to the bare path deliberately — see above.
    path: '/about',
    keywords: m.keywords,
  })
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vitrine',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Vitrine is a modern collection management platform for museums, galleries, and hobbyist collectors. Catalog, organise, track value, and showcase any collection — coins, stamps, trading cards, vinyl records, comic books, LEGO, watches, wine, art, and more.',
  sameAs: ['https://www.instagram.com/vitrinecms/'],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'About', item: `${SITE_URL}/about` },
  ],
}

const values = [
  {
    title: 'Accessible to everyone',
    description:
      'Professional collection management should not cost thousands of pounds per year. We price Vitrine so that individual collectors and small institutions can afford the same tools as large museums.',
  },
  {
    title: 'Your data, always',
    description:
      'You own your collection data. You can export it as CSV at any time. We will never lock you in, sell your data, or hold your catalogue hostage behind a paywall.',
  },
  {
    title: 'Built for collectors, by people who get it',
    description:
      'Collectors have specific needs — grading, provenance, condition reports, value tracking, insurance documentation. We build for those needs, not for generic inventory management.',
  },
  {
    title: 'Actively maintained',
    description:
      'Too many collection apps become abandonware. Vitrine is built on a sustainable business model with a paying customer base, which means continued development and long-term reliability.',
  },
]

function TrackSwitch({ track }: { track: Track }) {
  const base =
    'flex-1 text-center px-5 py-3 rounded-md font-mono text-sm transition-colors border'
  const on = 'bg-amber-500 text-stone-950 border-amber-500 font-medium'
  const off = 'border-white/10 text-stone-400 hover:text-white hover:border-white/20'

  return (
    <nav aria-label="Choose what to read about" className="flex flex-col sm:flex-row gap-2 mb-14">
      <Link
        href="/about"
        scroll={false}
        aria-current={track === 'collectors' ? 'page' : undefined}
        className={`${base} ${track === 'collectors' ? on : off}`}
      >
        For collectors
      </Link>
      <Link
        href="/about?for=museums"
        scroll={false}
        aria-current={track === 'museums' ? 'page' : undefined}
        className={`${base} ${track === 'museums' ? on : off}`}
      >
        For museums &amp; galleries
      </Link>
    </nav>
  )
}

export default async function AboutPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string | string[] }>
}) {
  const track = resolveTrack((await searchParams).for)

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={organizationSchema} />
      <JsonLd data={breadcrumbSchema} />

      <PublicNav activePath="/about" />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-stone-300 transition-colors">
                Home
              </Link>
            </li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">About</li>
          </ol>
        </nav>

        {/* Answer capsule — self-contained definition for AI extraction. The
            price is read from PLANS so it cannot drift from lib/plans.ts. */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl italic font-normal leading-tight mb-6">
            About <span className="text-amber-500">Vitrine</span>
          </h1>
          <p className="text-xl text-stone-300 leading-relaxed border-l-2 border-amber-500/40 pl-5 mb-6">
            Vitrine is a collection management platform that helps museums, galleries, and hobbyist
            collectors catalog, organise, track value, and showcase their collections. It gives every
            collector a professional CMS and public website. Plans start free, with paid plans from{' '}
            {PLANS.hobbyist.price.replace('/mo', ' a month')}.
          </p>
          <p className="text-stone-400 leading-relaxed">
            Most collection management tools fall into one of two camps: expensive institutional
            software built for large museums, or outdated desktop apps built for hobbyists in the
            1990s. Vitrine sits in the gap — modern, web-based, and priced so that a coin collector in
            their spare room gets the same quality of tools as a regional gallery.
          </p>
          <p className="text-stone-400 leading-relaxed mt-4">
            It is really two products sharing one foundation. Pick the one you are, and the rest of
            this page follows.
          </p>
        </div>

        <TrackSwitch track={track} />

        {track === 'museums' ? <MuseumTrack /> : <CollectorTrack />}

        {/* Shared — true for both audiences */}
        <section className="mb-16 pt-4 border-t border-white/10">
          <h2 className="text-2xl font-medium text-white mb-8 pt-10">What we believe</h2>
          <div className="space-y-8">
            {values.map((value) => (
              <div key={value.title}>
                <h3 className="text-lg font-medium text-white mb-2">{value.title}</h3>
                <p className="text-stone-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 border border-white/10 rounded-lg">
          <h2 className="text-xl font-medium text-white mb-2">Get started</h2>
          <p className="text-stone-400 mb-6">
            Vitrine is free to try — no credit card required. Read our guide to see what&apos;s
            possible, or browse public collections to get a feel for the platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={track === 'museums' ? '/guide/professional' : '/guide/essentials'}
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Read the guide
            </Link>
            {track === 'museums' && (
              <Link
                href="/compliance"
                className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
              >
                The registers in detail
              </Link>
            )}
            <Link
              href="/discover"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Browse collections
            </Link>
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Start for free →
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
