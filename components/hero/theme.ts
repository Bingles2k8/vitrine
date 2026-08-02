import type { Look } from './aisle'

/**
 * stone-950 — the colour of the page the hero is dropped into. Every band
 * resolves to it at the foot of the frame whatever its own scene colour is,
 * because that is what sits directly underneath. Measured the alternative:
 * golden hour ending on its own aubergine put a visible step against this.
 */
const PAGE_RGB = '12,10,9'

/**
 * The copy dressing that goes with each Look — the hero's own type and
 * buttons, plus the colours its scrims are built from. The page around it is
 * the site's, not the band's: only the pinned frame changes with the clock.
 */
export type Theme = {
  /** Applied to the pinned hero frame, behind the canvas. */
  page: string
  ctaPrimary: string
  ctaGhost: string
  eyebrow: string
  headline: string
  body: string
  fine: string
  /** Accent colour for type — the amber the live site uses on key words. */
  accent: string
  scrollCue: string
  /**
   * Lift for the hero copy: a tight pass for edge definition plus a wide soft
   * one thrown down and to the left, so the darkening sits under the text the
   * way the corner veil does. Dark themes shade; light ones halo, because ink
   * on a mid-grey shelf needs pushing the other way.
   */
  textShadow: string
  /** Page background as "r,g,b" so the scrims can be built from it. */
  scrimRgb: string
  /**
   * What the hero's base scrim resolves to at the very bottom of the frame,
   * as "r,g,b". Defaults to scrimRgb, which is what every band wants except
   * a white one: white copy-shade on a white page is no shade at all, so the
   * white bands land the hero on black and invert their copy to match.
   */
  footRgb?: string
  /**
   * Overrides for the copy where it disagrees with the flat fields above.
   * Midday is the only user: its foot is dark like the rest, but its primary
   * button has to survive on a white frame as well.
   */
  heroCopy?: Partial<
    Pick<Theme, 'eyebrow' | 'headline' | 'body' | 'fine' | 'ctaPrimary' | 'ctaGhost' | 'scrollCue' | 'textShadow'>
  >
  /**
   * Peak opacity of the black veil the copy carries as it climbs. Black on
   * every band, but a dark room can take the full weight where a white one
   * cannot — at 1.0 the midday aisle turns grey, which is the one thing that
   * scene is not supposed to do.
   */
  veil: number
  /**
   * How much of that veil is already there before any scrolling. Zero for the
   * dark bands, where the aisle behind the copy is dark anyway. Midday needs a
   * floor: its aisle is a lit white room, and the frame's own scrim has not
   * begun to darken at the height the eyebrow sits at, so without this the
   * amber lands on near-white at about 1.7:1.
   */
  veilRest?: number
  /**
   * Scales the pool of shade the copy sits in, in both reach and weight.
   * Only midday raises it: its aisle is a lit room, so the copy column needs
   * real ground under it rather than the touch of darkening a dark band wants.
   */
  poolBoost?: number
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
  ambient: [0.014, 0.020, 0.033],
  sheenSky: [0.048, 0.068, 0.098],
  sheenGround: [0.010, 0.013, 0.018],
  floorRough: 0.22,
  rackRough: 0.26,
  objectRough: 0.22,
  key: 5.2,
  spec: 17.0,
  // Long tubes rather than bulbs: a wider source, so softer shadow edges.
  lampSize: 0.14,
  /**
   * The moon. Geometrically it is the sun — near enough the same angular
   * radius seen from here, so the shadow edge is just as hard. What makes it
   * read as moonlight is everything else: it is cold rather than warm, it is
   * high and off to the right rather than low, and it is weak enough that the
   * room's own tubes stay the working light and the moon only rims things.
   *
   * Keeping it faint is the whole trick. Moonlight bright enough to light a
   * room stops looking like moonlight and starts looking like an overcast
   * afternoon someone put a blue filter on.
   */
  sun: {
    dir: [0.62, 0.74, -0.26],
    colour: [0.60, 0.73, 1.0],
    intensity: 0.42,
    spec: 11.0,
    size: 0.007,
  },
  fogStart: 6.5,
  fog: 0.080,
  exposure: 1.24,
  contrast: 1.2,
  vignette: 0.15,
  grain: 0.004,
}

export const COLD_THEME: Theme = {
  page: 'bg-[#070a0e] text-slate-100',
  ctaPrimary: 'bg-slate-100 text-[#070a0e] hover:bg-white',
  ctaGhost: 'border border-white/25 text-slate-300 hover:border-white/45 hover:text-white',
  eyebrow: 'text-slate-400',
  headline: 'text-white',
  body: 'text-slate-400',
  fine: 'text-slate-600',
  accent: 'text-slate-100',
  scrollCue: 'text-slate-700',
  textShadow: '0 1px 2px rgba(4,7,11,0.65), -6px 10px 22px rgba(4,7,11,0.58), -14px 22px 52px rgba(4,7,11,0.45)',
  scrimRgb: '7,10,14',
  footRgb: PAGE_RGB,
  veil: 1.0,
}

/* ── Golden hour: sun through the racking ───────────────────────
   The one thing that separates a sunset from a brown room is that a sunset is
   two colours, not one. Warm light, cool shade. The previous pass had a warm
   lamp on warm albedo under warm ambient with a warm sheen, and with nothing
   anywhere to play the orange against it settled into mud.

   So the paint is close to neutral and every bit of colour arrives as light:
   a low orange sun from the right, and a cold violet skylight filling
   everything the sun cannot reach. */

export const GOLDEN_LOOK: Look = {
  // The overhead battens are still on, but well down — they are the room's
  // working light, not the story. Turned up they wash the sun out and the
  // brown comes straight back.
  lamp: [1.0, 0.815, 0.60],
  page: '#17101a',
  // Near enough neutral. Any warmth mixed into the albedo gets multiplied by
  // the warmth of the sun and lands back at brown.
  floor: [0.104, 0.100, 0.104],
  rack: [0.292, 0.286, 0.288],
  object: [0.655, 0.640, 0.628],
  // Dusk skylight: the cold half of the picture. Well up on the old value,
  // because a shadow that falls to black cannot show you what colour it is.
  ambient: [0.031, 0.039, 0.074],
  sheenSky: [0.062, 0.090, 0.168],
  // Warm ground bounce, so the undersides pick the sun back up.
  sheenGround: [0.086, 0.044, 0.022],
  floorRough: 0.28,
  rackRough: 0.3,
  objectRough: 0.24,
  key: 2.6,
  spec: 12.0,
  lampSize: 0.07,
  /**
   * Low and to the right, so the shadows are thrown long across the aisle to
   * the left. There is no ceiling and there are no side walls in this room —
   * only floor, racking and objects — so the rays get in under the shelves and
   * stripe the floor with the gaps between them, which is the whole effect.
   * Nearly point-sized, because a sun 150 million km away has no penumbra
   * worth rendering at this distance.
   */
  sun: {
    dir: [1.0, 0.26, -0.14],
    colour: [1.0, 0.38, 0.12],
    intensity: 3.4,
    spec: 9.0,
    size: 0.012,
  },
  fogStart: 6.0,
  fog: 0.085,
  exposure: 1.22,
  contrast: 1.16,
  vignette: 0.11,
  grain: 0.004,
}

export const GOLDEN_THEME: Theme = {
  page: 'bg-[#17101a] text-stone-100',
  ctaPrimary: 'bg-amber-500 text-stone-950 hover:bg-amber-400',
  ctaGhost: 'border border-white/25 text-stone-300 hover:border-white/45 hover:text-white',
  eyebrow: 'text-amber-500',
  headline: 'text-stone-100',
  body: 'text-stone-400',
  fine: 'text-stone-600',
  accent: 'text-amber-500',
  scrollCue: 'text-stone-700',
  textShadow: '0 1px 2px rgba(0,0,0,0.6), -6px 10px 22px rgba(0,0,0,0.55), -14px 22px 52px rgba(0,0,0,0.42)',
  scrimRgb: '23,16,26',
  footRgb: PAGE_RGB,
  veil: 1.0,
}

/* ── Midday: the shutters are open, the lights are still on ──────
   Brighter without going to paper. The page lifts to a warm charcoal, the
   lamps go daylight-neutral, and the haze thins out so the aisle runs further
   before it disappears — which is what actually reads as "more light in here",
   more than any change of hue does. */

export const MIDDAY_LOOK: Look = {
  /* A white room lit by its own ceiling, not by a sun through a window. The
     reference for this is a photographic one: soft overhead strips, everything
     in the room painted white, shadows that are light cool grey rather than
     dark, and a floor of polished concrete throwing the whole aisle back at
     itself — with the midday sun coming near enough straight down through it. */
  lamp: [1.0, 1.0, 1.0],
  page: '#ffffff',
  // Polished concrete: the one thing in the room that is not white, and
  // smooth enough to carry the reflections that give the aisle its depth.
  floor: [0.285, 0.290, 0.300],
  rack: [0.80, 0.80, 0.80],
  // White ceramics on white shelves. They separate by form and contact
  // shadow, not by tone — making them dark to "read better" is what turned
  // them into silhouettes.
  object: [0.75, 0.75, 0.752],
  /* An order of magnitude above every other band, and very slightly cool. This
     is the whole look: a white room bounces enormously, so nothing in it ever
     goes dark, and the shadows land as pale blue-grey. */
  ambient: [0.255, 0.265, 0.285],
  sheenSky: [0.42, 0.44, 0.48],
  sheenGround: [0.235, 0.240, 0.248],
  floorRough: 0.18,
  rackRough: 0.42,
  objectRough: 0.30,
  key: 2.4,
  spec: 4.0,
  // A wide source. Fluorescent battens diffuse across the whole ceiling, so
  // the shelf shadows have no edge worth speaking of.
  lampSize: 0.35,
  /**
   * Noon. Nearly overhead, pure white and hard-edged — the angular radius is
   * the real sun's, so the shadow edge is as crisp as this renderer draws.
   * Not perfectly vertical: a sun straight down the y axis hides every shadow
   * underneath the thing casting it, and the shadows are the point. This is
   * tipped just far enough to throw them clear and a little to the left, so
   * the direction agrees with golden hour.
   *
   * The shadows stay light despite being hard, because the ambient in this
   * band is an order of magnitude above the others — which is exactly how a
   * bright white room behaves and why the reference photograph had crisp
   * shadows that were nowhere near black.
   */
  sun: {
    dir: [0.30, 1.0, -0.12],
    colour: [1.0, 1.0, 0.985],
    intensity: 1.5,
    spec: 7.0,
    size: 0.006,
  },
  // Whites out sooner than the dark bands, because the haze is the only thing
  // left to carry distance once nothing goes dark.
  fogStart: 7.0,
  fog: 0.068,
  exposure: 0.95,
  contrast: 1.14,
  vignette: 0.0,
  grain: 0.002,
}

export const MIDDAY_THEME: Theme = {
  // Only the pinned frame is white, and only because the aisle in it is. The
  // site itself is the same black as the live one — the hero resolves to black
  // at its foot, so the two meet without a seam.
  page: 'bg-white text-stone-900',
  // The header sits over the top of the frame, which is the lit end of the
  // white room, so it alone keeps the light treatment.
  ctaPrimary: 'bg-stone-900 text-white hover:bg-stone-800',
  // Unlike the rest of the header's palette this one goes light: the ghost
  // button is only ever the hero's secondary, which sits on the dark foot.
  ctaGhost: 'border border-white/25 text-stone-300 hover:border-white/45 hover:text-white',
  // Everything below the fold now reads on black, same as the other bands.
  eyebrow: 'text-amber-500',
  headline: 'text-stone-100',
  body: 'text-stone-400',
  fine: 'text-stone-600',
  accent: 'text-amber-500',
  scrollCue: 'text-stone-500',
  textShadow: '0 1px 2px rgba(0,0,0,0.6), -6px 10px 22px rgba(0,0,0,0.55), -14px 22px 52px rgba(0,0,0,0.42)',
  scrimRgb: '255,255,255',
  // The aisle stays the white room it was; only the last third of the frame
  // goes dark, which is the one place the copy sits. Ink on a lit white shelf
  // was the weakest type on any of the bands.
  footRgb: PAGE_RGB,
  veil: 0.9,
  // The only band that carries shade behind the copy before you scroll, and
  // the only one whose copy column needs a pool with real weight in it.
  // Measured: amber on the bare aisle here was 1.74:1.
  veilRest: 0.62,
  poolBoost: 1.5,
  // The hero copy is on black like the rest, so it takes the flat fields now.
  // The one thing it cannot share is the primary button: the header's version
  // of that sits on white and has to stay dark.
  heroCopy: {
    ctaPrimary: 'bg-white text-stone-900 hover:bg-stone-200',
    // The one band that does not get the amber eyebrow. It sits highest in
    // the copy, where even a boosted pool leaves the aisle too bright for
    // amber to clear 4.5:1 — and darkening far enough to rescue it would put
    // out the white room this band exists for. White clears it comfortably;
    // the amber stays on "beautifully", which sits lower and darker.
    eyebrow: 'text-stone-100',
  },
}
