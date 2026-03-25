import Link from 'next/link'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const metadata = buildPageMetadata({
  title: 'About Vitrine – Modern Collection Management Software',
  description:
    'Vitrine is a collection management platform built for museums, galleries, and hobbyist collectors. Learn about our mission to make professional collection tools accessible to everyone.',
  path: '/about',
  keywords: [
    'about vitrine',
    'collection management software',
    'museum CMS company',
    'collection organiser app',
  ],
})

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vitrine',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Vitrine is a modern collection management platform for museums, galleries, and hobbyist collectors. Catalog, organise, track value, and showcase any collection — coins, stamps, trading cards, vinyl records, comic books, LEGO, watches, wine, art, and more.',
  sameAs: [] as string[],
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'About',
      item: `${SITE_URL}/about`,
    },
  ],
}

const collectionTypes = [
  'Coins & currency',
  'Stamps & philately',
  'Trading cards & sports cards',
  'Vinyl records',
  'Comic books',
  'LEGO & toys',
  'Books & manuscripts',
  'Wine & spirits',
  'Watches & timepieces',
  'Art & photography',
  'Antiques & furniture',
  'Museum objects',
]

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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={organizationSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">
            Vitrine<span className="text-amber-500">.</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm text-stone-400 hover:text-white transition-colors">Discover</Link>
            <Link href="/blog" className="text-sm text-stone-400 hover:text-white transition-colors">Blog</Link>
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

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">About</li>
          </ol>
        </nav>

        {/* Answer capsule — self-contained definition for AI extraction */}
        <div className="mb-12">
          <h1 className="font-serif text-5xl italic font-normal leading-tight mb-6">
            About <span className="text-amber-500">Vitrine</span>
          </h1>
          <p className="text-xl text-stone-300 leading-relaxed border-l-2 border-amber-500/40 pl-5 mb-6">
            Vitrine is a collection management platform that helps museums, galleries, and hobbyist
            collectors catalog, organise, track value, and showcase their collections. It gives every
            collector a professional CMS and public website. Plans start free, with paid plans from £5/month.
          </p>
          <p className="text-stone-400 leading-relaxed">
            Most collection management tools fall into one of two camps: expensive institutional software
            built for large museums, or outdated desktop apps built for hobbyists in the 1990s. Vitrine
            sits in the gap — modern, web-based, and priced so that a coin collector in their spare room
            gets the same quality of tools as a regional gallery.
          </p>
        </div>

        {/* What we support */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-6">What you can catalogue</h2>
          <p className="text-stone-400 mb-6 leading-relaxed">
            Vitrine supports any type of physical or digital collection. There are no restrictions on
            collection type — if you can describe an item, you can catalogue it. Common collections managed
            on Vitrine include:
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {collectionTypes.map((type) => (
              <li key={type} className="flex items-center gap-2 text-stone-300 text-sm">
                <span className="text-amber-500/60">—</span>
                {type}
              </li>
            ))}
          </ul>
        </section>

        {/* What we believe */}
        <section className="mb-16">
          <h2 className="text-2xl font-medium text-white mb-8">What we believe</h2>
          <div className="space-y-8">
            {values.map((value) => (
              <div key={value.title}>
                <h3 className="text-lg font-medium text-white mb-2">{value.title}</h3>
                <p className="text-stone-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="p-8 border border-white/10 rounded-lg">
          <h2 className="text-xl font-medium text-white mb-2">Get started</h2>
          <p className="text-stone-400 mb-6">
            Vitrine is free to try — no credit card required. Read our guide to see what&apos;s possible,
            or browse public collections to get a feel for the platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/guide/essentials"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Read the guide
            </Link>
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

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-stone-500">
          <span className="font-serif italic">Vitrine<span className="text-amber-500">.</span></span>
          <div className="flex gap-6">
            <Link href="/faq" className="hover:text-stone-300 transition-colors">FAQ</Link>
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
