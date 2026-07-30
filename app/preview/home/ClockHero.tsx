'use client'

import { useState } from 'react'
import ShelfHero from '@/app/design/_shelf/ShelfHero'
import { BANDS, bandData, useTimeBand, type Band } from '@/app/design/_shelf/timeOfDay'

/** stone-950, the colour of the rest of the homepage. */
const PAGE_RGB = '12,10,9'

export default function ClockHero() {
  const auto = useTimeBand()
  const [override, setOverride] = useState<Band | null>(null)
  const band = override ?? auto
  const { look, theme } = bandData(band)

  return (
    <>
      <ShelfHero
        look={look}
        theme={theme}
        // The site header is already on the page, and the sections below are
        // stone-950 whatever the hour — so the hero resolves to that rather
        // than to its own band colour, or midday meets them at a seam.
        ownNav={false}
        handoffRgb={PAGE_RGB}
        copy={{
          eyebrow: 'Collection management software for museums & collectors',
          headline: (
            <>
              Your collection,
              <br />
              <span className={theme.accent}>beautifully</span>
              <br />
              managed.
            </>
          ),
          body: (
            <>
              An easy-to-use Collection Management System
              <br className="hidden sm:inline" /> with a beautiful public website built in.
            </>
          ),
          primary: { label: 'Start for free →', href: '/signup' },
          secondary: { label: 'Browse examples', href: '/discover' },
          fine: 'Free plan available · No credit card required',
        }}
      />

      {/* Preview-only. The shipped page would take the clock and nothing else. */}
      <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 print:hidden">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/75 px-1.5 py-1.5 backdrop-blur-md">
          <span className="hidden px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 sm:inline">
            preview · {override ? 'forced' : 'your clock'}
          </span>
          {BANDS.map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setOverride(b.id === band && override ? null : b.id)}
              title={b.hours}
              className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${
                b.id === band ? 'bg-white text-black' : 'text-white/60 hover:text-white'
              }`}
            >
              {b.label}
            </button>
          ))}
          {override && (
            <button
              type="button"
              onClick={() => setOverride(null)}
              className="rounded-full px-2.5 py-1 font-mono text-[11px] text-white/40 hover:text-white"
            >
              reset
            </button>
          )}
        </div>
      </div>
    </>
  )
}
