import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'

export const metadata = buildPageMetadata({
  title: 'Design v4 — The Switch',
  description: 'Homepage concept: spreadsheet pain versus a proper record.',
  path: '/design/v4',
  noIndex: true,
})

/** A believable, slightly rotten collection spreadsheet. */
const SHEET_HEAD = ['A', 'B', 'C', 'D', 'E', 'F']
const SHEET_ROWS: string[][] = [
  ['item', 'yr', 'paid', 'worth?', 'cond', 'notes'],
  ['Leica M3 chrome', '1954', '620', '1200?', 'exc', 'shutter done 24'],
  ['leica m3 (2nd one)', '54', '£585', '', 'ok', 'DUPLICATE?? check'],
  ['Braun T3', '1958', '90', '210', 'good', ''],
  ['Beatles PPM mono', '1963', '', '340', 'M-', 'in loft box 3'],
  ['Beatles - Please Ple', "'63", '210', '#REF!', '', 'dup of row 5?'],
  ['radio (the small one)', '', '', '', '', 'ask dad'],
  ['', '', '', '', '', ''],
  ['TOTAL', '', '=SUM(C2:C7)', '#VALUE!', '', 'last edited 2023'],
]

const RECORD = [
  ['Object no.', '2026.014.3'],
  ['Object', 'Leica M3 rangefinder, chrome'],
  ['Maker', 'Ernst Leitz GmbH'],
  ['Year', '1954'],
  ['Acquired', '11 Mar 2019 · auction, lot 212 · £620'],
  ['Valuation', '£1,200 · reviewed Jan 2026'],
  ['Condition', 'Excellent · shutter serviced 2024'],
  ['Location', 'Cabinet 2, shelf B'],
  ['Documents', 'Receipt.pdf · Service report.pdf'],
  ['Published', 'Yes — on your collection site'],
]

const TASKS: [string, string, string][] = [
  ['Find the receipt for something you bought in 2019', 'A folder, maybe an email', 'Attached to the object'],
  ['Prove what the collection is worth, to an insurer', 'A morning of retyping', 'Insurance schedule, PDF, one click'],
  ['Know what a piece was worth last year and now', 'One cell, overwritten', 'Valuation history kept'],
  ['Spot that you bought the same thing twice', 'You do not, until it arrives', 'Duplicate detection flags it'],
  ['Show a piece to a buyer without sending the lot', 'Screenshot and hope', 'A private share link that expires'],
  ['Let anyone see the collection', 'You email a file', 'A public site at your own address'],
  ['Open it on your phone in a junk shop', 'Pinch, zoom, despair', 'Built for it — scan and add on the spot'],
]

export default function V4() {
  return (
    <div className="min-h-screen bg-white text-[#111110]">
      <VariantBar current="v4" />

      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="type-book text-xl">Vitrine.</Link>
          <div className="type-mono flex items-center gap-5 text-[12px]">
            <Link href="/plans" className="hidden text-[#6b6b64] hover:text-black sm:block">Pricing</Link>
            <Link href="/login" className="text-[#6b6b64] hover:text-black">Sign in</Link>
            <Link href="/signup" className="bg-[#111110] px-4 py-2 text-white hover:bg-[#333]">
              Import my spreadsheet
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 sm:pt-20">
        <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.18em] text-[#9a7b17]">
          For collections currently living in Excel, Sheets or Numbers
        </p>
        <h1 className="type-grotesk max-w-3xl text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[3.6rem]">
          The spreadsheet worked
          <br />
          until about object 200.
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#4a4a44]">
          Then came the duplicate row, the valuation you overwrote, the receipt you cannot find, and
          the column called <span className="type-mono text-[15px]">notes2</span>. Vitrine takes the
          same information and makes it behave like a catalogue.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link
            href="/signup"
            className="type-mono bg-[#111110] px-7 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white hover:bg-[#333]"
          >
            Import your CSV — free
          </Link>
          <Link
            href="/tools/insurance-inventory"
            className="type-mono text-[12px] uppercase tracking-[0.14em] underline underline-offset-[6px] text-[#6b6b64] hover:text-black"
          >
            Or try a free tool first
          </Link>
        </div>
        <p className="type-mono mt-4 text-[11px] text-[#8a8a80]">
          Keeps your columns · 100 objects free · export back to CSV whenever you want out
        </p>
      </section>

      {/* The split */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-px border border-black/15 bg-black/15 lg:grid-cols-2">
          {/* Sheet */}
          <div className="bg-[#f6f6f4]">
            <div className="type-mono flex items-center justify-between border-b border-black/10 px-4 py-2.5 text-[11px] text-[#6b6b64]">
              <span>collection_v4_FINAL(2).xlsx</span>
              <span className="text-[#b03a2e]">3 errors</span>
            </div>
            <div className="overflow-x-auto">
              <table className="type-mono w-full min-w-[440px] text-[11px]">
                <thead>
                  <tr className="bg-[#eaeae6] text-[#8a8a80]">
                    <th className="w-8 border-r border-black/10 px-2 py-1 font-normal" />
                    {SHEET_HEAD.map(h => (
                      <th key={h} className="border-r border-black/10 px-2 py-1 text-left font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SHEET_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-black/[0.07]">
                      <td className="border-r border-black/10 bg-[#eaeae6] px-2 py-1.5 text-center text-[#a0a098]">
                        {i + 1}
                      </td>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          className={`border-r border-black/[0.07] px-2 py-1.5 whitespace-nowrap ${
                            cell.startsWith('#') ? 'bg-[#b03a2e]/10 text-[#b03a2e]' : 'text-[#3d3d38]'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="type-mono border-t border-black/10 px-4 py-3 text-[11px] leading-relaxed text-[#8a8a80]">
              Everything you know, flattened into text. No photographs, no history, nothing that
              stops you entering the same camera twice.
            </p>
          </div>

          {/* Record */}
          <div className="bg-[#161613] text-[#eceae4]">
            <div className="type-mono flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-[11px] text-white/45">
              <span>vitrine.app · object 2026.014.3</span>
              <span className="text-[#d8b04a]">complete</span>
            </div>
            <div className="p-4">
              <div className="mb-5 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-white/15 text-2xl">📷</div>
                <div>
                  <div className="type-book text-xl leading-tight">Leica M3 rangefinder</div>
                  <div className="type-mono mt-1 text-[11px] text-white/40">
                    1954 · Excellent · £1,200
                  </div>
                </div>
              </div>
              <dl>
                {RECORD.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-3 gap-3 border-t border-white/10 py-2">
                    <dt className="type-mono text-[10px] uppercase tracking-[0.1em] text-white/35">{k}</dt>
                    <dd className="col-span-2 text-[13px] leading-relaxed text-white/85">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="type-mono border-t border-white/10 px-4 py-3 text-[11px] leading-relaxed text-white/40">
              The same object after import. Nothing was invented — the fields were simply given
              somewhere to live.
            </p>
          </div>
        </div>
      </section>

      {/* Task comparison */}
      <section className="border-y border-black/10 bg-[#faf9f6]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="type-grotesk mb-10 max-w-xl text-[1.9rem] font-semibold leading-tight tracking-[-0.02em]">
            The seven jobs a spreadsheet quietly refuses to do.
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="type-mono border-b border-black/20 text-[10px] uppercase tracking-[0.14em] text-[#8a8a80]">
                  <th className="py-3 font-normal">When you need to…</th>
                  <th className="py-3 font-normal">Spreadsheet</th>
                  <th className="py-3 font-normal">Vitrine</th>
                </tr>
              </thead>
              <tbody>
                {TASKS.map(([task, sheet, vit]) => (
                  <tr key={task} className="border-b border-black/[0.08] align-top">
                    <td className="py-4 pr-6 text-[15px] leading-snug">{task}</td>
                    <td className="py-4 pr-6 text-[14px] leading-snug text-[#8a8a80]">{sheet}</td>
                    <td className="py-4 text-[14px] leading-snug text-[#111110]">{vit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Migration */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="type-grotesk text-[1.9rem] font-semibold leading-tight tracking-[-0.02em]">
              Moving across is an afternoon, not a project.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[#4a4a44]">
              And it is reversible. Vitrine exports back to CSV in full, at any time, on every plan
              including the free one. If it does not suit you, you leave with everything you brought
              plus everything you added.
            </p>
            <Link
              href="/signup"
              className="type-mono mt-8 inline-block bg-[#111110] px-7 py-3.5 text-[12px] uppercase tracking-[0.14em] text-white hover:bg-[#333]"
            >
              Start the import
            </Link>
          </div>
          <ol className="lg:col-span-7">
            {[
              ['Export what you have', 'Save your sheet as CSV. Messy is fine — that is the normal starting state.'],
              ['Match your columns', 'Tell Vitrine which column is the name, the year, the price. Anything odd lands in notes rather than being thrown away.'],
              ['Fix as you go', 'Duplicates get flagged, blanks stay blank. You are not required to have a perfect record before you begin.'],
              ['Add the photographs', 'The part the spreadsheet never had. Phone camera is enough.'],
            ].map(([h, b], i) => (
              <li key={h} className="flex gap-6 border-t border-black/10 py-5 last:border-b">
                <span className="type-mono w-6 shrink-0 text-[12px] text-[#9a7b17]">{i + 1}</span>
                <div>
                  <h3 className="type-grotesk text-[17px] font-medium">{h}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[#4a4a44]">{b}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Price + close */}
      <section className="border-t border-black/10 bg-[#161613] text-[#eceae4]">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="type-grotesk text-[2.1rem] font-semibold leading-tight tracking-[-0.02em]">
                Free up to 100 objects.
                <br />
                £5 a month up to 1,000.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
                CSV import and export are included from the Hobbyist plan up. Museums and galleries
                start at £79 a month with a thirty-day trial and the full documentation registers.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/signup" className="type-mono bg-white px-9 py-4 text-center text-[12px] uppercase tracking-[0.14em] text-black hover:bg-[#f0eee8]">
                Move my collection
              </Link>
              <Link href="/compare" className="type-mono text-center text-[11px] uppercase tracking-[0.14em] text-white/45 underline underline-offset-4 hover:text-white">
                Compare with other software
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="type-mono mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] text-[#8a8a80]">
          <span className="type-book text-black">Vitrine.</span>
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/faq" className="hover:text-black">FAQ</Link>
          <Link href="/tools" className="hover:text-black">Free tools</Link>
          <Link href="/compare" className="hover:text-black">Compare</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
