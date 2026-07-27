import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections } from '../_lib'
import { CountUp, RotatingWord, TypingRecord } from './Kinetic'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v14 — Kinetic Ledger',
  description: 'Homepage concept: kinetic type and a record that catalogues itself.',
  path: '/design/v14',
  noIndex: true,
})

export default async function V14() {
  const featured = await getFeaturedCollections(4)

  return (
    <div className="min-h-screen bg-[#ece9e2] text-[#111110]">
      <VariantBar current="v14" />

      <header className="sticky top-[30px] z-40 border-b border-black/10 bg-[#ece9e2]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="type-grotesk text-[17px] font-bold tracking-[-0.02em]">
            VITRINE<span className="text-[#d4321a]">.</span>
          </Link>
          <nav className="type-mono hidden gap-7 text-[12px] text-[#5f5a50] md:flex">
            <Link href="/discover" className="hover:text-black">Discover</Link>
            <Link href="/compliance" className="hover:text-black">Museums</Link>
            <Link href="/plans" className="hover:text-black">Pricing</Link>
          </nav>
          <div className="type-mono flex items-center gap-4 text-[12px]">
            <Link href="/login" className="text-[#5f5a50] hover:text-black">Sign in</Link>
            <Link href="/signup" className="bg-[#d4321a] px-5 py-2.5 text-white transition-colors hover:bg-[#b32712]">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-14">
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="type-mono mb-8 text-[11px] uppercase tracking-[0.2em] text-[#8a8378]">
              Collection management software · museums &amp; collectors
            </p>
            <h1 className="type-grotesk text-[2.9rem] font-bold leading-[0.94] tracking-[-0.035em] sm:text-[4.6rem] lg:text-[5.2rem]">
              Your <RotatingWord />
              <br />
              deserve better
              <br />
              than a spreadsheet.
            </h1>
            <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-[#4a463d]">
              Vitrine gives every object a proper record — photographed, dated, valued,
              condition-checked and placed — and gives the collection a public site of its own.
              Watch one being catalogued.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-mono bg-[#111110] px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-[#ece9e2] transition-colors hover:bg-[#d4321a]"
              >
                Catalogue your first object
              </Link>
              <Link
                href="/discover"
                className="type-mono text-[12px] uppercase tracking-[0.14em] text-[#5f5a50] underline underline-offset-[7px] hover:text-black"
              >
                See real collections
              </Link>
            </div>
            <p className="type-mono mt-5 text-[11px] text-[#8a8378]">
              100 objects free · no card · full export whenever you like
            </p>
          </div>

          <div className="lg:col-span-5">
            <TypingRecord />
          </div>
        </div>
      </section>

      {/* Counters */}
      <section className="border-y border-black/10 bg-[#111110] text-[#ece9e2]">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/10 sm:grid-cols-3">
          {[
            { v: <CountUp to={100} />, l: 'Objects on the free plan, permanently' },
            { v: <CountUp to={1000} />, l: 'Objects for £5 a month, five photographs each' },
            { v: <CountUp to={11} />, l: 'Museum registers built in, entry through to audit' },
          ].map((s, i) => (
            <div key={i} className="bg-[#111110] px-8 py-12">
              <div className="type-grotesk text-[3.6rem] font-bold leading-none tracking-[-0.04em] text-[#d4321a]">
                {s.v}
              </div>
              <p className="type-mono mt-4 text-[12px] leading-relaxed text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Big type feature rows */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        {[
          {
            n: '01',
            h: 'Everything you know, in one record.',
            b: 'Maker, date, provenance, what you paid, what it is worth now, condition history, which shelf it is on, and the receipt attached. The fields people who catalogue for a living actually use.',
          },
          {
            n: '02',
            h: 'A public site, if you want an audience.',
            b: 'Your own address, your own colours, your name on it. Publishing is a switch on every individual object, so the valuations and the storage locations never leave the back office.',
          },
          {
            n: '03',
            h: 'Paperwork that stands up to scrutiny.',
            b: 'Insurance schedules and dated condition reports on every plan. On Professional, the full Spectrum-mapped registers: entry, acquisition, loans, conservation, valuation, deaccession, audit.',
          },
        ].map(r => (
          <div key={r.n} className="group grid gap-6 border-t border-black/15 py-12 lg:grid-cols-12">
            <div className="type-mono lg:col-span-2">
              <span className="text-[12px] tracking-[0.2em] text-[#d4321a]">{r.n}</span>
            </div>
            <h2 className="type-grotesk text-[1.9rem] font-bold leading-[1.06] tracking-[-0.025em] lg:col-span-6 lg:text-[2.5rem]">
              {r.h}
            </h2>
            <p className="text-[15.5px] leading-[1.7] text-[#4a463d] lg:col-span-4">{r.b}</p>
          </div>
        ))}
      </section>

      {/* Real collections */}
      {featured.length > 0 && (
        <section className="border-y border-black/10 bg-[#e3dfd5]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="type-mono mb-8 text-[11px] uppercase tracking-[0.2em] text-[#8a8378]">
              Published with Vitrine
            </p>
            <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
              {featured.map(c => (
                <Link key={c.slug} href={`/museum/${c.slug}`} className="group">
                  <span className="type-grotesk text-[26px] font-bold tracking-[-0.02em] transition-colors group-hover:text-[#d4321a] sm:text-[34px]">
                    {c.name}
                  </span>
                  <span className="type-mono ml-3 text-[11px] text-[#8a8378]">
                    {c.count.toLocaleString()}
                  </span>
                </Link>
              ))}
              <Link href="/discover" className="type-mono text-[11px] uppercase tracking-[0.16em] text-[#d4321a] underline underline-offset-[6px]">
                All collections →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Close */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="type-grotesk max-w-3xl text-[2.6rem] font-bold leading-[0.96] tracking-[-0.035em] sm:text-[4rem]">
          One object takes
          <br />
          ninety seconds.
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href="/signup"
            className="type-mono bg-[#d4321a] px-10 py-4 text-[12px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#b32712]"
          >
            Start free
          </Link>
          <Link href="/plans" className="type-mono text-[12px] uppercase tracking-[0.14em] text-[#5f5a50] underline underline-offset-[7px] hover:text-black">
            £5/mo for 1,000 · £79/mo for museums
          </Link>
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] text-[#8a8378]">
          <span className="type-grotesk font-bold text-black">VITRINE.</span>
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/faq" className="hover:text-black">FAQ</Link>
          <Link href="/blog" className="hover:text-black">Blog</Link>
          <Link href="/tools" className="hover:text-black">Free tools</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
