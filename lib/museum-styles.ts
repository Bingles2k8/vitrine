import { getTemplate } from './templates'

export const FONT_MAP: Record<string, { google: string; css: string }> = {
  playfair:   { google: 'Playfair+Display:ital,wght@0,400;0,700;1,400',                  css: "'Playfair Display', serif" },
  cormorant:  { google: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',               css: "'Cormorant Garamond', serif" },
  'dm-serif': { google: 'DM+Serif+Display:ital@0;1',                                     css: "'DM Serif Display', serif" },
  libre:      { google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',                css: "'Libre Baskerville', serif" },
  'dm-sans':  { google: 'DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,700;1,9..40,300',  css: "'DM Sans', sans-serif" },
}

export const PAGE_BG: Record<string, string> = {
  minimal: '#fafaf9', dramatic: '#0c0a09', archival: '#f5f0e8', editorial: '#ffffff', classic: '#111827',
}

// Per-template content colours for sub-pages
export const CONTENT_COLORS: Record<string, {
  heading: string
  body: string
  muted: string
  border: string
  cardBg: string
  inputBg: string
}> = {
  minimal:   { heading: '#1c1917', body: '#57534e', muted: '#a8a29e', border: '#e7e5e4', cardBg: '#ffffff',              inputBg: '#ffffff' },
  editorial: { heading: '#000000', body: '#57534e', muted: '#a8a29e', border: '#000000', cardBg: '#ffffff',              inputBg: '#ffffff' },
  archival:  { heading: '#292524', body: '#78716c', muted: '#a8a29e', border: '#d4c5a0', cardBg: 'rgba(255,255,255,0.5)', inputBg: '#fffbf0' },
  dramatic:  { heading: '#ffffff', body: 'rgba(255,255,255,0.6)', muted: 'rgba(255,255,255,0.35)', border: 'rgba(255,255,255,0.1)', cardBg: 'rgba(255,255,255,0.05)', inputBg: 'rgba(255,255,255,0.08)' },
  classic:   { heading: '#fef3c7', body: 'rgba(254,243,199,0.6)',  muted: 'rgba(254,243,199,0.35)',  border: 'rgba(255,255,255,0.1)', cardBg: 'rgba(255,255,255,0.05)', inputBg: 'rgba(255,255,255,0.08)' },
}

export const NAV_STYLES: Record<string, { nav: string; text: string; link: string }> = {
  minimal:   { nav: 'bg-white border-b border-stone-100',      text: 'text-stone-900',  link: 'text-stone-400 hover:text-stone-900' },
  dramatic:  { nav: 'bg-stone-950 border-b border-white/5',    text: 'text-white',      link: 'text-white/50 hover:text-white' },
  archival:  { nav: 'bg-amber-50 border-b border-amber-200/50',text: 'text-stone-800',  link: 'text-stone-500 hover:text-stone-800' },
  editorial: { nav: 'bg-white border-b-4 border-black',        text: 'text-black font-bold', link: 'text-stone-400 hover:text-black' },
  classic:   { nav: 'bg-stone-900 border-b border-white/10',   text: 'text-amber-100', link: 'text-amber-100/50 hover:text-amber-100' },
}

export function getMuseumStyles(museum: any) {
  const tmpl = getTemplate(museum.template || 'minimal')
  const accent = museum.accent_color || tmpl.accent_color
  const primary = museum.primary_color || tmpl.primary_color
  const font = FONT_MAP[museum.heading_font || 'playfair'] || FONT_MAP.playfair
  const headingStyle: React.CSSProperties = tmpl.id === 'editorial'
    ? { fontFamily: font.css, fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em' }
    : { fontFamily: font.css, fontStyle: 'italic' }

  return {
    tmpl,
    accent,
    primary,
    font,
    headingStyle,
    pageBg: PAGE_BG[tmpl.id] || '#fafaf9',
    content: CONTENT_COLORS[tmpl.id] || CONTENT_COLORS.minimal,
    navStyle: NAV_STYLES[tmpl.id] || NAV_STYLES.minimal,
  }
}
