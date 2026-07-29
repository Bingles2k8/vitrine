'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import Scene from './Scene'

/**
 * A tall section with a pinned frame inside it, so the scroll wheel drives the
 * camera down the aisle instead of moving the page. Progress lives in a ref —
 * scrolling must never trigger a React render here.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const counterRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const read = () => {
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const span = r.height - window.innerHeight
      progressRef.current = span > 0 ? Math.min(Math.max(-r.top / span, 0), 1) : 0
    }
    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Scene progressRef={progressRef} counterRef={counterRef} />

        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,5,6,0.86) 0%, rgba(5,5,6,0.12) 26%, transparent 46%, rgba(5,5,6,0.55) 82%, rgba(5,5,6,0.92) 100%)',
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

          {/* The counter is the argument. It climbs as you travel. */}
          <div className="pointer-events-none absolute right-6 top-[24%] text-right sm:right-12">
            <p className="type-mono text-[11px] uppercase tracking-[0.28em] text-white/40">
              Objects passed
            </p>
            <p className="type-mono mt-2 text-[2.6rem] leading-none tabular-nums text-[#e0b64a] sm:text-[4rem]">
              <span ref={counterRef}>14</span>
            </p>
          </div>

          <div className="mt-auto max-w-2xl px-6 pb-14 sm:px-12 sm:pb-20">
            <h1 className="type-grotesk text-[2.4rem] font-semibold uppercase leading-[0.94] tracking-[-0.035em] sm:text-[3.8rem]">
              Keep scrolling.
              <br />
              It does not end.
            </h1>
            <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-white/60">
              Neither does yours. Vitrine is the register that knows what is on every shelf, what
              it cost, and where it went.
            </p>
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center gap-5">
              <Link
                href="/signup"
                className="type-grotesk bg-white px-8 py-4 text-[12px] uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-85"
              >
                Start the register
              </Link>
              <Link
                href="/discover"
                className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-white/45 underline underline-offset-[8px] hover:text-white"
              >
                See real collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
