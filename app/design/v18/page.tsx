import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import Immersion, { type Slide } from './Immersion'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v18 — Immersion',
  description: 'Homepage concept: one enormous object filling the fold.',
  path: '/design/v18',
  noIndex: true,
})

const FALLBACK: [string, string][] = [
  ['Leica M3 rangefinder, 1954', '📷'],
  ['Braun T3 pocket radio, 1958', '📻'],
  ['Omega Seamaster 300, 1966', '⌚'],
  ['Please Please Me, mono first press', '💿'],
]

export default async function V18() {
  const objects = await getWallObjects(5)

  const slides: Slide[] = objects.length
    ? objects.map(o => ({
        id: o.id, title: o.title, museum: o.museum, slug: o.slug, image: o.image_url, emoji: o.emoji ?? '▫',
      }))
    : FALLBACK.map(([title, emoji], i) => ({
        id: `f${i}`, title, museum: 'Example collection', slug: '', image: null, emoji,
      }))

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <VariantBar current="v18" />

      {/* The fold — one object, edge to edge */}
      <section className="relative h-[calc(100vh-30px)] min-h-[600px] w-full overflow-hidden">
        <Immersion slides={slides} />

        <div className="relative z-10 flex h-full flex-col">
          <header className="flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-didone text-[22px] tracking-[0.05em]">Vitrine</Link>
            <nav className="type-mono hidden gap-8 text-[11px] uppercase tracking-[0.2em] text-white/60 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-mono border border-white/45 px-5 py-2 text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:text-black"
            >
              Start free
            </Link>
          </header>

          <div className="mt-auto max-w-3xl px-6 pb-24 sm:px-10 sm:pb-28">
            <p className="type-mono mb-5 text-[11px] uppercase tracking-[0.3em] text-white/60">
              Collection management software
            </p>
            <h1 className="type-didone text-[3rem] leading-[0.92] tracking-[-0.015em] sm:text-[5.2rem]">
              Look at it properly
              <br />
              for once.
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/70">
              Every object you own has a story, a price, a condition and a place — and almost none of
              it is written down. Vitrine is where all of that finally lives.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-mono bg-white px-9 py-4 text-[12px] uppercase tracking-[0.18em] text-black transition-colors hover:bg-white/85"
              >
                Catalogue your first object
              </Link>
              <Link
                href="/discover"
                className="type-mono text-[12px] uppercase tracking-[0.18em] text-white/60 underline underline-offset-[8px] hover:text-white"
              >
                See real collections
              </Link>
            </div>
            <p className="type-mono mt-5 text-[11px] text-white/40">
              Free for 100 objects · no card · nothing public until you say so
            </p>
          </div>
        </div>
      </section>

      {/* After the image, the argument */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="type-didone max-w-2xl text-[2.4rem] leading-[1.05] sm:text-[3.4rem]">
            A photograph is the easy half.
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/60">
            Anyone can take a nice picture of a thing. The hard half is everything the picture cannot
            tell you: who made it, when, what you paid, what it is worth now, what condition it was
            in the last time anyone looked, where it physically is, and where the receipt went.
          </p>

          <dl className="mt-14 grid gap-px bg-white/12 sm:grid-cols-2">
            {[
              ['Provenance', 'Where it came from, when, from whom, for how much'],
              ['Valuation history', 'Dated and kept, never overwritten'],
              ['Condition', 'Dated reports with damage mapping, exportable'],
              ['Location', 'Room, cabinet, shelf — findable in seconds'],
              ['Documents', 'Receipts, certificates and service records attached'],
              ['Visibility', 'A publish switch on every single object'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#0c0c0c] p-7">
                <dt className="type-mono text-[11px] uppercase tracking-[0.18em] text-white/40">{k}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-white/85">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="type-didone text-[2.6rem] leading-[0.98] sm:text-[3.8rem]">
              The first hundred
              <br />
              objects are free.
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/55">
              £5 a month for a thousand with five photographs each. Museums and galleries from £79
              with the full documentation registers and a thirty-day trial.
            </p>
          </div>
          <Link href="/signup" className="type-mono shrink-0 bg-white px-11 py-4 text-center text-[12px] uppercase tracking-[0.18em] text-black hover:bg-white/85">
            Start free
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="type-mono mx-auto flex max-w-5xl flex-wrap gap-x-7 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/30">
          <span className="type-didone normal-case tracking-normal text-white/60">Vitrine</span>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/faq" className="hover:text-white">FAQ</Link>
          <Link href="/tools" className="hover:text-white">Tools</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
