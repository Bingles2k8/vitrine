import Link from 'next/link'
import type { ReactNode } from 'react'
import { VariantBar } from '../_lib'

/**
 * Shared shell for the WebGL homepage demos (v21–v25): full-bleed scene,
 * overlaid nav and headline, and a short strip below the fold. Deliberately
 * light on marketing copy — these exist to test the interaction.
 */
export default function GlFold({
  variant,
  kicker,
  headline,
  sub,
  note,
  scene,
  overlayPosition = 'left',
}: {
  variant: string
  kicker: string
  headline: ReactNode
  sub: string
  note: string
  scene: ReactNode
  overlayPosition?: 'left' | 'bottom'
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f2efe9]">
      <VariantBar current={variant} />

      <section className="relative h-[calc(100vh-30px)] min-h-[620px] w-full overflow-hidden">
        {scene}

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <header className="pointer-events-auto flex items-center justify-between px-6 py-6 sm:px-10">
            <Link href="/" className="type-didone text-[22px] tracking-[0.04em]">Vitrine</Link>
            <nav className="type-mono hidden gap-8 text-[11px] uppercase tracking-[0.2em] text-white/45 md:flex">
              <Link href="/discover" className="hover:text-white">Collections</Link>
              <Link href="/plans" className="hover:text-white">Pricing</Link>
              <Link href="/login" className="hover:text-white">Sign in</Link>
            </nav>
            <Link
              href="/signup"
              className="type-mono border border-[#e9b872]/50 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-[#e9b872] transition-colors hover:bg-[#e9b872] hover:text-black"
            >
              Start free
            </Link>
          </header>

          <div
            className={`flex flex-1 px-6 sm:px-10 ${
              overlayPosition === 'bottom' ? 'items-end pb-28' : 'items-center pb-20'
            }`}
          >
            <div className="max-w-xl">
              <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.3em] text-[#e9b872]">
                {kicker}
              </p>
              <h1
                className="type-didone text-[3rem] leading-[0.9] tracking-[-0.02em] sm:text-[5.4rem]"
                style={{ textShadow: '0 6px 44px rgba(0,0,0,0.85)' }}
              >
                {headline}
              </h1>
              <p
                className="mt-7 max-w-md text-[17px] leading-relaxed text-white/65"
                style={{ textShadow: '0 2px 22px rgba(0,0,0,0.9)' }}
              >
                {sub}
              </p>
              <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-5">
                <Link
                  href="/signup"
                  className="type-mono bg-[#e9b872] px-9 py-4 text-[12px] uppercase tracking-[0.18em] text-[#0a0a0c] transition-colors hover:bg-[#f5cd93]"
                >
                  Catalogue your first object
                </Link>
                <Link
                  href="/discover"
                  className="type-mono text-[12px] uppercase tracking-[0.18em] text-white/55 underline underline-offset-[8px] hover:text-white"
                >
                  See real collections
                </Link>
              </div>
              <p className="type-mono mt-5 text-[11px] text-white/35">{note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl text-[16px] leading-relaxed text-white/55">
            Vitrine catalogues what you own — photographed, dated, valued, condition-checked and
            placed — and gives the collection a public site of its own. Free for your first hundred
            objects, £5 a month for a thousand, £79 for museums.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/signup" className="type-mono bg-[#e9b872] px-8 py-3.5 text-[12px] uppercase tracking-[0.18em] text-[#0a0a0c] hover:bg-[#f5cd93]">
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
