import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections, getWallObjects } from '../_lib'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v3 — The Wall',
  description: 'Homepage concept: real collections are the hero.',
  path: '/design/v3',
  noIndex: true,
})

const STEPS = [
  {
    n: 'I',
    head: 'Photograph it',
    body: 'Phone in one hand, object in the other. The photo becomes the record; the details can follow later.',
  },
  {
    n: 'II',
    head: 'Say what it is',
    body: 'Maker, year, what you paid, condition, where it lives. As much or as little as you know today.',
  },
  {
    n: 'III',
    head: 'Hang it',
    body: 'Flip a switch and the object appears on your public collection site. Or leave it private — that switch is per object.',
  },
]

export default async function V3() {
  const [wall, featured] = await Promise.all([getWallObjects(24), getFeaturedCollections(6)])
  const hasWall = wall.length >= 6

  return (
    <div className="min-h-screen bg-[#0b0b0a] text-[#f2f0ea]">
      <VariantBar current="v3" />

      <header className="absolute left-0 right-0 top-[30px] z-40">
        <div className="mx-auto flex max-w-none items-center justify-between px-6 py-6 sm:px-10">
          <Link href="/" className="type-grotesk text-[15px] font-medium uppercase tracking-[0.32em]">
            Vitrine
          </Link>
          <nav className="type-grotesk hidden gap-9 text-[11px] uppercase tracking-[0.22em] text-white/60 md:flex">
            <Link href="/discover" className="hover:text-white">Discover</Link>
            <Link href="/plans" className="hover:text-white">Pricing</Link>
            <Link href="/compliance" className="hover:text-white">Museums</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </nav>
          <Link
            href="/signup"
            className="type-grotesk border border-white/40 px-5 py-2 text-[11px] uppercase tracking-[0.2em] hover:bg-white hover:text-black"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Hero — the hang */}
      <section className="relative">
        {hasWall ? (
          <div className="grid grid-cols-3 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-6">
            {wall.slice(0, 24).map(o => (
              <Link
                key={o.id}
                href={`/museum/${o.slug}`}
                className="group relative aspect-square overflow-hidden bg-[#141312]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={o.image_url!}
                  alt={o.title}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
                />
                <span className="type-grotesk absolute inset-x-0 bottom-0 translate-y-full bg-black/80 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white/80 transition-transform duration-300 group-hover:translate-y-0">
                  {o.museum}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          // No published images to show yet — a typographic wall rather than a hole.
          <div className="grid grid-cols-3 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-6">
            {[
              'Cameras', 'Records', 'Watches', 'Coins', 'Ceramics', 'Fossils',
              'Militaria', 'Radios', 'Books', 'Prints', 'Tools', 'Toys',
              'Stamps', 'Glass', 'Furniture', 'Textiles', 'Maps', 'Instruments',
            ].map(t => (
              <div
                key={t}
                className="type-grotesk flex aspect-square items-center justify-center bg-[#141312] text-[10px] uppercase tracking-[0.2em] text-white/20"
              >
                {t}
              </div>
            ))}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b0b0a] via-[#0b0b0a]/85 to-transparent" />

        <div className="relative -mt-2 px-6 pb-16 sm:px-10">
          <div className="max-w-3xl">
            <h1 className="type-grotesk text-[2.5rem] font-medium leading-[0.98] tracking-[-0.03em] sm:text-[4.2rem] lg:text-[5.4rem]">
              {hasWall ? (
                <>
                  Every object above
                  <br />
                  belongs to someone
                  <br />
                  like you.
                </>
              ) : (
                <>
                  Whatever fills
                  <br />
                  your shelves
                  <br />
                  deserves a record.
                </>
              )}
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-white/65">
              These are real collections, catalogued in Vitrine and published by their owners.
              Cabinets, record shelves, workshops, small museums. Yours goes up the same way — and
              the cataloguing underneath is the part that actually matters.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Link
                href="/signup"
                className="type-grotesk bg-[#f2f0ea] px-8 py-4 text-[12px] uppercase tracking-[0.2em] text-black transition-colors hover:bg-white"
              >
                Put yours on the wall
              </Link>
              <Link
                href="/discover"
                className="type-grotesk text-[12px] uppercase tracking-[0.2em] text-white/60 underline underline-offset-8 hover:text-white"
              >
                Walk the whole wall
              </Link>
            </div>
            <p className="type-mono mt-5 text-[11px] text-white/35">
              Free for your first 100 objects · no card · everything private until you publish it
            </p>
          </div>
        </div>
      </section>

      {/* Named collections */}
      {featured.length > 0 && (
        <section className="border-y border-white/10">
          <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-3 lg:grid-cols-6">
            {featured.map(c => (
              <Link key={c.slug} href={`/museum/${c.slug}`} className="group bg-[#0b0b0a] p-6 hover:bg-[#141312]">
                <div className="type-grotesk text-[15px] leading-snug text-white/85 group-hover:text-white">
                  {c.name}
                </div>
                <div className="type-mono mt-2 text-[11px] text-white/35">
                  {c.count.toLocaleString()} on show
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Three steps */}
      <section className="mx-auto max-w-none px-6 py-20 sm:px-10 lg:py-28">
        <h2 className="type-grotesk mb-14 max-w-2xl text-[2rem] font-medium leading-tight tracking-[-0.02em] sm:text-[2.6rem]">
          Getting an object on the wall takes about ninety seconds.
        </h2>
        <div className="grid gap-px bg-white/10 md:grid-cols-3">
          {STEPS.map(s => (
            <div key={s.n} className="bg-[#0b0b0a] p-8 lg:p-10">
              <span className="type-grotesk block text-[13px] tracking-[0.3em] text-white/35">{s.n}</span>
              <h3 className="type-grotesk mt-8 text-[22px] font-medium tracking-[-0.01em]">{s.head}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/55">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Private by default */}
      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-none gap-12 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:py-28">
          <div>
            <h2 className="type-grotesk text-[2rem] font-medium leading-tight tracking-[-0.02em] sm:text-[2.4rem]">
              A wall you control, down to the object.
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-white/60">
              Publishing is a per-object switch, not an all-or-nothing setting. Show the pieces you
              are proud of; keep the valuations, the storage locations and the ones you would rather
              nobody knew about entirely private. Insurance schedules and private share links work
              from the same records.
            </p>
            <Link
              href="/signup"
              className="type-grotesk mt-9 inline-block border border-white/40 px-7 py-3.5 text-[12px] uppercase tracking-[0.2em] hover:bg-white hover:text-black"
            >
              Start cataloguing
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-px self-start bg-white/10">
            {[
              ['Public', 'Anyone with the link, and Discover'],
              ['Unlisted', 'Anyone with the link only'],
              ['Private', 'You and the people you invite'],
              ['Share link', 'One object, one recipient, expires'],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#0b0b0a] p-6">
                <dt className="type-grotesk text-[12px] uppercase tracking-[0.2em] text-white/85">{k}</dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-white/45">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Price + close */}
      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-none flex-col gap-10 px-6 py-20 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="type-grotesk text-[2.4rem] font-medium leading-[1.02] tracking-[-0.03em] sm:text-[3.4rem]">
              Free to hang
              <br />
              100 objects.
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-relaxed text-white/55">
              £5 a month takes it to 1,000 objects with five photographs each, analytics and CSV
              import. Museums and galleries start at £79 with a thirty-day trial.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/signup" className="type-grotesk bg-[#f2f0ea] px-10 py-4 text-center text-[12px] uppercase tracking-[0.2em] text-black hover:bg-white">
              Start free
            </Link>
            <Link href="/plans" className="type-grotesk text-center text-[11px] uppercase tracking-[0.2em] text-white/45 underline underline-offset-8 hover:text-white">
              All plans
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="type-grotesk mx-auto flex max-w-none flex-wrap gap-x-8 gap-y-3 px-6 py-9 text-[11px] uppercase tracking-[0.2em] text-white/35 sm:px-10">
          <span className="text-white/70">Vitrine</span>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/blog" className="hover:text-white">Journal</Link>
          <Link href="/tools" className="hover:text-white">Tools</Link>
          <Link href="/faq" className="hover:text-white">FAQ</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
