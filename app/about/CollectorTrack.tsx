import Link from 'next/link'
import { COLLECTION_PROFILES } from '@/lib/collectionProfiles'
import { COLLECTION_CATEGORIES } from '@/lib/categories'
import { TEMPLATES } from '@/lib/templates'
import { PLANS, FREE_TIER_TEMPLATES } from '@/lib/plans'
import { Section, Point, TemplateCard, LimitsTable } from './shared'

/**
 * Community and Hobbyist — the two `fullMode: false` tiers, which is also the
 * predicate that turns on collection profiles and simple mode. Every number
 * here is read from lib/, never typed, so the page cannot drift from the gates.
 */

const standard = TEMPLATES.filter((t) => !t.minPlan)
const premium = TEMPLATES.filter((t) => t.minPlan === 'professional')
const community = PLANS.community
const hobbyist = PLANS.hobbyist

// `general` is the "none of the above" fallback, and the registry lists it
// first. Leading a grid of collecting types with "A museum or general
// collection" reads as though that were the headline option, so it goes last.
// Still counted — the number in the copy is the whole registry.
const profiles = [
  ...COLLECTION_PROFILES.filter((p) => p.id !== 'general'),
  ...COLLECTION_PROFILES.filter((p) => p.id === 'general'),
]

export default function CollectorTrack() {
  return (
    <>
      <Section
        title="It knows what you collect"
        lead="Most collection software gives you a box called “Artist” and expects you to put a mint mark in it. Vitrine asks what you collect and changes to suit."
      >
        <p>
          Pick from {COLLECTION_PROFILES.length} collection types and the fields change with them. A
          card collector gets Set, Manufacturer, Player and Cert No. A coin collector gets
          Denomination, Mint, Year and Grade. Collect more than one thing and you can run several at
          once. Each object inherits the type of your collection, or overrides it on its own.
        </p>
        <p>
          Grading is part of the record proper. Grade, grading company and certification number are
          real fields, so you can search and sort on them and see them broken down in your analytics.
          Everything the type calls for is already there without you building it.
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 pt-2">
          {profiles.map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm text-stone-300">
              <span aria-hidden="true">{p.emoji}</span>
              {p.label}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Every collection gets a real website"
        lead="Your collection gets its own website, at its own address, with a design chosen to suit what you collect."
      >
        <p>
          Each design is a whole treatment. It sets the masthead, the way the collection is laid out,
          the arrangement of a single object’s page, and the typefaces it is all set in. Two designs
          may share a grid, but never share everything.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {standard.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
        <p className="pt-2">
          Then adjust it: hero height, columns, image shape, card padding, how much label text shows,
          light or dark, your own colours and fonts. Each design only shows you the controls it
          actually uses, so you are never moving a slider that does nothing.
        </p>
        <Point title="What the free plan includes">
          {FREE_TIER_TEMPLATES.map((id) => TEMPLATES.find((t) => t.id === id)?.name)
            .filter(Boolean)
            .join(', ')}
          , which is {FREE_TIER_TEMPLATES.length} of the {standard.length}. Hobbyist opens the rest,
          lets you choose your own web address, and takes the Vitrine badge off the footer.
        </Point>
        <Point title="Five more, on Professional">
          These work differently. Instead of laying images out in a rhythm, they size every frame
          from the object’s own proportions and treat it as something you handle. Several suit exactly
          the sort of thing collectors own. Foil fans a hand of graded cards; Verso turns an object
          over to show its catalogue entry. Both sit on the Professional plan.
        </Point>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {premium.map((t) => (
            <TemplateCard key={t.id} t={t} locked />
          ))}
        </div>
        <p className="pt-2 text-sm text-stone-500">
          Every site is hosted at vitrinecms.com/your-collection. Nothing to set up and no domain to
          buy.
        </p>
      </Section>

      <Section
        title="Group part of a collection and give it its own page"
        lead="“Struck in Gold.” “Everything from the 1986 Fleer set.” “The ones I actually paid too much for.”"
      >
        <p>
          Pick the members by hand, or write a rule and let it fill itself. Anything matching stays in
          as you add to the collection, and you can pin or drop individual items when the filter gets
          it slightly wrong.
        </p>
        <p>
          A published set gets its own page on your site, its own place in the navigation, and a card
          on your homepage. Choose how visitors move through it: a plain grid, a cover flow, a
          carousel, a filmstrip, objects stood on shelves, a darkroom contact sheet, a dated timeline,
          or one item per screen for phones. Covers build themselves from the items inside, so there
          is nothing to upload.
        </p>
        <p className="text-stone-300">Unlimited, on every plan including the free one.</p>
      </Section>

      <Section
        title="Be found by people who collect what you collect"
        lead="Discover is a public directory of collections on Vitrine. It browses objects, so people find the piece first and the collection second."
      >
        <p>
          Someone looking for early Staffordshire figures sees the figures, then finds the collection
          they belong to. Filter by any of {COLLECTION_CATEGORIES.length} collecting categories,
          search by object, or look up a collection by name. Items can carry their own category, so
          the odd Roman coin in a militaria collection still surfaces under Coins &amp; Medals.
        </p>
        <p>
          Listing is off until you turn it on, and only objects you have already published to your own
          site appear. Once listed, people can message you about a piece, a trade or a question of
          attribution, and it lands in your inbox instead of your email. You can switch messages off
          and stay a listing only.
        </p>
        <p className="text-sm font-mono">
          <Link href="/discover" className="text-amber-500 hover:text-amber-400 transition-colors">
            Browse Discover →
          </Link>
        </p>
      </Section>

      <Section
        title="Keep track of what you are still after"
        lead="Every collector keeps this list somewhere. A notes app, a spreadsheet, the back of their head."
      >
        <p>
          Record what you are hunting, how badly you want it, and what you are willing to pay. Publish
          it to your site and other collectors can see what you are looking for. Occasionally that is
          how you find it.
        </p>
      </Section>

      <Section
        title="What you paid, what it’s worth"
        lead="Record a purchase price and an estimated value against every object and see the collection’s total, its cost, and the difference between them."
      >
        <p>
          Buy in dollars and sell in pounds and the sums still work. Seven currencies are supported,
          converted to whichever you count in.
        </p>
        <p>
          None of it is public unless you say so. Values are hidden on your site by default.
        </p>
      </Section>

      <Section
        title="Show someone the collection without publishing it"
        lead="Create a private link, send it to a valuer or an insurer, and set it to expire when you are done."
      >
        <p>
          It works without an account at the other end and it does not touch what is on your public
          site. Unlimited links, from Hobbyist up.
        </p>
      </Section>

      <Section
        title="Import what you already have, and see what it adds up to"
        lead="Bring an existing spreadsheet in as CSV, and take the whole collection back out the same way whenever you like."
      >
        <p>
          Your data stays yours, and the export button is always there. The analytics view breaks the
          collection down by type, medium and status, and tracks what you have paid against what it is
          worth.
        </p>
        <p>
          Hobbyist also gives you {hobbyist.documentStorageMb} MB for documents: receipts,
          certificates, valuations and provenance, attached to the objects they belong to.
        </p>
      </Section>

      <Section
        title="Two things you can use without signing up"
        lead="An insurance inventory generator and a condition report builder, both free."
      >
        <p>
          The inventory tool turns a list of what you own into a document an insurer will accept. The
          condition report builder gives you a damage map you can mark up. Both run in your browser.
          Nothing is uploaded, and we do not ask for your email.
        </p>
        <p className="text-sm font-mono flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/tools/insurance-inventory" className="text-amber-500 hover:text-amber-400 transition-colors">
            Insurance inventory →
          </Link>
          <Link href="/tools/condition-report" className="text-amber-500 hover:text-amber-400 transition-colors">
            Condition report →
          </Link>
        </p>
      </Section>

      <Section title="What each plan holds">
        <LimitsTable
          columns={[community.label, hobbyist.label]}
          rows={[
            ['Objects', community.objects!.toLocaleString(), hobbyist.objects!.toLocaleString()],
            ['Photos per object', String(community.imagesPerObject), String(hobbyist.imagesPerObject)],
            ['Site designs', String(FREE_TIER_TEMPLATES.length), String(standard.length)],
            ['Documents', '—', `${hobbyist.documentStorageMb} MB`],
            ['Private share links', '—', 'Unlimited'],
            ['Analytics & CSV', '—', 'Yes'],
            ['Choose your web address', '—', 'Yes'],
            ['Remove Vitrine badge', '—', 'Yes'],
            ['Collection sets', 'Unlimited', 'Unlimited'],
            ['Wishlist', 'Yes', 'Yes'],
            ['Discover listing', 'Yes', 'Yes'],
          ]}
          footnote="The professional plans, for museums and galleries working with staff, are on the other side of this page."
        />
      </Section>
    </>
  )
}
