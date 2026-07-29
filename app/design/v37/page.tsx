import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Scene from './Scene'

export const metadata = buildPageMetadata({
  title: 'Design v37 — Macro',
  description: 'No room. One object, one light, four words.',
  path: '/design/v37',
  noIndex: true,
})

export default function V37() {
  return (
    <div className="min-h-screen bg-[#08080a] text-white">
      <VariantBar current="v37" />

      <section className="relative h-[calc(100vh-30px)] min-h-[640px] w-full overflow-hidden">
        <Scene />

        <div className="pointer-events-none relative z-10 flex h-full flex-col items-center px-6 text-center">
          <header className="pointer-events-auto flex w-full max-w-6xl items-center justify-between py-5">
            <Link href="/" className="type-grotesk text-[14px] font-semibold uppercase tracking-[0.3em]">
              Vitrine
            </Link>
            <nav className="type-grotesk hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-white/50 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-grotesk border border-white/25 px-5 py-2 text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:text-black"
            >
              Start free
            </Link>
          </header>

          <h1 className="type-grotesk mt-8 text-[3.4rem] font-semibold leading-[0.88] tracking-[-0.045em] sm:mt-10 sm:text-[6.2rem]">
            Know what
            <br />
            you own.
          </h1>

          {/* The object occupies this gap. Nothing sits on top of it. */}
          <div className="flex-1" />

          <div className="pointer-events-auto pb-12 sm:pb-16">
            <Link
              href="/signup"
              className="type-grotesk inline-block bg-white px-10 py-4 text-[12px] uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-85"
            >
              Catalogue your first object
            </Link>
            <p className="type-grotesk mt-5 text-[11px] uppercase tracking-[0.16em] text-white/35">
              Free for 100 objects · no card
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
          <p className="text-[15px] leading-relaxed text-white/60">
            Photograph it, describe it, put a number on it. Vitrine keeps the record — where it
            came from, what it cost, where it is now.
          </p>
          <p className="text-[15px] leading-relaxed text-white/60">
            Publish the parts you want to show and keep the rest private. Your collection gets a
            page; your valuations do not.
          </p>
          <p className="text-[15px] leading-relaxed text-white/60">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with
            the full documentation registers.
          </p>
        </div>
      </section>
    </div>
  )
}
