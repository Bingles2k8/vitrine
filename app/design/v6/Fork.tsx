'use client'

import Link from 'next/link'
import { useState } from 'react'

type Side = 'collector' | 'institution'

const CONTENT: Record<
  Side,
  {
    kicker: string
    head: React.ReactNode
    sub: string
    cta: { label: string; href: string }
    alt: { label: string; href: string }
    note: string
    points: [string, string][]
    price: { name: string; price: string; line: string; href: string }[]
    closing: string
  }
> = {
  collector: {
    kicker: 'For people with a collection at home',
    head: (
      <>
        You know what everything is.
        <br />
        Nobody else does.
      </>
    ),
    sub: 'Records, cameras, coins, militaria, fossils, watches — whatever fills the shelves. Vitrine gives every piece a proper record, and gives the collection a website if you want one.',
    cta: { label: 'Start free — 100 objects', href: '/signup' },
    alt: { label: 'Look at other collections', href: '/discover' },
    note: 'No card. Export everything whenever you like.',
    points: [
      ['Photograph and log it in a minute', 'Add from your phone while you are still in the shop. Details can follow.'],
      ['Know what it is worth', 'Valuation history per object, so you can see what has moved and what has not.'],
      ['Insurance without the dread', 'Generate a schedule with photographs, values and condition instead of retyping a spreadsheet.'],
      ['Show it off, or do not', 'A public site at your own address, with a publish switch on every single object.'],
      ['Stop buying the same thing twice', 'Duplicate detection, wishlists, and a record of what you paid last time.'],
      ['Leave whenever', 'Full CSV export on every plan, including the free one.'],
    ],
    price: [
      { name: 'Community', price: 'Free', line: '100 objects, 1 photo each, public site included', href: '/signup' },
      { name: 'Hobbyist', price: '£5/mo', line: '1,000 objects, 5 photos each, analytics, CSV import, no Vitrine branding', href: '/signup' },
    ],
    closing: 'Start with the piece you would grab in a fire.',
  },
  institution: {
    kicker: 'For museums, galleries and archives',
    head: (
      <>
        The registers, the website,
        <br />
        and one bill.
      </>
    ),
    sub: 'A collections management system with Spectrum-mapped documentation, plus the public museum site, plan-your-visit page and ticketing — running off the same catalogue, so nothing has to be kept in sync by hand.',
    cta: { label: 'Start the 30-day trial', href: '/signup' },
    alt: { label: 'See documentation coverage', href: '/compliance' },
    note: 'No card to begin. Ten staff accounts included on Professional.',
    points: [
      ['Entry to accession', 'Entry forms, receipts, open-ended entry, accession numbering and registers.'],
      ['Loans, in and out', 'Agreements, lenders and borrowers, due dates and returns, all against the object.'],
      ['Condition and conservation', 'Dated condition reports with damage mapping; treatment records that persist.'],
      ['Valuation, insurance, audit', 'Valuation history, policies, insured values, audit exercises and sign-off.'],
      ['Deaccession, done properly', 'Proposal, approval, method and exit records — with protection against accidental deletion.'],
      ['The public side', 'Object pages, exhibitions, opening hours, access information and event ticketing.'],
    ],
    price: [
      { name: 'Professional', price: '£79/mo', line: '5,000 objects, 10 staff, full registers, ticketing, analytics — 30-day trial', href: '/signup' },
      { name: 'Institution', price: 'On application', line: 'Higher object, staff and storage limits; bespoke terms', href: '/plans/institution' },
    ],
    closing: 'Put one real accession through it and judge the record.',
  },
}

export default function Fork() {
  const [side, setSide] = useState<Side>('collector')
  const c = CONTENT[side]

  const dark = side === 'institution'
  const bg = dark ? 'bg-[#12161a] text-[#e8e9e6]' : 'bg-[#fbfaf7] text-[#15150f]'
  const muted = dark ? 'text-white/55' : 'text-[#5a5750]'
  const faint = dark ? 'text-white/35' : 'text-[#9a958a]'
  const line = dark ? 'border-white/12' : 'border-black/12'
  const accent = dark ? '#7fa8c9' : '#8a5a1f'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      {/* The fork itself — first thing on the page */}
      <div className={`border-b ${line}`}>
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="type-book text-xl">Vitrine.</Link>
          <div
            role="tablist"
            aria-label="Who is this for"
            className={`type-mono flex overflow-hidden rounded-none border ${line}`}
          >
            {(
              [
                ['collector', 'I collect'],
                ['institution', 'I run a museum'],
              ] as [Side, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={side === key}
                onClick={() => setSide(key)}
                className={`px-5 py-2.5 text-[12px] uppercase tracking-[0.14em] transition-colors ${
                  side === key
                    ? dark
                      ? 'bg-[#e8e9e6] text-[#12161a]'
                      : 'bg-[#15150f] text-[#fbfaf7]'
                    : `${muted} hover:opacity-80`
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="type-mono flex items-center gap-5 text-[12px]">
            <Link href="/login" className={`${muted} hover:opacity-70`}>Sign in</Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-14 pt-16">
        <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.18em]" style={{ color: accent }}>
          {c.kicker}
        </p>
        <h1 className="type-grotesk max-w-3xl text-[2.3rem] font-medium leading-[1.05] tracking-[-0.025em] sm:text-[3.4rem]">
          {c.head}
        </h1>
        <p className={`mt-6 max-w-xl text-[17px] leading-relaxed ${muted}`}>{c.sub}</p>

        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link
            href={c.cta.href}
            className={`type-mono px-7 py-3.5 text-[12px] uppercase tracking-[0.14em] transition-opacity hover:opacity-90 ${
              dark ? 'bg-[#e8e9e6] text-[#12161a]' : 'bg-[#15150f] text-[#fbfaf7]'
            }`}
          >
            {c.cta.label}
          </Link>
          <Link
            href={c.alt.href}
            className={`type-mono text-[12px] uppercase tracking-[0.14em] underline underline-offset-[6px] ${muted} hover:opacity-70`}
          >
            {c.alt.label}
          </Link>
        </div>
        <p className={`type-mono mt-4 text-[11px] ${faint}`}>{c.note}</p>
      </section>

      {/* Points */}
      <section className={`border-t ${line}`}>
        <div className="mx-auto max-w-5xl px-6 py-14">
          <div className={`grid gap-x-12 gap-y-8 sm:grid-cols-2`}>
            {c.points.map(([h, b], i) => (
              <div key={h} className={`border-t pt-5 ${line}`}>
                <span className={`type-mono text-[11px] ${faint}`}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className="type-grotesk mt-3 text-[18px] font-medium leading-snug">{h}</h3>
                <p className={`mt-2 text-[15px] leading-relaxed ${muted}`}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price */}
      <section className={`border-t ${line}`}>
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="type-grotesk mb-8 text-[1.7rem] font-medium tracking-[-0.02em]">What it costs you</h2>
          <div className={`grid gap-px sm:grid-cols-2 ${dark ? 'bg-white/12' : 'bg-black/12'}`}>
            {c.price.map(p => (
              <div key={p.name} className={`${dark ? 'bg-[#12161a]' : 'bg-[#fbfaf7]'} p-7`}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="type-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: accent }}>
                    {p.name}
                  </span>
                  <span className="type-book text-[28px]">{p.price}</span>
                </div>
                <p className={`mt-4 text-[15px] leading-relaxed ${muted}`}>{p.line}</p>
                <Link
                  href={p.href}
                  className={`type-mono mt-6 inline-block text-[11px] uppercase tracking-[0.14em] underline underline-offset-4 hover:opacity-70`}
                  style={{ color: accent }}
                >
                  Choose {p.name} →
                </Link>
              </div>
            ))}
          </div>
          <p className={`type-mono mt-5 text-[11px] ${faint}`}>
            Wrong door?{' '}
            <button
              onClick={() => setSide(side === 'collector' ? 'institution' : 'collector')}
              className="underline underline-offset-4 hover:opacity-70"
            >
              See the {side === 'collector' ? 'museum' : 'collector'} side instead
            </button>
          </p>
        </div>
      </section>

      {/* Close */}
      <section className={`border-t ${line}`}>
        <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <h2 className="type-grotesk max-w-lg text-[1.9rem] font-medium leading-tight tracking-[-0.02em]">
            {c.closing}
          </h2>
          <Link
            href={c.cta.href}
            className={`type-mono shrink-0 px-9 py-4 text-center text-[12px] uppercase tracking-[0.14em] transition-opacity hover:opacity-90 ${
              dark ? 'bg-[#e8e9e6] text-[#12161a]' : 'bg-[#15150f] text-[#fbfaf7]'
            }`}
          >
            {c.cta.label}
          </Link>
        </div>
      </section>

      <footer className={`border-t ${line}`}>
        <div className={`type-mono mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] ${faint}`}>
          <span className="type-book">Vitrine.</span>
          <Link href="/about" className="hover:opacity-70">About</Link>
          <Link href="/faq" className="hover:opacity-70">FAQ</Link>
          <Link href="/discover" className="hover:opacity-70">Discover</Link>
          <Link href="/tools" className="hover:opacity-70">Free tools</Link>
          <Link href="/privacy" className="hover:opacity-70">Privacy</Link>
          <Link href="/terms" className="hover:opacity-70">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
