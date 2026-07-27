'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../_motion'

export type ZoomObject = { id: string; title: string; image: string | null; emoji: string }

const CAPTIONS = [
  { k: 'Serial no. 700429', t: 'Every object carries a number.' },
  { k: 'The object', t: 'This one is a 1954 Leica M3.' },
  { k: 'The record', t: 'In Vitrine it becomes a record.' },
  { k: 'The collection', t: 'One of three hundred and forty-seven.' },
  { k: 'The collection site', t: 'All of it, public if you want it to be.' },
]

/**
 * A single continuous pull-back: engraving → object → record → collection →
 * public site, driven entirely by scroll position. One shot, no cuts.
 */
export default function Zoom({ objects }: { objects: ZoomObject[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const reduced = useReducedMotion()
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (reduced) return
    const wrap = wrapRef.current
    if (!wrap) return

    let raf = 0
    const N = CAPTIONS.length

    const tick = () => {
      const r = wrap.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0
      const t = p * (N - 1)

      for (let k = 0; k < N; k++) {
        const el = layerRefs.current[k]
        if (!el) continue
        const d = t - k
        const scale = Math.pow(0.3, d)
        const fade = Math.max(0, 1 - Math.max(0, Math.abs(d) - 0.55) / 0.5)
        el.style.transform = `scale(${scale.toFixed(4)})`
        el.style.opacity = fade.toFixed(3)
        el.style.visibility = fade < 0.01 ? 'hidden' : 'visible'
      }
      setStage(Math.round(t))
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const layers = [
    // 0 — the engraving, enormous
    <div key="0" className="flex flex-col items-center">
      <div className="type-mono text-[13vw] leading-none tracking-[-0.04em] text-[#c8c2b4] sm:text-[9vw]">
        700429
      </div>
      <div className="mt-4 h-px w-[42vw] bg-[#c8c2b4]/40" />
      <div className="type-mono mt-4 text-[2.2vw] uppercase tracking-[0.3em] text-[#8e887a] sm:text-[1.1vw]">
        Ernst Leitz Wetzlar
      </div>
    </div>,

    // 1 — the object
    <div key="1" className="flex flex-col items-center">
      <div className="text-[22vw] leading-none sm:text-[13vw]">📷</div>
      <div className="type-book mt-4 text-[3.4vw] text-[#efeade] sm:text-[1.7vw]">Leica M3, chrome</div>
    </div>,

    // 2 — the record
    <div key="2" className="w-[86vw] max-w-[560px] border border-white/25 bg-[#1e1b16] p-5 text-left shadow-2xl">
      <div className="type-mono mb-4 flex justify-between text-[9px] uppercase tracking-[0.18em] text-white/35">
        <span>Object 2026.014.3</span>
        <span className="text-[#d9b25f]">Complete</span>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center border border-white/15 text-2xl">📷</div>
        <div>
          <div className="type-book text-[17px] text-white">Leica M3 rangefinder</div>
          <div className="type-mono text-[10px] text-white/40">1954 · Excellent · £1,200</div>
        </div>
      </div>
      {[
        ['Maker', 'Ernst Leitz GmbH, Wetzlar'],
        ['Acquired', '11 Mar 2019 · lot 212 · £620'],
        ['Valuation', '£1,200 · reviewed Jan 2026'],
        ['Condition', 'Excellent · serviced 2024'],
        ['Location', 'Cabinet 2, shelf B'],
      ].map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-3 border-t border-white/10 py-1.5">
          <div className="type-mono text-[9px] uppercase tracking-[0.1em] text-white/30">{k}</div>
          <div className="col-span-2 text-[11.5px] text-white/80">{v}</div>
        </div>
      ))}
    </div>,

    // 3 — the collection
    <div key="3" className="grid w-[88vw] max-w-[760px] grid-cols-6 gap-1.5">
      {Array.from({ length: 36 }).map((_, n) => {
        const o = objects[n % Math.max(1, objects.length)]
        return (
          <div key={n} className="flex aspect-square items-center justify-center overflow-hidden bg-[#1a1815] text-lg">
            {o?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />
            ) : (
              <span className="opacity-70">{o?.emoji ?? '▫'}</span>
            )}
          </div>
        )
      })}
    </div>,

    // 4 — the public site
    <div key="4" className="w-[92vw] max-w-[900px] border border-white/12 bg-[#0f0e0c] shadow-2xl">
      <div className="type-mono flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[10px] text-white/35">
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="ml-2">vitrine.app/your-collection</span>
      </div>
      <div className="p-5">
        <div className="type-book mb-1 text-[20px] text-white">Your collection</div>
        <div className="type-mono mb-4 text-[10px] uppercase tracking-[0.16em] text-white/35">
          347 objects · est. £12,400 · established 2019
        </div>
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 24 }).map((_, n) => {
            const o = objects[(n + 3) % Math.max(1, objects.length)]
            return (
              <div key={n} className="flex aspect-square items-center justify-center overflow-hidden bg-[#191714] text-sm">
                {o?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />
                ) : (
                  <span className="opacity-60">{o?.emoji ?? '▫'}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>,
  ]

  if (reduced) {
    return (
      <div className="space-y-24 px-6 py-20">
        {layers.map((l, k) => (
          <div key={k} className="flex flex-col items-center gap-6">
            <div className="flex justify-center">{l}</div>
            <p className="type-mono text-center text-[12px] uppercase tracking-[0.18em] text-white/45">
              {CAPTIONS[k].t}
            </p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ height: '520vh' }} className="relative">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Layers */}
        <div className="absolute inset-0 flex items-center justify-center">
          {layers.map((l, k) => (
            <div
              key={k}
              ref={el => {
                layerRefs.current[k] = el
              }}
              className="absolute flex items-center justify-center will-change-transform"
              style={{ opacity: k === 0 ? 1 : 0 }}
            >
              {l}
            </div>
          ))}
        </div>

        {/* Caption rail */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 px-6 pb-10">
          <div className="mx-auto flex max-w-5xl items-end justify-between gap-6">
            <div>
              <p className="type-mono mb-2 text-[10px] uppercase tracking-[0.24em] text-[#d9b25f]">
                {CAPTIONS[Math.min(stage, CAPTIONS.length - 1)].k}
              </p>
              <p className="type-book text-[6vw] leading-tight text-[#efeade] sm:text-[2.2rem]">
                {CAPTIONS[Math.min(stage, CAPTIONS.length - 1)].t}
              </p>
            </div>
            <div className="hidden gap-1.5 sm:flex">
              {CAPTIONS.map((c, k) => (
                <span
                  key={c.k}
                  className={`h-[3px] w-10 transition-colors ${k <= stage ? 'bg-[#d9b25f]' : 'bg-white/15'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {stage === 0 && (
          <div className="type-mono pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-[0.24em] text-white/25">
            <span className="inline-block animate-pulse">scroll to pull back ↓</span>
          </div>
        )}

        {stage >= CAPTIONS.length - 1 && (
          <Link
            href="/signup"
            className="type-mono absolute right-6 top-24 bg-[#d9b25f] px-6 py-3 text-[11px] uppercase tracking-[0.16em] text-[#0b0a09] hover:bg-[#e8c883]"
          >
            Start yours free
          </Link>
        )}
      </div>
    </div>
  )
}
