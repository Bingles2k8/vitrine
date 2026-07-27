import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import Torch, { type Tile } from './Torch'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v20 — Torchlight',
  description: 'Homepage concept: a dark attic revealed by a torch beam.',
  path: '/design/v20',
  noIndex: true,
})

const FALLBACK = ['📷', '💿', '⌚', '🪙', '🏺', '📻', '🗺️', '🔭', '📮', '🎸', '⚙️', '🦴', '♟️', '🧵', '🪚', '🌡️', '☎️', '🎖️', '⚓', '📸']

export default async function V20() {
  const objects = await getWallObjects(30)

  const tiles: Tile[] = objects.length
    ? objects.map(o => ({ id: o.id, title: o.title, museum: o.museum, image: o.image_url, emoji: o.emoji ?? '▪' }))
    : FALLBACK.map((emoji, i) => ({ id: `f${i}`, title: '', museum: '', image: null, emoji }))

  return (
    <div className="min-h-screen bg-[#050403] text-[#f0e9dd]">
      <VariantBar current="v20" />

      {/* The fold — a dark room and a torch */}
      <section className="relative h-[calc(100vh-30px)] min-h-[600px] w-full overflow-hidden">
        <Torch tiles={tiles} />

        <div className="relative z-10 flex h-full flex-col">
          <header className="flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-book text-xl">Vitrine.</Link>
            <nav className="type-mono hidden gap-8 text-[11px] uppercase tracking-[0.2em] text-white/45 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-mono border border-[#e8c37a]/50 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-[#e8c37a] hover:bg-[#e8c37a] hover:text-black"
            >
              Start free
            </Link>
          </header>

          <div className="flex flex-1 items-center px-6 sm:px-10">
            <div className="max-w-2xl">
              <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[#e8c37a]">
                Move the light
              </p>
              <h1
                className="type-book text-[3rem] leading-[0.94] tracking-[-0.01em] sm:text-[5.6rem]"
                style={{ textShadow: '0 4px 40px rgba(0,0,0,0.95)' }}
              >
                You can&apos;t look
                <br />
                after what you
                <br />
                can&apos;t see.
              </h1>
              <p
                className="mt-7 max-w-md text-[17px] leading-relaxed text-white/70"
                style={{ textShadow: '0 2px 24px rgba(0,0,0,0.95)' }}
              >
                Most collections live in the dark — boxed, stacked, half-remembered. Vitrine turns
                the lights on: every object photographed, dated, valued and findable.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link
                  href="/signup"
                  className="type-mono bg-[#e8c37a] px-9 py-4 text-[12px] uppercase tracking-[0.18em] text-[#050403] transition-colors hover:bg-[#f3d69d]"
                >
                  Turn the lights on — free
                </Link>
                <Link
                  href="/discover"
                  className="type-mono text-[12px] uppercase tracking-[0.18em] text-white/55 underline underline-offset-[8px] hover:text-white"
                >
                  See lit collections
                </Link>
              </div>
              <p className="type-mono mt-5 text-[11px] text-white/35">
                100 objects free · no card · export whenever you like
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lights on */}
      <section className="border-t border-white/10 bg-[#0d0b09]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="type-book max-w-2xl text-[2.3rem] leading-[1.08] sm:text-[3.2rem]">
            Lights on, everything in its place.
          </h2>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">
            {[
              { n: '01', h: 'Found in seconds', b: 'Room, cabinet, shelf recorded against every object, with barcode and QR labels if you want to scan a box open.' },
              { n: '02', h: 'Worth something, provably', b: 'Dated valuation history and insurance schedules with photographs, generated rather than retyped the night before.' },
              { n: '03', h: 'Seen, if you want it seen', b: 'A public collection site at your own address, with a publish switch on every individual object.' },
            ].map(c => (
              <div key={c.n} className="bg-[#0d0b09] p-8">
                <span className="type-mono text-[11px] tracking-[0.2em] text-[#e8c37a]">{c.n}</span>
                <h3 className="type-book mt-6 text-[24px] leading-tight">{c.h}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/50">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="type-book text-[2.6rem] leading-[0.98] sm:text-[3.8rem]">
              The first hundred
              <br />
              are free.
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/55">
              £5 a month for a thousand objects with five photographs each, analytics and CSV import.
              Museums from £79 with the full registers, ticketing and a thirty-day trial.
            </p>
          </div>
          <Link href="/signup" className="type-mono shrink-0 bg-[#e8c37a] px-11 py-4 text-center text-[12px] uppercase tracking-[0.18em] text-[#050403] hover:bg-[#f3d69d]">
            Start free
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-7 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/25">
          <span className="type-book normal-case tracking-normal text-white/60">Vitrine.</span>
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
