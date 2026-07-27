'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../_motion'

export type Tile = { id: string; title: string; museum: string; image: string | null; emoji: string }

/**
 * The attic light is off. Your cursor is the torch — objects only exist where
 * you point it. On touch devices the beam wanders on its own.
 */
export default function Torch({ tiles }: { tiles: Tile[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let raf = 0
    let tx = 0.5
    let ty = 0.45
    let cx = 0.5
    let cy = 0.45
    let pointerSeen = false

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      tx = (e.clientX - r.left) / r.width
      ty = (e.clientY - r.top) / r.height
      pointerSeen = true
    }

    const t0 = performance.now()
    const tick = () => {
      // No pointer yet (touch, or before first move): drift the beam so the
      // effect is visible without interaction.
      if (!pointerSeen && !reduced) {
        const t = (performance.now() - t0) / 1000
        tx = 0.5 + 0.3 * Math.sin(t * 0.42)
        ty = 0.45 + 0.2 * Math.sin(t * 0.63 + 1.1)
      }
      cx += (tx - cx) * (reduced ? 1 : 0.11)
      cy += (ty - cy) * (reduced ? 1 : 0.11)
      wrap.style.setProperty('--tx', `${(cx * 100).toFixed(2)}%`)
      wrap.style.setProperty('--ty', `${(cy * 100).toFixed(2)}%`)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  const grid = (
    <div className="grid h-full w-full grid-cols-4 gap-px sm:grid-cols-7 lg:grid-cols-10">
      {Array.from({ length: 60 }).map((_, n) => {
        const t = tiles[n % Math.max(1, tiles.length)]
        return (
          <div key={n} className="flex aspect-square items-center justify-center overflow-hidden bg-[#131210]">
            {t?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl sm:text-4xl">{t?.emoji ?? '▪'}</span>
            )}
          </div>
        )
      })}
    </div>
  )

  const mask =
    'radial-gradient(circle 260px at var(--tx) var(--ty), #000 0%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.25) 72%, transparent 100%)'

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden bg-[#050403]"
      style={{ ['--tx' as string]: '50%', ['--ty' as string]: '45%' } as React.CSSProperties}
    >
      {/* Barely-there base layer, so the room has shapes in the dark */}
      <div className="absolute inset-0 opacity-[0.06] grayscale">{grid}</div>

      {/* Lit layer, revealed only under the beam */}
      <div
        className="absolute inset-0"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        {grid}
      </div>

      {/* Warm falloff of the beam itself */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 300px at var(--tx) var(--ty), rgba(255,214,150,0.16), transparent 70%)',
        }}
      />
      {/* Keep the edges black so it reads as a dark room */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_35%,rgba(5,4,3,0.9)_100%)]" />
    </div>
  )
}
