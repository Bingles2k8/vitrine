import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'

export const metadata = buildPageMetadata({
  title: 'Design v8 — One Object',
  description: 'Homepage concept: one object travels from shoebox to public page.',
  path: '/design/v8',
  noIndex: true,
})

const GOLD = '#c9a961'

const SCRAPS = [
  { text: 'auction, march? — £620 I think', rot: '-3deg' },
  { text: 'LOT 212', rot: '2deg' },
  { text: 'serviced — the man in Hackney', rot: '-1.5deg' },
  { text: 'worth about a grand now?', rot: '4deg' },
  { text: 'Leitz Wetzlar — 1954? 1955?', rot: '-2.5deg' },
  { text: 'receipt: somewhere', rot: '1deg' },
]

const FIELDS: [string, string][] = [
  ['Object no.', '2026.014.3'],
  ['Object', 'Leica M3 rangefinder camera, chrome'],
  ['Maker', 'Ernst Leitz GmbH, Wetzlar'],
  ['Year', '1954'],
  ['Acquired', '11 March 2019 · auction, lot 212 · £620'],
  ['Valuation', '£1,200 · reviewed January 2026'],
  ['Condition', 'Excellent · shutter serviced 2024'],
  ['Location', 'Cabinet 2, shelf B'],
  ['Documents', 'Receipt · Service report'],
]

export default function V8() {
  return (
    <div className="min-h-screen bg-[#0c0b09] text-[#ece7dc]">
      <VariantBar current="v8" />

      <header className="absolute left-0 right-0 top-[30px] z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <Link href="/" className="type-book text-xl">
            Vitrine<span style={{ color: GOLD }}>.</span>
          </Link>
          <div className="type-mono flex items-center gap-6 text-[11px] uppercase tracking-[0.16em]">
            <Link href="/login" className="text-white/45 hover:text-white">Sign in</Link>
            <Link href="/signup" className="border px-5 py-2 hover:bg-white hover:text-black" style={{ borderColor: `${GOLD}80`, color: GOLD }}>
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Act I — the shoebox */}
      <section className="relative flex min-h-[92vh] items-center px-6 pt-28">
        <div className="mx-auto grid w-full max-w-5xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Act one · the shoebox
            </p>
            <h1 className="type-book text-[2.6rem] leading-[1.06] sm:text-[3.8rem]">
              You own a 1954 Leica.
              <br />
              Everything else about it
              <br />
              lives in your head.
            </h1>
            <p className="mt-7 max-w-md text-[17px] leading-relaxed text-white/55">
              What you paid. Roughly when. The man in Hackney who serviced the shutter. Whether the
              receipt is in the drawer or the loft. It has been fine so far, because you have not had
              to prove any of it to anyone.
            </p>
          </div>

          <div className="relative min-h-[300px]">
            {SCRAPS.map((s, i) => (
              <p
                key={s.text}
                className="type-mono mb-4 inline-block border border-white/10 bg-[#141210] px-4 py-2.5 text-[13px] text-white/45"
                style={{
                  transform: `rotate(${s.rot})`,
                  marginLeft: `${(i % 3) * 22}px`,
                }}
              >
                {s.text}
              </p>
            ))}
            <p className="type-mono mt-6 text-[11px] uppercase tracking-[0.16em] text-white/25">
              Not a catalogue. A rumour.
            </p>
          </div>
        </div>
      </section>

      {/* Act II — the record */}
      <section className="relative border-t border-white/10 bg-[#100e0c] px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="border border-white/12 bg-[#0c0b09] p-7">
              <div className="mb-6 flex items-start gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center border text-3xl" style={{ borderColor: `${GOLD}55` }}>
                  📷
                </div>
                <div>
                  <div className="type-book text-2xl leading-tight">Leica M3</div>
                  <div className="type-mono mt-1.5 text-[11px]" style={{ color: GOLD }}>
                    Catalogued · published · insured
                  </div>
                </div>
              </div>
              <dl className="border-t border-white/10">
                {FIELDS.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-4 border-b border-white/10 py-2.5">
                    <dt className="type-mono text-[10px] uppercase tracking-[0.1em] text-white/35">{k}</dt>
                    <dd className="col-span-2 text-[13.5px] leading-relaxed text-white/85">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Act two · the record
            </p>
            <h2 className="type-book text-[2.2rem] leading-[1.12] sm:text-[2.9rem]">
              Ninety seconds later it
              <br />
              exists outside your head.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/55">
              A photograph, a maker, a date, a price, a condition, a shelf. Vitrine keeps the
              valuation history too, so next year you can see what moved. The receipt goes in as a
              document, where it stops being lost.
            </p>
            <Link
              href="/signup"
              className="type-mono mt-8 inline-block px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-90"
              style={{ background: GOLD }}
            >
              Do this with your first object
            </Link>
          </div>
        </div>
      </section>

      {/* Act III — the page */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto grid max-w-5xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Act three · the audience
            </p>
            <h2 className="type-book text-[2.2rem] leading-[1.12] sm:text-[2.9rem]">
              And then, if you like,
              <br />
              other people can see it.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/55">
              One switch publishes the object to your collection site — your own address, your name
              on it. Another makes a private link for a single object, for an insurer or a buyer,
              that expires when you say. The valuation and the storage location stay behind the
              curtain either way.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link
                href="/discover"
                className="type-mono text-[12px] uppercase tracking-[0.16em] underline underline-offset-[6px] text-white/50 hover:text-white"
              >
                See real collections
              </Link>
            </div>
          </div>

          <div className="border border-white/12">
            <div className="type-mono flex items-center gap-3 border-b border-white/10 bg-[#141210] px-4 py-2.5 text-[11px] text-white/35">
              vitrine.app/your-collection/leica-m3
            </div>
            <div className="p-8">
              <div className="mb-6 flex h-44 items-center justify-center border border-white/10 bg-[#141210] text-5xl">
                📷
              </div>
              <h3 className="type-book text-2xl">Leica M3 rangefinder camera</h3>
              <p className="type-mono mt-2 text-[11px] uppercase tracking-[0.14em] text-white/35">
                Ernst Leitz GmbH · 1954 · chrome
              </p>
              <p className="mt-4 text-[14px] leading-relaxed text-white/55">
                Bought at auction in 2019 and used most weekends since. Shutter serviced in 2024; the
                original receipt is filed against the record.
              </p>
              <div className="type-mono mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em] text-white/30">
                {['Cameras', 'Post-war', 'In use'].map(t => (
                  <span key={t} className="border border-white/10 px-2.5 py-1">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coda */}
      <section className="border-t border-white/10 bg-[#100e0c] px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Coda
          </p>
          <h2 className="type-book text-[2.4rem] leading-[1.1] sm:text-[3.2rem]">
            Now do the other
            <br />
            three hundred.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-white/55">
            The first hundred objects are free and stay free. A thousand is £5 a month. Museums and
            galleries start at £79 with the full documentation registers and a thirty-day trial.
          </p>
          <Link
            href="/signup"
            className="type-mono mt-10 inline-block px-10 py-4 text-[12px] uppercase tracking-[0.16em] text-black transition-opacity hover:opacity-90"
            style={{ background: GOLD }}
          >
            Start the catalogue
          </Link>
          <p className="type-mono mt-4 text-[11px] text-white/30">
            No card · export everything whenever you like
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="type-mono mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/30">
          <span className="type-book normal-case tracking-normal text-white/70">Vitrine.</span>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/faq" className="hover:text-white">FAQ</Link>
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <Link href="/tools" className="hover:text-white">Tools</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
