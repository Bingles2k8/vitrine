import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import Table, { type TableItem } from './Table'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v12 — Curator’s Table',
  description: 'Homepage concept: a draggable table of real objects.',
  path: '/design/v12',
  noIndex: true,
})

const PLACEHOLDER_TITLES = [
  ['Leica M3, chrome', '📷'], ['Braun T3 radio', '📻'], ['Omega Seamaster', '⌚'],
  ['Please Please Me', '💿'], ['Olivetti Valentine', '⌨️'], ['Anglepoise 1227', '💡'],
  ['Roman denarius', '🪙'], ['Ammonite, Dorset', '🐚'], ['Delft charger', '🍽️'],
  ['Ordnance map, 1897', '🗺️'], ['Bakelite telephone', '☎️'], ['Zeiss binoculars', '🔭'],
  ['Penny black', '📮'], ['Wedgwood jasper', '🏺'], ['Stanley no.4 plane', '🪚'],
  ['Meccano set', '⚙️'], ['Fender Telecaster', '🎸'], ['Singer 99K', '🧵'],
  ['Chess set, ivorine', '♟️'], ['Barometer, oak', '🌡️'], ['Fossil trilobite', '🦴'],
]

export default async function V12() {
  const objects = await getWallObjects(28)

  const items: TableItem[] = objects.length
    ? objects.map(o => ({
        id: o.id,
        title: o.title,
        museum: o.museum,
        slug: o.slug,
        image: o.image_url,
        emoji: o.emoji ?? '🏛️',
      }))
    : PLACEHOLDER_TITLES.map(([t, e], i) => ({
        id: `p${i}`,
        title: t,
        museum: 'Example collection',
        slug: '',
        image: null,
        emoji: e,
      }))

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-[#171612]">
      <VariantBar current="v12" />

      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="type-book text-xl">Vitrine.</Link>
        <nav className="type-mono hidden gap-7 text-[12px] text-[#6b665a] md:flex">
          <Link href="/discover" className="hover:text-black">Discover</Link>
          <Link href="/compliance" className="hover:text-black">For museums</Link>
          <Link href="/plans" className="hover:text-black">Pricing</Link>
        </nav>
        <div className="type-mono flex items-center gap-5 text-[12px]">
          <Link href="/login" className="text-[#6b665a] hover:text-black">Sign in</Link>
          <Link href="/signup" className="bg-[#171612] px-5 py-2.5 text-[#f4f1e9] hover:bg-[#33302a]">
            Start free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-6">
        <h1 className="type-book max-w-3xl text-[2.8rem] leading-[1.02] tracking-[-0.01em] sm:text-[4.2rem]">
          Spread the whole collection
          <br />
          out on the table.
        </h1>
        <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-lg text-[17px] leading-relaxed text-[#54503f]">
            Every object below is really in Vitrine, published by the person who owns it. Drag the
            table around. Pick something up. That is what a catalogue looks like when it stops being
            a spreadsheet.
          </p>
          <Link
            href="/signup"
            className="type-mono shrink-0 bg-[#171612] px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-[#f4f1e9] hover:bg-[#33302a]"
          >
            Start your table — free
          </Link>
        </div>
      </section>

      <Table items={items} />

      {/* What sits behind each card */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="type-book text-[2.2rem] leading-[1.1]">
              A card on the table, a full record underneath.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[#54503f]">
              What the public sees is the pretty half. The half that matters is private: what you
              paid, what it is worth now, what condition it was in last time you checked, which
              shelf it is on, and where the receipt is. That is the half that answers to an insurer,
              an executor or an auditor.
            </p>
            <div className="mt-8 flex flex-wrap gap-5">
              <Link href="/signup" className="type-mono bg-[#171612] px-7 py-3.5 text-[12px] uppercase tracking-[0.16em] text-[#f4f1e9] hover:bg-[#33302a]">
                Catalogue something
              </Link>
              <Link href="/compliance" className="type-mono self-center text-[12px] uppercase tracking-[0.14em] text-[#6b665a] underline underline-offset-[6px] hover:text-black">
                Museum registers
              </Link>
            </div>
          </div>

          <div className="grid gap-px self-start bg-black/10 sm:grid-cols-2 lg:col-span-7">
            {[
              ['Photographs', 'Up to five per object on Hobbyist, more on Professional'],
              ['Valuation history', 'Dated, multi-currency, never overwritten'],
              ['Condition records', 'With damage mapping, exportable as PDF'],
              ['Location', 'Room, cabinet, shelf — findable in seconds'],
              ['Documents', 'Receipts, service records, certificates, attached'],
              ['Visibility', 'A publish switch on every single object'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#f4f1e9] p-6">
                <div className="type-mono text-[11px] uppercase tracking-[0.16em] text-[#8a5a1f]">{k}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-[#54503f]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-black/10 bg-[#eeeadf]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="type-book text-[2.2rem] leading-tight">
                A hundred objects, free.
              </h2>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[#54503f]">
                A thousand for £5 a month, with five photographs each, analytics and CSV import.
                Museums and galleries start at £79 a month with the full documentation registers,
                ticketing and a thirty-day trial.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/signup" className="type-mono bg-[#171612] px-9 py-4 text-center text-[12px] uppercase tracking-[0.16em] text-[#f4f1e9] hover:bg-[#33302a]">
                Start free
              </Link>
              <Link href="/plans" className="type-mono text-center text-[11px] uppercase tracking-[0.14em] text-[#6b665a] underline underline-offset-4 hover:text-black">
                All plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] text-[#9a9184]">
          <span className="type-book text-[#171612]">Vitrine.</span>
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/faq" className="hover:text-black">FAQ</Link>
          <Link href="/discover" className="hover:text-black">Discover</Link>
          <Link href="/tools" className="hover:text-black">Free tools</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
