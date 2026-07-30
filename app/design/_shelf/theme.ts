import type { Look } from './aisle'

/**
 * The page dressing that goes with each Look. Class strings rather than tokens,
 * because the whole point of these variants is to try colours that are not in
 * the design system yet.
 */
export type Theme = {
  /** Applied to the page wrapper and the pinned frame. */
  page: string
  navBg: string
  navLink: string
  navBorder: string
  hamburger: string
  /** The wordmark's full stop — the one piece of the logo that carries colour. */
  logoDot: string
  ctaPrimary: string
  ctaGhost: string
  eyebrow: string
  headline: string
  body: string
  fine: string
  counterLabel: string
  counterValue: string
  scrollCue: string
  sectionBorder: string
  cardBg: string
  cardHover: string
  cardTitle: string
  /** Page background as "r,g,b" so the scrims can be built from it. */
  scrimRgb: string
  fallback: string
}

/* ── Stone: the live site's palette ─────────────────────────────── */

export const STONE_LOOK: Look = {
  lamp: [1.0, 0.895, 0.735],
  page: '#0c0a09',
  floor: [0.105, 0.098, 0.09],
  rack: [0.28, 0.265, 0.245],
  object: [0.64, 0.62, 0.575],
  ambient: [0.017, 0.015, 0.013],
  sheenSky: [0.06, 0.055, 0.048],
  sheenGround: [0.015, 0.013, 0.011],
  floorRough: 0.28,
  rackRough: 0.3,
  objectRough: 0.24,
  key: 5.4,
  spec: 14.0,
  lampSize: 0.06,
  fog: 0.085,
  exposure: 1.22,
  contrast: 1.14,
  vignette: 0.13,
  grain: 0.004,
}

export const STONE_THEME: Theme = {
  page: 'bg-stone-950 text-stone-100',
  navBg: 'bg-stone-950/70',
  navLink: 'text-stone-400 hover:text-white',
  navBorder: 'border-white/5',
  hamburger: 'bg-stone-400',
  logoDot: 'text-amber-500',
  ctaPrimary: 'bg-amber-500 text-stone-950 hover:bg-amber-400',
  ctaGhost: 'border border-white/10 text-stone-400 hover:border-white/20 hover:text-white',
  eyebrow: 'text-amber-500',
  headline: 'text-stone-100',
  body: 'text-stone-400',
  fine: 'text-stone-600',
  counterLabel: 'text-stone-400',
  counterValue: 'text-amber-500',
  scrollCue: 'text-stone-700',
  sectionBorder: 'border-white/5',
  cardBg: 'bg-stone-950',
  cardHover: 'hover:bg-stone-900',
  cardTitle: 'text-white',
  scrimRgb: '12,10,9',
  fallback: 'radial-gradient(46% 40% at 50% 34%, #3f382c 0%, #0c0a09 76%)',
}

/* ── Cold store: blue-black room, fluorescent tubes, bone UI ─────
   Amber is demoted to the full stop in the wordmark and nothing else, so the
   accent reads as a signature rather than as the interface. */

export const COLD_LOOK: Look = {
  lamp: [0.80, 0.90, 1.0],
  page: '#070a0e',
  floor: [0.082, 0.092, 0.108],
  rack: [0.235, 0.265, 0.305],
  object: [0.60, 0.635, 0.665],
  ambient: [0.012, 0.017, 0.026],
  sheenSky: [0.045, 0.062, 0.088],
  sheenGround: [0.010, 0.013, 0.018],
  floorRough: 0.22,
  rackRough: 0.26,
  objectRough: 0.22,
  key: 5.8,
  spec: 17.0,
  // Long tubes rather than bulbs: a wider source, so softer shadow edges.
  lampSize: 0.14,
  fog: 0.075,
  exposure: 1.24,
  contrast: 1.2,
  vignette: 0.15,
  grain: 0.004,
}

export const COLD_THEME: Theme = {
  page: 'bg-[#070a0e] text-slate-100',
  navBg: 'bg-[#070a0e]/70',
  navLink: 'text-slate-400 hover:text-white',
  navBorder: 'border-white/8',
  hamburger: 'bg-slate-400',
  logoDot: 'text-amber-500',
  ctaPrimary: 'bg-slate-100 text-[#070a0e] hover:bg-white',
  ctaGhost: 'border border-white/15 text-slate-400 hover:border-white/30 hover:text-white',
  eyebrow: 'text-slate-400',
  headline: 'text-white',
  body: 'text-slate-400',
  fine: 'text-slate-600',
  counterLabel: 'text-slate-300',
  counterValue: 'text-slate-100',
  scrollCue: 'text-slate-700',
  sectionBorder: 'border-white/8',
  cardBg: 'bg-[#070a0e]',
  cardHover: 'hover:bg-[#0d1219]',
  cardTitle: 'text-white',
  scrimRgb: '7,10,14',
  fallback: 'radial-gradient(46% 40% at 50% 34%, #2b3542 0%, #070a0e 76%)',
}

/* ── Daylight: the same aisle with the shutters open ─────────────
   Inverts the page. Depth stops coming from darkness and starts coming from
   aerial perspective — the aisle fades into the paper colour instead of black,
   and the objects are the dark things on light shelves. */

export const DAY_LOOK: Look = {
  lamp: [1.0, 0.975, 0.935],
  page: '#efece6',
  // Well below the paper they sit against. A light scene needs *darker*
  // albedos than a dark one, not brighter: the page is already near-white, so
  // anything that gets close to it has nowhere left to go.
  floor: [0.185, 0.180, 0.171],
  rack: [0.255, 0.249, 0.236],
  object: [0.075, 0.073, 0.069],
  ambient: [0.115, 0.118, 0.124],
  sheenSky: [0.40, 0.41, 0.425],
  sheenGround: [0.13, 0.127, 0.121],
  floorRough: 0.28,
  rackRough: 0.40,
  objectRough: 0.22,
  key: 5.6,
  spec: 11.0,
  lampSize: 0.20,
  // Distance reads as air rather than as darkness, but not so much of it that
  // the near bays lose their form.
  fog: 0.075,
  exposure: 0.95,
  contrast: 1.16,
  vignette: 0.05,
  grain: 0.003,
}

export const DAY_THEME: Theme = {
  page: 'bg-[#efece6] text-stone-900',
  navBg: 'bg-[#efece6]/75',
  navLink: 'text-stone-500 hover:text-stone-900',
  navBorder: 'border-stone-900/10',
  hamburger: 'bg-stone-500',
  logoDot: 'text-amber-600',
  ctaPrimary: 'bg-stone-900 text-[#efece6] hover:bg-stone-800',
  ctaGhost: 'border border-stone-900/15 text-stone-600 hover:border-stone-900/30 hover:text-stone-900',
  eyebrow: 'text-amber-700',
  headline: 'text-stone-900',
  body: 'text-stone-600',
  fine: 'text-stone-400',
  counterLabel: 'text-stone-500',
  counterValue: 'text-amber-700',
  scrollCue: 'text-stone-400',
  sectionBorder: 'border-stone-900/10',
  cardBg: 'bg-[#efece6]',
  cardHover: 'hover:bg-[#e5e1d9]',
  cardTitle: 'text-stone-900',
  scrimRgb: '239,236,230',
  fallback: 'radial-gradient(46% 40% at 50% 34%, #ffffff 0%, #d8d4cb 76%)',
}
