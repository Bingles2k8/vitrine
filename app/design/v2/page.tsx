import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getFeaturedCollections } from '../_lib'
import FirstObject from './FirstObject'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v2 — First Object',
  description: 'Homepage concept: catalogue something before you sign up.',
  path: '/design/v2',
  noIndex: true,
})

const AFTER = [
  {
    step: '01',
    head: 'Add the rest the fast way',
    body: 'Photograph objects with your phone and they arrive in the catalogue. Already have a spreadsheet? Import the whole thing as CSV and keep your existing columns.',
    link: { label: 'How import works', href: '/guide/essentials' },
  },
  {
    step: '02',
    head: 'Decide what the world sees',
    body: 'Your collection gets a public site at its own address. Every object has its own switch — publish the ones you want seen, keep the valuations and the storage locations to yourself.',
    link: { label: 'See live collections', href: '/discover' },
  },
  {
    step: '03',
    head: 'Use it for the boring, useful things',
    body: 'Insurance schedules, condition reports, share links for a buyer or a curator, and — on Professional — the full set of museum registers, from acquisition to deaccession.',
    link: { label: 'Documentation in detail', href: '/compliance' },
  },
]

export default async function V2() {
  const featured = await getFeaturedCollections(4)

  return (
    <div className="min-h-screen bg-[#eae7df] text-[#14150f]">
      <VariantBar current="v2" />

      <header className="border-b border-[#14150f]/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <Link href="/" className="type-book text-xl">Vitrine.</Link>
          <nav className="type-mono hidden gap-7 text-[12px] text-[#5c5749] sm:flex">
            <Link href="/discover" className="hover:text-[#14150f]">Discover</Link>
            <Link href="/plans" className="hover:text-[#14150f]">Pricing</Link>
            <Link href="/compliance" className="hover:text-[#14150f]">For museums</Link>
          </nav>
          <div className="type-mono flex items-center gap-5 text-[12px]">
            <Link href="/login" className="text-[#5c5749] hover:text-[#14150f]">Sign in</Link>
            <Link href="/signup" className="bg-[#14150f] px-4 py-2 text-[#eae7df] hover:opacity-90">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — the product is the headline */}
      <section className="relative overflow-hidden">
        <div
          className="rule-dots pointer-events-none absolute inset-0 text-[#14150f]/25"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-14 sm:pt-20">
          <div className="mb-10 max-w-2xl">
            <h1 className="type-grotesk text-[2.4rem] font-medium leading-[1.05] tracking-[-0.02em] sm:text-[3.4rem]">
              Catalogue one thing.
              <br />
              Right now, on this page.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-[#4c483e]">
              Not a demo video, not a screenshot tour. Fill this in and you will have made a real
              catalogue record — then decide whether the other ninety-nine free ones are worth an
              email address.
            </p>
          </div>

          <FirstObject />

          <div className="type-mono mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] text-[#6b665a]">
            <span>100 objects free, forever</span>
            <span className="hidden sm:inline">·</span>
            <span>No card to start</span>
            <span className="hidden sm:inline">·</span>
            <span>Export your data any time</span>
            <span className="hidden sm:inline">·</span>
            <span>£5/mo when you outgrow it</span>
          </div>
        </div>
      </section>

      {/* What happens after you sign up */}
      <section className="border-t border-[#14150f]/15 bg-[#f7f5f0]">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <h2 className="type-grotesk mb-12 max-w-lg text-[1.8rem] font-medium leading-tight tracking-[-0.015em]">
            What the account is actually for.
          </h2>
          <div className="grid gap-px bg-[#14150f]/15 md:grid-cols-3">
            {AFTER.map(a => (
              <div key={a.step} className="flex flex-col bg-[#f7f5f0] p-7">
                <span className="type-mono mb-6 text-[11px] tracking-[0.18em] text-[#8a8377]">{a.step}</span>
                <h3 className="type-grotesk mb-3 text-[19px] font-medium leading-snug">{a.head}</h3>
                <p className="mb-6 flex-1 text-[15px] leading-relaxed text-[#4c483e]">{a.body}</p>
                <Link
                  href={a.link.href}
                  className="type-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-4 hover:text-[#14150f]"
                >
                  {a.link.label} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real collections */}
      {featured.length > 0 && (
        <section className="border-t border-[#14150f]/15">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="type-mono mb-7 text-[11px] uppercase tracking-[0.18em] text-[#8a8377]">
              People who kept going
            </p>
            <div className="grid gap-px bg-[#14150f]/15 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map(c => (
                <Link key={c.slug} href={`/museum/${c.slug}`} className="group bg-[#eae7df] p-6 hover:bg-[#f7f5f0]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center border border-[#14150f]/15 text-xl">
                    {c.preview_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.preview_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      c.preview_emoji
                    )}
                  </div>
                  <div className="type-book text-[17px] leading-snug group-hover:underline">{c.name}</div>
                  <div className="type-mono mt-1 text-[11px] text-[#8a8377]">
                    {c.count.toLocaleString()} objects published
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Close */}
      <section className="border-t border-[#14150f]/15 bg-[#14150f] text-[#eae7df]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="type-grotesk text-[1.9rem] font-medium leading-tight tracking-[-0.015em]">
              You already made the first record.
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#b8b2a4]">
              Scroll back up, hit save, and take the account. It costs nothing and the next
              ninety-nine objects are included.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/signup" className="type-mono bg-[#eae7df] px-8 py-4 text-center text-[12px] uppercase tracking-[0.16em] text-[#14150f] hover:bg-white">
              Create the free account
            </Link>
            <Link href="/plans" className="type-mono text-center text-[11px] uppercase tracking-[0.14em] text-[#8a8377] underline underline-offset-4 hover:text-[#eae7df]">
              Or read the pricing first
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#14150f]/15">
        <div className="type-mono mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-[11px] text-[#8a8377]">
          <span className="type-book text-[#14150f]">Vitrine.</span>
          <Link href="/about" className="hover:text-[#14150f]">About</Link>
          <Link href="/faq" className="hover:text-[#14150f]">FAQ</Link>
          <Link href="/tools" className="hover:text-[#14150f]">Free tools</Link>
          <Link href="/privacy" className="hover:text-[#14150f]">Privacy</Link>
          <Link href="/terms" className="hover:text-[#14150f]">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
