import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import Zoom, { type ZoomObject } from './Zoom'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v13 — Zoom',
  description: 'Homepage concept: a scroll-driven pull-back from engraving to collection.',
  path: '/design/v13',
  noIndex: true,
})

const FALLBACK_EMOJI = ['📷', '📻', '⌚', '💿', '🪙', '🏺', '🗺️', '🔭', '📮', '🎸', '⚙️', '🦴']

export default async function V13() {
  const objects = await getWallObjects(36)

  const zoomObjects: ZoomObject[] = objects.length
    ? objects.map(o => ({ id: o.id, title: o.title, image: o.image_url, emoji: o.emoji ?? '▫' }))
    : FALLBACK_EMOJI.map((e, i) => ({ id: `f${i}`, title: '', image: null, emoji: e }))

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#efeade]">
      <VariantBar current="v13" />

      <header className="fixed left-0 right-0 top-[30px] z-50 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 mix-blend-difference">
        <Link href="/" className="type-book text-xl text-white">Vitrine.</Link>
        <div className="type-mono flex items-center gap-6 text-[11px] uppercase tracking-[0.16em] text-white/70">
          <Link href="/discover" className="hidden hover:text-white sm:block">Collections</Link>
          <Link href="/plans" className="hidden hover:text-white sm:block">Pricing</Link>
          <Link href="/signup" className="hover:text-white">Start free →</Link>
        </div>
      </header>

      {/* Opening title, then the pull-back takes over */}
      <section className="relative flex min-h-[70vh] items-end px-6 pb-16 pt-32">
        <div className="mx-auto w-full max-w-5xl">
          <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.24em] text-[#d9b25f]">
            Collection management for museums &amp; collectors
          </p>
          <h1 className="type-book text-[3rem] leading-[0.98] tracking-[-0.01em] sm:text-[5.5rem]">
            Start at the serial number.
            <br />
            End at the whole collection.
          </h1>
          <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/55">
            Everything a collection needs to be taken seriously sits between those two points.
            Scroll, and Vitrine will show you the distance.
          </p>
        </div>
      </section>

      <Zoom objects={zoomObjects} />

      {/* Landing */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="type-book max-w-2xl text-[2.2rem] leading-tight sm:text-[3rem]">
            That whole distance is one product, and most of it is free.
          </h2>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">
            {[
              ['Free', '100 objects, one photograph each, and a public collection site. No card, permanently.'],
              ['£5 / month', '1,000 objects, five photographs each, analytics, CSV import and export, your branding.'],
              ['£79 / month', 'Museums and galleries: 5,000 objects, ten staff, full documentation registers, ticketing. Thirty-day trial.'],
            ].map(([p, l]) => (
              <div key={p} className="bg-[#0b0a09] p-8">
                <div className="type-book text-[30px] text-[#d9b25f]">{p}</div>
                <p className="mt-4 text-[15px] leading-relaxed text-white/55">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Link href="/signup" className="type-mono bg-[#d9b25f] px-9 py-4 text-[12px] uppercase tracking-[0.16em] text-[#0b0a09] hover:bg-[#e8c883]">
              Catalogue your first object
            </Link>
            <Link href="/discover" className="type-mono text-[12px] uppercase tracking-[0.16em] text-white/50 underline underline-offset-[7px] hover:text-white">
              See real collections
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="type-mono mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/25">
          <span className="type-book normal-case tracking-normal text-white/60">Vitrine.</span>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/faq" className="hover:text-white">FAQ</Link>
          <Link href="/tools" className="hover:text-white">Tools</Link>
          <Link href="/compliance" className="hover:text-white">Museums</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
