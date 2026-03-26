import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { segments } from '@/lib/segments'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Who is Vitrine For? – Collection Management for Every Collector',
  description:
    'Vitrine works for any type of collector. Explore how Vitrine helps trading card collectors, coin collectors, vinyl record collectors, book collectors, and more.',
  path: '/for',
  keywords: [
    'collection management app',
    'best collection app',
    'catalog my collection',
    'collection organiser',
  ],
})

const segmentMeta: Record<string, { emoji: string; tagline: string; displayName: string }> = {
  'trading-card-collection-app': { emoji: '🃏', displayName: 'Trading Cards', tagline: 'Track sports cards, Pokémon cards, and graded slabs' },
  'coin-collection-app': { emoji: '🪙', displayName: 'Coin Collecting', tagline: 'Catalog coins with numismatic fields, grades, and values' },
  'vinyl-record-collection-app': { emoji: '🎵', displayName: 'Vinyl Records', tagline: 'Organise your records by label, pressing, and condition' },
  'book-collection-app': { emoji: '📚', displayName: 'Book Libraries', tagline: 'Catalog your library with editions, ISBNs, and read status' },
  'lego-toy-collection-app': { emoji: '🧱', displayName: 'LEGO Sets', tagline: 'Track sets by theme, year, completeness, and value' },
  'comic-book-collection-app': { emoji: '💥', displayName: 'Comic Books', tagline: 'Manage issues, runs, and graded slabs in one place' },
  'wine-collection-app': { emoji: '🍷', displayName: 'Wine Cellars', tagline: 'Record vintages, cellars, tasting notes, and valuations' },
  'watch-collection-app': { emoji: '⌚', displayName: 'Watch Cabinets', tagline: 'Document references, movements, service history, and values' },
  'stamp-collection-app': { emoji: '✉️', displayName: 'Stamp Collecting', tagline: 'Catalog philatelic collections with condition and catalogue values' },
  'art-collection-app': { emoji: '🖼️', displayName: 'Art Collections', tagline: 'Record provenance, medium, dimensions, and insurance values' },
  'video-game-collection-app': { emoji: '🕹️', displayName: 'Video Games', tagline: 'Catalog games and consoles across every platform and era' },
  'vintage-camera-collection-app': { emoji: '📷', displayName: 'Vintage Cameras', tagline: 'Record serial numbers, service history, and lens pairings' },
  'sneaker-collection-app': { emoji: '👟', displayName: 'Sneakers', tagline: 'Track deadstock condition, colourways, and market value' },
  'sports-memorabilia-collection-app': { emoji: '🏆', displayName: 'Sports Memorabilia', tagline: 'Catalog signed shirts, programmes, and autographs with provenance' },
  'model-train-collection-app': { emoji: '🚂', displayName: 'Model Railways', tagline: 'Track locomotives by gauge, livery, DCC details, and value' },
  'fossil-mineral-collection-app': { emoji: '🪨', displayName: 'Fossils & Minerals', tagline: 'Record locality, formation, and geological period per specimen' },
  'funko-pop-collection-app': { emoji: '🧸', displayName: 'Funko Pops', tagline: 'Catalog standard, chase, and exclusive Pops with box condition' },
  'board-game-collection-app': { emoji: '♟️', displayName: 'Board Games', tagline: 'Track games, expansions, and Kickstarter exclusives' },
  'antique-collection-app': { emoji: '🏺', displayName: 'Antiques', tagline: 'Document maker\'s marks, provenance, and insurance values' },
  'military-memorabilia-collection-app': { emoji: '🎖️', displayName: 'Military Memorabilia', tagline: 'Record medals, recipient research, and provenance permanently' },
  'jewelry-collection-app': { emoji: '💎', displayName: 'Jewellery', tagline: 'Catalog hallmarks, gemstone details, and insurance valuations' },
  'vintage-clothing-collection-app': { emoji: '👗', displayName: 'Vintage Clothing', tagline: 'Record label details, condition, and provenance for each garment' },
  'museum-collection-management-software': { emoji: '🏛️', displayName: 'Museums', tagline: 'Full CMS with compliance tools, staff roles, and a public website' },
  'local-history-society-collection-app': { emoji: '🗺️', displayName: 'Local History Societies', tagline: 'Catalog photographs, documents, and artefacts for your community' },
  'university-archive-management': { emoji: '📜', displayName: 'University Archives', tagline: 'Manage special collections with access controls and finding aids' },
  'photography-archive-management': { emoji: '🎞️', displayName: 'Photography Archives', tagline: 'Catalog prints, negatives, and digital files with rights records' },
}

// Ordered by conversion likelihood — clearest pain point + weakest existing tool first
const SEGMENT_ORDER = [
  'trading-card-collection-app',       // huge community, CLZ/PSA are clearly limited
  'coin-collection-app',               // active hobby, existing software is old/Windows-only
  'watch-collection-app',              // high-value, service history tracking is a real need
  'comic-book-collection-app',         // graded slab tracking, CLZ is dated
  'art-collection-app',                // provenance + insurance need, high value
  'museum-collection-management-software', // institutional, will pay Professional/Institution rates
  'video-game-collection-app',         // massive audience, no great catalogue tool
  'sneaker-collection-app',            // active community, GOAT/StockX don't serve cataloguing
  'jewelry-collection-app',            // insurance documentation is a clear driver
  'antique-collection-app',            // estate + insurance documentation need
  'sports-memorabilia-collection-app', // provenance tracking, COA management
  'military-memorabilia-collection-app', // dedicated collectors, recipient research need
  'stamp-collection-app',              // traditional hobby, old desktop software
  'vintage-camera-collection-app',     // passionate niche, serial number + service records
  'wine-collection-app',               // CellarTracker exists but UX is weak
  'local-history-society-collection-app', // genuine institutional need, no affordable tool
  'funko-pop-collection-app',          // large community, Funko App is limited
  'photography-archive-management',    // niche institutional, clear pain point
  'model-train-collection-app',        // older demographic, genuine cataloguing need
  'vintage-clothing-collection-app',   // growing niche, fashion/costume crossover
  'university-archive-management',     // long sales cycle but high value
  'fossil-mineral-collection-app',     // passionate but very niche
  'board-game-collection-app',         // BGG partly fills this gap
  'book-collection-app',               // GoodReads/LibraryThing are strong
  'lego-toy-collection-app',           // Rebrickable is very strong competition
  'vinyl-record-collection-app',       // Discogs dominates this space
]

const orderedSegments = SEGMENT_ORDER
  .map((slug) => segments.find((s) => s.slug === slug))
  .filter(Boolean) as typeof segments

export default function ForIndex() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      <PublicNav />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">Who is Vitrine for?</li>
          </ol>
        </nav>

        {/* Header */}
        <section className="mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl italic font-normal leading-tight mb-6">
            Who is Vitrine for?
          </h1>
          <p className="text-lg text-stone-400 leading-relaxed max-w-2xl">
            Vitrine works for any type of collector — from hobbyists with a few hundred items to institutions managing tens of thousands. Browse by collection type below.
          </p>
        </section>

        {/* Collection types grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {orderedSegments.map((segment) => {
            const meta = segmentMeta[segment.slug] ?? { emoji: '📦', tagline: '' }
            return (
              <Link
                key={segment.slug}
                href={`/for/${segment.slug}`}
                className="group border border-white/8 rounded-xl p-6 hover:border-white/20 hover:bg-white/3 transition-all"
              >
                <div className="text-3xl mb-4">{meta.emoji}</div>
                <h2 className="font-medium text-white text-lg mb-2 group-hover:text-amber-400 transition-colors">
                  {meta.displayName}
                </h2>
                <p className="text-sm text-stone-500 leading-relaxed">{meta.tagline}</p>
                <p className="mt-4 text-sm font-mono text-stone-600 group-hover:text-amber-500 transition-colors">
                  Learn more →
                </p>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <section className="mt-16 p-8 border border-white/10 rounded-lg text-center">
          <h2 className="text-2xl font-medium text-white mb-3">
            Don&apos;t see your collection type?
          </h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto">
            Vitrine supports any type of collection. If you can describe an item, you can catalogue it — free to start.
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
