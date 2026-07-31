'use client'

import { useState } from 'react'
import ShelfHero from '@/app/design/_shelf/ShelfHero'
import { BANDS, bandData, useTimeBand, type Band } from '@/app/design/_shelf/timeOfDay'

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
        // The site header is already on the page. The hero resolves to its own
        // band colour: night and golden hour are within a couple of levels of
        // the stone-950 sections below, so that join stays invisible, and
        // midday must not fade to black at the bottom of a sunlit white room —
        // it meets the dark sections as a deliberate edge instead.
        ownNav={false}
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
