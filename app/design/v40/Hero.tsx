'use client'

import Link from 'next/link'
import { useState } from 'react'
import Scene from './Scene'

/**
 * The hero owns the reveal, so the button and the shader share one piece of
 * state. Everything else on the page stays a server component.
 */
export default function Hero() {
  const [revealed, setRevealed] = useState(false)

  return (
    <section className="relative h-[calc(100vh-30px)] min-h-[640px] w-full overflow-hidden">
      <Scene revealed={revealed} />

      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            'linear-gradient(94deg, rgba(4,4,6,0.94) 0%, rgba(4,4,6,0.72) 28%, rgba(4,4,6,0.10) 52%, transparent 66%)',
        }}
      />

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-12">
          <Link href="/" className="type-grotesk text-[14px] font-semibold uppercase tracking-[0.3em]">
            Vitrine
          </Link>
          <nav className="type-grotesk hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-white/45 md:flex">
            <Link href="/discover" className="hover:text-white">Collections</Link>
            <Link href="/plans" className="hover:text-white">Pricing</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </nav>
          <Link
            href="/signup"
            className="type-grotesk border border-white/25 px-5 py-2 text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:text-black"
          >
            Start free
          </Link>
        </header>

        <div className="mt-auto max-w-2xl px-6 pb-14 sm:px-12 sm:pb-20">
          <p className="type-mono mb-5 text-[11px] uppercase tracking-[0.3em] text-[#e0b64a]">
            Plinth 04 · vacant
          </p>
          <h1 className="type-didone text-[2.6rem] leading-[0.94] tracking-[-0.02em] sm:text-[4.2rem]">
            {revealed ? (
              <>
                Now it exists
                <br />
                in two places.
              </>
            ) : (
              <>
                Everything you own
                <br />
                and never wrote down.
              </>
            )}
          </h1>

          <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-white/60">
            {revealed
              ? 'On the shelf, and on the record. One of them survives a house move, an insurance claim, or you.'
              : 'It is somewhere in the house. You could find it, probably. Nobody else could — and nobody else knows what it is worth.'}
          </p>

          <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-5">
            {revealed ? (
              <>
                <Link
                  href="/signup"
                  className="type-grotesk bg-white px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-85"
                >
                  Start the register
                </Link>
                <button
                  type="button"
                  onClick={() => setRevealed(false)}
                  className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-white/45 underline underline-offset-[8px] hover:text-white"
                >
                  Take it away again
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="type-grotesk bg-[#e0b64a] px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-85"
                >
                  Put something on it
                </button>
                <Link
                  href="/signup"
                  className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-white/45 underline underline-offset-[8px] hover:text-white"
                >
                  Skip — start free
                </Link>
              </>
            )}
          </div>

          <p
            className={`type-mono mt-6 text-[11px] uppercase tracking-[0.2em] transition-opacity duration-700 ${
              revealed ? 'text-white/45 opacity-100' : 'opacity-0'
            }`}
          >
            Accession 2026.04.011 · recorded just now
          </p>
        </div>
      </div>
    </section>
  )
}
