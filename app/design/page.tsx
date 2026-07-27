import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VARIANTS } from './_lib'

export const metadata = buildPageMetadata({
  title: 'Homepage design concepts',
  description: 'Internal review: ten homepage concepts aimed at conversion.',
  path: '/design',
  noIndex: true,
})

const NOTES: Record<string, { best: string; risk: string; measure: string }> = {
  v1: {
    best: 'Collectors who care about provenance and craft; also reads credible to curators.',
    risk: 'Slow burn — the offer arrives late. Weakest for cold paid traffic.',
    measure: 'Scroll depth to pricing, signup rate from organic/blog traffic.',
  },
  v2: {
    best: 'Cold traffic. The product is used before the pitch is read.',
    risk: 'Widget has to feel instant; a janky first interaction is worse than a screenshot.',
    measure: 'Widget engagement → signup rate; drafted-object recovery on signup.',
  },
  v3: {
    best: 'Hobbyists who want to show their collection off. Aspiration-led.',
    risk: 'Depends on having good-looking public collections live at all times.',
    measure: 'Discover click-through, then signup; time on page.',
  },
  v4: {
    best: 'Anyone currently running a collection out of a spreadsheet — the biggest switch pool.',
    risk: 'Negative framing can feel smug; the contrast must stay factual.',
    measure: 'CSV-import CTA clicks, signup rate from comparison and "vs spreadsheet" keywords.',
  },
  v5: {
    best: 'Museum, gallery and archive buyers evaluating on documentation standards.',
    risk: 'Too austere for hobbyists; needs a separate consumer entry point.',
    measure: 'Professional trial starts, compliance-page reads, contact form volume.',
  },
  v6: {
    best: 'Mixed traffic where you cannot tell hobbyist from institution up front.',
    risk: 'Adds one decision before any value is shown; the fork must be obvious and instant.',
    measure: 'Fork selection split, then signup rate per side vs current blended rate.',
  },
  v7: {
    best: 'Paid traffic and price-sensitive shoppers. Fastest path to a decision.',
    risk: 'Plain by design — will look "unfinished" to some. Deliberate.',
    measure: 'Signup rate, paid-plan mix, FAQ expand rate as an objection signal.',
  },
  v8: {
    best: 'Visitors who do not yet know what a collection management system is.',
    risk: 'Longest to build well; a weak narrative is worse than a feature grid.',
    measure: 'Scroll completion, CTA clicks at each act, signup rate from cold social.',
  },
  v9: {
    best: 'Serious cataloguers with 500+ objects who distrust marketing pages.',
    risk: 'Density scares casual collectors. Narrow but high-intent.',
    measure: 'Signup rate from Reddit/forum referrers, paid conversion within 14 days.',
  },
  v10: {
    best: 'Design-led collectors; strong brand and social-share value.',
    risk: 'Says least. Everything rides on one line of copy and one CTA.',
    measure: 'Bounce rate vs signup rate — it will move both. Test against v7 as the floor.',
  },
}

export default function DesignIndex() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#16150f]">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="type-mono mb-3 text-[11px] uppercase tracking-[0.2em] text-[#7b2d26]">
          Internal · not indexed · not linked from the site
        </p>
        <h1 className="type-book mb-4 text-4xl leading-tight sm:text-5xl">
          Ten homepage concepts, aimed at conversion.
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[#544f45]">
          Each one is a working page with real pricing and real public collections, not a mockup.
          They are different arguments for signing up, not different paint jobs — so they should be
          judged on which argument is true for the traffic you actually get. Nothing here invents
          testimonials, customer counts or logos; where a page has a slot for proof it is marked.
        </p>

        <ol className="mt-12 space-y-px border-t border-[#16150f]/15">
          {VARIANTS.map((v, i) => {
            const note = NOTES[v.id]
            return (
              <li key={v.id} className="border-b border-[#16150f]/15">
                <Link
                  href={`/design/${v.id}`}
                  className="group block py-6 transition-colors hover:bg-[#16150f]/[0.03]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline">
                    <span className="type-mono w-16 shrink-0 text-xs text-[#8a8377]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <h2 className="type-book text-2xl group-hover:text-[#7b2d26]">{v.name}</h2>
                      <p className="mt-1 text-[15px] text-[#544f45]">{v.thesis}</p>
                      <dl className="type-mono mt-4 grid gap-2 text-[11px] leading-relaxed text-[#6b665a] sm:grid-cols-3">
                        <div>
                          <dt className="uppercase tracking-[0.14em] text-[#a09889]">Best for</dt>
                          <dd className="mt-1">{note.best}</dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.14em] text-[#a09889]">Risk</dt>
                          <dd className="mt-1">{note.risk}</dd>
                        </div>
                        <div>
                          <dt className="uppercase tracking-[0.14em] text-[#a09889]">Measure</dt>
                          <dd className="mt-1">{note.measure}</dd>
                        </div>
                      </dl>
                    </div>
                    <span className="type-mono shrink-0 text-xs text-[#7b2d26] opacity-0 transition-opacity group-hover:opacity-100">
                      view →
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>

        <div className="type-mono mt-14 border-t border-[#16150f]/15 pt-6 text-[11px] leading-relaxed text-[#6b665a]">
          <p className="mb-2 uppercase tracking-[0.14em] text-[#a09889]">How to run this</p>
          <p className="max-w-2xl">
            Do not ship a blend. Pick one challenger with a thesis you believe, run it against the
            current homepage on a 50/50 split, and hold it until the signup-rate difference is real
            rather than promising. Then take the winner as the new control and test the next thesis
            against it. Blending ten pages produces a page with no argument at all.
          </p>
          <p className="mt-4">
            <Link href="/" className="underline underline-offset-4 hover:text-[#7b2d26]">
              Current homepage (control) →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
