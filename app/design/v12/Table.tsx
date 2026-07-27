'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type TableItem = {
  id: string
  title: string
  museum: string
  slug: string
  image: string | null
  emoji: string
}

/** Deterministic jitter so server and client lay the table out identically. */
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const FIELD_TEMPLATE: [string, string][] = [
  ['Maker', 'Recorded against the object'],
  ['Date', 'Year, or a range where it is uncertain'],
  ['Acquired', 'When, where, from whom, and what you paid'],
  ['Valuation', 'Dated history, not a single overwritten figure'],
  ['Condition', 'Dated reports with damage mapping'],
  ['Location', 'Room, cabinet, shelf'],
  ['Documents', 'Receipts, service records, certificates'],
]

/**
 * A curator's table: real objects laid out on a surface you can drag around.
 * Direct manipulation instead of a screenshot — the collection is the interface.
 */
export default function Table({ items }: { items: TableItem[] }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<TableItem | null>(null)
  const [dragging, setDragging] = useState(false)
  const [hinted, setHinted] = useState(false)

  const pos = useRef({ x: 0, y: 0 })
  const vel = useRef({ x: 0, y: 0 })
  const down = useRef<{ x: number; y: number; ox: number; oy: number; moved: number } | null>(null)

  const FIELD_W = 2600
  const FIELD_H = 1500

  useEffect(() => {
    const layer = layerRef.current
    const frame = frameRef.current
    if (!layer || !frame) return

    let raf = 0
    const clamp = () => {
      const maxX = 0
      const minX = Math.min(0, frame.clientWidth - FIELD_W)
      const maxY = 0
      const minY = Math.min(0, frame.clientHeight - FIELD_H)
      pos.current.x = Math.max(minX, Math.min(maxX, pos.current.x))
      pos.current.y = Math.max(minY, Math.min(maxY, pos.current.y))
    }

    const tick = () => {
      if (!down.current) {
        pos.current.x += vel.current.x
        pos.current.y += vel.current.y
        vel.current.x *= 0.94
        vel.current.y *= 0.94
        if (Math.abs(vel.current.x) < 0.02) vel.current.x = 0
        if (Math.abs(vel.current.y) < 0.02) vel.current.y = 0
      }
      clamp()
      layer.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    // Start part-way in so the table reads as bigger than the window.
    pos.current = { x: -FIELD_W * 0.22, y: -FIELD_H * 0.18 }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    down.current = { x: e.clientX, y: e.clientY, ox: pos.current.x, oy: pos.current.y, moved: 0 }
    vel.current = { x: 0, y: 0 }
    setDragging(true)
    setHinted(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = down.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    d.moved = Math.max(d.moved, Math.abs(dx) + Math.abs(dy))
    const nx = d.ox + dx
    const ny = d.oy + dy
    vel.current = { x: nx - pos.current.x, y: ny - pos.current.y }
    pos.current = { x: nx, y: ny }
  }

  function onPointerUp() {
    down.current = null
    setDragging(false)
  }

  return (
    <div className="relative">
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative h-[62vh] min-h-[440px] touch-none select-none overflow-hidden border-y border-black/10 bg-[#e6e2d8] ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(0,0,0,0.05), transparent 55%), radial-gradient(circle at 75% 80%, rgba(0,0,0,0.06), transparent 55%)',
        }}
      >
        <div ref={layerRef} className="absolute left-0 top-0" style={{ width: 2600, height: 1500 }}>
          {items.map((it, n) => {
            const col = n % 7
            const row = Math.floor(n / 7)
            // Rounded: React serialises numeric styles differently on server and
            // client at full float precision, which trips a hydration mismatch.
            const x = Math.round(90 + col * 350 + seeded(n) * 120)
            const y = Math.round(80 + row * 300 + seeded(n + 99) * 110)
            const rot = Math.round((seeded(n + 7) - 0.5) * 1100) / 100
            return (
              <button
                key={it.id}
                onClick={() => {
                  if ((down.current?.moved ?? 0) > 6) return
                  setSelected(it)
                }}
                className="group absolute block text-left"
                style={{ left: x, top: y, transform: `rotate(${rot}deg)` }}
              >
                <div className="w-[210px] bg-white p-3 shadow-[0_14px_30px_-12px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_26px_48px_-14px_rgba(0,0,0,0.5)]">
                  <div className="flex h-[150px] items-center justify-center overflow-hidden bg-[#f2efe8] text-4xl">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={it.image}
                        alt={it.title}
                        draggable={false}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{it.emoji}</span>
                    )}
                  </div>
                  <div className="type-book mt-3 line-clamp-2 text-[14px] leading-snug text-[#171612]">
                    {it.title}
                  </div>
                  <div className="type-mono mt-1 truncate text-[10px] uppercase tracking-[0.12em] text-[#9a9184]">
                    {it.museum}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#e6e2d8] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#e6e2d8] to-transparent" />

        {!hinted && (
          <div className="type-mono pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 border border-black/15 bg-white/85 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#4a463d] backdrop-blur">
            Drag the table · click any object
          </div>
        )}
      </div>

      {/* Record drawer */}
      {selected && (
        <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true">
          <button
            aria-label="Close record"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
          />
          <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#faf8f3] p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <span className="type-mono text-[10px] uppercase tracking-[0.2em] text-[#9a9184]">
                Object record
              </span>
              <button
                onClick={() => setSelected(null)}
                className="type-mono text-[11px] uppercase tracking-[0.14em] text-[#6b665a] hover:text-black"
              >
                Close ✕
              </button>
            </div>

            <div className="mb-6 flex h-[220px] items-center justify-center overflow-hidden bg-[#eeebe3] text-6xl">
              {selected.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.image} alt={selected.title} className="h-full w-full object-cover" />
              ) : (
                <span>{selected.emoji}</span>
              )}
            </div>

            <h3 className="type-book text-[24px] leading-tight text-[#171612]">{selected.title}</h3>
            <Link
              href={`/museum/${selected.slug}`}
              className="type-mono mt-2 text-[11px] uppercase tracking-[0.14em] text-[#8a5a1f] underline underline-offset-4"
            >
              {selected.museum} →
            </Link>

            <p className="mt-7 text-[14px] leading-relaxed text-[#5a5648]">
              This object is published from a real Vitrine collection. Behind every public object
              there is a private record, and this is what it holds:
            </p>

            <dl className="mt-5 border-t border-black/10">
              {FIELD_TEMPLATE.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 border-b border-black/10 py-2.5">
                  <dt className="type-mono text-[10px] uppercase tracking-[0.1em] text-[#9a9184]">{k}</dt>
                  <dd className="col-span-2 text-[13px] leading-relaxed text-[#3d3a31]">{v}</dd>
                </div>
              ))}
            </dl>

            <Link
              href="/signup"
              className="type-mono mt-8 block bg-[#171612] py-3.5 text-center text-[12px] uppercase tracking-[0.16em] text-[#faf8f3] hover:bg-[#33302a]"
            >
              Lay out your own collection
            </Link>
            <p className="type-mono mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-[#9a9184]">
              Free for 100 objects · no card
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
