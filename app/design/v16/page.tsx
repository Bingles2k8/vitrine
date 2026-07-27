import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections } from '../_lib'
import Gallery3D from './Gallery3D'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v16 — The Gallery',
  description: 'Homepage concept: a raymarched gallery room as the fold.',
  path: '/design/v16',
  noIndex: true,
})

export default async function V16() {
  const featured = await getFeaturedCollections(4)

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f2efe9]">
      <VariantBar current="v16" />

      {/* Fold — the room */}
      <section className="relative h-[calc(100vh-30px)] min-h-[600px] w-full overflow-hidden">
        <Gallery3D />

        <div className="relative z-10 flex h-full flex-col">
          <header className="flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-didone text-[22px] tracking-[0.04em]">Vitrine</Link>
            <nav className="type-mono hidden gap-8 text-[11px] uppercase tracking-[0.2em] text-white/50 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/compliance" className="hover:text-white">Museums</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-mono border border-[#e9b872]/50 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-[#e9b872] transition-colors hover:bg-[#e9b872] hover:text-black"
            >
              Start free
            </Link>
          </header>

          <div className="flex flex-1 items-end px-6 pb-16 sm:px-10 sm:pb-20">
            <div className="w-full">
              <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[#e9b872]">
                Collection management software
              </p>
              <h1 className="type-didone text-[3.4rem] leading-[0.86] tracking-[-0.02em] sm:text-[7rem] lg:text-[9.5rem]">
                Give it
                <br />
                the room.
              </h1>
              <div className="mt-9 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                <p className="max-w-md text-[17px] leading-relaxed text-white/65">
                  Whatever you collect is sitting in a cupboard with no record of what it is, what
                  you paid or what it is worth. Vitrine catalogues it properly — and then puts it
                  under a light.
                </p>
                <div className="flex flex-wrap items-center gap-5">
                  <Link
                    href="/signup"
                    className="type-mono bg-[#e9b872] px-9 py-4 text-[12px] uppercase tracking-[0.18em] text-[#0a0a0c] transition-colors hover:bg-[#f5cd93]"
                  >
                    Catalogue your first object
                  </Link>
                  <Link
                    href="/discover"
                    className="type-mono text-[12px] uppercase tracking-[0.18em] text-white/55 underline underline-offset-[8px] hover:text-white"
                  >
                    Walk the collections
                  </Link>
                </div>
              </div>
              <p className="type-mono mt-6 text-[11px] text-white/30">
                Free for 100 objects · no card · drag to move around the room
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What the light is on */}
      <section className="border-t border-white/[0.08]">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/[0.08] md:grid-cols-3">
          {[
            { n: '01', h: 'The record', b: 'Maker, date, provenance, what you paid, what it is worth now, condition history, which shelf — and the receipt attached to it.' },
            { n: '02', h: 'The room', b: 'A public collection site at your own address, in your colours. Publishing is a switch on every single object, so nothing goes up by accident.' },
            { n: '03', h: 'The proof', b: 'Insurance schedules and dated condition reports out of the catalogue. On Professional, the full museum registers from entry to deaccession.' },
          ].map(c => (
            <div key={c.n} className="bg-[#0a0a0c] px-8 py-14">
              <span className="type-mono text-[11px] tracking-[0.2em] text-[#e9b872]">{c.n}</span>
              <h2 className="type-didone mt-7 text-[36px] leading-none">{c.h}</h2>
              <p className="mt-5 text-[15px] leading-[1.65] text-white/50">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-t border-white/[0.08]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.22em] text-white/30">
              Rooms already lit
            </p>
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
              {featured.map(c => (
                <Link key={c.slug} href={`/museum/${c.slug}`} className="group">
                  <span className="type-didone text-[28px] group-hover:text-[#e9b872] sm:text-[36px]">
                    {c.name}
                  </span>
                  <span className="type-mono ml-3 text-[11px] text-white/30">
                    {c.count.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="type-didone text-[2.8rem] leading-[0.94] sm:text-[4.2rem]">
              A hundred objects,
              <br />
              free forever.
            </h2>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/55">
              £5 a month takes it to a thousand with five photographs each, analytics and CSV import.
              Museums start at £79 with the full registers, ticketing and a thirty-day trial.
            </p>
          </div>
          <Link href="/signup" className="type-mono shrink-0 bg-[#e9b872] px-11 py-4 text-center text-[12px] uppercase tracking-[0.18em] text-[#0a0a0c] hover:bg-[#f5cd93]">
            Start free
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.08]">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-7 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/25">
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
