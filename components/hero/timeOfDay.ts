'use client'

import { useSyncExternalStore } from 'react'
import type { Look } from './aisle'
import {
  COLD_LOOK,
  COLD_THEME,
  GOLDEN_LOOK,
  GOLDEN_THEME,
  MIDDAY_LOOK,
  MIDDAY_THEME,
  type Theme,
} from './theme'

export type Band = 'night' | 'golden' | 'midday'

export const BANDS: { id: Band; label: string; hours: string; look: Look; theme: Theme }[] = [
  { id: 'night', label: 'Night', hours: '21:00 – 05:00', look: COLD_LOOK, theme: COLD_THEME },
  { id: 'golden', label: 'Golden hour', hours: '05:00 – 09:00 · 18:00 – 21:00', look: GOLDEN_LOOK, theme: GOLDEN_THEME },
  { id: 'midday', label: 'Midday', hours: '09:00 – 18:00', look: MIDDAY_LOOK, theme: MIDDAY_THEME },
]

export function bandFor(hour: number): Band {
  if (hour < 5 || hour >= 21) return 'night'
  if (hour < 9 || hour >= 18) return 'golden'
  return 'midday'
}

export function bandData(band: Band) {
  return BANDS.find(b => b.id === band) ?? BANDS[1]
}

function read(): Band {
  try {
    const forced = new URLSearchParams(window.location.search).get('t')
    if (forced === 'night' || forced === 'golden' || forced === 'midday') return forced
  } catch {
    /* no search params — fall through to the clock */
  }
  return bandFor(new Date().getHours())
}

/**
 * Re-checks every five minutes, so a page left open across dusk changes with
 * it rather than staying on whatever it loaded as.
 */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 5 * 60 * 1000)
  return () => window.clearInterval(id)
}

/**
 * The server has no idea what time it is where the visitor is, so it renders
 * golden hour and the client corrects on hydration. useSyncExternalStore rather
 * than an effect: the swap happens before paint, so nobody sees the wrong band
 * flash past. Golden is the safe default — it is the palette the live site
 * already uses, so the pre-hydration frame is never jarring.
 */
export function useTimeBand(): Band {
  return useSyncExternalStore(subscribe, read, () => 'golden')
}
