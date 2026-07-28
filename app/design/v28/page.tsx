import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Villa from './Villa'

export const metadata = buildPageMetadata({
  title: 'Design v28 — Afternoon',
  description: 'Museum scene: sunlight through a window, terracotta, a table not a plinth.',
  path: '/design/v28',
  noIndex: true,
})

export default function V28() {
  return (
    <div className="min-h-screen bg-[#2a1710] text-[#f6e7d6]">
      <VariantBar current="v28" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Villa />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-book text-[23px] italic">Vitrine</Link>
            <nav className="type-book hidden gap-8 text-[15px] italic text-[#f6e7d6]/60 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-book border-b border-[#f6e7d6]/50 pb-0.5 text-[15px] italic hover:border-white hover:text-white"
            >
              Start free
            </Link>
          </header>

          <div className="mt-auto max-w-2xl px-6 pb-16 sm:px-10 sm:pb-20">
            <h1
              className="type-book text-[2.6rem] leading-[1.02] sm:text-[4.4rem]"
              style={{ textShadow: '0 4px 30px rgba(40,16,8,0.7)' }}
            >
              Things you live with
              <br />
              deserve a record too.
            </h1>
            <p
              className="mt-6 max-w-md text-[17px] leading-relaxed text-[#f6e7d6]/75"
              style={{ textShadow: '0 2px 18px rgba(40,16,8,0.8)' }}
            >
              Not everything worth cataloguing sits behind glass. Vitrine keeps the maker, the date,
              what you paid, what it is worth now and where it lives — for the things on your own
              table.
            </p>
            <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-6">
              <Link
                href="/signup"
                className="type-book bg-[#f6e7d6] px-8 py-3.5 text-[17px] italic text-[#2a1710] transition-colors hover:bg-white"
              >
                Catalogue your first object
              </Link>
              <Link href="/discover" className="type-book text-[16px] italic text-[#f6e7d6]/70 underline underline-offset-[7px] hover:text-white">
                See real collections
              </Link>
            </div>
            <p className="type-mono mt-6 text-[11px] text-[#f6e7d6]/45">
              Free for 100 objects · move the pointer to move the sun
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#f6e7d6]/15 bg-[#1e1009]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-[#f6e7d6]/65">
            Free for your first hundred objects, £5 a month for a thousand with five photographs
            each, £79 for museums with the full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/signup" className="type-book bg-[#f6e7d6] px-8 py-3.5 text-[17px] italic text-[#2a1710] hover:bg-white">
              Start free
            </Link>
            <Link href="/design" className="type-mono text-[11px] uppercase tracking-[0.14em] text-[#f6e7d6]/40 underline underline-offset-4 hover:text-white">
              Back to concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
