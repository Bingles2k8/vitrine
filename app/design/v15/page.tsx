import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections, getWallObjects } from '../_lib'
import Spotlight, { type SpotObject } from './Spotlight'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v15 — Spotlight',
  description: 'Homepage concept: the homepage is a live search across real collections.',
  path: '/design/v15',
  noIndex: true,
})

const SAMPLE: [string, string][] = [
  ['Leica M3, chrome', '📷'], ['Braun T3 pocket radio', '📻'], ['Omega Seamaster 300', '⌚'],
  ['Please Please Me, mono', '💿'], ['Olivetti Valentine', '⌨️'], ['Anglepoise 1227', '💡'],
  ['Roman denarius, Trajan', '🪙'], ['Ammonite, Charmouth', '🐚'], ['Delft charger', '🍽️'],
  ['Ordnance Survey, 1897', '🗺️'], ['Bakelite telephone', '☎️'], ['Zeiss binoculars', '🔭'],
  ['Penny black, plate 6', '📮'], ['Wedgwood jasperware', '🏺'], ['Stanley no.4 plane', '🪚'],
  ['Meccano outfit no.6', '⚙️'], ['Fender Telecaster', '🎸'], ['Singer 99K', '🧵'],
  ['Trilobite, Dudley', '🦴'], ['Victorian barometer', '🌡️'], ['Chess set, ivorine', '♟️'],
  ['Regimental cap badge', '🎖️'], ['Sextant, brass', '⚓'], ['Kodak Brownie', '📸'],
]

export default async function V15() {
  const [objects, featured] = await Promise.all([getWallObjects(120), getFeaturedCollections(5)])

  const spotObjects: SpotObject[] = objects.length
    ? objects.map(o => ({
        id: o.id,
        title: o.title,
        museum: o.museum,
        slug: o.slug,
        image: o.image_url,
        emoji: o.emoji ?? '▫',
      }))
    : SAMPLE.map(([t, e], i) => ({
        id: `s${i}`,
        title: t,
        museum: 'Example collection',
        slug: '',
        image: null,
        emoji: e,
      }))

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <VariantBar current="v15" />

      <header className="mx-auto flex max-w-none items-center justify-between px-6 py-6">
        <Link href="/" className="type-book text-xl">Vitrine.</Link>
        <nav className="type-mono hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-white/40 md:flex">
          <Link href="/discover" className="hover:text-white">Discover</Link>
          <Link href="/compliance" className="hover:text-white">Museums</Link>
          <Link href="/plans" className="hover:text-white">Pricing</Link>
          <Link href="/login" className="hover:text-white">Sign in</Link>
        </nav>
        <Link
          href="/signup"
          className="type-mono bg-white px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-black hover:bg-white/85"
        >
          Start free
        </Link>
      </header>

      {/* Hero: the search is the headline */}
      <section className="pb-16 pt-10 sm:pt-16">
        <div className="mx-auto mb-10 max-w-4xl px-6">
          <h1 className="type-book text-[2.4rem] leading-[1.02] sm:text-[3.6rem]">
            Search a hundred thousand
            <br />
            things people actually own.
          </h1>
          <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-white/55">
            Every object here was catalogued in Vitrine by a collector or a museum and published
            deliberately. Look for something. Then consider that none of your collection is in here
            yet.
          </p>
        </div>

        <Spotlight objects={spotObjects} />
      </section>

      {/* The turn: from browsing to owning */}
      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="type-book text-[2.1rem] leading-[1.1] sm:text-[2.7rem]">
              Everything above has a private half.
            </h2>
            <p className="mt-6 text-[16px] leading-relaxed text-white/55">
              The image is the part its owner chose to show. Underneath sits the record that does the
              work: what they paid, what it is worth now, the condition history, which shelf it is
              on, and the receipt. That half never gets published — it gets used, when an insurer or
              an executor or an auditor asks.
            </p>
            <Link
              href="/signup"
              className="type-mono mt-9 inline-block bg-white px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-black hover:bg-white/85"
            >
              Start your own catalogue
            </Link>
            <p className="type-mono mt-4 text-[11px] text-white/30">
              100 objects free · no card · export any time
            </p>
          </div>

          <dl className="grid gap-px self-start bg-white/12 sm:grid-cols-2 lg:col-span-7">
            {[
              ['Public', 'Title, images, description, the story'],
              ['Private', 'Price paid, valuation history, insured value'],
              ['Private', 'Condition reports with damage mapping'],
              ['Private', 'Room, cabinet, shelf'],
              ['Private', 'Receipts, certificates, service records'],
              ['Yours', 'Full CSV export, every plan, any time'],
            ].map(([k, v], i) => (
              <div key={i} className="bg-[#050505] p-6">
                <dt className="type-mono text-[10px] uppercase tracking-[0.18em] text-white/35">{k}</dt>
                <dd className="mt-2 text-[14.5px] leading-relaxed text-white/80">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Collections */}
      {featured.length > 0 && (
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.2em] text-white/30">
              Collections you just searched
            </p>
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
              {featured.map(c => (
                <Link key={c.slug} href={`/museum/${c.slug}`} className="group">
                  <span className="type-book text-[24px] group-hover:underline sm:text-[30px]">{c.name}</span>
                  <span className="type-mono ml-3 text-[11px] text-white/35">
                    {c.count.toLocaleString()} objects
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing + close */}
      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="type-book text-[2.4rem] leading-[1.02] sm:text-[3.4rem]">
              Add the first
              <br />
              hundred for nothing.
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/55">
              £5 a month takes it to a thousand objects with five photographs each, analytics and CSV
              import. Museums and galleries start at £79 with the full documentation registers,
              ticketing and a thirty-day trial.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/signup" className="type-mono bg-white px-10 py-4 text-center text-[12px] uppercase tracking-[0.16em] text-black hover:bg-white/85">
              Start free
            </Link>
            <Link href="/plans" className="type-mono text-center text-[11px] uppercase tracking-[0.14em] text-white/40 underline underline-offset-4 hover:text-white">
              All plans
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/25">
          <span className="type-book normal-case tracking-normal text-white/60">Vitrine.</span>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/faq" className="hover:text-white">FAQ</Link>
          <Link href="/blog" className="hover:text-white">Journal</Link>
          <Link href="/tools" className="hover:text-white">Tools</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
