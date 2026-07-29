import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Hero from './Hero'

export const metadata = buildPageMetadata({
  title: 'Design v39 — Accession',
  description: 'The object holds still and the record builds itself over the top.',
  path: '/design/v39',
  noIndex: true,
})

export default function V39() {
  return (
    <div className="min-h-screen bg-[#e8eae7] text-[#101210]">
      <VariantBar current="v39" />
      <Hero />

      <section className="border-t border-black/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-black/60">
            Free for your first hundred objects, £5 a month for a thousand, £79 for museums with
            the full documentation registers.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-grotesk bg-black px-8 py-3.5 text-[12px] uppercase tracking-[0.16em] text-white hover:opacity-85">
              Start free
            </Link>
            <Link href="/design" className="type-grotesk text-[11px] uppercase tracking-[0.14em] text-black/45 underline underline-offset-4 hover:text-black">
              Back to concepts
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
