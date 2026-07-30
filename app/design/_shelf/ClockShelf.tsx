'use client'

import { useState } from 'react'
import ShelfBody from './ShelfBody'
import ShelfHero from './ShelfHero'
import { BANDS, bandData, useTimeBand, type Band } from './timeOfDay'

/**
 * The shelf, dressed by the visitor's own clock: cold fluorescent at night,
 * tungsten at dawn and dusk, daylight through the middle of the day.
 *
 * `override` exists for review only — the shipped page would take the clock and
 * nothing else.
 */
export default function ClockShelf() {
  const auto = useTimeBand()
  const [override, setOverride] = useState<Band | null>(null)
  const band = override ?? auto
  const { look, theme } = bandData(band)

  return (
    <div className={`min-h-screen transition-colors duration-700 ${theme.page}`}>
      <ShelfHero look={look} theme={theme} />
      <ShelfBody theme={theme} dark />

      {/* Review control. Not part of the design — it is here so all three bands
          can be seen without changing the system clock. */}
      <div className="fixed bottom-4 left-1/2 z-[70] -translate-x-1/2 print:hidden">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-1.5 py-1.5 backdrop-blur-md">
          <span className="hidden px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 sm:inline">
            {override ? 'forced' : 'by your clock'}
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
    </div>
  )
}
