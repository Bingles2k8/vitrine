'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../_motion'

export type Body = { id: string; label: string; emoji: string; image: string | null }

type Sim = {
  x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number
}

/**
 * Objects fall into the frame and pile up. You can grab one and throw it.
 * Hand-rolled circle physics — no library, no canvas, just transforms.
 */
export default function Pile({ bodies }: { bodies: Body[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduced = useReducedMotion()

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const N = bodies.length
    const R = 44
    const sim: Sim[] = Array.from({ length: N }, (_, i) => ({
      // Deterministic start so nothing depends on render order.
      x: 80 + ((i * 137) % Math.max(1, wrap.clientWidth - 160)),
      y: -120 - i * 95,
      vx: (((i * 53) % 100) / 100 - 0.5) * 2.2,
      vy: 0,
      r: R,
      rot: ((i * 71) % 60) - 30,
      vr: (((i * 29) % 100) / 100 - 0.5) * 2,
    }))

    if (reduced) {
      // Settle instantly into a tidy row rather than animating a pile.
      const cols = Math.max(1, Math.floor(wrap.clientWidth / (R * 2 + 12)))
      sim.forEach((b, i) => {
        b.x = R + 12 + (i % cols) * (R * 2 + 12)
        b.y = wrap.clientHeight - R - 12 - Math.floor(i / cols) * (R * 2 + 8)
        b.rot = 0
      })
      sim.forEach((b, i) => {
        const el = nodeRefs.current[i]
        if (el) el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`
      })
      return
    }

    const G = 0.62
    const DAMP = 0.992
    const REST = 0.34

    let held: number | null = null
    let heldPrev = { x: 0, y: 0 }
    let pointer = { x: 0, y: 0 }

    const pick = (px: number, py: number) => {
      for (let i = sim.length - 1; i >= 0; i--) {
        const dx = px - sim[i].x
        const dy = py - sim[i].y
        if (dx * dx + dy * dy < sim[i].r * sim[i].r) return i
      }
      return null
    }

    const onDown = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      const px = e.clientX - r.left
      const py = e.clientY - r.top
      const i = pick(px, py)
      if (i === null) return
      held = i
      pointer = { x: px, y: py }
      heldPrev = { x: px, y: py }
      wrap.setPointerCapture(e.pointerId)
      wrap.style.cursor = 'grabbing'
    }

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top }
    }

    const onUp = () => {
      if (held !== null) {
        sim[held].vx = (pointer.x - heldPrev.x) * 0.85
        sim[held].vy = (pointer.y - heldPrev.y) * 0.85
      }
      held = null
      wrap.style.cursor = 'grab'
    }

    wrap.addEventListener('pointerdown', onDown)
    wrap.addEventListener('pointermove', onMove, { passive: true })
    wrap.addEventListener('pointerup', onUp)
    wrap.addEventListener('pointercancel', onUp)

    let raf = 0
    const step = () => {
      const W = wrap.clientWidth
      const H = wrap.clientHeight

      for (let i = 0; i < N; i++) {
        const b = sim[i]
        if (held === i) {
          heldPrev = { x: b.x, y: b.y }
          b.x = pointer.x
          b.y = pointer.y
          b.vx = 0
          b.vy = 0
          continue
        }
        b.vy += G
        b.vx *= DAMP
        b.vy *= DAMP
        b.x += b.vx
        b.y += b.vy
        b.rot += b.vr
        b.vr *= 0.985

        if (b.x < b.r) { b.x = b.r; b.vx = -b.vx * REST; b.vr = -b.vr }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -b.vx * REST; b.vr = -b.vr }
        if (b.y > H - b.r) {
          b.y = H - b.r
          b.vy = -b.vy * REST
          b.vx *= 0.9
          b.vr *= 0.86
        }
      }

      // Pairwise separation — few enough bodies that O(n²) is fine.
      for (let a = 0; a < N; a++) {
        for (let c = a + 1; c < N; c++) {
          const A = sim[a]
          const B = sim[c]
          let dx = B.x - A.x
          const dy = B.y - A.y
          const min = A.r + B.r
          let d2 = dx * dx + dy * dy
          if (d2 === 0) { dx = 0.01; d2 = 0.0001 }
          if (d2 < min * min) {
            const d = Math.sqrt(d2)
            const nx = dx / d
            const ny = dy / d
            const overlap = (min - d) * 0.5
            if (held !== a) { A.x -= nx * overlap; A.y -= ny * overlap }
            if (held !== c) { B.x += nx * overlap; B.y += ny * overlap }
            const rvx = B.vx - A.vx
            const rvy = B.vy - A.vy
            const sep = rvx * nx + rvy * ny
            if (sep < 0) {
              const imp = -(1 + REST) * sep * 0.5
              if (held !== a) { A.vx -= imp * nx; A.vy -= imp * ny }
              if (held !== c) { B.vx += imp * nx; B.vy += imp * ny }
              const spin = imp * 0.35
              A.vr -= spin
              B.vr += spin
            }
          }
        }
      }

      for (let i = 0; i < N; i++) {
        const el = nodeRefs.current[i]
        if (!el) continue
        const b = sim[i]
        el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0) rotate(${b.rot.toFixed(1)}deg)`
      }

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(raf)
      wrap.removeEventListener('pointerdown', onDown)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerup', onUp)
      wrap.removeEventListener('pointercancel', onUp)
    }
  }, [bodies, reduced])

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full touch-none overflow-hidden"
      style={{ cursor: 'grab' }}
    >
      {bodies.map((b, i) => (
        <div
          key={b.id}
          ref={el => {
            nodeRefs.current[i] = el
          }}
          className="absolute left-0 top-0 flex h-[88px] w-[88px] select-none items-center justify-center overflow-hidden rounded-full border-2 border-[#14110d] bg-white text-3xl shadow-[0_8px_0_0_rgba(20,17,13,0.9)] will-change-transform"
          title={b.label}
        >
          {b.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.image} alt={b.label} draggable={false} className="h-full w-full object-cover" />
          ) : (
            <span>{b.emoji}</span>
          )}
        </div>
      ))}
    </div>
  )
}
