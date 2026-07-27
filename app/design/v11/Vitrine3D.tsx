'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../_motion'

type Piece = { label: string; meta: string; emoji: string; image: string | null }

/**
 * A display case built in CSS 3D. The case tilts toward the pointer, a
 * spotlight follows it, and the glass carries a sheen that moves with it —
 * so the hero behaves like an object rather than a picture of one.
 */
export default function Vitrine3D({ pieces }: { pieces: Piece[] }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reduced) return

    let frame = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2
    }

    const tick = () => {
      cx += (tx - cx) * 0.06
      cy += (ty - cy) * 0.06
      stage.style.setProperty('--ry', `${cx * 16}deg`)
      stage.style.setProperty('--rx', `${-cy * 9}deg`)
      stage.style.setProperty('--sx', `${50 + cx * 34}%`)
      stage.style.setProperty('--sy', `${50 + cy * 26}%`)
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduced])

  // Rotate the object on show, like a case being re-dressed.
  useEffect(() => {
    if (pieces.length < 2 || reduced) return
    const t = setInterval(() => setI(n => (n + 1) % pieces.length), 4200)
    return () => clearInterval(t)
  }, [pieces.length, reduced])

  const piece = pieces[i] ?? pieces[0]
  const W = 300
  const H = 340
  const D = 210

  const glass =
    'absolute border border-white/[0.14] bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent'

  return (
    <div
      ref={stageRef}
      className="relative flex h-[560px] items-center justify-center sm:h-[640px]"
      style={
        {
          perspective: '1400px',
          ['--ry' as string]: '0deg',
          ['--rx' as string]: '0deg',
          ['--sx' as string]: '50%',
          ['--sy' as string]: '50%',
        } as React.CSSProperties
      }
    >
      {/* Gallery spotlight, tracking the pointer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(700px 520px at var(--sx) var(--sy), rgba(255,238,205,0.24), transparent 68%), radial-gradient(320px 320px at 50% 42%, rgba(255,236,196,0.14), transparent 70%)',
        }}
      />

      <div
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(var(--rx)) rotateY(var(--ry))',
          width: W,
          height: H,
        }}
      >
        {/* Plinth */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#1b1a17] to-[#0e0e0c]"
          style={{
            width: W + 34,
            height: 130,
            top: H - 4,
            transform: 'translateZ(0px)',
            boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9)',
          }}
        />

        {/* Case faces */}
        <div className={glass} style={{ width: W, height: H, transform: `translateZ(${D / 2}px)` }} />
        <div className={glass} style={{ width: W, height: H, transform: `translateZ(-${D / 2}px) rotateY(180deg)` }} />
        <div
          className={glass}
          style={{ width: D, height: H, left: (W - D) / 2, transform: `rotateY(-90deg) translateZ(${W / 2}px)` }}
        />
        <div
          className={glass}
          style={{ width: D, height: H, left: (W - D) / 2, transform: `rotateY(90deg) translateZ(${W / 2}px)` }}
        />
        <div
          className="absolute border border-white/20 bg-white/[0.06]"
          style={{ width: W, height: D, top: (H - D) / 2, transform: `rotateX(90deg) translateZ(${H / 2}px)` }}
        />

        {/* Moving sheen on the front glass */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: W,
            height: H,
            transform: `translateZ(${D / 2 + 1}px)`,
            background:
              'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.16) calc(var(--sx) * 0.5), transparent 68%)',
          }}
        />

        {/* The object on show */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'translateZ(0px)' }}
        >
          <div
            className="flex flex-col items-center"
            style={reduced ? undefined : { animation: 'vitrine-float 6s ease-in-out infinite' }}
          >
            <div
              key={piece?.label}
              className="flex h-[150px] w-[150px] items-center justify-center overflow-hidden text-[68px]"
              style={{
                animation: reduced ? undefined : 'vitrine-swap 4.2s ease-in-out',
                filter: 'drop-shadow(0 24px 34px rgba(0,0,0,0.75))',
              }}
            >
              {piece?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={piece.image} alt={piece.label} className="h-full w-full object-contain" />
              ) : (
                <span>{piece?.emoji ?? '📷'}</span>
              )}
            </div>
            {/* Wall label inside the case */}
            <div className="mt-7 max-w-[220px] border-t border-white/30 pt-3 text-center">
              <div className="type-book text-[15px] leading-snug text-white">{piece?.label}</div>
              <div className="type-mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[#e8c37a]/80">
                {piece?.meta}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case index */}
      {pieces.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {pieces.map((p, n) => (
            <button
              key={p.label}
              onClick={() => setI(n)}
              aria-label={`Show ${p.label}`}
              className={`h-[3px] w-8 transition-colors ${n === i ? 'bg-[#e8c37a]' : 'bg-white/15 hover:bg-white/30'}`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes vitrine-float {
          0%, 100% { transform: translateY(0) rotate(-1.5deg); }
          50%      { transform: translateY(-14px) rotate(1.5deg); }
        }
        @keyframes vitrine-swap {
          0%   { opacity: 0; transform: scale(0.9) translateY(10px); }
          14%  { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
