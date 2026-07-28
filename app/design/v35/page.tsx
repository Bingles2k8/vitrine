import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import { PLACEHOLDER_PHOTOS } from '../_gl/photo'
import Scene from './Scene'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v35 — Studio',
  description: 'Spectrum 5/5: the clean end — cyclorama, colour, one real print behind.',
  path: '/design/v35',
  noIndex: true,
})

export default async function V35() {
  const objects = await getWallObjects(8)
  const real = objects.map(o => o.image_url).filter((u): u is string => !!u)
  const photos = real.length ? real : PLACEHOLDER_PHOTOS

  return (
    <div className="min-h-screen bg-white text-[#0d0d0d]">
      <VariantBar current="v35" />

      <section className="relative h-[calc(100vh-30px)] min-h-[640px] w-full overflow-hidden">
        <Scene photos={photos} />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-10">
            <Link href="/" className="type-grotesk text-[17px] font-bold tracking-[-0.03em]">Vitrine</Link>
            <nav className="type-grotesk hidden gap-8 text-[13px] font-medium text-black/50 md:flex">
              <Link href="/discover" className="hover:text-black">Collections</Link>
              <Link href="/plans" className="hover:text-black">Pricing</Link>
              <Link href="/login" className="hover:text-black">Sign in</Link>
            </nav>
            <Link href="/signup" className="type-grotesk rounded-full bg-black px-6 py-2.5 text-[13px] font-medium text-white hover:opacity-85">
              Start free
            </Link>
          </header>

          <div className="pt-6 text-center sm:pt-10">
            <h1 className="type-grotesk text-[15vw] font-bold leading-[0.82] tracking-[-0.05em] sm:text-[9vw]">
              Catalogue
            </h1>
          </div>

          <div className="mt-auto px-6 pb-10 text-center sm:px-10">
            <h2 className="type-grotesk text-[15vw] font-bold leading-[0.82] tracking-[-0.05em] sm:text-[9vw]">
              anything.
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-[16.5px] leading-relaxed text-black/60">
              One record per object — photographs, maker, date, what you paid, what it is worth now,
              condition, location. The print behind is a real published object.
            </p>
            <div className="pointer-events-auto mt-7 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className="type-grotesk rounded-full bg-black px-9 py-4 text-[14px] font-medium text-white hover:opacity-85">
                Start free — 100 objects
              </Link>
              <Link href="/discover" className="type-grotesk rounded-full border border-black/20 px-9 py-4 text-[14px] font-medium text-black/70 hover:border-black hover:text-black">
                See real collections
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-black/60">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk rounded-full bg-black px-8 py-3.5 text-[14px] font-medium text-white hover:opacity-85">Start free</Link>
            <Link href="/design" className="type-grotesk text-[13px] text-black/40 underline underline-offset-4 hover:text-black">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
