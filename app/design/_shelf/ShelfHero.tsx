'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useShader } from '../_gl/useShader'
import { useReducedMotion } from '../_motion'
import { aisleFrag, type Look } from './aisle'
import type { Theme } from './theme'

const START_Z = 5.0
/* Camera travel over the pinned scroll. Cut alongside the section height so the
   aisle moves past at the same rate — a shorter pin with the old distance just
   makes the travel feel like a dolly on fast-forward. */
const TRAVEL = 34.0

/**
 * Offset for the site header. The /design review bar is pinned at exactly 32px
 * (see VariantBar), so the header clears it with no sliver of scene showing
 * above. Lifting this page out of the concepts directory means `top-0`.
 */
const NAV_TOP = 'top-8'

const NAV_LINKS = [
  { label: 'Discover', href: '/discover' },
  { label: 'Guides', href: '/guide/essentials' },
  { label: 'Blog', href: '/blog' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/plans' },
]

/** The live site's header, recoloured. Same wordmark, links and buttons. */
function Nav({ theme }: { theme: Theme }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`pointer-events-auto fixed inset-x-0 ${NAV_TOP} z-50 border-b backdrop-blur-md ${theme.navBg} ${theme.navBorder}`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-xl italic">
          Vitrine<span className={theme.logoDot}>.</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className={`text-sm transition-colors ${theme.navLink}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className={`hidden font-mono text-sm transition-colors sm:block ${theme.navLink}`}>
            Sign in
          </Link>
          <Link href="/signup" className={`rounded px-4 py-2 font-mono text-sm transition-colors ${theme.ctaPrimary}`}>
            Start free →
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <span className={`block h-px w-5 transition-all duration-200 ${theme.hamburger} ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-px w-5 transition-all duration-200 ${theme.hamburger} ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-px w-5 transition-all duration-200 ${theme.hamburger} ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className={`border-b md:hidden ${theme.navBorder} ${theme.cardBg}`}>
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-b py-3 font-mono text-sm last:border-0 ${theme.navBorder} ${theme.navLink}`}
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

function Canvas({
  look,
  theme,
  progressRef,
}: {
  look: Look
  theme: Theme
  progressRef: React.RefObject<number>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const s = useRef({ z: START_Z, px: 0, py: 0, tpx: 0, tpy: 0 })

  // Reduced motion still travels, it just does not ease toward the target.
  const ease = reduced ? 1 : 0.08

  const onFrame = useCallback(
    (t: number) => {
      const st = s.current
      const want = START_Z - progressRef.current * TRAVEL
      st.z += (want - st.z) * ease

      st.px += (st.tpx - st.px) * 0.03
      st.py += (st.tpy - st.py) * 0.03

      // A slow handheld drift, so the aisle reads as a place you are standing in
      // rather than a picture of one. Two incommensurate periods, so it never
      // settles into a visible loop, and small enough that you notice the
      // parallax between the near uprights and the far end rather than the
      // movement itself. Costs nothing — it is three uniforms.
      const dx = reduced ? 0 : Math.sin(t * 0.21) * 0.065 + Math.sin(t * 0.132 + 1.7) * 0.035
      const dy = reduced ? 0 : Math.sin(t * 0.17 + 0.6) * 0.03
      const tx = reduced ? 0 : Math.sin(t * 0.113 + 2.2) * 0.05

      return {
        uTime: t,
        uCam: [dx + st.px, 1.62 + dy + st.py, st.z],
        // The target leans the other way, which is what turns a pan into
        // parallax: the racking either side shears, the vanishing point holds.
        uTarget: [-tx - st.px * 0.35, 1.34 - dy * 0.5, st.z - 6.0],
        uLight: [0, 2.85, st.z],
        uP: [0, 0, 0, 0],
      }
    },
    [ease, reduced, progressRef]
  )

  const failed = useShader(canvasRef, aisleFrag(look), onFrame, 0.92)

  if (failed) {
    return <div className="absolute inset-0" style={{ background: theme.fallback }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={e => {
        if (reduced || e.pointerType !== 'mouse') return
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        s.current.tpx = ((e.clientX - r.left) / r.width - 0.5) * 0.34
        s.current.tpy = ((e.clientY - r.top) / r.height - 0.5) * -0.12
      }}
      onPointerLeave={() => { s.current.tpx = 0; s.current.tpy = 0 }}
      aria-label="An aisle of storage racking receding into the dark, an object in every bay"
    />
  )
}

export type Copy = {
  eyebrow: string
  headline: React.ReactNode
  body: React.ReactNode
  primary: { label: string; href: string }
  secondary: { label: string; href: string }
  fine: string
}

const DEFAULT_COPY: Copy = {
  eyebrow: 'Your collection, from the inside',
  headline: (
    <>
      Somewhere in here
      <br />
      is everything you own.
    </>
  ),
  body: 'Vitrine gives every object a record — what it is, what it cost, where it is now, and who it goes to next. Then it gives the collection a page worth showing.',
  primary: { label: 'Start free →', href: '/signup' },
  secondary: { label: 'Browse collections', href: '/discover' },
  fine: 'Free plan available · No credit card required',
}

export default function ShelfHero({
  look,
  theme,
  copy = DEFAULT_COPY,
  /** False when the page already has its own fixed site header above this. */
  ownNav = true,
  /**
   * Colour the bottom of the hero resolves to, as "r,g,b". Set it to the colour
   * of whatever follows when that is not the band colour — otherwise midday's
   * lighter page meets a stone-950 section at a visible seam.
   */
  handoffRgb,
}: {
  look: Look
  theme: Theme
  copy?: Copy
  ownNav?: boolean
  handoffRgb?: string
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const progressRef = useRef(0)
  const copyRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const read = () => {
      const el = sectionRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const span = r.height - window.innerHeight
      const p = span > 0 ? Math.min(Math.max(-r.top / span, 0), 1) : 0
      progressRef.current = p

      // The frame is pinned, so without this the page appears to stop dead
      // while the wheel keeps turning. Moving the copy at about a fifth of
      // scroll speed gives the reader something that responds — the aisle
      // stays full-bleed, the words drift up and out. Written straight to
      // the node: scrolling must not re-render this component.
      const c = copyRef.current
      if (c) {
        // The fade finishes at 0.95, just before the pin lets go, so the copy
        // leaving *is* the cue that the page is about to start moving again.
        // Any earlier and the hero sits there empty while the wheel turns.
        c.style.transform = `translate3d(0, ${-p * 34}vh, 0)`
        c.style.opacity = String(Math.max(0, 1 - Math.max(0, p - 0.45) / 0.50))
      }
      // The copy's own shade fades in only as it climbs out of the frame's
      // scrim. At rest it would just be a second layer of dark over the first.
      const v = veilRef.current
      if (v) v.style.opacity = String(Math.min(1, p / 0.18))

      // The cue has done its job the moment scrolling starts; leaving it on
      // means it is still there telling you to scroll as the pin lets go.
      const q = cueRef.current
      if (q) q.style.opacity = String(Math.max(0, 1 - p / 0.12))
    }
    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  const rgb = theme.scrimRgb
  const foot = handoffRgb ?? rgb

  return (
    <section ref={sectionRef} className="relative h-[250vh]">
      <div className={`sticky top-0 h-screen w-full overflow-hidden ${theme.page}`}>
        <Canvas look={look} theme={theme} progressRef={progressRef} />

        {/* Page colour top and bottom, nothing across the middle, and enough
            stops that the transition never shows as a band on a lit shelf. */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background: `linear-gradient(180deg, rgba(${rgb},0.92) 0%, rgba(${rgb},0.55) 10%, rgba(${rgb},0.18) 20%, rgba(${rgb},0.04) 30%, rgba(${rgb},0) 42%, rgba(${foot},0.10) 54%, rgba(${foot},0.30) 64%, rgba(${foot},0.62) 74%, rgba(${foot},0.88) 88%, rgb(${foot}) 100%)`,
          }}
        />

        {/* The copy's home corner. An anchored pool of the page colour in the
            lower left, so the text always sits on shade regardless of which
            shelf the travel has put behind it — the band scrims fade across
            the middle precisely so the aisle stays visible, which left the
            copy's legibility to luck. This takes the luck out. */}
        <div
          className="pointer-events-none absolute inset-0 z-[6]"
          style={{
            background: `radial-gradient(95% 110% at 12% 88%, rgba(${rgb},0.62) 0%, rgba(${rgb},0.34) 38%, rgba(${rgb},0.10) 58%, transparent 72%)`,
          }}
        />

        <div className="pointer-events-none relative z-10 h-full">
          {ownNav && <Nav theme={theme} />}

          <div ref={copyRef} className="absolute inset-x-0 bottom-0 will-change-transform">
            {/* The copy travels up out of the frame's own scrim, so it carries a
                second one with it. Two rules keep it invisible as a shape:
                it is plain black in every band (a page-coloured veil only
                matched on the dark bands anyway), and its bottom hangs 45vh
                below the wrapper — the copy travels 34vh at most, so the
                gradient's darkest edge can never rise into the frame and
                print a hard line across the scene, which it used to. */}
            <div
              ref={veilRef}
              className="pointer-events-none absolute inset-x-0 -z-10 opacity-0"
              style={{
                top: '-55%',
                bottom: '-45vh',
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.30) 42%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.68) 100%)',
              }}
            />
            <div className="mx-auto max-w-6xl px-6 pb-24 sm:pb-20" style={{ textShadow: theme.textShadow }}>
              <p className={`mb-4 font-mono text-[11px] uppercase tracking-widest sm:mb-5 sm:text-xs ${theme.eyebrow}`}>
                {copy.eyebrow}
              </p>
              <h1 className={`font-serif text-4xl italic leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl ${theme.headline}`}>
                {copy.headline}
              </h1>
              <p className={`mt-5 max-w-lg text-[15px] leading-relaxed sm:mt-6 sm:text-base ${theme.body}`}>
                {copy.body}
              </p>

              <div
                className="pointer-events-auto mt-7 flex flex-wrap items-center gap-3 sm:mt-8"
                style={{ textShadow: 'none' }}
              >
                <Link href={copy.primary.href} className={`rounded px-6 py-3 font-mono text-sm transition-colors ${theme.ctaPrimary}`}>
                  {copy.primary.label}
                </Link>
                <Link href={copy.secondary.href} className={`rounded px-6 py-3 font-mono text-sm transition-colors ${theme.ctaGhost}`}>
                  {copy.secondary.label}
                </Link>
              </div>
              <p className={`mt-4 font-mono text-xs ${theme.fine}`}>
                {copy.fine}
              </p>
            </div>
          </div>

          <p
            ref={cueRef}
            className={`absolute inset-x-0 bottom-4 hidden text-center font-mono text-[10px] uppercase tracking-[0.3em] lg:block ${theme.scrollCue}`}
            style={{ textShadow: theme.textShadow }}
          >
            Scroll ↓
          </p>
        </div>
      </div>
    </section>
  )
}
