import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Assemble from './Assemble'

export const metadata = buildPageMetadata({
  title: 'Design v25 — Assembly',
  description: 'WebGL gallery: the exhibit builds itself as you scroll.',
  path: '/design/v25',
  noIndex: true,
})

export default function V25() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f2efe9]">
      <VariantBar current="v25" />
      <Assemble />

      <section className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="type-didone text-[2.4rem] leading-[0.98] sm:text-[3.4rem]">
              Now do it for real.
            </h2>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/55">
              Free for your first hundred objects, £5 a month for a thousand with five photographs
              each, £79 for museums with the full documentation registers and a thirty-day trial.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-mono bg-[#e9b872] px-9 py-4 text-[12px] uppercase tracking-[0.18em] text-[#0a0a0c] hover:bg-[#f5cd93]">
              Start free
            </Link>
            <Link href="/design" className="type-mono text-[11px] uppercase tracking-[0.16em] text-white/40 underline underline-offset-4 hover:text-white">
              Back to concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
