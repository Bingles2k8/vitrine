import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Cube from './Cube'

export const metadata = buildPageMetadata({
  title: 'Design v26 — White Cube',
  description: 'Museum scene: a daylit white gallery, high key, black type.',
  path: '/design/v26',
  noIndex: true,
})

export default function V26() {
  return (
    <div className="min-h-screen bg-[#f6f6f4] text-[#111]">
      <VariantBar current="v26" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Cube />

        {/* Type sits over a bright room, so everything is ink — centred, not left-aligned */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-grotesk text-[15px] font-semibold uppercase tracking-[0.3em]">
              Vitrine
            </Link>
            <nav className="type-grotesk hidden gap-9 text-[11px] uppercase tracking-[0.2em] text-black/50 md:flex">
              <Link href="/discover" className="hover:text-black">Collections</Link>
              <Link href="/plans" className="hover:text-black">Pricing</Link>
              <Link href="/login" className="hover:text-black">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-grotesk border border-black px-5 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors hover:bg-black hover:text-white"
            >
              Start free
            </Link>
          </header>

          <div className="max-w-2xl px-6 pt-14 sm:px-10 sm:pt-24">
            <p className="type-grotesk mb-6 text-[11px] uppercase tracking-[0.34em] text-black/45">
              Collection management software
            </p>
            <h1 className="type-grotesk max-w-2xl text-[2.6rem] font-semibold leading-[0.94] tracking-[-0.035em] sm:text-[4.4rem]">
              Everything you own,
              <br />
              in good light.
            </h1>
            <p className="mt-7 max-w-md text-[16.5px] leading-relaxed text-black/60">
              Photographed, dated, valued, condition-checked and findable — with a public collection
              site that comes with it.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="type-grotesk bg-black px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85"
              >
                Catalogue your first object
              </Link>
              <Link
                href="/discover"
                className="type-grotesk px-2 py-4 text-[12px] uppercase tracking-[0.18em] text-black/55 underline underline-offset-[8px] hover:text-black"
              >
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-5 text-[11px] uppercase tracking-[0.16em] text-black/35">
              Free for 100 objects · no card
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-black/60">
            Free for your first hundred objects, £5 a month for a thousand with five photographs
            each, £79 for museums with the full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-black px-8 py-3.5 text-[12px] uppercase tracking-[0.18em] text-white hover:opacity-85">
              Start free
            </Link>
            <Link href="/design" className="type-grotesk text-[11px] uppercase tracking-[0.16em] text-black/40 underline underline-offset-4 hover:text-black">
              Back to concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
