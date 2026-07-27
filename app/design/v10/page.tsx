import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections } from '../_lib'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v10 — Display Case',
  description: 'Homepage concept: gallery-white, huge type, one decision.',
  path: '/design/v10',
  noIndex: true,
})

export default async function V10() {
  const featured = await getFeaturedCollections(3)

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#0f0f0d]">
      <VariantBar current="v10" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-8 py-8">
        <Link href="/" className="type-didone text-[22px] tracking-[0.02em]">Vitrine</Link>
        <div className="type-mono flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] text-[#6e6e66]">
          <Link href="/discover" className="hidden hover:text-black sm:block">Collections</Link>
          <Link href="/plans" className="hidden hover:text-black sm:block">Pricing</Link>
          <Link href="/login" className="hover:text-black">Sign in</Link>
        </div>
      </header>

      {/* The case */}
      <section className="mx-auto max-w-6xl px-8 pb-24 pt-10 sm:pt-20">
        <h1 className="type-didone text-[3.2rem] leading-[0.94] tracking-[-0.02em] sm:text-[6rem] lg:text-[7.5rem]">
          Keep it
          <br />
          like it
          <br />
          matters.
        </h1>

        <div className="mt-16 grid gap-12 border-t border-black/15 pt-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-[19px] leading-[1.6] text-[#3b3b35]">
              Vitrine is a collection management system for people whose things deserve a record:
              every object photographed, dated, valued, condition-checked and placed — with a public
              collection site included, should you ever want an audience.
            </p>
            <div className="mt-10">
              <Link
                href="/signup"
                className="type-mono inline-block bg-[#0f0f0d] px-10 py-4 text-[12px] uppercase tracking-[0.2em] text-[#f7f7f4] transition-colors hover:bg-[#33332c]"
              >
                Begin your catalogue
              </Link>
              <p className="type-mono mt-4 text-[11px] uppercase tracking-[0.14em] text-[#8f8f86]">
                Free for 100 objects · £5 a month for 1,000
              </p>
            </div>
          </div>

          {/* Wall label */}
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="border-l border-black/20 pl-6">
              <p className="type-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8f86]">
                Wall label
              </p>
              <dl className="mt-5 space-y-4">
                {[
                  ['What it holds', 'Photographs, maker, date, provenance, price paid, valuation history, condition, location, documents'],
                  ['What it makes', 'A public collection site, insurance schedules, condition reports, private share links'],
                  ['For museums', 'Full Spectrum-mapped registers, staff roles and event ticketing on Professional, £79 a month'],
                  ['What it costs you to leave', 'Nothing — full export, every plan, any time'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="type-mono text-[10px] uppercase tracking-[0.16em] text-[#8f8f86]">{k}</dt>
                    <dd className="mt-1 text-[14px] leading-relaxed text-[#3b3b35]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Three plinths */}
      <section className="border-t border-black/15">
        <div className="mx-auto grid max-w-6xl gap-px bg-black/15 md:grid-cols-3">
          {[
            {
              n: 'i',
              h: 'Catalogue',
              b: 'One record per object, holding everything you know and everything you will forget. Add from your phone in the shop, or import a spreadsheet in an afternoon.',
            },
            {
              n: 'ii',
              h: 'Curate',
              b: 'Choose what the world sees, object by object. Your own address, your own colours, your name on it — and the valuations kept firmly to yourself.',
            },
            {
              n: 'iii',
              h: 'Prove',
              b: 'Insurance schedules, dated condition reports, valuation history and share links, generated from the catalogue rather than assembled the night before.',
            },
          ].map(p => (
            <div key={p.n} className="bg-[#f7f7f4] px-8 py-14">
              <span className="type-didone text-[28px] text-[#b3b3a8]">{p.n}</span>
              <h2 className="type-didone mt-8 text-[32px] leading-none">{p.h}</h2>
              <p className="mt-5 text-[15px] leading-[1.65] text-[#4a4a43]">{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* On show */}
      {featured.length > 0 && (
        <section className="border-t border-black/15">
          <div className="mx-auto max-w-6xl px-8 py-16">
            <p className="type-mono mb-8 text-[10px] uppercase tracking-[0.22em] text-[#8f8f86]">
              Currently on show
            </p>
            <div className="flex flex-wrap items-baseline gap-x-12 gap-y-5">
              {featured.map(c => (
                <Link key={c.slug} href={`/museum/${c.slug}`} className="group">
                  <span className="type-didone text-[30px] leading-none group-hover:italic sm:text-[40px]">
                    {c.name}
                  </span>
                  <span className="type-mono ml-4 text-[11px] uppercase tracking-[0.14em] text-[#8f8f86]">
                    {c.count.toLocaleString()} objects
                  </span>
                </Link>
              ))}
              <Link
                href="/discover"
                className="type-mono text-[11px] uppercase tracking-[0.18em] underline underline-offset-[6px] text-[#6e6e66] hover:text-black"
              >
                Every collection →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Close */}
      <section className="border-t border-black/15 bg-[#0f0f0d] text-[#f7f7f4]">
        <div className="mx-auto max-w-6xl px-8 py-24 text-center">
          <h2 className="type-didone text-[2.8rem] leading-[0.98] tracking-[-0.02em] sm:text-[4.5rem]">
            The first hundred
            <br />
            are free.
          </h2>
          <Link
            href="/signup"
            className="type-mono mt-12 inline-block bg-[#f7f7f4] px-12 py-4 text-[12px] uppercase tracking-[0.2em] text-[#0f0f0d] hover:bg-white"
          >
            Begin
          </Link>
          <p className="type-mono mt-5 text-[11px] uppercase tracking-[0.14em] text-white/35">
            No card · nothing public until you say so
          </p>
        </div>
      </section>

      <footer className="border-t border-black/15">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-8 gap-y-3 px-8 py-8 text-[10px] uppercase tracking-[0.18em] text-[#8f8f86]">
          <span className="type-didone text-[14px] normal-case tracking-normal text-black">Vitrine</span>
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/faq" className="hover:text-black">FAQ</Link>
          <Link href="/blog" className="hover:text-black">Journal</Link>
          <Link href="/tools" className="hover:text-black">Tools</Link>
          <Link href="/compliance" className="hover:text-black">Museums</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
