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
  v44: {
    best: 'The room is lit by the visitor\u2019s own time of day — fluorescent at 2am, tungsten at dusk, daylight at noon. Costs nothing to run and nobody else does it.',
    risk: 'Two visitors comparing notes see different sites, and any screenshot only ever shows one of the three.',
    measure: 'Signup rate split by band. If one band is clearly ahead, ship that one and drop the mechanic.',
  },
  v41: {
    best: 'The live brand exactly: stone-950, tungsten lamps, amber on the type. Warmest of the three and the least work to ship.',
    risk: 'Warm greys plus warm light can drift toward sepia. Watch it does not read as a period piece.',
    measure: 'Scroll depth through the pinned section, then CTA clicks past 50% travel.',
  },
  v42: {
    best: 'Cold room, warm signature. Fluorescent tubes against a bone-white interface, with amber left on the wordmark alone — reads institutional and expensive.',
    risk: 'Loses the amber CTA the rest of the site uses, so it is a brand decision, not just a page one.',
    measure: 'Same as v41, plus CTA click rate — a white button on a cold page is a real change to the primary action.',
  },
  v43: {
    best: 'The full inversion. Depth comes from haze instead of darkness, and dark objects on pale shelves are far easier to read at a glance.',
    risk: 'Furthest from the current site of the three, and a bright hero gives the render nowhere to hide.',
    measure: 'Signup rate against v41 head to head; light pages usually win on trust and lose on memorability.',
  },
  v36: {
    best: 'The brand name rendered instead of described. Real refraction is the thing nobody else on this market has.',
    risk: 'Glass over type is a legibility fight, and refraction that is slightly wrong just reads as a bug.',
    measure: 'Drag rate, then signup rate among visitors who dragged versus those who did not.',
  },
  v37: {
    best: 'Total confidence and nothing to read. Cheapest scene here by a distance, so it is the one that will be smooth on a mid-range phone.',
    risk: 'It is a product shot for a product that is not the object. The copy has to carry the whole argument alone.',
    measure: 'Signup rate from cold paid traffic — this is the one built for it.',
  },
  v38: {
    best: 'Scale made physical. The counter climbing as you travel is the argument, and it is impossible to argue with.',
    risk: 'Repetition can read as repetition. Also the only concept that hijacks the scroll, which some visitors hate.',
    measure: 'Scroll depth through the pinned section, then CTA clicks past 50% travel.',
  },
  v39: {
    best: 'The only one that demonstrates the actual software above the fold. Answers "what do I get" without a screenshot.',
    risk: 'Busiest of the five, and the leader lines have to keep pointing at the object on every screen size.',
    measure: 'Signup rate, and time to first CTA click against v37 — this trades speed for substance.',
  },
  v40: {
    best: 'Pure curiosity. The button is a payoff rather than a link, so pressing it costs nothing and commits nothing.',
    risk: 'A hero with nothing in it. Lives or dies on the headline, and the reveal only lands once.',
    measure: 'Reveal press rate, then signup rate among those who pressed. If the first number is low the concept is dead.',
  },
  v31: {
    best: 'The darkest step. Strongest problem statement, and the crate labels make the photos feel found rather than staged.',
    risk: 'Almost no light. Photos are small and the room does the talking.',
    measure: 'Professional trial starts; this end should over-index with institutions.',
  },
  v32: {
    best: 'Keeps the store honesty but you can actually see the place. Prints read clearly.',
    risk: 'Fluorescent green-grey is nobody\u2019s favourite colour. Least attractive step in the ramp.',
    measure: 'Signup rate against v31 — this isolates whether the darkness helps or hurts.',
  },
  v33: {
    best: 'The true midpoint and probably the most broadly likeable: a real room, real light, real work.',
    risk: 'Middle of a spectrum can mean committing to nothing. Check it does not read as bland.',
    measure: 'Straight signup rate. If the ramp has a peak, expect it near here.',
  },
  v34: {
    best: 'Bright and aspirational while still a place. Prints are large enough to carry real proof.',
    risk: 'Starts to look like a furniture catalogue rather than software for keeping records.',
    measure: 'Signup rate plus £5 tier mix; this end should favour hobbyists.',
  },
  v35: {
    best: 'The clean end. Loudest, most product-like, best for cold paid traffic.',
    risk: 'Loses the room entirely — no context, no story, just an object and a claim.',
    measure: 'Signup rate from paid; compare directly against v31 to size the whole spectrum.',
  },
  v26: {
    best: 'Reads modern and calm, and the black-on-white type is far easier to make legible.',
    risk: 'A bright room hides the shader\u2019s best trick — no beam, no drama. Can look like a render, not a place.',
    measure: 'Signup rate against the dark rooms; bright pages usually win on trust, lose on memorability.',
  },
  v27: {
    best: 'The most premium-looking of the lot. Mirror floor plus glowing case is the screenshot people share.',
    risk: 'Very dark and very cold — reads as security software rather than a hobby you enjoy.',
    measure: 'Direct/social referral share and time on page, then signup rate.',
  },
  v28: {
    best: 'The only one that says "your home", not "an institution". Best fit for the hobbyist tier.',
    risk: 'Warm and soft can read as lifestyle rather than software. The sun shaft is also the heaviest effect here.',
    measure: 'Signup rate from consumer channels, and £5 tier mix specifically.',
  },
  v29: {
    best: 'Truest to the actual problem — this is what an uncatalogued collection really looks like.',
    risk: 'Deliberately unglamorous. Sells the pain, not the pleasure.',
    measure: 'Professional trial starts; this one should over-index with institutional buyers.',
  },
  v30: {
    best: 'Loud, colourful, high-key. The clearest "this works for whatever you collect" statement.',
    risk: 'Abandons the museum metaphor almost entirely — closer to a hardware launch page.',
    measure: 'Signup rate from cold paid traffic, plus swatch/shape interaction as an intent signal.',
  },
  v21: {
    best: 'Closest to "handling the object". The lift-the-glass moment is the one people will remember.',
    risk: 'Orbit needs a hint or some visitors never drag at all and just see a still.',
    measure: 'Share of sessions that drag or lift, then signup rate among those who did versus did not.',
  },
  v22: {
    best: 'Conveys scale — the collection does not run out. Good for "I have hundreds of things".',
    risk: 'Constant motion with no user input can read as a video and get ignored. Also the heaviest scene.',
    measure: 'Time in the fold and CTA clicks; watch for motion-sickness complaints in feedback.',
  },
  v23: {
    best: 'The strongest argument of the five — the dark is the pitch, not decoration.',
    risk: 'Deliberately hides your product behind a beam. Impatient traffic may bounce.',
    measure: 'Time to first CTA click. If the metaphor works, it should be faster, not slower.',
  },
  v24: {
    best: 'Answers "does it work for what I collect?" without a word of copy. Most controls, most dwell.',
    risk: 'Configurator UI competes with the CTA. Fiddling is not converting.',
    measure: 'Control interactions per session against signup rate — check dwell is not just play.',
  },
  v25: {
    best: 'A guided story with a real payoff, and no interaction to learn. Safest of the five.',
    risk: 'Scroll-jacked builds age fast, and the offer only appears at the end.',
    measure: 'Scroll completion to the final stage, then CTA clicks from that stage.',
  },
  v16: {
    best: 'Maximum first-impression impact. Nothing else in this category looks remotely like it.',
    risk: 'A per-pixel raymarched shader. Needs a real frame-rate check on mid-range Android before it ships.',
    measure: 'Signup rate, but watch bounce rate on low-end devices as the counterweight.',
  },
  v17: {
    best: 'Hobbyist collectors arriving from social. Impossible to scroll past, very screenshot-able.',
    risk: 'Loud enough to put off the museum buyer entirely. Would need a separate institutional entry point.',
    measure: 'Signup rate from consumer channels; check the £79 tier does not fall off a cliff.',
  },
  v18: {
    best: 'Prestige and desire. The cheapest of the five to build and the easiest to get wrong.',
    risk: 'Entirely dependent on image quality — one mediocre photo and the whole page collapses.',
    measure: 'Signup rate, plus scroll-past-fold rate as a proxy for whether the image earns its space.',
  },
  v19: {
    best: 'Cold traffic that has never heard of collection management. The most memorable page here.',
    risk: 'Playfulness can undercut the "this protects your valuables" argument. Test the tone carefully.',
    measure: 'Interaction rate with the pile → signup. Watch returning-visitor share too; toys get revisited.',
  },
  v20: {
    best: 'Atmosphere with almost no cost — CSS masks, no 3D, no heavy assets. Strong on mobile.',
    risk: 'Hiding your own content behind a beam is a real conversion gamble on impatient traffic.',
    measure: 'Time to first CTA click, and signup rate against v18 which shows everything up front.',
  },
  v11: {
    best: 'Brand-building and design-led collectors. The most photographable page here.',
    risk: 'CSS 3D is the whole hook — it must be flawless on mid-range Android or it reads as broken.',
    measure: 'Signup rate, but also time-on-page and direct/social referral share.',
  },
  v12: {
    best: 'Cold visitors who do not yet know what "collection management" means. Play sells it.',
    risk: 'Drag-to-explore hides the pitch below the fold; needs the CTA pinned in view.',
    measure: 'Table interaction rate → record-drawer opens → signup. Watch mobile separately.',
  },
  v13: {
    best: 'Social and campaign traffic. A one-take scroll people finish and share.',
    risk: 'Five screens of scroll before an offer. Wrong for anyone arriving ready to buy.',
    measure: 'Scroll completion to the final act, then CTA clicks at the landing section.',
  },
  v14: {
    best: 'The safest of the five — familiar SaaS rhythm, but the record catalogues itself.',
    risk: 'Kinetic type is now common enough that it can read as trend-following.',
    measure: 'Straight signup rate against the current homepage. This is the fair fight.',
  },
  v15: {
    best: 'Everyone, and it compounds — the search doubles as a Discover funnel and SEO surface.',
    risk: 'Only as good as the published collections behind it; thin data makes a thin page.',
    measure: 'Search usage rate, empty-result CTA clicks (the strongest moment), signup rate.',
  },
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
          Thirty-five homepage concepts, aimed at conversion.
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-[#544f45]">
          Each one is a working page with real pricing and real public collections, not a mockup.
          They are different arguments for signing up, not different paint jobs — so they should be
          judged on which argument is true for the traffic you actually get. Nothing here invents
          testimonials, customer counts or logos; where a page has a slot for proof it is marked.
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#544f45]">
          The first five (v11–v15) are the ambitious round: the interface is built out of the
          objects themselves — a glass case in CSS 3D, a draggable curator&apos;s table, a
          scroll-driven pull-back, a record that catalogues itself, and a homepage that is a live
          search. The ten below them are the quieter first round, kept for reference and for the
          arguments they make.
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
