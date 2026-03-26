import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { competitors } from '@/lib/competitors'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Vitrine vs Other Collection Management Tools – Comparisons',
  description:
    'See how Vitrine compares to other collection management apps. Detailed comparisons with Delicious Library, CatalogIt, Sortly, CLZ Apps, and more.',
  path: '/compare',
  keywords: [
    'collection management app comparison',
    'best collection software',
    'vitrine alternative',
    'collection app review',
  ],
})

const competitorMeta: Record<string, { tagline: string }> = {
  'delicious-library-alternative': { tagline: 'Mac-only desktop app for books, movies, and games' },
  'catalogit-alternative': { tagline: 'Museum and archive cataloguing platform' },
  'sortly-alternative': { tagline: 'General inventory and asset tracking tool' },
  'clz-alternative': { tagline: 'Apps for cards, comics, movies, and music collectors' },
  'spreadsheet-alternative': { tagline: 'Excel and Google Sheets for collection tracking' },
  'icollect-everything-alternative': { tagline: 'iOS app for cataloguing physical collections' },
  'collectify-alternative': { tagline: 'Mobile app for collectible tracking' },
}

export default function CompareIndex() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      <PublicNav />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">Compare</li>
          </ol>
        </nav>

        {/* Header */}
        <section className="mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl italic font-normal leading-tight mb-6">
            Vitrine vs the alternatives
          </h1>
          <p className="text-lg text-stone-400 leading-relaxed max-w-2xl">
            How does Vitrine compare to other collection management tools? We&apos;ve put together honest, detailed comparisons with the most common alternatives.
          </p>
        </section>

        {/* Competitors list */}
        <div className="space-y-2">
          {competitors.map((competitor) => {
            const meta = competitorMeta[competitor.slug] ?? { tagline: '' }
            return (
              <Link
                key={competitor.slug}
                href={`/compare/${competitor.slug}`}
                className="group flex items-center justify-between border border-white/8 rounded-xl px-6 py-5 hover:border-white/20 hover:bg-white/3 transition-all"
              >
                <div>
                  <h2 className="font-medium text-white text-lg mb-1 group-hover:text-amber-400 transition-colors">
                    Vitrine vs {competitor.name}
                  </h2>
                  <p className="text-sm text-stone-500">{meta.tagline}</p>
                </div>
                <span className="text-stone-600 group-hover:text-amber-500 transition-colors font-mono text-sm flex-shrink-0 ml-4">
                  →
                </span>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <section className="mt-16 p-8 border border-white/10 rounded-lg text-center">
          <h2 className="text-2xl font-medium text-white mb-3">
            See for yourself
          </h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto">
            Free to start, no credit card required. Try Vitrine and compare it against any tool yourself.
          </p>
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-8 py-3 rounded transition-colors inline-block"
          >
            Start for free →
          </Link>
        </section>

      </main>

      <PublicFooter />
    </div>
  )
}
