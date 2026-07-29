import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Scene from './Scene'

export const metadata = buildPageMetadata({
  title: 'Design v36 — Vitrine',
  description: 'A real glass case, refraction and all. Drag to walk around it.',
  path: '/design/v36',
  noIndex: true,
})

export default function V36() {
  return (
    <div className="min-h-screen bg-[#060708] text-white">
      <VariantBar current="v36" />

      <section className="relative h-[calc(100vh-30px)] min-h-[640px] w-full overflow-hidden">
        <Scene />

        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              'linear-gradient(96deg, rgba(5,6,7,0.94) 0%, rgba(5,6,7,0.74) 26%, rgba(5,6,7,0.12) 50%, transparent 64%)',
          }}
        />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-12">
            <Link href="/" className="type-didone text-[19px] tracking-[0.16em]">
              VITRINE
            </Link>
            <nav className="type-grotesk hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-white/45 md:flex">
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

          <div className="mt-auto max-w-2xl px-6 pb-14 sm:px-12 sm:pb-20">
            <p className="type-mono mb-5 text-[11px] uppercase tracking-[0.3em] text-white/40">
              vitrine · noun · a glass display case
            </p>
            <h1 className="type-didone text-[2.7rem] leading-[0.98] tracking-[-0.015em] sm:text-[4.4rem]">
              Give it the case
              <br />
              it deserves.
            </h1>
            <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-white/60">
              Every object gets a record, a photograph, a provenance and a page. What a museum
              would do for one of theirs, done properly for one of yours.
            </p>
            <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-grotesk bg-white px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-85"
              >
                Open your first case
              </Link>
              <Link
                href="/discover"
                className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-white/45 underline underline-offset-[8px] hover:text-white"
              >
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-5 text-[11px] uppercase tracking-[0.14em] text-white/30">
              Free for 100 objects · drag to walk around it
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-white/55">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with
            the full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-white px-8 py-3.5 text-[12px] uppercase tracking-[0.16em] text-black hover:opacity-85">
              Start free
            </Link>
            <Link href="/design" className="type-grotesk text-[11px] uppercase tracking-[0.14em] text-white/40 underline underline-offset-4 hover:text-white">
              Back to concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
