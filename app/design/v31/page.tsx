import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Scene from './Scene'

export const metadata = buildPageMetadata({
  title: 'Design v31 — Store, dark',
  description: 'The dark store room: racking, crates, one swinging bulb.',
  path: '/design/v31',
  noIndex: true,
})

const FACTS: [string, string][] = [
  ['Objects on site', 'Unknown'],
  ['Last audited', 'Never'],
  ['Insured value', 'Estimated'],
  ['Location records', 'In someone’s head'],
]

export default function V31() {
  return (
    <div className="min-h-screen bg-[#0b0d0b] text-[#e6eae2]">
      <VariantBar current="v31" />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        <Scene />

        {/* Second scrim on top of the shader's own, so the copy holds at any size */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              'linear-gradient(100deg, rgba(6,8,6,0.92) 0%, rgba(6,8,6,0.78) 34%, rgba(6,8,6,0.18) 62%, transparent 78%)',
          }}
        />

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between border-b border-white/10 px-5 py-3">
            <Link href="/" className="type-mono text-[13px] uppercase tracking-[0.2em] text-white">
              vitrine<span className="text-[#f0c02a]">/</span>store
            </Link>
            <div className="type-mono flex items-center gap-5 text-[11px] uppercase tracking-[0.12em] text-white/55">
              <Link href="/plans" className="hidden hover:text-white sm:block">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/signup" className="bg-[#f0c02a] px-4 py-1.5 text-[#0b0d0b] hover:bg-[#ffd447]">
                Start free
              </Link>
            </div>
          </header>

          <div className="flex flex-1 items-center px-5 sm:px-8">
            <div className="max-w-xl border-l-2 border-[#f0c02a] pl-6">
              <p className="type-mono mb-5 text-[11px] uppercase tracking-[0.2em] text-[#f0c02a]">
                Room 3 · racking B–F · no inventory
              </p>
              <h1 className="type-mono text-[2rem] font-medium leading-[1.14] text-white sm:text-[3.1rem]">
                Most collections
                <br />
                look like this.
              </h1>
              <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-white/80">
                Boxed, stacked, unlabelled, and known only to whoever put it there. Vitrine is the
                register that survives them leaving.
              </p>

              <dl className="mt-8 grid max-w-md grid-cols-2 gap-x-8 gap-y-1 border-t border-white/25 pt-4">
                {FACTS.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-white/15 py-1.5">
                    <dt className="type-mono text-[10px] uppercase tracking-[0.1em] text-white/55">{k}</dt>
                    <dd className="type-mono text-[10px] uppercase tracking-[0.1em] text-[#f0c02a]">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-5">
                <Link
                  href="/signup"
                  className="type-mono bg-[#f0c02a] px-8 py-3.5 text-[12px] uppercase tracking-[0.14em] text-[#0b0d0b] transition-colors hover:bg-[#ffd447]"
                >
                  Start the register
                </Link>
                <Link href="/compliance" className="type-mono text-[12px] uppercase tracking-[0.12em] text-white/70 underline underline-offset-[6px] hover:text-white">
                  Museum registers
                </Link>
              </div>
              <p className="type-mono mt-5 text-[11px] text-white/45">
                Free for 100 objects · drag to swing the light
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[15.5px] leading-relaxed text-white/60">
            Entry, acquisition, location and movement, loans, condition, conservation, valuation,
            insurance, deaccession and audit — built in on Professional, £79 a month.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-mono bg-[#f0c02a] px-8 py-3.5 text-[12px] uppercase tracking-[0.14em] text-[#0b0d0b] hover:bg-[#ffd447]">Start free</Link>
            <Link href="/design" className="type-mono text-[11px] uppercase tracking-[0.12em] text-white/40 underline underline-offset-4 hover:text-white">Back to concepts</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
