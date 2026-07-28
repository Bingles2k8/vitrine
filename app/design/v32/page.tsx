import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Scene from './Scene'

export const metadata = buildPageMetadata({
  title: 'Design v32 — Store, lights on',
  description: 'The same store with the strip lights on and a bench to work at.',
  path: '/design/v32',
  noIndex: true,
})

export default function V32() {
  return (
    <div className="min-h-screen bg-[#eef0ee] text-[#101210]">
      <VariantBar current="v32" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Scene />

        {/* The room is bright, so the copy is ink — and the corner is lifted, not
            dimmed. Kept to the bottom-left corner the copy actually occupies:
            the old full-width wash flattened the bench and the object along
            with it, which is no use when the render is the point. */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              'linear-gradient(58deg, rgba(238,240,238,0.95) 0%, rgba(238,240,238,0.74) 24%, rgba(238,240,238,0.16) 44%, transparent 60%)',
          }}
        />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-10">
            <Link href="/" className="type-grotesk text-[15px] font-semibold uppercase tracking-[0.26em]">
              Vitrine
            </Link>
            <nav className="type-grotesk hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-black/55 md:flex">
              <Link href="/discover" className="hover:text-black">Collections</Link>
              <Link href="/plans" className="hover:text-black">Pricing</Link>
              <Link href="/login" className="hover:text-black">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-grotesk bg-black px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85"
            >
              Start free
            </Link>
          </header>

          <div className="mt-auto max-w-4xl px-6 pb-16 sm:px-10 sm:pb-20">
            <p className="type-grotesk mb-5 text-[11px] uppercase tracking-[0.3em] text-black/50">
              Same room, one difference
            </p>
            <h1 className="type-grotesk text-[2.2rem] font-semibold uppercase leading-[0.96] tracking-[-0.03em] sm:text-[3.5rem]">
              Turn the lights on
              <br />
              and write it down.
            </h1>
            <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-black/65">
              Same shelves, same boxes, same objects. The only thing that changed is that somebody
              made a record — and now the collection can be found, valued and proved.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-grotesk bg-black px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-85"
              >
                Catalogue your first object
              </Link>
              <Link href="/discover" className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-black/60 underline underline-offset-[8px] hover:text-black">
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-5 text-[11px] uppercase tracking-[0.14em] text-black/40">
              Free for 100 objects · no card
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-black/65">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with the
            full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-black px-8 py-3.5 text-[12px] uppercase tracking-[0.16em] text-white hover:opacity-85">Start free</Link>
            <Link href="/design" className="type-grotesk text-[11px] uppercase tracking-[0.14em] text-black/40 underline underline-offset-4 hover:text-black">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
