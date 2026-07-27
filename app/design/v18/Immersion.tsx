'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '../_motion'

export type Slide = { id: string; title: string; museum: string; slug: string; image: string | null; emoji: string }

/**
 * One enormous image at a time, drifting slowly, cross-fading to the next.
 * The type stays small and out of the way — the object is the argument.
 */
export default function Immersion({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || slides.length < 2) return
    const t = setInterval(() => setI(n => (n + 1) % slides.length), 6400)
    return () => clearInterval(t)
  }, [slides.length, reduced])

  const current = slides[i] ?? slides[0]

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0c0c0c]">
      {slides.map((s, n) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-[1600ms] ease-out"
          style={{ opacity: n === i ? 1 : 0 }}
          aria-hidden={n !== i}
        >
          {s.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.image}
              alt={s.title}
              className="h-full w-full object-cover"
              style={
                reduced
                  ? undefined
                  : { animation: n === i ? 'v18-drift 14s ease-out forwards' : undefined }
              }
            />
          ) : (
            // No photograph available — a generated plate rather than a grey box.
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  'radial-gradient(70% 60% at 42% 38%, #3a332a 0%, #1a1713 55%, #0c0b0a 100%)',
              }}
            >
              <span
                className="text-[34vw] opacity-25 grayscale"
                style={reduced ? undefined : { animation: 'v18-drift 14s ease-out forwards' }}
              >
                {s.emoji}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Legibility scrims */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Caption for the object currently filling the screen */}
      <div className="absolute bottom-6 right-6 z-20 hidden max-w-[260px] text-right sm:block">
        <p className="type-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Now showing</p>
        <p className="type-book mt-1 text-[15px] leading-snug text-white/90">{current?.title}</p>
        {current?.slug ? (
          <Link
            href={`/museum/${current.slug}`}
            className="type-mono mt-1 inline-block text-[10px] uppercase tracking-[0.14em] text-white/50 underline underline-offset-4 hover:text-white"
          >
            {current.museum} →
          </Link>
        ) : (
          <p className="type-mono mt-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
            {current?.museum}
          </p>
        )}
      </div>

      {/* Slide index */}
      <div className="absolute bottom-6 left-6 z-20 flex gap-1.5">
        {slides.map((s, n) => (
          <button
            key={s.id}
            onClick={() => setI(n)}
            aria-label={`Show ${s.title}`}
            className={`h-[3px] w-10 transition-colors ${n === i ? 'bg-white' : 'bg-white/25 hover:bg-white/50'}`}
          />
        ))}
      </div>

      <style>{`
        @keyframes v18-drift {
          from { transform: scale(1.02) translate3d(0,0,0); }
          to   { transform: scale(1.14) translate3d(-1.5%, -1.5%, 0); }
        }
      `}</style>
    </div>
  )
}
