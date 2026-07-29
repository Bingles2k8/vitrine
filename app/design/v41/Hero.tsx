'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Scene from './Scene'

/**
 * The live site's header — same wordmark, same links, same buttons as
 * components/PublicNav.tsx, so what you are looking at is the real thing.
 * The only difference is `top-[30px]`, which clears the /design review bar and
 * becomes `top-0` the moment this leaves the concepts directory.
 */
function Nav() {
  const [open, setOpen] = useState(false)
  const links = [
    { label: 'Discover', href: '/discover' },
    { label: 'Guides', href: '/guide/essentials' },
    { label: 'Blog', href: '/blog' },
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/plans' },
  ]

  return (
    <div className="pointer-events-auto fixed inset-x-0 top-[30px] z-50 border-b border-white/5 bg-stone-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-xl italic">
          Vitrine<span className="text-amber-500">.</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm text-stone-400 transition-colors hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden font-mono text-sm text-stone-400 transition-colors hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded bg-amber-500 px-4 py-2 font-mono text-sm text-stone-950 transition-colors hover:bg-amber-400"
          >
            Start free →
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <span className={`block h-px w-5 bg-stone-400 transition-all duration-200 ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-px w-5 bg-stone-400 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-5 bg-stone-400 transition-all duration-200 ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-b border-white/10 bg-stone-950 md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/5 py-3 font-mono text-sm text-stone-400 last:border-0"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

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
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-stone-950">
        <Scene progressRef={progressRef} counterRef={counterRef} />

        {/* Two scrims in the page colour: one under the nav, one under the copy.
            Both fade to nothing across the middle so the aisle stays clean. */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              'linear-gradient(180deg, rgba(12,10,9,0.92) 0%, rgba(12,10,9,0.55) 10%, rgba(12,10,9,0.18) 20%, rgba(12,10,9,0.04) 30%, rgba(12,10,9,0) 42%, rgba(12,10,9,0.10) 54%, rgba(12,10,9,0.30) 64%, rgba(12,10,9,0.58) 74%, rgba(12,10,9,0.82) 86%, rgba(12,10,9,0.96) 100%)',
          }}
        />

        <div className="pointer-events-none relative z-10 h-full">
          <Nav />

          {/* Scroll odometer. Sits under the nav on a phone, mid-right on a
              desktop where the aisle has clear space. */}
          <div className="absolute right-6 top-24 text-right sm:right-10 sm:top-[22%] lg:right-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
            {/* The aisle scrolls past underneath, so the odometer carries its own
                pool of shade — otherwise the label lands on a lit shelf and
                disappears every second bay. */}
            <div
              className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10"
              style={{ background: 'radial-gradient(60% 60% at 62% 50%, rgba(12,10,9,0.78), rgba(12,10,9,0) 72%)' }}
            />
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 sm:tracking-[0.28em] sm:text-xs">
              Objects passed
            </p>
            <p className="mt-1.5 font-mono text-4xl leading-none tabular-nums text-amber-500 sm:mt-2 sm:text-6xl">
              <span ref={counterRef}>14</span>
            </p>
          </div>

          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-6xl px-6 pb-14 sm:pb-20">
              <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-amber-500 sm:mb-5 sm:text-xs">
                Your collection, from the inside
              </p>
              <h1 className="font-serif text-4xl italic leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Somewhere in here
                <br />
                is everything you own.
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-stone-400 sm:mt-6 sm:text-base">
                Vitrine gives every object a record — what it is, what it cost, where it is now,
                and who it goes to next. Then it gives the collection a page worth showing.
              </p>

              <div className="pointer-events-auto mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
                <Link
                  href="/signup"
                  className="rounded bg-amber-500 px-6 py-3 font-mono text-sm text-stone-950 transition-colors hover:bg-amber-400"
                >
                  Start free →
                </Link>
                <Link
                  href="/discover"
                  className="rounded border border-white/10 px-6 py-3 font-mono text-sm text-stone-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  Browse collections
                </Link>
              </div>
              <p className="mt-4 font-mono text-xs text-stone-600">
                Free plan available · No credit card required
              </p>
            </div>
          </div>

          <p className="absolute inset-x-0 bottom-4 hidden text-center font-mono text-[10px] uppercase tracking-[0.3em] text-stone-700 lg:block">
            Scroll ↓
          </p>
        </div>
      </div>
    </section>
  )
}
