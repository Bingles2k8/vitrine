import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'

export const metadata = buildPageMetadata({
  title: 'Design v5 — The Register',
  description: 'Homepage concept: an archival dossier for institutional buyers.',
  path: '/design/v5',
  noIndex: true,
})

const SECTIONS = [
  {
    n: '1',
    title: 'What it is',
    body: [
      'Vitrine is a collections management system with a public-facing museum website attached to it. One database, one login, one bill. The catalogue your registrar works in is the catalogue your visitors browse — there is no export step between the two, and no second CMS to keep in sync.',
      'It runs in a browser. There is nothing to install on your machines, no server in the back office, and no annual licence negotiation. A small museum can be documenting objects the same afternoon it signs up.',
    ],
  },
  {
    n: '2',
    title: 'Documentation procedures',
    body: [
      'Professional and Institution plans carry the registers a UK museum is expected to keep, mapped to Spectrum procedures rather than approximated by a generic notes field.',
    ],
    list: [
      ['Object entry', 'Entry forms, receipts, open-ended entry slots, and a full entry register.'],
      ['Acquisition & accessioning', 'Accession numbering, source, method, transfer of title, accession register.'],
      ['Location & movement control', 'Current and permanent locations, movement history, audit trail.'],
      ['Loans in / loans out', 'Loan agreements, borrower and lender records, due dates, returns.'],
      ['Condition checking & assessment', 'Condition reports with damage mapping and dated history per object.'],
      ['Conservation & collections care', 'Treatment records, conservator, materials, dates, before and after.'],
      ['Valuation & insurance', 'Valuation history, policies, insured values, schedules for underwriters.'],
      ['Deaccession & disposal', 'Proposal, approval, method, exit records, protection against accidental deletion.'],
      ['Audit', 'Audit exercises, spot checks, discrepancies, sign-off.'],
      ['Rights & reproduction', 'Rights holders, licences, reproduction requests, image permissions.'],
    ],
  },
  {
    n: '3',
    title: 'The public side',
    body: [
      'Every account includes a public museum site: collection browsing, object pages, exhibitions, a plan-your-visit page with opening hours and access information, and event ticketing on Professional and above. Objects appear online only where you have set them to, and the catalogue fields you consider internal — valuations, storage locations, donor details — never leave the back office.',
    ],
  },
  {
    n: '4',
    title: 'Staff, permissions and continuity',
    body: [
      'Professional includes ten staff accounts with roles; Institution plans raise the limits. Every record carries who changed what and when. Data is exportable in full, in open formats, on every plan — including the free one. That is deliberate: the exit is the point. A collection database you cannot leave is a risk to the collection, not a feature of the software.',
    ],
  },
  {
    n: '5',
    title: 'What it costs',
    body: [
      'Professional is £79 a month, with a thirty-day trial and no card required to begin: up to 5,000 objects, ten staff accounts, the registers listed above, ticketing, visitor and collection analytics, and 1 GB of document storage. Institution and Enterprise plans raise object, staff and storage limits and are quoted individually.',
      'There is no implementation fee, no per-seat surcharge and no annual minimum. If you use it for a month and it is not right, you export and stop paying.',
    ],
  },
]

export default function V5() {
  return (
    <div className="min-h-screen bg-[#f2efe9] text-[#1a1a17]">
      <VariantBar current="v5" />

      <header className="border-b-2 border-[#1a1a17]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-4 px-6 py-4">
          <Link href="/" className="type-book text-lg tracking-tight">Vitrine.</Link>
          <div className="type-mono flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.14em] text-[#5f5b52]">
            <Link href="/compliance" className="hover:text-[#1a1a17]">Documentation</Link>
            <Link href="/guide/professional" className="hover:text-[#1a1a17]">Guide</Link>
            <Link href="/plans" className="hover:text-[#1a1a17]">Plans</Link>
            <Link href="/contact" className="hover:text-[#1a1a17]">Contact</Link>
            <Link href="/login" className="hover:text-[#1a1a17]">Sign in</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6">
        {/* Masthead */}
        <div className="border-b border-[#1a1a17]/25 py-14">
          <div className="type-mono mb-10 grid gap-2 text-[11px] uppercase tracking-[0.14em] text-[#5f5b52] sm:grid-cols-3">
            <div>
              <span className="block text-[#a09a8d]">Document</span>
              Collections management system — overview
            </div>
            <div>
              <span className="block text-[#a09a8d]">For</span>
              Museums, galleries, archives, historic houses
            </div>
            <div>
              <span className="block text-[#a09a8d]">Status</span>
              In service · trial available
            </div>
          </div>

          <h1 className="type-book max-w-3xl text-[2.3rem] leading-[1.12] sm:text-[3.1rem]">
            A collections management system that does the paperwork properly, and runs your website
            while it is at it.
          </h1>

          <p className="mt-7 max-w-2xl text-[17px] leading-[1.7] text-[#413d36]">
            Written for the person who has to answer to an accreditation assessor, an auditor and an
            underwriter — and who is also, most weeks, the person updating the opening hours.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/signup"
              className="type-mono bg-[#1a1a17] px-7 py-3.5 text-[12px] uppercase tracking-[0.14em] text-[#f2efe9] hover:bg-[#33322c]"
            >
              Begin the 30-day trial
            </Link>
            <Link
              href="/contact"
              className="type-mono text-[12px] uppercase tracking-[0.14em] underline decoration-1 underline-offset-[6px] text-[#5f5b52] hover:text-[#1a1a17]"
            >
              Ask a question first
            </Link>
          </div>
          <p className="type-mono mt-4 text-[11px] text-[#a09a8d]">
            No card required to begin · £79/month thereafter · cancel in one click
          </p>
        </div>

        {/* Contents */}
        <nav className="border-b border-[#1a1a17]/25 py-8">
          <p className="type-mono mb-4 text-[11px] uppercase tracking-[0.16em] text-[#a09a8d]">Contents</p>
          <ol className="type-mono grid gap-y-2 text-[13px] sm:grid-cols-2">
            {SECTIONS.map(s => (
              <li key={s.n}>
                <a href={`#s${s.n}`} className="hover:text-[#7b2d26]">
                  <span className="mr-3 text-[#a09a8d]">{s.n}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Body */}
        {SECTIONS.map(s => (
          <section key={s.n} id={`s${s.n}`} className="border-b border-[#1a1a17]/15 py-12 scroll-mt-12">
            <div className="grid gap-8 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <h2 className="type-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-[#5f5b52]">
                  <span className="mr-2 text-[#a09a8d]">{s.n}</span>
                  {s.title}
                </h2>
              </div>
              <div className="sm:col-span-9">
                {s.body.map(p => (
                  <p key={p} className="mb-5 max-w-2xl text-[16px] leading-[1.75] text-[#33302a] last:mb-0">
                    {p}
                  </p>
                ))}

                {s.list && (
                  <dl className="mt-8 border-t border-[#1a1a17]/20">
                    {s.list.map(([k, v]) => (
                      <div key={k} className="grid gap-2 border-b border-[#1a1a17]/10 py-3 sm:grid-cols-3">
                        <dt className="type-mono text-[12px] leading-relaxed text-[#1a1a17]">{k}</dt>
                        <dd className="text-[14px] leading-relaxed text-[#5f5b52] sm:col-span-2">{v}</dd>
                      </div>
                    ))}
                    <p className="type-mono mt-4 text-[11px] leading-relaxed text-[#a09a8d]">
                      Procedure coverage is documented in full at{' '}
                      <Link href="/compliance" className="underline underline-offset-4 hover:text-[#7b2d26]">
                        /compliance
                      </Link>
                      , including which fields map to which Spectrum requirement.
                    </p>
                  </dl>
                )}
              </div>
            </div>
          </section>
        ))}

        {/* Close */}
        <section className="py-14">
          <div className="border-2 border-[#1a1a17] p-8 sm:p-10">
            <h2 className="type-book text-[1.8rem] leading-snug">
              The quickest way to judge this is to put ten real objects into it.
            </h2>
            <p className="mt-4 max-w-2xl text-[16px] leading-[1.7] text-[#413d36]">
              Take an accession you already know well, enter it fully, run a condition report and an
              insurance schedule off the back of it, and see whether the record holds everything your
              current system holds. Thirty days is more than enough to find out, and nothing is
              charged in that time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link href="/signup" className="type-mono bg-[#1a1a17] px-7 py-3.5 text-[12px] uppercase tracking-[0.14em] text-[#f2efe9] hover:bg-[#33322c]">
                Start the trial
              </Link>
              <Link href="/guide/professional" className="type-mono text-[12px] uppercase tracking-[0.14em] underline underline-offset-[6px] text-[#5f5b52] hover:text-[#1a1a17]">
                Read the professional guide
              </Link>
              <Link href="/plans/institution" className="type-mono text-[12px] uppercase tracking-[0.14em] underline underline-offset-[6px] text-[#5f5b52] hover:text-[#1a1a17]">
                Institution &amp; enterprise
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-[#1a1a17]">
        <div className="type-mono mx-auto flex max-w-4xl flex-wrap gap-x-6 gap-y-2 px-6 py-7 text-[11px] uppercase tracking-[0.12em] text-[#a09a8d]">
          <span className="type-book normal-case tracking-normal text-[#1a1a17]">Vitrine.</span>
          <Link href="/about" className="hover:text-[#1a1a17]">About</Link>
          <Link href="/compliance" className="hover:text-[#1a1a17]">Compliance</Link>
          <Link href="/discover" className="hover:text-[#1a1a17]">Discover</Link>
          <Link href="/faq" className="hover:text-[#1a1a17]">FAQ</Link>
          <Link href="/privacy" className="hover:text-[#1a1a17]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#1a1a17]">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
