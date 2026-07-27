import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections } from '../_lib'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v9 — The Workbench',
  description: 'Homepage concept: a dense, keyboard-first tool for serious cataloguers.',
  path: '/design/v9',
  noIndex: true,
})

const AMBER = '#d8a52e'

const ROWS: [string, string, string, string, string][] = [
  ['2026.014.3', 'Leica M3 chrome', '1954', 'EXC', '£1,200'],
  ['2026.014.2', 'Braun T3 pocket radio', '1958', 'GOOD', '£210'],
  ['2026.014.1', 'Beatles — Please Please Me (mono)', '1963', 'M-', '£340'],
  ['2026.013.9', 'Omega Seamaster 300', '1966', 'FAIR', '£2,850'],
  ['2026.013.8', 'Olivetti Valentine', '1969', 'EXC', '£480'],
  ['2026.013.7', 'Anglepoise 1227, original', '1935', 'REST', '£150'],
]

const SPEC: [string, string][] = [
  ['Object limit', 'Free 100 · Hobbyist 1,000 · Professional 5,000 · Institution higher'],
  ['Images per object', 'Free 1 · Hobbyist 5 · Professional 10+'],
  ['Bulk import', 'CSV, column mapping, dry-run, duplicate detection'],
  ['Bulk export', 'CSV, full catalogue, every plan including free, no ticket required'],
  ['Documents', 'PDF/JPG/PNG attachments per object · 100 MB Hobbyist · 1 GB Professional'],
  ['Valuation', 'Dated valuation history per object, multi-currency'],
  ['Condition', 'Dated condition records with damage mapping, exportable as PDF'],
  ['Public site', 'Own URL, templates, custom colours and logo, per-object visibility'],
  ['Share links', 'Per object or per set, optional passcode, expiry'],
  ['Barcode / QR', 'Scan to open a record; print labels for shelves and cases'],
  ['Registers (Pro)', 'Entry, acquisition, location, loans, condition, conservation, valuation, insurance, deaccession, audit, rights'],
  ['Mobile capture', 'Android app for photographing objects straight into the catalogue'],
  ['Staff & roles', 'Professional 10 seats with permissions; Institution more'],
  ['Data ownership', 'Yours. Export any time. No export fee, no lock-in.'],
]

const KEYS: [string, string][] = [
  ['N', 'New object'],
  ['/', 'Search the catalogue'],
  ['G then O', 'Go to objects'],
  ['G then S', 'Go to your public site'],
  ['E', 'Edit record'],
  ['⌘K', 'Command palette'],
]

export default async function V9() {
  const featured = await getFeaturedCollections(5)

  return (
    <div className="min-h-screen bg-[#0d0f0d] text-[#d5dbd2]">
      <VariantBar current="v9" />

      <header className="border-b border-white/10">
        <div className="type-mono mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 text-[12px]">
          <Link href="/" className="text-[#eef2ec]">
            vitrine<span style={{ color: AMBER }}>_</span>
          </Link>
          <nav className="hidden gap-6 text-white/45 sm:flex">
            <Link href="/discover" className="hover:text-white">/discover</Link>
            <Link href="/compliance" className="hover:text-white">/registers</Link>
            <Link href="/plans" className="hover:text-white">/pricing</Link>
            <Link href="/guide/essentials" className="hover:text-white">/docs</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/45 hover:text-white">sign in</Link>
            <Link href="/signup" className="px-3 py-1.5 text-black" style={{ background: AMBER }}>
              start —&gt;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="type-mono mb-6 text-[11px]" style={{ color: AMBER }}>
              # collection management, for people who actually catalogue
            </p>
            <h1 className="type-mono text-[1.9rem] font-medium leading-[1.25] tracking-[-0.01em] text-[#eef2ec] sm:text-[2.3rem]">
              1,000 objects.
              <br />
              Every field filled.
              <br />
              No mouse required.
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/50">
              Vitrine is built around bulk entry, keyboard navigation and clean exports. If you have
              ever abandoned collection software because entering the two-hundredth object took eight
              clicks, this is the answer to that.
            </p>

            <div className="type-mono mt-8 flex flex-wrap gap-3 text-[12px]">
              <Link href="/signup" className="px-6 py-3 text-black hover:opacity-90" style={{ background: AMBER }}>
                start free — 100 objects
              </Link>
              <Link href="/discover" className="border border-white/20 px-6 py-3 text-white/60 hover:border-white/40 hover:text-white">
                browse real catalogues
              </Link>
            </div>
            <p className="type-mono mt-4 text-[11px] text-white/30">
              no card · csv in, csv out · £5/mo at 1,000 objects
            </p>
          </div>

          {/* Catalogue view */}
          <div className="lg:col-span-7">
            <div className="border border-white/12">
              <div className="type-mono flex items-center justify-between border-b border-white/10 bg-[#121512] px-3 py-2 text-[11px] text-white/40">
                <span>objects — 347 records</span>
                <span>
                  <span style={{ color: AMBER }}>/</span> to search
                </span>
              </div>
              <table className="type-mono w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/30">
                    <th className="px-3 py-2 font-normal">no.</th>
                    <th className="px-3 py-2 font-normal">object</th>
                    <th className="px-3 py-2 font-normal">yr</th>
                    <th className="px-3 py-2 font-normal">cond</th>
                    <th className="px-3 py-2 text-right font-normal">value</th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, i) => (
                    <tr
                      key={r[0]}
                      className={`border-b border-white/[0.06] ${i === 0 ? 'bg-white/[0.06]' : ''}`}
                    >
                      <td className="px-3 py-2 text-white/35">{r[0]}</td>
                      <td className="px-3 py-2 text-[#eef2ec]">{r[1]}</td>
                      <td className="px-3 py-2 text-white/45">{r[2]}</td>
                      <td className="px-3 py-2" style={{ color: AMBER }}>{r[3]}</td>
                      <td className="px-3 py-2 text-right text-white/60">{r[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="type-mono flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 bg-[#121512] px-3 py-2 text-[10.5px] text-white/30">
                {KEYS.map(([k, v]) => (
                  <span key={k}>
                    <span className="text-white/60">{k}</span> {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spec sheet */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="type-mono mb-8 text-[13px] uppercase tracking-[0.16em] text-white/40">
            ## specification — no marketing adjectives
          </h2>
          <dl className="grid gap-x-10 md:grid-cols-2">
            {SPEC.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 border-b border-white/[0.08] py-3">
                <dt className="type-mono text-[12px] text-[#eef2ec]">{k}</dt>
                <dd className="type-mono col-span-2 text-[12px] leading-relaxed text-white/45">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Real catalogues */}
      {featured.length > 0 && (
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-5 py-12">
            <h2 className="type-mono mb-6 text-[13px] uppercase tracking-[0.16em] text-white/40">
              ## live catalogues
            </h2>
            <ul className="type-mono text-[12.5px]">
              {featured.map(c => (
                <li key={c.slug} className="flex items-baseline justify-between gap-4 border-b border-white/[0.08] py-2.5">
                  <Link href={`/museum/${c.slug}`} className="text-[#eef2ec] hover:underline">
                    /museum/{c.slug}
                  </Link>
                  <span className="hidden flex-1 truncate px-4 text-white/35 sm:block">{c.name}</span>
                  <span className="text-white/45">{c.count.toLocaleString()} objects</span>
                </li>
              ))}
            </ul>
            <Link href="/discover" className="type-mono mt-4 inline-block text-[12px]" style={{ color: AMBER }}>
              ls /discover —&gt;
            </Link>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="type-mono mb-8 text-[13px] uppercase tracking-[0.16em] text-white/40">
            ## pricing
          </h2>
          <div className="grid gap-px bg-white/10 md:grid-cols-4">
            {[
              ['community', '£0', '100 objects · 1 photo · public site'],
              ['hobbyist', '£5/mo', '1,000 objects · 5 photos · analytics · csv'],
              ['professional', '£79/mo', '5,000 objects · 10 staff · registers · ticketing'],
              ['institution', 'quote', 'higher limits · bespoke terms'],
            ].map(([n, p, l]) => (
              <div key={n} className="bg-[#0d0f0d] p-5">
                <div className="type-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: AMBER }}>{n}</div>
                <div className="type-mono mt-3 text-[26px] text-[#eef2ec]">{p}</div>
                <p className="type-mono mt-3 text-[11.5px] leading-relaxed text-white/40">{l}</p>
              </div>
            ))}
          </div>
          <div className="type-mono mt-8 flex flex-wrap items-center gap-4 text-[12px]">
            <Link href="/signup" className="px-7 py-3 text-black hover:opacity-90" style={{ background: AMBER }}>
              create account
            </Link>
            <Link href="/plans" className="text-white/45 underline underline-offset-4 hover:text-white">
              full plan comparison
            </Link>
            <span className="text-white/25">cancel in one click · full export on every plan</span>
          </div>
        </div>
      </section>

      <footer className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-5 py-7 text-[11px] text-white/25">
        <span className="text-white/50">vitrine_</span>
        <Link href="/about" className="hover:text-white">about</Link>
        <Link href="/faq" className="hover:text-white">faq</Link>
        <Link href="/blog" className="hover:text-white">blog</Link>
        <Link href="/tools" className="hover:text-white">tools</Link>
        <Link href="/compare" className="hover:text-white">compare</Link>
        <Link href="/privacy" className="hover:text-white">privacy</Link>
        <Link href="/terms" className="hover:text-white">terms</Link>
      </footer>
    </div>
  )
}
