import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Night from './Night'

export const metadata = buildPageMetadata({
  title: 'Design v27 — After Hours',
  description: 'Museum scene: cold security lighting, mirror floor, glowing case.',
  path: '/design/v27',
  noIndex: true,
})

export default function V27() {
  return (
    <div className="min-h-screen bg-[#05070c] text-[#dce6f5]">
      <VariantBar current="v27" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Night />

        {/* Everything centred and low — the room is the subject, type is a caption */}
        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-grotesk text-[13px] font-medium uppercase tracking-[0.42em]">
              Vitrine
            </Link>
            <Link
              href="/signup"
              className="type-grotesk border border-[#6fb2ff]/40 px-5 py-2 text-[10px] uppercase tracking-[0.24em] text-[#8ec6ff] transition-colors hover:bg-[#8ec6ff] hover:text-[#05070c]"
            >
              Start free
            </Link>
          </header>

          <div className="mt-auto px-6 pb-16 text-center sm:px-10 sm:pb-20">
            <p className="type-grotesk mb-6 text-[10px] uppercase tracking-[0.42em] text-[#6fb2ff]">
              Closed to the public
            </p>
            <h1 className="type-grotesk mx-auto max-w-3xl text-[2rem] font-light leading-[1.1] tracking-[-0.01em] sm:text-[3.2rem]">
              The lights go off.
              <br />
              The record stays on.
            </h1>
            <p className="mx-auto mt-6 max-w-md text-[15.5px] leading-relaxed text-[#dce6f5]/55">
              Valuations, condition history, locations, insurance schedules — the part of a
              collection that has to survive the people who look after it.
            </p>
            <div className="pointer-events-auto mt-9 flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/signup"
                className="type-grotesk bg-[#8ec6ff] px-9 py-4 text-[11px] uppercase tracking-[0.24em] text-[#05070c] transition-colors hover:bg-white"
              >
                Catalogue your first object
              </Link>
              <Link
                href="/discover"
                className="type-grotesk text-[11px] uppercase tracking-[0.24em] text-[#dce6f5]/45 underline underline-offset-[9px] hover:text-white"
              >
                See real collections
              </Link>
            </div>
            <p className="type-grotesk mt-6 text-[10px] uppercase tracking-[0.24em] text-[#dce6f5]/25">
              Free for 100 objects · drag to turn the object
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[15.5px] leading-relaxed text-[#dce6f5]/55">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with the
            full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-[#8ec6ff] px-8 py-3.5 text-[11px] uppercase tracking-[0.24em] text-[#05070c] hover:bg-white">
              Start free
            </Link>
            <Link href="/design" className="type-grotesk text-[10px] uppercase tracking-[0.2em] text-[#dce6f5]/35 underline underline-offset-4 hover:text-white">
              Back to concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
