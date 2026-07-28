import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import { PLACEHOLDER_PHOTOS } from '../_gl/photo'
import Scene from './Scene'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v33 — Workroom',
  description: 'Spectrum 3/5: the midpoint — a working room with a pinboard of real objects.',
  path: '/design/v33',
  noIndex: true,
})

export default async function V33() {
  const objects = await getWallObjects(8)
  const real = objects.map(o => o.image_url).filter((u): u is string => !!u)
  const photos = real.length ? real : PLACEHOLDER_PHOTOS

  return (
    <div className="min-h-screen bg-[#3a3833] text-[#f2efe9]">
      <VariantBar current="v33" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Scene photos={photos} />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-10">
            <Link href="/" className="type-grotesk text-[19px] font-semibold tracking-[-0.02em]">Vitrine</Link>
            <nav className="type-grotesk hidden gap-8 text-[14px] text-white/60 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link href="/signup" className="type-grotesk bg-white px-5 py-2.5 text-[13px] font-medium text-[#2a2823] hover:bg-white/85">
              Start free
            </Link>
          </header>

          <div className="mt-auto max-w-xl px-6 pb-16 sm:px-10 sm:pb-20">
            <h1 className="type-grotesk text-[2.3rem] font-semibold leading-[1.04] tracking-[-0.025em] sm:text-[3.4rem]" style={{ textShadow: '0 4px 28px rgba(0,0,0,0.6)' }}>
              Cataloguing is just
              <br />
              an afternoon at a bench.
            </h1>
            <p className="mt-5 max-w-md text-[16.5px] leading-relaxed text-white/70" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}>
              One object at a time: photograph it, date it, price it, note the condition, say where
              it lives. The board behind is real objects other people have already done.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-5">
              <Link href="/signup" className="type-grotesk bg-white px-8 py-4 text-[14px] font-medium text-[#2a2823] hover:bg-white/85">
                Catalogue your first object
              </Link>
              <Link href="/discover" className="type-grotesk text-[14px] text-white/65 underline underline-offset-[7px] hover:text-white">
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-5 text-[13px] text-white/40">Free for your first 100 objects · no card</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#2a2823]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-white/60">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with the
            full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-white px-8 py-3.5 text-[14px] font-medium text-[#2a2823] hover:bg-white/85">Start free</Link>
            <Link href="/design" className="type-grotesk text-[13px] text-white/40 underline underline-offset-4 hover:text-white">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
