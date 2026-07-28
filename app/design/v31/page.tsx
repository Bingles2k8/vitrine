import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar, getWallObjects } from '../_lib'
import { PLACEHOLDER_PHOTOS } from '../_gl/photo'
import Scene from './Scene'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Design v31 — Store, dark',
  description: 'Spectrum 1/5: the dark store room, crates labelled with real object photographs.',
  path: '/design/v31',
  noIndex: true,
})

export default async function V31() {
  const objects = await getWallObjects(8)
  const real = objects.map(o => o.image_url).filter((u): u is string => !!u)
  const photos = real.length ? real : PLACEHOLDER_PHOTOS

  return (
    <div className="min-h-screen bg-[#0b0d0b] text-[#d8dcd4]">
      <VariantBar current="v31" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Scene photos={photos} />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between border-b border-white/10 px-5 py-3">
            <Link href="/" className="type-mono text-[13px] uppercase tracking-[0.2em]">
              vitrine<span className="text-[#c9a227]">/</span>store
            </Link>
            <div className="type-mono flex items-center gap-5 text-[11px] uppercase tracking-[0.12em] text-white/40">
              <Link href="/plans" className="hidden hover:text-white sm:block">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/signup" className="bg-[#c9a227] px-4 py-1.5 text-[#0b0d0b] hover:bg-[#e0b93a]">Start free</Link>
            </div>
          </header>

          <div className="flex flex-1 items-center px-5 sm:px-8">
            <div className="max-w-xl border-l-2 border-[#c9a227] pl-6">
              <p className="type-mono mb-5 text-[11px] uppercase tracking-[0.2em] text-[#c9a227]">
                Room 3 · unlabelled · no inventory
              </p>
              <h1 className="type-mono text-[2rem] font-medium leading-[1.15] sm:text-[3rem]" style={{ textShadow: '0 4px 30px rgba(0,0,0,0.95)' }}>
                Nobody knows
                <br />
                what is in here.
              </h1>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-white/60" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.95)' }}>
                Except the crates now have labels, because someone catalogued them. That is the
                entire difference between a collection and a pile.
              </p>
              <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-5">
                <Link href="/signup" className="type-mono bg-[#c9a227] px-8 py-3.5 text-[12px] uppercase tracking-[0.14em] text-[#0b0d0b] hover:bg-[#e0b93a]">
                  Start the register
                </Link>
                <Link href="/compliance" className="type-mono text-[12px] uppercase tracking-[0.12em] text-white/50 underline underline-offset-[6px] hover:text-white">
                  Museum registers
                </Link>
              </div>
              <p className="type-mono mt-5 text-[11px] text-white/30">
                Free for 100 objects · drag to swing the light · labels are real published objects
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[15.5px] leading-relaxed text-white/55">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with the
            full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-mono bg-[#c9a227] px-8 py-3.5 text-[12px] uppercase tracking-[0.14em] text-[#0b0d0b] hover:bg-[#e0b93a]">Start free</Link>
            <Link href="/design" className="type-mono text-[11px] uppercase tracking-[0.12em] text-white/35 underline underline-offset-4 hover:text-white">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
