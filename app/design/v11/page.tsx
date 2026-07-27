import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import Vitrine3D from './Vitrine3D'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v11 — The Case',
  description: 'Homepage concept: a glass display case built in CSS 3D.',
  path: '/design/v11',
  noIndex: true,
})

const FALLBACK = [
  { label: 'Leica M3 rangefinder', meta: 'Ernst Leitz · 1954 · Excellent', emoji: '📷', image: null },
  { label: 'Braun T3 pocket radio', meta: 'Dieter Rams · 1958 · Good', emoji: '📻', image: null },
  { label: 'Omega Seamaster 300', meta: 'Biel/Bienne · 1966 · Fair', emoji: '⌚', image: null },
  { label: 'Please Please Me, mono', meta: 'Parlophone · 1963 · M−', emoji: '💿', image: null },
]

export default async function V11() {
  const objects = await getWallObjects(4)

  const pieces = objects.length
    ? objects.map(o => ({
        label: o.title,
        meta: o.museum,
        emoji: o.emoji ?? '🏛️',
        image: o.image_url,
      }))
    : FALLBACK

  return (
    <div className="min-h-screen bg-[#08090a] text-[#ece8df]">
      <VariantBar current="v11" />

      <header className="relative z-30 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="type-book text-xl">
          Vitrine<span className="text-[#e8c37a]">.</span>
        </Link>
        <nav className="type-mono hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-white/45 md:flex">
          <Link href="/discover" className="hover:text-white">Collections</Link>
          <Link href="/compliance" className="hover:text-white">Museums</Link>
          <Link href="/plans" className="hover:text-white">Pricing</Link>
          <Link href="/login" className="hover:text-white">Sign in</Link>
        </nav>
        <Link
          href="/signup"
          className="type-mono border border-[#e8c37a]/45 px-5 py-2 text-[11px] uppercase tracking-[0.16em] text-[#e8c37a] transition-colors hover:bg-[#e8c37a] hover:text-black"
        >
          Start free
        </Link>
      </header>

      {/* Hero — headline and case share the same space */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-4 px-6 pb-16 lg:grid-cols-2">
          <div className="relative z-20 pt-6 lg:pt-0">
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.24em] text-[#e8c37a]">
              Collection management · museums &amp; collectors
            </p>
            <h1 className="type-didone text-[3.4rem] leading-[0.9] tracking-[-0.02em] sm:text-[5rem] lg:text-[5.8rem]">
              Under
              <br />
              glass.
            </h1>
            <p className="mt-8 max-w-md text-[17px] leading-relaxed text-white/60">
              Vitrine catalogues what you own — photographed, dated, valued, condition-checked and
              placed — then gives the collection a public case of its own. The kind of record a
              museum keeps, for whatever it is you keep.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-mono bg-[#e8c37a] px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-[#08090a] transition-colors hover:bg-[#f2d597]"
              >
                Open your case
              </Link>
              <Link
                href="/discover"
                className="type-mono text-[12px] uppercase tracking-[0.16em] text-white/50 underline underline-offset-[7px] hover:text-white"
              >
                Walk the collections
              </Link>
            </div>
            <p className="type-mono mt-5 text-[11px] text-white/30">
              100 objects free · no card · nothing public until you say so
            </p>
          </div>

          <div className="relative lg:-mr-16">
            <Vitrine3D pieces={pieces} />
          </div>
        </div>
      </section>

      {/* Three cases */}
      <section className="border-t border-white/[0.08]">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/[0.08] md:grid-cols-3">
          {[
            {
              n: 'i',
              h: 'Catalogue',
              b: 'One record per object holding maker, date, provenance, price paid, valuation history, condition and location — plus the photographs and the receipt.',
            },
            {
              n: 'ii',
              h: 'Curate',
              b: 'Publish object by object to a collection site at your own address, in your own colours. The valuations and the storage locations stay behind the glass.',
            },
            {
              n: 'iii',
              h: 'Prove',
              b: 'Insurance schedules, dated condition reports and expiring share links, generated from the catalogue rather than assembled the night before.',
            },
          ].map(c => (
            <div key={c.n} className="group relative overflow-hidden bg-[#08090a] px-8 py-14">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <span className="type-didone relative text-[26px] text-[#e8c37a]/60">{c.n}</span>
              <h2 className="type-didone relative mt-7 text-[34px] leading-none">{c.h}</h2>
              <p className="relative mt-5 text-[15px] leading-[1.65] text-white/50">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing on plinths */}
      <section className="border-t border-white/[0.08]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="type-didone mb-14 text-center text-[2.6rem] leading-none sm:text-[3.4rem]">
            Three sizes of case.
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { name: 'Community', price: 'Free', line: '100 objects · 1 photograph each · public collection site', cta: 'Start free', href: '/signup' },
              { name: 'Hobbyist', price: '£5', suffix: '/mo', line: '1,000 objects · 5 photographs each · analytics · CSV import · your branding', cta: 'Choose Hobbyist', href: '/signup', lit: true },
              { name: 'Professional', price: '£79', suffix: '/mo', line: '5,000 objects · 10 staff · full documentation registers · ticketing · 30-day trial', cta: 'Start trial', href: '/signup' },
            ].map(p => (
              <div key={p.name} className="flex flex-col">
                <div
                  className={`flex flex-1 flex-col border p-8 ${
                    p.lit ? 'border-[#e8c37a]/35 bg-gradient-to-b from-[#e8c37a]/[0.07] to-transparent' : 'border-white/10'
                  }`}
                >
                  <div className="type-mono text-[11px] uppercase tracking-[0.18em] text-[#e8c37a]">{p.name}</div>
                  <div className="type-didone mt-5 text-[46px] leading-none">
                    {p.price}
                    {p.suffix && <span className="type-mono ml-1 text-[15px] text-white/40">{p.suffix}</span>}
                  </div>
                  <p className="mt-5 flex-1 text-[14.5px] leading-relaxed text-white/50">{p.line}</p>
                  <Link
                    href={p.href}
                    className={`type-mono mt-8 block py-3 text-center text-[11px] uppercase tracking-[0.16em] transition-colors ${
                      p.lit
                        ? 'bg-[#e8c37a] text-[#08090a] hover:bg-[#f2d597]'
                        : 'border border-white/15 text-white/70 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {p.cta}
                  </Link>
                </div>
                {/* plinth */}
                <div className="h-3 bg-gradient-to-b from-white/[0.07] to-transparent" />
              </div>
            ))}
          </div>
          <p className="type-mono mt-10 text-center text-[11px] text-white/30">
            Cancel in one click · full export on every plan, including the free one ·{' '}
            <Link href="/plans/institution" className="underline underline-offset-4 hover:text-white/60">
              Institution &amp; Enterprise
            </Link>
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/[0.08]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(600px 300px at 50% 0%, rgba(232,195,122,0.10), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="type-didone text-[2.8rem] leading-[0.95] sm:text-[4rem]">
            Your first object
            <br />
            is waiting for a label.
          </h2>
          <Link
            href="/signup"
            className="type-mono mt-11 inline-block bg-[#e8c37a] px-11 py-4 text-[12px] uppercase tracking-[0.16em] text-[#08090a] hover:bg-[#f2d597]"
          >
            Begin cataloguing
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.08]">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-7 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em] text-white/25">
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
