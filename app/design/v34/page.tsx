import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import { PLACEHOLDER_PHOTOS } from '../_gl/photo'
import Scene from './Scene'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v34 — Showroom',
  description: 'Spectrum 4/5: a bright showroom with real prints on the wall.',
  path: '/design/v34',
  noIndex: true,
})

export default async function V34() {
  const objects = await getWallObjects(8)
  const real = objects.map(o => o.image_url).filter((u): u is string => !!u)
  const photos = real.length ? real : PLACEHOLDER_PHOTOS

  return (
    <div className="min-h-screen bg-[#f4f3f0] text-[#15140f]">
      <VariantBar current="v34" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Scene photos={photos} />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-grotesk text-[19px] font-semibold tracking-[-0.02em]">Vitrine</Link>
            <nav className="type-grotesk hidden gap-8 text-[14px] text-black/55 md:flex">
              <Link href="/discover" className="hover:text-black">Collections</Link>
              <Link href="/plans" className="hover:text-black">Pricing</Link>
              <Link href="/login" className="hover:text-black">Sign in</Link>
            </nav>
            <Link href="/signup" className="type-grotesk bg-black px-6 py-2.5 text-[13px] font-medium text-white hover:opacity-85">
              Start free
            </Link>
          </header>

          <div className="max-w-2xl px-6 pt-12 sm:px-10 sm:pt-16">
            <h1 className="type-grotesk text-[2.7rem] font-semibold leading-[0.96] tracking-[-0.035em] sm:text-[4.2rem]">
              Your collection,
              <br />
              properly hung.
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-black/60">
              Every object gets a record and a place to be seen — a public collection site at your
              own address. The prints on that wall are real, published from real accounts.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="type-grotesk bg-black px-8 py-4 text-[14px] font-medium text-white hover:opacity-85">
                Catalogue your first object
              </Link>
              <Link href="/discover" className="type-grotesk px-2 py-4 text-[14px] text-black/55 underline underline-offset-[8px] hover:text-black">
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-5 text-[13px] text-black/40">Free for your first 100 objects · no card</p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-black/60">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-black px-8 py-3.5 text-[14px] font-medium text-white hover:opacity-85">Start free</Link>
            <Link href="/design" className="type-grotesk text-[13px] text-black/40 underline underline-offset-4 hover:text-black">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
