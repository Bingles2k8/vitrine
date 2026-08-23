import {
  getTemplate,
  templateOptions,
  type ChromeStyle, type GridOptions, type GridVariant,
  type ObjectOptions, type ObjectVariant,
} from './templates'

export const FONT_MAP: Record<string, { google: string; css: string }> = {
  playfair:   { google: 'Playfair+Display:ital,wght@0,400;0,700;1,400',                  css: "'Playfair Display', serif" },
  cormorant:  { google: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',               css: "'Cormorant Garamond', serif" },
  'dm-serif': { google: 'DM+Serif+Display:ital@0;1',                                     css: "'DM Serif Display', serif" },
  libre:      { google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',                css: "'Libre Baskerville', serif" },
  'dm-sans':  { google: 'DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,700;1,9..40,300',  css: "'DM Sans', sans-serif" },
}

/**
 * Body faces, paired to a template rather than chosen by the collector.
 *
 * Every template used to render body copy in the same default system sans, so
 * the heading font was carrying the whole identity on its own. Pairing is what
 * actually distinguishes a catalogue from a magazine.
 */
export const BODY_FONT_MAP: Record<string, { google: string; css: string }> = {
  inter:          { google: 'Inter:wght@300;400;500;600',                                    css: "'Inter', system-ui, sans-serif" },
  'work-sans':    { google: 'Work+Sans:ital,wght@0,300;0,400;0,600;1,400',                   css: "'Work Sans', system-ui, sans-serif" },
  'ibm-plex':     { google: 'IBM+Plex+Sans:ital,wght@0,300;0,400;0,600;1,400',               css: "'IBM Plex Sans', system-ui, sans-serif" },
  karla:          { google: 'Karla:ital,wght@0,300;0,400;0,600;1,400',                       css: "'Karla', system-ui, sans-serif" },
  lora:           { google: 'Lora:ital,wght@0,400;0,600;1,400',                              css: "'Lora', Georgia, serif" },
  'eb-garamond':  { google: 'EB+Garamond:ital,wght@0,400;0,600;1,400',                       css: "'EB Garamond', Georgia, serif" },
  'source-serif': { google: 'Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400', css: "'Source Serif 4', Georgia, serif" },
  // ── paired with the object-led templates ──
  archivo:        { google: 'Archivo:wght@400;500;600;700',                                   css: "'Archivo', system-ui, sans-serif" },
  manrope:        { google: 'Manrope:wght@300;400;500;700',                                   css: "'Manrope', system-ui, sans-serif" },
  jost:           { google: 'Jost:wght@300;400;500',                                          css: "'Jost', system-ui, sans-serif" },
  chivo:          { google: 'Chivo:wght@300;400;700;900',                                     css: "'Chivo', system-ui, sans-serif" },
}

export const PAGE_BG: Record<string, string> = {
  minimal: '#fafaf9', dramatic: '#0c0a09', archival: '#f5f0e8', editorial: '#ffffff', classic: '#111827',
  cover: '#0d0b08', curator: '#faf8f5', magazine: '#ffffff', salon: '#fafaf9',
  // object-led, all dark by design
  flip: '#08070a', foil: '#0a0812', northlight: '#101216', verso: '#0c0b0a', viewfinder: '#0b0c0d',
}

const PAGE_BG_DARK: Record<string, string> = {
  minimal: '#111110', editorial: '#0a0a0a', archival: '#1a1610',
  curator: '#111110', magazine: '#0a0a0a', salon: '#111110',
}

// Per-template content colours for sub-pages
export const CONTENT_COLORS: Record<string, {
  heading: string
  body: string
  muted: string
  border: string
  cardBg: string
  inputBg: string
  /** Ground a work sits on before its image loads, and the mat behind a
   *  `contain`-fitted plate. */
  imageBg: string
}> = {
  minimal:   { heading: '#1c1917', body: '#57534e', muted: '#a8a29e', border: '#e7e5e4', cardBg: '#ffffff',              inputBg: '#ffffff', imageBg: '#fafaf9' },
  editorial: { heading: '#000000', body: '#57534e', muted: '#a8a29e', border: '#000000', cardBg: '#ffffff',              inputBg: '#ffffff', imageBg: '#f5f5f4' },
  archival:  { heading: '#292524', body: '#78716c', muted: '#a8a29e', border: '#d4c5a0', cardBg: 'rgba(255,255,255,0.5)', inputBg: '#fffbf0', imageBg: 'rgba(254,243,199,0.45)' },
  dramatic:  { heading: '#ffffff', body: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', cardBg: 'rgba(255,255,255,0.05)', inputBg: 'rgba(255,255,255,0.08)', imageBg: '#292524' },
  classic:   { heading: '#fef3c7', body: 'rgba(254,243,199,0.6)',  muted: 'rgba(254,243,199,0.35)',  border: 'rgba(255,255,255,0.1)', cardBg: 'rgba(255,255,255,0.05)', inputBg: 'rgba(255,255,255,0.08)', imageBg: '#44403c' },
  cover:     { heading: '#ffffff', body: 'rgba(255,255,255,0.65)', muted: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', cardBg: 'rgba(255,255,255,0.06)', inputBg: 'rgba(255,255,255,0.08)', imageBg: 'rgba(255,255,255,0.06)' },
  curator:   { heading: '#1c1917', body: '#57534e', muted: '#a8a29e', border: '#e7e5e4', cardBg: '#ffffff', inputBg: '#ffffff', imageBg: '#fafaf9' },
  magazine:  { heading: '#000000', body: '#44403c', muted: '#a8a29e', border: '#e7e5e4', cardBg: '#ffffff', inputBg: '#f5f5f4', imageBg: '#f5f5f4' },
  salon:     { heading: '#1c1917', body: '#57534e', muted: '#a8a29e', border: '#e7e5e4', cardBg: '#ffffff', inputBg: '#ffffff', imageBg: '#fafaf9' },
  // ── object-led ──
  // imageBg is the fallback surround for a picture with no sampled matte, so
  // it has to sit quietly against the page rather than read as a card.
  flip:       { heading: '#f2f0ea', body: '#b5b0a8', muted: '#6f6b64', border: 'rgba(242,240,234,0.16)', cardBg: 'rgba(242,240,234,0.05)', inputBg: 'rgba(242,240,234,0.06)', imageBg: '#14120f' },
  foil:       { heading: '#efe9f5', body: '#b8b0c4', muted: '#7a7288', border: 'rgba(239,233,245,0.16)', cardBg: 'rgba(239,233,245,0.05)', inputBg: 'rgba(239,233,245,0.06)', imageBg: '#161020' },
  northlight: { heading: '#eef1f4', body: '#a9b3bf', muted: '#6f7885', border: 'rgba(238,241,244,0.16)', cardBg: '#15181d',               inputBg: 'rgba(238,241,244,0.06)', imageBg: '#171a1f' },
  verso:      { heading: '#ece7dc', body: '#b6ab93', muted: '#7d766a', border: 'rgba(236,231,220,0.16)', cardBg: 'rgba(236,231,220,0.05)', inputBg: 'rgba(236,231,220,0.06)', imageBg: '#14120f' },
  viewfinder: { heading: '#eceff1', body: '#a3aab0', muted: '#6b7176', border: 'rgba(236,239,241,0.16)', cardBg: '#22282c',               inputBg: 'rgba(236,239,241,0.06)', imageBg: '#14181a' },
}

const CONTENT_COLORS_DARK: Record<string, typeof CONTENT_COLORS[string]> = {
  minimal:   { heading: '#f5f4f3', body: '#a8a29e', muted: '#57534e', border: '#292524', cardBg: '#1c1917', inputBg: '#1c1917', imageBg: '#292524' },
  editorial: { heading: '#ffffff', body: '#a8a29e', muted: '#57534e', border: '#3a3a3a', cardBg: '#141414', inputBg: '#141414', imageBg: '#171717' },
  archival:  { heading: '#ede8dc', body: '#a09070', muted: '#6b5e47', border: '#3d3020', cardBg: 'rgba(255,255,255,0.05)', inputBg: '#231c0f', imageBg: '#292524' },
  curator:   { heading: '#f5f4f3', body: '#a8a29e', muted: '#57534e', border: '#292524', cardBg: '#1c1917', inputBg: '#1c1917', imageBg: '#292524' },
  magazine:  { heading: '#ffffff', body: '#a8a29e', muted: '#57534e', border: '#292524', cardBg: '#141414', inputBg: '#1a1a1a', imageBg: '#171717' },
  salon:     { heading: '#f5f4f3', body: '#a8a29e', muted: '#57534e', border: '#292524', cardBg: '#1c1917', inputBg: '#1c1917', imageBg: '#292524' },
}

export const NAV_STYLES: Record<string, { nav: string; text: string; link: string }> = {
  minimal:   { nav: 'bg-white border-b border-stone-100',      text: 'text-stone-900',  link: 'text-stone-400 hover:text-stone-900' },
  dramatic:  { nav: 'bg-stone-950 border-b border-white/5',    text: 'text-white',      link: 'text-white/50 hover:text-white' },
  archival:  { nav: 'bg-amber-50 border-b border-amber-200/50',text: 'text-stone-800',  link: 'text-stone-500 hover:text-stone-800' },
  editorial: { nav: 'bg-white border-b-4 border-black',        text: 'text-black font-bold', link: 'text-stone-400 hover:text-black' },
  classic:   { nav: 'bg-stone-900 border-b border-white/10',   text: 'text-amber-100', link: 'text-amber-100/50 hover:text-amber-100' },
  cover:     { nav: 'absolute top-0 left-0 right-0 z-50 bg-transparent border-0', text: 'text-white', link: 'text-white/60 hover:text-white' },
  curator:   { nav: 'bg-stone-50 border-b border-stone-100',   text: 'text-stone-900',  link: 'text-stone-400 hover:text-stone-900' },
  magazine:  { nav: 'bg-white border-b-2 border-black',        text: 'text-black font-bold', link: 'text-stone-400 hover:text-black' },
  salon:     { nav: 'bg-white border-b border-stone-100',      text: 'text-stone-900',  link: 'text-stone-400 hover:text-stone-900' },
  flip:       { nav: 'bg-stone-950 border-b border-white/10',  text: 'text-stone-100', link: 'text-stone-500 hover:text-stone-100' },
  foil:       { nav: 'bg-[#0a0812] border-b border-white/10',  text: 'text-stone-100', link: 'text-stone-500 hover:text-stone-100' },
  northlight: { nav: 'bg-[#101216] border-b border-white/10',  text: 'text-stone-100', link: 'text-stone-500 hover:text-stone-100' },
  verso:      { nav: 'bg-[#0c0b0a] border-b border-white/10',  text: 'text-stone-100', link: 'text-stone-500 hover:text-stone-100' },
  viewfinder: { nav: 'bg-[#0b0c0d] border-b border-white/10',  text: 'text-stone-100', link: 'text-stone-500 hover:text-stone-100' },
}

const NAV_STYLES_DARK: Record<string, typeof NAV_STYLES[string]> = {
  minimal:   { nav: 'bg-stone-950 border-b border-stone-800',   text: 'text-stone-100',       link: 'text-stone-500 hover:text-stone-100' },
  editorial: { nav: 'bg-stone-950 border-b-4 border-white',     text: 'text-white font-bold', link: 'text-stone-500 hover:text-white' },
  archival:  { nav: 'bg-stone-900 border-b border-stone-700',   text: 'text-stone-200',       link: 'text-stone-500 hover:text-stone-200' },
  curator:   { nav: 'bg-stone-950 border-b border-stone-800',   text: 'text-stone-100',       link: 'text-stone-500 hover:text-stone-100' },
  magazine:  { nav: 'bg-stone-950 border-b-2 border-white',     text: 'text-white font-bold', link: 'text-stone-500 hover:text-white' },
  salon:     { nav: 'bg-stone-950 border-b border-stone-800',   text: 'text-stone-100',       link: 'text-stone-500 hover:text-stone-100' },
}

const DARK_TEMPLATES = new Set(['dramatic', 'classic', 'cover'])

export type MuseumStyleInput = {
  template?: string | null
  /** Per-template levers, keyed by template id. */
  template_options?: Record<string, Record<string, unknown>> | null
  accent_color?: string | null
  primary_color?: string | null
  heading_font?: string | null
  dark_mode?: boolean | null
}

export function getLayoutVariant(museum: MuseumStyleInput): string {
  const tmpl = getTemplate(museum.template || 'minimal')
  return tmpl.layout_variant
}

export function getMuseumStyles(museum: MuseumStyleInput) {
  const tmpl = getTemplate(museum.template || 'minimal')
  const accent = museum.accent_color || tmpl.accent_color
  const primary = museum.primary_color || tmpl.primary_color
  const font = FONT_MAP[museum.heading_font || 'playfair'] || FONT_MAP.playfair
  const headingStyle: React.CSSProperties = tmpl.id === 'editorial'
    ? { fontFamily: font.css, fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em' }
    : { fontFamily: font.css, fontStyle: 'italic' }

  const bodyFont = BODY_FONT_MAP[tmpl.body_font] || BODY_FONT_MAP.inter

  const useDark = museum.dark_mode === true && !DARK_TEMPLATES.has(tmpl.id)

  return {
    tmpl,
    accent,
    primary,
    font,
    bodyFont,
    headingStyle,
    bodyStyle: { fontFamily: bodyFont.css } as React.CSSProperties,
    gridVariant: tmpl.grid_variant as GridVariant,
    gridOptions: (tmpl.grid_options ?? {}) as GridOptions,
    objectVariant: tmpl.object_variant as ObjectVariant,
    objectOptions: (tmpl.object_options ?? {}) as ObjectOptions,
    chrome: tmpl.chrome as ChromeStyle,
    /** Resolved levers for the chosen template, defaults filled in. Only the
     *  object-led variants read these; the other eight ignore them. */
    templateOptions: templateOptions(tmpl, museum.template_options),
    pageBg:   (useDark ? PAGE_BG_DARK[tmpl.id] : null) ?? PAGE_BG[tmpl.id] ?? '#fafaf9',
    content:  (useDark ? CONTENT_COLORS_DARK[tmpl.id] : null) ?? CONTENT_COLORS[tmpl.id] ?? CONTENT_COLORS.minimal,
    navStyle: (useDark ? NAV_STYLES_DARK[tmpl.id] : null) ?? NAV_STYLES[tmpl.id] ?? NAV_STYLES.minimal,
  }
}

/** Stylesheet href loading the template's heading and body faces together. */
export function googleFontsHref(
  font: { google: string },
  bodyFont: { google: string },
): string {
  return `https://fonts.googleapis.com/css2?family=${font.google}&family=${bodyFont.google}&display=swap`
}
