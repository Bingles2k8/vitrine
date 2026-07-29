'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SHAPE_META } from '../_gl/shapes'
import Scene from './Scene'

/** Where each field's leader starts, as a fraction of the frame. */
const ROWS = [
  { key: 'dims', term: 'Dimensions', y: 0.455 },
  { key: 'material', term: 'Material', y: 0.575 },
  { key: 'condition', term: 'Condition', y: 0.695 },
] as const

type RowKey = (typeof ROWS)[number]['key']

export default function Hero() {
  const frameRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  // The record is written straight into these nodes when the shader picks an
  // object, so a new object per page load costs no React render at all.
  const nameRef = useRef<HTMLSpanElement>(null)
  const periodRef = useRef<HTMLSpanElement>(null)
  const fieldRefs = useRef<Record<RowKey, HTMLSpanElement | null>>({
    dims: null,
    material: null,
    condition: null,
  })

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect
      setBox({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onShape = useCallback((i: number) => {
    const m = SHAPE_META[i] ?? SHAPE_META[1]
    if (nameRef.current) nameRef.current.textContent = m.object
    if (periodRef.current) periodRef.current.textContent = m.period
    if (fieldRefs.current.dims) fieldRefs.current.dims.textContent = m.dims
    if (fieldRefs.current.material) fieldRefs.current.material.textContent = m.material
    if (fieldRefs.current.condition) fieldRefs.current.condition.textContent = m.condition
  }, [])

  // Must agree with the lens shift in Scene.tsx — that is what puts the object
  // on a known mark so the leaders can point at something real.
  const wide = box.w > box.h
  const anchor = {
    x: box.w / 2 + (wide ? 0.3 : 0) * box.h,
    y: box.h / 2 - (wide ? 0.02 : 0.3) * box.h,
  }
  // Just inside the object's silhouette, so the leaders touch it rather than
  // stopping short in clear space.
  const radius = Math.max(70, box.h * (wide ? 0.14 : 0.13))
  // The leaders start just past the field text, so the run-in reads as part of
  // the record rather than as a line floating in the middle of the frame.
  const gutter = box.w >= 640 ? 40 : 24
  const fieldW = Math.min(300, Math.max(150, box.w * 0.26))
  const startX = wide ? gutter + fieldW + 14 : box.w * 0.5

  // Desktop only: on a phone the fields sit directly under the object, so every
  // leader would leave from the same point and converge on the same spot.
  const leaders = box.w && wide
    ? ROWS.map((row, i) => {
        const p = { x: startX, y: box.h * row.y }
        const dx = anchor.x - p.x
        const dy = anchor.y - p.y
        const len = Math.hypot(dx, dy) || 1
        const end = { x: anchor.x - (dx / len) * radius, y: anchor.y - (dy / len) * radius }
        const elbow = { x: p.x + 26, y: p.y }
        const total =
          Math.hypot(elbow.x - p.x, elbow.y - p.y) + Math.hypot(end.x - elbow.x, end.y - elbow.y)
        return { i, p, elbow, end, total }
      })
    : []

  return (
    <section
      ref={frameRef}
      className="relative h-[calc(100vh-30px)] min-h-[660px] w-full overflow-hidden bg-[#cdd0cd]"
    >
      <Scene onShape={onShape} />

      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            'linear-gradient(96deg, rgba(232,234,231,0.94) 0%, rgba(232,234,231,0.72) 26%, rgba(232,234,231,0.10) 50%, transparent 64%)',
        }}
      />

      {/* The leaders live between the scrim and the type so they read as part
          of the record rather than as decoration on the photograph. */}
      {leaders.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-[6]"
          width={box.w}
          height={box.h}
          aria-hidden="true"
        >
          {leaders.map(l => (
            <g key={l.i}>
              <polyline
                className="leader"
                style={{ ['--len' as string]: `${l.total}`, animationDelay: `${520 + l.i * 190}ms` }}
                points={`${l.p.x},${l.p.y} ${l.elbow.x},${l.elbow.y} ${l.end.x},${l.end.y}`}
                fill="none"
                stroke="rgba(16,18,16,0.42)"
                strokeWidth="1"
              />
              <circle
                className="assemble"
                style={{ animationDelay: `${1100 + l.i * 190}ms` }}
                cx={l.end.x}
                cy={l.end.y}
                r="2.5"
                fill="rgba(16,18,16,0.6)"
              />
            </g>
          ))}
        </svg>
      )}

      <div className="pointer-events-none relative z-10 flex h-full flex-col text-[#101210]">
        <header className="pointer-events-auto flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="type-grotesk text-[14px] font-semibold uppercase tracking-[0.28em]">
            Vitrine
          </Link>
          <nav className="type-grotesk hidden gap-8 text-[11px] uppercase tracking-[0.18em] text-black/50 md:flex">
            <Link href="/discover" className="hover:text-black">Collections</Link>
            <Link href="/plans" className="hover:text-black">Pricing</Link>
            <Link href="/login" className="hover:text-black">Sign in</Link>
          </nav>
          <Link
            href="/signup"
            className="type-grotesk bg-black px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-white hover:opacity-85"
          >
            Start free
          </Link>
        </header>

        <div className="max-w-xl px-6 pt-6 sm:px-10 sm:pt-10">
          <p className="type-mono assemble text-[11px] uppercase tracking-[0.3em] text-black/45">
            Accession 2026.04.011
          </p>
          <h1 className="type-book assemble mt-4 text-[2.3rem] leading-[1.02] tracking-[-0.015em] sm:text-[3.2rem]" style={{ animationDelay: '120ms' }}>
            <span ref={nameRef}>Baluster vase</span>,{' '}
            <span ref={periodRef} className="text-black/50">c. 1910</span>
          </h1>
          <p className="assemble mt-5 max-w-md text-[16.5px] leading-relaxed text-black/60" style={{ animationDelay: '260ms' }}>
            This is what Vitrine makes. Not a photo in a folder — a record, with everything an
            insurer, a valuer or an executor would ask for.
          </p>
        </div>

        {/* Field rows sit at the same fractions the leaders start from — the
            container has to be full height for those percentages to mean
            anything. */}
        <div className="pointer-events-none absolute inset-0">
          {ROWS.map((row, i) => (
            <dl
              key={row.key}
              className="assemble absolute -translate-y-1/2"
              style={{
                top: `${row.y * 100}%`,
                left: gutter,
                width: fieldW,
                animationDelay: `${560 + i * 190}ms`,
              }}
            >
              <dt className="type-mono text-[10.5px] uppercase tracking-[0.24em] text-black/40">
                {row.term}
              </dt>
              <dd className="type-mono mt-1 text-[13.5px] leading-snug text-black/80">
                <span ref={el => { fieldRefs.current[row.key] = el }}>
                  {row.key === 'dims'
                    ? SHAPE_META[1].dims
                    : row.key === 'material'
                      ? SHAPE_META[1].material
                      : SHAPE_META[1].condition}
                </span>
              </dd>
            </dl>
          ))}
        </div>

        <div className="mt-auto px-6 pb-12 sm:px-10 sm:pb-16">
          <div className="pointer-events-auto assemble flex flex-wrap items-center gap-5" style={{ animationDelay: '1180ms' }}>
            <Link
              href="/signup"
              className="type-grotesk bg-black px-8 py-4 text-[12px] uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-85"
            >
              Make the first record
            </Link>
            <Link
              href="/discover"
              className="type-grotesk text-[12px] uppercase tracking-[0.16em] text-black/55 underline underline-offset-[8px] hover:text-black"
            >
              See real collections
            </Link>
          </div>
          <p className="type-grotesk assemble mt-5 text-[11px] uppercase tracking-[0.14em] text-black/40" style={{ animationDelay: '1300ms' }}>
            Free for 100 objects · no card
          </p>
        </div>
      </div>
    </section>
  )
}
