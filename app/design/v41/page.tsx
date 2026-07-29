import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Hero from './Hero'

export const metadata = buildPageMetadata({
  title: 'Design v41 — The Long Shelf, in brand',
  description: 'v38 rebuilt in the live Vitrine palette, wordmark and type.',
  path: '/design/v41',
  noIndex: true,
})

const POINTS = [
  {
    title: 'Every object, one record',
    body: 'Photographs, measurements, what you paid, where it came from and where it is now. The things an insurer, a valuer or an executor will ask for.',
  },
  {
    title: 'Findable in seconds',
    body: 'Search the whole collection by anything you can remember about it. Location down to the shelf, so you never turn the house over again.',
  },
  {
    title: 'A page worth showing',
    body: 'Publish the parts you want public and keep valuations private. Your collection gets a site; your numbers stay yours.',
  },
]

export default function V41() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <VariantBar current="v41" />
      <Hero />

      <section className="border-t border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-amber-500">
            Everything a collector needs
          </p>
          <h2 className="mb-12 font-serif text-4xl italic leading-tight sm:text-5xl">
            One place for
            <br />
            your whole collection.
          </h2>

          <div className="grid gap-px overflow-hidden rounded-xl bg-white/5 sm:grid-cols-3">
            {POINTS.map(p => (
              <div key={p.title} className="bg-stone-950 p-8 transition-colors hover:bg-stone-900">
                <div className="mb-3 font-serif text-xl italic text-white">{p.title}</div>
                <p className="text-sm leading-relaxed text-stone-400">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="rounded bg-amber-500 px-6 py-3 font-mono text-sm text-stone-950 transition-colors hover:bg-amber-400"
            >
              Start free →
            </Link>
            <Link
              href="/design"
              className="font-mono text-xs uppercase tracking-widest text-stone-600 transition-colors hover:text-stone-400"
            >
              Back to concepts
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
