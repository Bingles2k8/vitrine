import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'

export const metadata = buildPageMetadata({
  title: 'Design v7 — Plain Offer',
  description: 'Homepage concept: direct response. Price, objections, guarantee.',
  path: '/design/v7',
  noIndex: true,
})

const GETS = [
  'Every object catalogued — photographs, maker, year, what you paid, what it is worth now, condition, and where the thing physically is.',
  'A public collection website at your own address, included, with a publish switch on every individual object.',
  'Valuation history, so you can see what a piece was worth last year as well as today.',
  'Insurance schedules and condition reports as proper PDFs, generated from your records rather than retyped.',
  'CSV import, so the spreadsheet you already have takes an afternoon to move, and CSV export, so leaving is just as easy.',
  'Private share links for a single object — for an insurer, a buyer, or a fellow collector — that you can expire.',
  'Duplicate detection, wishlists, and a record of what you paid the last time you nearly bought it again.',
]

const OBJECTIONS: [string, string][] = [
  [
    'I only have a few dozen things.',
    'Then the free plan covers you permanently and this costs you nothing. The point of starting small is that you catalogue as you acquire, instead of facing 400 objects in one weekend three years from now.',
  ],
  [
    'My spreadsheet is fine.',
    'It is, until you need a photograph, a valuation from two years ago, a receipt, or proof for an insurer. Import it as CSV and keep your columns — you can export it straight back out if you disagree.',
  ],
  [
    'I do not want my collection on the internet.',
    'Nothing is published unless you switch it on, object by object. Plenty of people use Vitrine entirely privately and never turn the public site on at all.',
  ],
  [
    'What happens to my data if you disappear?',
    'Full CSV export on every plan including the free one, at any time, without asking. No export fee, no support ticket, no lock-in. That is the deal.',
  ],
  [
    'I am not technical.',
    'If you can use a phone camera and fill in a form, you can use it. There is nothing to install and nothing to configure before you add your first object.',
  ],
  [
    'Is £5 a month really worth it?',
    'It is worth it at the moment you need to prove what you own to somebody else — an insurer, an executor, a buyer. If that moment never comes, stay on the free plan.',
  ],
]

export default function V7() {
  return (
    <div className="min-h-screen bg-white text-black">
      <VariantBar current="v7" />

      <div className="mx-auto max-w-[42rem] px-5 py-12 sm:py-16">
        {/* Wordmark only — no nav to leak clicks */}
        <Link href="/" className="type-book text-lg">Vitrine.</Link>

        <h1 className="type-times mt-10 text-[2.1rem] font-bold leading-[1.15] sm:text-[2.7rem]">
          Catalogue your collection properly, for five pounds a month.
        </h1>

        <p className="type-times mt-6 text-[19px] leading-[1.6]">
          Vitrine is a collection management app. You put in what you own — photographs, maker, year,
          what you paid, condition, where it is kept — and it keeps the record straight, values it
          over time, prints the paperwork your insurer wants, and gives the collection a website if
          you want one.
        </p>

        <p className="type-times mt-5 text-[19px] leading-[1.6]">
          <strong>The first 100 objects are free and always will be.</strong> No card, no trial
          countdown, no sales call. If you outgrow it, it is £5 a month for a thousand objects.
        </p>

        <p className="mt-8">
          <Link
            href="/signup"
            className="type-times inline-block border-2 border-black bg-[#b3311f] px-8 py-4 text-[19px] font-bold text-white hover:bg-[#8f2718]"
          >
            Start cataloguing — free →
          </Link>
        </p>
        <p className="type-times mt-3 text-[15px] text-[#555]">
          Takes about a minute. Your first object can be catalogued before the kettle boils.
        </p>

        <hr className="my-12 border-t border-black/25" />

        <h2 className="type-times text-[1.5rem] font-bold">What you actually get</h2>
        <ul className="type-times mt-5 space-y-4 text-[18px] leading-[1.55]">
          {GETS.map(g => (
            <li key={g} className="flex gap-3">
              <span aria-hidden className="mt-[2px] shrink-0 font-bold text-[#b3311f]">→</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>

        <hr className="my-12 border-t border-black/25" />

        {/* The offer box */}
        <div className="border-2 border-black p-6 sm:p-8">
          <h2 className="type-times text-[1.5rem] font-bold">The whole price list</h2>
          <dl className="type-times mt-5 text-[18px] leading-[1.5]">
            {[
              ['Community', 'Free, permanently', '100 objects · 1 photo each · public site included'],
              ['Hobbyist', '£5 per month', '1,000 objects · 5 photos each · analytics · CSV import · your branding, not ours'],
              ['Professional', '£79 per month', 'For museums and galleries · 5,000 objects · 10 staff · full documentation registers · ticketing · 30-day free trial'],
              ['Institution', 'On application', 'Larger organisations, higher limits'],
            ].map(([name, price, line]) => (
              <div key={name} className="border-t border-black/20 py-4 first:border-t-0 first:pt-0">
                <dt className="font-bold">
                  {name} — {price}
                </dt>
                <dd className="mt-1 text-[16px] text-[#3a3a3a]">{line}</dd>
              </div>
            ))}
          </dl>
          <p className="type-times mt-5 text-[17px] leading-[1.55]">
            Cancel from inside the app in one click. No notice period, no cancellation form, no
            &ldquo;let us hop on a call first&rdquo;.
          </p>
          <p className="mt-6">
            <Link
              href="/signup"
              className="type-times inline-block border-2 border-black bg-[#b3311f] px-7 py-3.5 text-[18px] font-bold text-white hover:bg-[#8f2718]"
            >
              Take the free plan →
            </Link>
          </p>
        </div>

        <hr className="my-12 border-t border-black/25" />

        <h2 className="type-times text-[1.5rem] font-bold">The objections, answered honestly</h2>
        <div className="mt-5">
          {OBJECTIONS.map(([q, a]) => (
            <details key={q} className="group border-b border-black/20 py-4">
              <summary className="type-times cursor-pointer list-none text-[18px] font-bold marker:hidden">
                <span aria-hidden className="mr-3 inline-block text-[#b3311f] group-open:hidden">+</span>
                <span aria-hidden className="mr-3 hidden text-[#b3311f] group-open:inline-block">−</span>
                {q}
              </summary>
              <p className="type-times mt-3 pl-7 text-[17px] leading-[1.6] text-[#3a3a3a]">{a}</p>
            </details>
          ))}
        </div>

        <hr className="my-12 border-t border-black/25" />

        <h2 className="type-times text-[1.5rem] font-bold">Why you can trust the export promise</h2>
        <p className="type-times mt-4 text-[18px] leading-[1.6]">
          Most software makes leaving hard on purpose. A collection database that traps your
          catalogue is a risk to the collection, not a feature of the product — so full CSV export
          sits in the settings of every plan, including the free one, and always will. You brought
          the data. It stays yours.
        </p>

        <p className="type-times mt-6 text-[18px] leading-[1.6]">
          There is also a{' '}
          <Link href="/tools/insurance-inventory" className="text-[#0b3fb3] underline underline-offset-2 hover:text-[#b3311f]">
            free insurance inventory generator
          </Link>{' '}
          and a{' '}
          <Link href="/tools/condition-report" className="text-[#0b3fb3] underline underline-offset-2 hover:text-[#b3311f]">
            free condition report generator
          </Link>{' '}
          that run in your browser with no account at all. Use them, keep the PDFs, sign up only if
          you want the rest.
        </p>

        <hr className="my-12 border-t border-black/25" />

        <h2 className="type-times text-[1.7rem] font-bold">Start with one object.</h2>
        <p className="type-times mt-4 text-[18px] leading-[1.6]">
          Not the whole collection. One. The piece you would grab in a fire. Photograph it, write
          down what you know, and see whether having that record makes you want the other
          ninety-nine free ones.
        </p>
        <p className="mt-7">
          <Link
            href="/signup"
            className="type-times inline-block border-2 border-black bg-[#b3311f] px-8 py-4 text-[19px] font-bold text-white hover:bg-[#8f2718]"
          >
            Catalogue my first object →
          </Link>
        </p>
        <p className="type-times mt-3 text-[15px] text-[#555]">
          Free plan · no card · export everything whenever you like
        </p>

        <p className="type-times mt-10 border-t border-black/25 pt-6 text-[17px] leading-[1.6] text-[#3a3a3a]">
          <strong>P.S.</strong> If you run a museum or gallery rather than a personal collection,
          the Professional plan carries the full documentation registers — entry, acquisition, loans,
          condition, conservation, valuation, deaccession and audit —{' '}
          <Link href="/compliance" className="text-[#0b3fb3] underline underline-offset-2 hover:text-[#b3311f]">
            listed here in detail
          </Link>
          , with a thirty-day trial.
        </p>

        <footer className="type-times mt-12 border-t border-black/25 pt-6 text-[15px] text-[#555]">
          <span className="type-book text-black">Vitrine.</span>{' '}
          <Link href="/about" className="text-[#0b3fb3] underline underline-offset-2">About</Link> ·{' '}
          <Link href="/faq" className="text-[#0b3fb3] underline underline-offset-2">FAQ</Link> ·{' '}
          <Link href="/discover" className="text-[#0b3fb3] underline underline-offset-2">Discover</Link> ·{' '}
          <Link href="/blog" className="text-[#0b3fb3] underline underline-offset-2">Blog</Link> ·{' '}
          <Link href="/privacy" className="text-[#0b3fb3] underline underline-offset-2">Privacy</Link> ·{' '}
          <Link href="/terms" className="text-[#0b3fb3] underline underline-offset-2">Terms</Link>
        </footer>
      </div>
    </div>
  )
}
