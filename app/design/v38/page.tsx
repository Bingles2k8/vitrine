import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Hero from './Hero'

export const metadata = buildPageMetadata({
  title: 'Design v38 — The Long Shelf',
  description: 'An aisle of racking that does not end. Scroll to travel it.',
  path: '/design/v38',
  noIndex: true,
})

export default function V38() {
  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <VariantBar current="v38" />
      <Hero />

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
