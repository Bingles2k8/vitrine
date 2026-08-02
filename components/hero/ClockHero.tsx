'use client'

import ShelfHero from './ShelfHero'
import { bandData, useTimeBand } from './timeOfDay'

/**
 * The homepage hero: an endless aisle of storage racking, lit to match the
 * visitor's own clock. Cold fluorescent and moonlight at night, a low sun
 * raking through the racking at dawn and dusk, a white room under a nearly
 * overhead sun through the middle of the day.
 *
 * The band comes from the device clock and nothing else. `?t=night|golden|midday`
 * forces one, which is there for checking all three without waiting for the
 * hour to come round.
 */
export default function ClockHero() {
  const { look, theme } = bandData(useTimeBand())

  return (
    <ShelfHero
      look={look}
      theme={theme}
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
  )
}
