import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import Pile, { type Body } from './Pile'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v19 — The Pile',
  description: 'Homepage concept: your collection as a physical pile you can throw around.',
  path: '/design/v19',
  noIndex: true,
})

const FALLBACK: [string, string][] = [
  ['Leica M3', '📷'], ['Please Please Me', '💿'], ['Seamaster 300', '⌚'],
  ['Roman denarius', '🪙'], ['Delft charger', '🏺'], ['Braun T3', '📻'],
  ['OS map, 1897', '🗺️'], ['Zeiss binoculars', '🔭'], ['Penny black', '📮'],
  ['Telecaster', '🎸'], ['Meccano no.6', '⚙️'], ['Trilobite', '🦴'],
  ['Ivorine chess set', '♟️'], ['Singer 99K', '🧵'], ['Stanley no.4', '🪚'],
  ['Oak barometer', '🌡️'], ['Bakelite phone', '☎️'], ['Cap badge', '🎖️'],
]

export default async function V19() {
  const objects = await getWallObjects(18)

  const bodies: Body[] = objects.length
    ? objects.map(o => ({ id: o.id, label: o.title, emoji: o.emoji ?? '▪', image: o.image_url }))
    : FALLBACK.map(([label, emoji], i) => ({ id: `f${i}`, label, emoji, image: null }))

  return (
    <div className="min-h-screen bg-[#fff3e0] text-[#14110d]">
      <VariantBar current="v19" />

      <header className="flex items-center justify-between border-b-2 border-[#14110d] px-5 py-3">
        <Link href="/" className="type-grotesk text-[19px] font-black tracking-[-0.03em]">
          VITRINE
        </Link>
        <nav className="type-mono hidden gap-6 text-[11px] font-bold uppercase sm:flex">
          <Link href="/discover" className="hover:text-[#e8452c]">Discover</Link>
          <Link href="/plans" className="hover:text-[#e8452c]">Pricing</Link>
          <Link href="/login" className="hover:text-[#e8452c]">Sign in</Link>
        </nav>
        <Link
          href="/signup"
          className="type-mono border-2 border-[#14110d] bg-[#e8452c] px-4 py-1.5 text-[11px] font-bold uppercase text-white shadow-[3px_3px_0_0_#14110d]"
        >
          Start free
        </Link>
      </header>

      {/* THE FOLD — a pile you can throw about */}
      <section className="relative border-b-2 border-[#14110d]">
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-start p-5 sm:p-10">
          <h1 className="type-grotesk max-w-4xl text-[13vw] font-black uppercase leading-[0.82] tracking-[-0.045em] sm:text-[7rem]">
            This is your
            <br />
            collection
            <span className="text-[#e8452c]">.</span>
          </h1>
          <p className="type-grotesk mt-5 max-w-md text-[17px] font-bold leading-[1.3]">
            Chucked in a drawer. Undocumented. Worth more than you think and provable to nobody.
            Go on — throw it around, it&apos;s already a mess.
          </p>
          <div className="pointer-events-auto mt-7 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="type-grotesk border-2 border-[#14110d] bg-[#e8452c] px-8 py-4 text-[17px] font-black uppercase text-white shadow-[5px_5px_0_0_#14110d] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#14110d]"
            >
              Tidy it up — free →
            </Link>
            <span className="type-mono text-[11px] font-bold uppercase">
              100 objects free · no card
            </span>
          </div>
        </div>

        <div className="h-[66vh] min-h-[460px] w-full">
          <Pile bodies={bodies} />
        </div>

        <p className="type-mono pointer-events-none absolute bottom-3 right-4 z-10 text-[10px] font-bold uppercase tracking-[0.1em] text-[#14110d]/45">
          Grab one. Throw it. ↑
        </p>
      </section>

      {/* THE TIDY VERSION */}
      <section className="border-b-2 border-[#14110d] bg-[#14110d] text-[#fff3e0]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="type-grotesk text-[10vw] font-black uppercase leading-[0.85] tracking-[-0.04em] sm:text-[4.5rem]">
            And this is it
            <br />
            <span className="text-[#ffc531]">catalogued.</span>
          </h2>

          <div className="mt-12 grid gap-px bg-white/15 md:grid-cols-3">
            {[
              { h: 'Every object, on the record', b: 'Photos, maker, year, what you paid, what it is worth now, condition, which shelf it lives on, receipt attached.' },
              { h: 'A site, if you fancy it', b: 'Your own address, your colours, your name. Publish object by object — the valuations stay private.' },
              { h: 'Proof when you need it', b: 'Insurance schedules and condition reports out of the catalogue. Museums get the full registers.' },
            ].map(c => (
              <div key={c.h} className="bg-[#14110d] p-7">
                <h3 className="type-grotesk text-[21px] font-black uppercase leading-tight">{c.h}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICE */}
      <section className="border-b-2 border-[#14110d]">
        <div className="mx-auto grid max-w-6xl gap-0 md:grid-cols-3">
          {[
            { n: 'FREE', p: '£0', l: '100 objects, 1 photo each, public site. Forever.', cta: 'Start', bg: '#fff3e0' },
            { n: 'HOBBYIST', p: '£5', l: '1,000 objects, 5 photos each, analytics, CSV import.', cta: 'Get it', bg: '#ffc531', star: true },
            { n: 'MUSEUMS', p: '£79', l: '5,000 objects, 10 staff, full registers, ticketing. 30-day trial.', cta: 'Try it', bg: '#fff3e0' },
          ].map(t => (
            <div
              key={t.n}
              className="border-t-2 border-[#14110d] p-7 md:border-l-2 md:border-t-0 md:first:border-l-0"
              style={{ background: t.bg }}
            >
              <div className="type-mono flex items-baseline justify-between text-[11px] font-bold uppercase">
                <span>{t.n}</span>
                {t.star && <span className="text-[#e8452c]">★ most picked</span>}
              </div>
              <div className="type-grotesk mt-4 text-[62px] font-black leading-none tracking-[-0.04em]">
                {t.p}
                <span className="type-mono ml-1 text-[14px] font-bold">{t.n === 'FREE' ? '' : '/mo'}</span>
              </div>
              <p className="type-grotesk mt-4 text-[15px] font-bold leading-snug">{t.l}</p>
              <Link
                href="/signup"
                className="type-mono mt-6 block border-2 border-[#14110d] bg-[#14110d] py-3 text-center text-[12px] font-bold uppercase text-[#fff3e0] shadow-[4px_4px_0_0_rgba(20,17,13,0.25)]"
              >
                {t.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 text-center">
        <h2 className="type-grotesk text-[11vw] font-black uppercase leading-[0.85] tracking-[-0.045em] sm:text-[4.5rem]">
          Start with one thing.
        </h2>
        <Link
          href="/signup"
          className="type-grotesk mt-8 inline-block border-2 border-[#14110d] bg-[#e8452c] px-10 py-5 text-[19px] font-black uppercase text-white shadow-[6px_6px_0_0_#14110d]"
        >
          Catalogue it →
        </Link>
      </section>

      <footer className="border-t-2 border-[#14110d] px-5 py-6">
        <div className="type-mono flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold uppercase">
          <span>VITRINE</span>
          <Link href="/about" className="hover:text-[#e8452c]">About</Link>
          <Link href="/faq" className="hover:text-[#e8452c]">FAQ</Link>
          <Link href="/tools" className="hover:text-[#e8452c]">Tools</Link>
          <Link href="/privacy" className="hover:text-[#e8452c]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#e8452c]">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
