import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v17 — Loud',
  description: 'Homepage concept: maximalist type and object marquees.',
  path: '/design/v17',
  noIndex: true,
})

const CREAM = '#f3eee2'
const INK = '#100f0d'
const RED = '#ff3b14'
const BLUE = '#1b2ecc'

const FALLBACK = ['📷', '💿', '⌚', '🪙', '🏺', '📻', '🗺️', '🔭', '📮', '🎸', '⚙️', '🦴', '♟️', '🧵', '🪚', '🌡️']

type StripItem = { id: string; emoji: string | null; image_url: string | null }

function Marquee({ items, reverse, dur }: { items: StripItem[]; reverse?: boolean; dur: number }) {
  return (
    <div className="flex overflow-hidden" style={{ background: INK }}>
      <div
        className="flex shrink-0 items-center gap-4 py-3 pr-4"
        style={{ animation: `v17-slide ${dur}s linear infinite${reverse ? ' reverse' : ''}` }}
      >
        {[...items, ...items].map((o, i) => (
          <div
            key={`${o.id}-${i}`}
            className="flex h-[86px] w-[86px] shrink-0 items-center justify-center overflow-hidden text-3xl"
            style={{ background: i % 5 === 0 ? RED : i % 7 === 0 ? BLUE : '#1e1c18' }}
          >
            {o.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span>{o.emoji ?? '▪'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function V17() {
  const objects = await getWallObjects(20)
  const strip: StripItem[] = objects.length
    ? objects.map(o => ({ id: o.id, emoji: o.emoji, image_url: o.image_url }))
    : FALLBACK.map((e, i) => ({ id: `f${i}`, emoji: e, image_url: null }))

  return (
    <div style={{ background: CREAM, color: INK }} className="min-h-screen overflow-x-hidden">
      <VariantBar current="v17" />

      <style>{`
        @keyframes v17-slide { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes v17-jitter { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @media (prefers-reduced-motion: reduce) {
          [style*="v17-slide"], [style*="v17-jitter"] { animation: none !important; }
        }
      `}</style>

      <header className="flex items-center justify-between border-b-2 px-5 py-3" style={{ borderColor: INK }}>
        <Link href="/" className="type-grotesk text-[19px] font-black tracking-[-0.04em]">
          VITRINE<span style={{ color: RED }}>®</span>
        </Link>
        <nav className="type-mono hidden gap-6 text-[11px] font-bold uppercase tracking-[0.08em] sm:flex">
          <Link href="/discover" className="hover:text-[#ff3b14]">Discover</Link>
          <Link href="/plans" className="hover:text-[#ff3b14]">Pricing</Link>
          <Link href="/compliance" className="hover:text-[#ff3b14]">Museums</Link>
          <Link href="/login" className="hover:text-[#ff3b14]">Sign in</Link>
        </nav>
        <Link
          href="/signup"
          className="type-mono border-2 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white"
          style={{ background: RED, borderColor: INK }}
        >
          Start free
        </Link>
      </header>

      {/* THE FOLD */}
      <section className="relative">
        <div className="px-4 pt-6">
          <p className="type-mono mb-2 text-[11px] font-bold uppercase tracking-[0.1em]">
            <span style={{ background: BLUE }} className="px-2 py-1 text-white">Cameras</span>{' '}
            <span className="px-2 py-1" style={{ background: INK, color: CREAM }}>Records</span>{' '}
            <span style={{ background: RED }} className="px-2 py-1 text-white">Coins</span>{' '}
            <span className="px-2 py-1" style={{ background: INK, color: CREAM }}>Fossils</span>{' '}
            <span style={{ background: BLUE }} className="px-2 py-1 text-white">Watches</span>{' '}
            <span className="hidden px-2 py-1 sm:inline" style={{ background: INK, color: CREAM }}>Militaria</span>
          </p>

          <h1 className="type-grotesk font-black uppercase leading-[0.78] tracking-[-0.05em]">
            <span className="block text-[19vw]">STOP</span>
            <span className="block text-[19vw]" style={{ color: RED }}>LOSING</span>
          </h1>
        </div>

        <div className="my-1 border-y-2" style={{ borderColor: INK }}>
          <Marquee items={strip} dur={42} />
        </div>

        <div className="px-4">
          <h2 className="type-grotesk font-black uppercase leading-[0.78] tracking-[-0.05em]">
            <span className="block text-[19vw]">TRACK</span>
            <span
              className="block text-[19vw]"
              style={{ WebkitTextStroke: `2px ${INK}`, color: 'transparent' }}
            >
              OF IT
            </span>
          </h2>
        </div>

        <div className="mt-2 grid gap-0 border-y-2 md:grid-cols-12" style={{ borderColor: INK }}>
          <div className="border-b-2 p-5 md:col-span-5 md:border-b-0 md:border-r-2" style={{ borderColor: INK }}>
            <p className="type-grotesk text-[19px] font-bold leading-[1.25]">
              You own three hundred things and you can prove almost nothing about any of them.
              Vitrine gives every object a record — photo, maker, year, what you paid, what it&apos;s
              worth now, what condition it&apos;s in and where the hell it actually is.
            </p>
          </div>
          <div className="flex flex-col justify-between gap-4 p-5 md:col-span-4 md:border-r-2" style={{ borderColor: INK }}>
            <Link
              href="/signup"
              className="type-grotesk block px-5 py-6 text-center text-[22px] font-black uppercase tracking-[-0.02em] text-white"
              style={{ background: RED, animation: 'v17-jitter 3.4s ease-in-out infinite' }}
            >
              Catalogue your
              <br />
              first object →
            </Link>
            <p className="type-mono text-[11px] font-bold uppercase leading-relaxed">
              100 objects free · no card · £5/mo for 1,000
            </p>
          </div>
          <div className="p-5 md:col-span-3">
            <div className="type-mono text-[11px] font-bold uppercase leading-[1.9]">
              <div className="flex justify-between border-b" style={{ borderColor: INK }}><span>Free</span><span>100 objects</span></div>
              <div className="flex justify-between border-b" style={{ borderColor: INK }}><span>£5/mo</span><span>1,000 objects</span></div>
              <div className="flex justify-between border-b" style={{ borderColor: INK }}><span>£79/mo</span><span>Museums</span></div>
              <div className="flex justify-between"><span>Export</span><span>Always free</span></div>
            </div>
            <Link href="/plans" className="type-mono mt-3 inline-block text-[11px] font-bold uppercase underline" style={{ color: BLUE }}>
              Full pricing →
            </Link>
          </div>
        </div>

        <Marquee items={strip} dur={36} reverse />
      </section>

      {/* THREE SHOUTS */}
      <section className="border-b-2" style={{ borderColor: INK }}>
        {[
          { n: '01', h: 'A RECORD, NOT A ROW', b: 'Photographs, maker, date, provenance, price paid, valuation history, condition reports, location, documents. Everything a spreadsheet quietly refuses to hold.', bg: CREAM, fg: INK },
          { n: '02', h: 'A SITE OF YOUR OWN', b: 'Your collection gets an address, your colours and your name on it. Publishing is a switch on every single object — the valuations never leave the back office.', bg: BLUE, fg: '#ffffff' },
          { n: '03', h: 'PROOF, ON DEMAND', b: 'Insurance schedules and dated condition reports straight out of the catalogue. Museums get the full registers: entry, acquisition, loans, conservation, deaccession, audit.', bg: RED, fg: '#ffffff' },
        ].map(s => (
          <div
            key={s.n}
            className="grid gap-6 border-t-2 px-5 py-12 md:grid-cols-12"
            style={{ borderColor: INK, background: s.bg, color: s.fg }}
          >
            <div className="type-mono text-[13px] font-bold md:col-span-2">{s.n}</div>
            <h3 className="type-grotesk text-[9vw] font-black uppercase leading-[0.85] tracking-[-0.04em] md:col-span-6 md:text-[4rem]">
              {s.h}
            </h3>
            <p className="type-grotesk text-[16px] font-bold leading-[1.35] md:col-span-4">{s.b}</p>
          </div>
        ))}
      </section>

      {/* CLOSE */}
      <section className="px-5 py-16" style={{ background: INK, color: CREAM }}>
        <h2 className="type-grotesk text-[13vw] font-black uppercase leading-[0.8] tracking-[-0.05em]">
          ONE OBJECT.
          <br />
          <span style={{ color: RED }}>NINETY</span> SECONDS.
        </h2>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link
            href="/signup"
            className="type-grotesk px-10 py-5 text-[20px] font-black uppercase text-white"
            style={{ background: RED }}
          >
            Start free →
          </Link>
          <Link href="/discover" className="type-mono text-[12px] font-bold uppercase underline underline-offset-[6px]">
            Or nose through other people&apos;s collections
          </Link>
        </div>
      </section>

      <footer className="border-t-2 px-5 py-6" style={{ borderColor: INK }}>
        <div className="type-mono flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold uppercase">
          <span>VITRINE®</span>
          <Link href="/about" className="hover:text-[#ff3b14]">About</Link>
          <Link href="/faq" className="hover:text-[#ff3b14]">FAQ</Link>
          <Link href="/blog" className="hover:text-[#ff3b14]">Blog</Link>
          <Link href="/tools" className="hover:text-[#ff3b14]">Tools</Link>
          <Link href="/privacy" className="hover:text-[#ff3b14]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#ff3b14]">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
