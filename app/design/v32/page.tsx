import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import { PLACEHOLDER_PHOTOS } from '../_gl/photo'
import Scene from './Scene'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v32 — Store, lights on',
  description: 'Spectrum 2/5: the same store with the strip lights on and prints hung.',
  path: '/design/v32',
  noIndex: true,
})

export default async function V32() {
  const objects = await getWallObjects(8)
  const real = objects.map(o => o.image_url).filter((u): u is string => !!u)
  const photos = real.length ? real : PLACEHOLDER_PHOTOS

  return (
    <div className="min-h-screen bg-[#1b201e] text-[#e4e9e6]">
      <VariantBar current="v32" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Scene photos={photos} />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-10">
            <Link href="/" className="type-grotesk text-[15px] font-semibold uppercase tracking-[0.26em]">Vitrine</Link>
            <nav className="type-grotesk hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-white/45 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link href="/signup" className="type-grotesk border border-white/40 px-5 py-2 text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:text-[#1b201e]">
              Start free
            </Link>
          </header>

          <div className="mt-auto max-w-2xl px-6 pb-16 sm:px-10 sm:pb-20">
            <h1 className="type-grotesk text-[2.4rem] font-semibold uppercase leading-[0.94] tracking-[-0.03em] sm:text-[3.8rem]" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.8)' }}>
              Turn the lights on
              <br />
              and write it down.
            </h1>
            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/65" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.9)' }}>
              Same room, same objects — the only thing that changed is that somebody made a record.
              The prints on the wall are real objects from real Vitrine collections.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-5">
              <Link href="/signup" className="type-grotesk bg-white px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-[#1b201e] hover:bg-white/85">
                Catalogue your first object
              </Link>
              <Link href="/discover" className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-white/55 underline underline-offset-[8px] hover:text-white">
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-5 text-[11px] uppercase tracking-[0.14em] text-white/30">Free for 100 objects · no card</p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-white/60">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-white px-8 py-3.5 text-[12px] uppercase tracking-[0.16em] text-[#1b201e] hover:bg-white/85">Start free</Link>
            <Link href="/design" className="type-grotesk text-[11px] uppercase tracking-[0.14em] text-white/35 underline underline-offset-4 hover:text-white">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
