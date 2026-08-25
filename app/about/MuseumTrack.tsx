import Link from 'next/link'
import { COLLECTION_CATEGORIES } from '@/lib/categories'
import { TEMPLATES } from '@/lib/templates'
import { PLANS } from '@/lib/plans'
import { Section, Point, TemplateCard, LimitsTable } from './shared'

/**
 * Professional, Institution and Enterprise. All three carry identical feature
 * flags — the differences are limits only — so nothing here may invent a
 * feature difference between them.
 *
 * Note what these plans lose: the wishlist and the collection profiles are both
 * simple-mode features and are off here. Neither is mentioned.
 *
 * The registers are described in plain museum vocabulary and grouped the way
 * /compliance groups them. No standards claim, no procedure count, no
 * alignment language — see docs/about-page-plan.md §3.
 */

const standard = TEMPLATES.filter((t) => !t.minPlan)
const premium = TEMPLATES.filter((t) => t.minPlan === 'professional')
const professional = PLANS.professional
const institution = PLANS.institution
const enterprise = PLANS.enterprise

export default function MuseumTrack() {
  return (
    <>
      <Section
        title="Collections documentation, done properly"
        lead="Twenty-one registers, each a real record with its own history, grouped the way the work divides."
      >
        <Point title="Everyday records">
          Object entry for anything arriving, whether for acquisition, for loan or for an opinion,
          before anything else happens to it. Accessioning into the permanent collection with a formal
          register. Cataloguing. Location and movement control down to building, floor, room and unit.
          Inventory. Object exit, capturing authorisation, transport and receipt.
        </Point>
        <Point title="Loans and access">
          Loans in and loans out, with dates, insurance, conditions and overdue flags. Records of who
          used what, for research, photography, teaching or display. Rights management and
          reproduction rights, so you know what you are allowed to do with an image before someone
          asks.
        </Point>
        <Point title="Care and risk">
          Condition checking. Conservation treatments with costs and before-and-after images.
          Valuations with method, purpose and valuer. Insurance policies with the objects they cover
          and their renewal dates. Damage and loss reports through investigation, repair and claim. A
          risk register covering theft, fire, flood, pests and handling, rated and mitigated.
          Emergency plans with salvage priorities, so the most important things come out first.
        </Point>
        <Point title="Governance and review">
          Documentation planning against your backlog. Collections review against your collecting
          policy. Formal audit exercises. Disposal and deaccession, with the approval trail that
          requires.
        </Point>
        <p className="pt-1">
          Entry records carry donor and depositor details, who received the object, consent, and the
          terms it came in under.
        </p>
        <p className="text-sm font-mono">
          <Link href="/compliance" className="text-amber-500 hover:text-amber-400 transition-colors">
            See every register in detail →
          </Link>
        </p>
      </Section>

      <Section
        title="One object, its whole history"
        lead="Every object opens onto its full record, and every part of it is a real field with its own history."
      >
        <p>
          Where it came from and on what terms, where it is now and everywhere it has been, its
          condition and every treatment it has had, what it is insured for and what it was last valued
          at, who has borrowed it, what may be done with its image, and every document that belongs to
          it.
        </p>
        <p>
          Up to {professional.imagesPerObject} photographs per object. Print a catalogue record, or
          generate a QR label for the store. Scan it and the object’s page opens on your phone.
        </p>
      </Section>

      <Section
        title="Fourteen designs, five of which treat the object as something you handle"
        lead="Your public site is a real website with its own address, and you choose how it looks."
      >
        <p>
          All {standard.length} of the standard designs are here: the white-cube hang, the ruled
          catalogue, the salon, the mosaic, the magazine spread. Each is a whole treatment, setting
          the masthead, the collection grid, the arrangement of a single object’s page, and the
          typefaces it is all set in.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {standard.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
        <p className="pt-2">
          Five more work differently. Instead of laying images out in a rhythm, they size every frame
          from the object’s own proportions. Each has its own handful of controls, and each tells you
          how many objects it needs before it looks right. A rack of three does not read as a rack.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {premium.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
        <Point title="Plan your visit">
          Opening hours, admission, access, directions and seasonal notices, on their own page and
          editable by whoever is actually on the desk.
        </Point>
        <Point title="Embed it somewhere else">
          An iframe snippet that drops the collection into a website you already have, if the
          institution’s main site is not yours to replace.
        </Point>
      </Section>

      <Section
        title="Sell tickets from your own site"
        lead="Create an event, set capacity, add timed entry slots, and take bookings on your collection’s own website."
      >
        <p>
          Free events and paid events both work. Paid events go through Stripe and the money lands in
          your account, not ours.
        </p>
        <p>
          Every ticket carries a QR code. Scan it at the door and you get the event, the slot, the name
          on the booking and whether the ticket is still valid. Refunds are handled from the same
          place.
        </p>
      </Section>

      <Section
        title="Gather part of the collection into an exhibition"
        lead="An exhibition gets its own public page, its own place in the navigation, and a card on your homepage."
      >
        <p>
          Choose the objects by hand, or write a rule and let it fill itself as the collection grows,
          pinning or dropping individual items where the filter gets it wrong. Choose how visitors move
          through it: a grid, a cover flow, a carousel, a filmstrip, objects on shelves, a contact
          sheet, a dated timeline, or one item per screen on a phone.
        </p>
        <p className="text-stone-300">Unlimited, on every plan.</p>
      </Section>

      <Section
        title="Be found by people looking for what you hold"
        lead="Discover is a public directory of collections on Vitrine. It browses objects, so a researcher finds the object first and the collection second."
      >
        <p>
          There are {COLLECTION_CATEGORIES.length} categories, searchable by object or by collection
          name, with objects carrying their own category where it differs from the collection’s.
        </p>
        <p>
          Listing is off until you turn it on, and only objects already published to your own site
          appear. Enquiries from researchers, visitors and other institutions arrive in a shared inbox
          your whole team can read. You can switch messages off and stay a listing only.
        </p>
      </Section>

      <Section
        title="The rest of the team"
        lead="Invite colleagues and decide what each of them can do."
      >
        <p>
          Admins have full access, Editors can change records, Viewers can look but not touch. That is{' '}
          {professional.staff} accounts on {professional.label}, and unlimited on {institution.label}.
        </p>
        <p>
          Deleted objects go to a bin for 30 days before they are gone, and every register keeps its
          own history.
        </p>
      </Section>

      <Section
        title="What is in the collection, and who is looking at it"
        lead="The collection broken down by type, medium and status, with total value against total acquisition cost."
      >
        <p>
          On the public side, page views by day, which objects are being looked at, and which parts of
          the site people reach.
        </p>
        <p>
          Export the whole catalogue to CSV whenever you want it, and bring an existing one in the same
          way. Deeds of gift, condition reports, valuations, conservation records, insurance schedules
          and loan agreements attach to the object or the record they relate to. Object photographs do
          not count against your document storage.
        </p>
      </Section>

      <Section title="What each plan holds">
        <LimitsTable
          columns={[professional.label, institution.label, enterprise.label]}
          rows={[
            [
              'Objects',
              professional.objects!.toLocaleString(),
              institution.objects!.toLocaleString(),
              'Unlimited',
            ],
            ['Staff accounts', String(professional.staff), 'Unlimited', 'Unlimited'],
            ['Documents', '1 GB', '10 GB', 'Unlimited'],
            ['Everything else', 'Yes', 'Yes', 'Yes'],
          ]}
          footnote="That last row is literal. The three plans carry the same features and differ only in size, so the question is how much collection you have and how many people work on it."
        />
      </Section>
    </>
  )
}
