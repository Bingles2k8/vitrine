import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections } from '../_lib'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v1 — Accession',
  description: 'Homepage concept: the page as a museum object label.',
  path: '/design/v1',
  noIndex: true,
})

const PAPER = '#f4f1ea'
const INK = '#16150f'

const LABEL_FIELDS: [string, string][] = [
  ['Accession no.', '2026.014.3'],
  ['Object', 'Leica M3 rangefinder camera, chrome'],
  ['Maker', 'Ernst Leitz GmbH, Wetzlar'],
  ['Date', '1954'],
  ['Acquired', '11 March 2019 · auction, Lot 212'],
  ['Condition', 'Excellent — shutter serviced 2024'],
  ['Valuation', '£1,200 · last reviewed Jan 2026'],
  ['Location', 'Cabinet 2, shelf B'],
]

const PLATES = [
  {
    n: '01',
    label: 'The record',
    head: 'Everything you know about a piece, in one place that outlives your memory.',
    body: 'Photographs, maker, date, what you paid, what it is worth now, condition history, where it physically is. Fields that are actually used by people who catalogue for a living — not a notes box pretending to be a database.',
    aside: ['Photos per object', 'Condition history', 'Valuation over time', 'Provenance notes', 'Physical location', 'Documents & receipts'],
  },
  {
    n: '02',
    label: 'The public face',
    head: 'A public collection site that looks like yours, not like a web app.',
    body: 'Every collection gets an address of its own. Choose what is shown and what stays private, down to the individual object. Send a link to an insurer, a fellow collector, a curator, or the whole internet.',
    aside: ['Your own URL', 'Per-object visibility', 'Template & colours', 'Your logo', 'Private share links', 'Listed in Discover'],
  },
  {
    n: '03',
    label: 'The paperwork',
    head: 'And when it needs to stand up to scrutiny, it does.',
    body: 'Professional plans add the registers a working museum is expected to keep: entry, acquisition, loans in and out, condition checking, conservation, valuation, insurance, deaccession and audit — mapped to Spectrum procedures.',
    aside: ['Entry & acquisition', 'Loans in / out', 'Condition checking', 'Conservation', 'Insurance & valuation', 'Deaccession & audit'],
  },
]

export default async function V1() {
  const featured = await getFeaturedCollections(4)

  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-screen">
      <VariantBar current="v1" />

      {/* Nav — a printed masthead, not a floating pill */}
      <header className="border-b" style={{ borderColor: `${INK}26` }}>
        <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-6 px-6 py-5">
          <Link href="/" className="type-book text-xl tracking-tight">
            Vitrine<span style={{ color: '#7b2d26' }}>.</span>
          </Link>
          <nav className="type-mono hidden gap-7 text-[11px] uppercase tracking-[0.16em] sm:flex" style={{ color: '#6b665a' }}>
            <Link href="/discover" className="hover:text-[#7b2d26]">Discover</Link>
            <Link href="/compliance" className="hover:text-[#7b2d26]">Documentation</Link>
            <Link href="/plans" className="hover:text-[#7b2d26]">Pricing</Link>
            <Link href="/guide/essentials" className="hover:text-[#7b2d26]">Guide</Link>
          </nav>
          <div className="type-mono flex items-center gap-5 text-[11px] uppercase tracking-[0.16em]">
            <Link href="/login" style={{ color: '#6b665a' }} className="hover:text-[#7b2d26]">Sign in</Link>
            <Link href="/signup" className="underline decoration-1 underline-offset-4" style={{ color: '#7b2d26' }}>
              Open an account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — statement left, object label right */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <p className="type-mono mb-8 text-[11px] uppercase tracking-[0.22em]" style={{ color: '#7b2d26' }}>
              Collection management, est. here
            </p>
            <h1 className="type-book text-[2.6rem] leading-[1.05] tracking-[-0.015em] sm:text-6xl lg:text-[4.25rem]">
              A collection is only
              <br />
              as good as its
              <br />
              <span style={{ color: '#7b2d26' }}>records.</span>
            </h1>
            <p className="mt-8 max-w-md text-[17px] leading-[1.65]" style={{ color: '#4c483e' }}>
              Vitrine is where the record lives: every object catalogued properly, valued,
              photographed and located — with a public collection site that comes free with it.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-mono px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-[#f4f1ea] transition-opacity hover:opacity-90"
                style={{ background: '#7b2d26' }}
              >
                Catalogue your first object
              </Link>
              <Link
                href="/discover"
                className="type-mono text-[12px] uppercase tracking-[0.16em] underline decoration-1 underline-offset-[6px]"
                style={{ color: '#6b665a' }}
              >
                Read other people&apos;s records
              </Link>
            </div>
            <p className="type-mono mt-5 text-[11px]" style={{ color: '#8a8377' }}>
              Free for 100 objects · no card · export everything whenever you like
            </p>
          </div>

          {/* The label */}
          <div className="lg:col-span-5">
            <figure className="border p-7 sm:p-8" style={{ borderColor: `${INK}33`, background: '#fbf9f5' }}>
              <div className="type-mono mb-6 flex items-baseline justify-between text-[10px] uppercase tracking-[0.2em]" style={{ color: '#8a8377' }}>
                <span>Object record</span>
                <span>Vitrine</span>
              </div>
              <dl className="space-y-0">
                {LABEL_FIELDS.map(([k, v], i) => (
                  <div
                    key={k}
                    className="grid grid-cols-3 gap-4 border-t py-3"
                    style={{ borderColor: i === 0 ? `${INK}33` : `${INK}14` }}
                  >
                    <dt className="type-mono text-[10px] uppercase leading-relaxed tracking-[0.12em]" style={{ color: '#8a8377' }}>
                      {k}
                    </dt>
                    <dd className="col-span-2 text-[14px] leading-relaxed" style={{ color: '#2a2820' }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
              <figcaption className="type-mono mt-6 border-t pt-4 text-[11px] leading-relaxed" style={{ borderColor: `${INK}33`, color: '#8a8377' }}>
                One object, fully catalogued. This is what a Vitrine record holds — and what a
                shoebox of receipts does not.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Proof strip — real collections, set as a line of text */}
      {featured.length > 0 && (
        <section className="border-y" style={{ borderColor: `${INK}26` }}>
          <div className="mx-auto max-w-6xl px-6 py-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:gap-8">
              <p className="type-mono shrink-0 text-[10px] uppercase tracking-[0.2em]" style={{ color: '#8a8377' }}>
                Public today
              </p>
              <p className="type-book flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[15px]">
                {featured.map(c => (
                  <Link key={c.slug} href={`/museum/${c.slug}`} className="hover:text-[#7b2d26]">
                    {c.name}
                    <span className="type-mono ml-2 text-[11px]" style={{ color: '#8a8377' }}>
                      {c.count.toLocaleString()} objects
                    </span>
                  </Link>
                ))}
                <Link href="/discover" className="type-mono text-[11px] uppercase tracking-[0.16em] underline underline-offset-4" style={{ color: '#7b2d26' }}>
                  all collections →
                </Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Plates */}
      {PLATES.map((p, i) => (
        <section key={p.n} className={i > 0 ? 'border-t' : ''} style={{ borderColor: `${INK}14` }}>
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-3">
              <p className="type-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: '#7b2d26' }}>
                Plate {p.n}
              </p>
              <p className="type-mono mt-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: '#8a8377' }}>
                {p.label}
              </p>
            </div>
            <div className="lg:col-span-6">
              <h2 className="type-book text-[1.75rem] leading-[1.25] sm:text-[2.1rem]">{p.head}</h2>
              <p className="mt-5 max-w-xl text-[16px] leading-[1.7]" style={{ color: '#4c483e' }}>
                {p.body}
              </p>
            </div>
            <ul className="type-mono space-y-2 text-[11px] uppercase tracking-[0.1em] lg:col-span-3" style={{ color: '#6b665a' }}>
              {p.aside.map(a => (
                <li key={a} className="border-b pb-2" style={{ borderColor: `${INK}14` }}>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      {/* Pricing as a ledger */}
      <section className="border-t" style={{ borderColor: `${INK}26` }}>
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="type-book text-[2.1rem] leading-tight">What it costs</h2>
            <p className="type-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: '#8a8377' }}>
              Prices in GBP · cancel any time · data exportable always
            </p>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="type-mono border-y text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: `${INK}33`, color: '#8a8377' }}>
                <th className="py-3 font-normal">Plan</th>
                <th className="py-3 font-normal">For</th>
                <th className="hidden py-3 font-normal sm:table-cell">Holds</th>
                <th className="py-3 text-right font-normal">Price</th>
                <th className="py-3 text-right font-normal" />
              </tr>
            </thead>
            <tbody>
              {[
                { plan: 'Community', who: 'Getting started', holds: '100 objects · 1 photo each', price: 'Free', cta: 'Start', href: '/signup' },
                { plan: 'Hobbyist', who: 'A collection you take seriously', holds: '1,000 objects · 5 photos each · analytics · CSV import', price: '£5 / mo', cta: 'Choose', href: '/signup', mark: true },
                { plan: 'Professional', who: 'Museums & galleries', holds: '5,000 objects · 10 staff · full registers · ticketing', price: '£79 / mo', cta: '30-day trial', href: '/signup' },
                { plan: 'Institution', who: 'Larger organisations', holds: 'Higher limits, more staff, bespoke terms', price: 'See plans', cta: 'Enquire', href: '/plans/institution' },
              ].map(row => (
                <tr key={row.plan} className="border-b align-top" style={{ borderColor: `${INK}14` }}>
                  <td className="py-5 pr-4">
                    <span className="type-book text-[19px]">{row.plan}</span>
                    {row.mark && (
                      <span className="type-mono ml-3 text-[10px] uppercase tracking-[0.14em]" style={{ color: '#7b2d26' }}>
                        most chosen
                      </span>
                    )}
                  </td>
                  <td className="py-5 pr-4 text-[14px]" style={{ color: '#4c483e' }}>{row.who}</td>
                  <td className="hidden py-5 pr-4 text-[13px] sm:table-cell" style={{ color: '#6b665a' }}>{row.holds}</td>
                  <td className="type-mono py-5 text-right text-[14px] whitespace-nowrap">{row.price}</td>
                  <td className="py-5 pl-4 text-right">
                    <Link
                      href={row.href}
                      className="type-mono text-[11px] uppercase tracking-[0.14em] underline decoration-1 underline-offset-4 whitespace-nowrap"
                      style={{ color: '#7b2d26' }}
                    >
                      {row.cta} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Closing wall label */}
      <section className="border-t" style={{ borderColor: `${INK}26` }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-xl border p-9 text-center" style={{ borderColor: `${INK}33`, background: '#fbf9f5' }}>
            <p className="type-mono mb-5 text-[10px] uppercase tracking-[0.2em]" style={{ color: '#8a8377' }}>
              Untitled collection
            </p>
            <h2 className="type-book text-[2rem] leading-tight">Yours, unrecorded.</h2>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed" style={{ color: '#4c483e' }}>
              Ten minutes and a phone camera is enough to start. The first hundred objects are free,
              and everything you enter is yours to export.
            </p>
            <Link
              href="/signup"
              className="type-mono mt-8 inline-block px-8 py-3.5 text-[12px] uppercase tracking-[0.16em] text-[#f4f1ea] transition-opacity hover:opacity-90"
              style={{ background: '#7b2d26' }}
            >
              Begin the record
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: `${INK}26` }}>
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-[11px] uppercase tracking-[0.14em]" style={{ color: '#8a8377' }}>
          <span className="type-book normal-case tracking-normal">Vitrine.</span>
          <Link href="/about" className="hover:text-[#7b2d26]">About</Link>
          <Link href="/faq" className="hover:text-[#7b2d26]">FAQ</Link>
          <Link href="/blog" className="hover:text-[#7b2d26]">Blog</Link>
          <Link href="/tools" className="hover:text-[#7b2d26]">Free tools</Link>
          <Link href="/privacy" className="hover:text-[#7b2d26]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#7b2d26]">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
