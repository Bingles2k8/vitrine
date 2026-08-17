/**
 * How the collection itself is laid out, below the hero.
 *
 * This is the setting that actually makes two templates look like different
 * sites. Before it existed every template rendered the same uniform card grid,
 * so the template only ever changed the masthead and the palette.
 */
export type GridVariant =
  | 'uniform'    // card grid — the original treatment, and the fallback
  | 'plate'      // gallery plate: no card chrome, matted image, caption beneath
  | 'catalogue'  // catalogue rows separated by hairline rules
  | 'spotlight'  // full-bleed tiles, captions revealed on hover
  | 'mosaic'     // asymmetric tiles of mixed span
  | 'salon'      // salon hang: masonry columns at natural aspect ratio
  | 'editorial'  // alternating large figure / text rows
  | 'stack'      // one wide band per item, revealed on scroll

/**
 * How a single item's page is arranged.
 *
 * The collection page gained a layout per template before this; the object
 * page stayed a single two-column arrangement for all nine, so following a
 * work through from a salon hang or a magazine spread landed on the same
 * page every time.
 */
export type ObjectVariant =
  | 'standard'   // two columns, sticky gallery, boxed metadata — the fallback
  | 'plate'      // white-cube: large plate, then a wall label beneath it
  | 'catalogue'  // formal record: ruled masthead and a definition list
  | 'cinematic'  // wide image up top, then prose against a metadata sidebar
  | 'editorial'  // magazine spread: heavy rules, oversized title, columns
  | 'essay'      // narrow reading measure, image as a figure, details last
  | 'panel'      // symmetrical, framed and matted, bordered metadata panel

export interface ObjectOptions {
  /** `cinematic`: title sits over the image rather than beneath it. */
  overlayTitle?: boolean
  /** `editorial`: kicker carries a catalogue number. */
  numbered?: boolean
}

/** Styling of the search box and filter chips above the collection. */
export type ChromeStyle =
  | 'soft'  // rounded input, pill chips
  | 'rule'  // borderless input over a hairline, filters as text links
  | 'hard'  // square borders, bold uppercase chips

export interface GridOptions {
  /** `plate`: draws a matted frame around each work. */
  frame?: boolean
  /** `catalogue`: prefixes each row with its catalogue number. */
  numbered?: boolean
  /** `catalogue`: includes an excerpt of the description. */
  lead?: boolean
}

export interface Template {
  id: string
  name: string
  description: string
  primary_color: string
  accent_color: string
  headingFont: string
  bodyFont: string
  /** Key into BODY_FONT_MAP — the body face paired with the heading face. */
  body_font: string
  previewBg: string
  previewText: string
  previewAccent: string
  card_radius: number
  hero_height: string
  grid_columns: number
  image_ratio: string
  card_padding: string
  card_metadata: string
  layout_variant: 'standard' | 'cover' | 'text-forward' | 'magazine' | 'sidebar' | 'minimal' | 'dramatic' | 'archival'
  grid_variant: GridVariant
  grid_options?: GridOptions
  object_variant: ObjectVariant
  object_options?: ObjectOptions
  chrome: ChromeStyle
  supports_header_image: boolean
}

export const TEMPLATES: Template[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Works matted on white with generous space and a quiet label beneath. A white-cube hang.',
    primary_color: '#111111',
    accent_color: '#111111',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'inter',
    previewBg: '#ffffff',
    previewText: '#111111',
    previewAccent: '#111111',
    card_radius: 8,
    hero_height: 'compact',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'title+artist',
    layout_variant: 'minimal',
    grid_variant: 'plate',
    chrome: 'rule',
    object_variant: 'plate',
    supports_header_image: false,
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Dark and atmospheric. Full-bleed tiles butt together; titles appear as you move across them.',
    primary_color: '#0f0e0c',
    accent_color: '#c8961e',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'inter',
    previewBg: '#0f0e0c',
    previewText: '#f5f2ec',
    previewAccent: '#c8961e',
    card_radius: 4,
    hero_height: 'tall',
    grid_columns: 3,
    image_ratio: 'portrait',
    card_padding: 'normal',
    card_metadata: 'full',
    layout_variant: 'dramatic',
    grid_variant: 'spotlight',
    chrome: 'rule',
    object_variant: 'cinematic',
    supports_header_image: true,
  },
  {
    id: 'archival',
    name: 'Archival',
    description: 'A numbered catalogue. Every entry is a ruled row with its thumbnail, details and date.',
    primary_color: '#5c4a2a',
    accent_color: '#8b6914',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'lora',
    previewBg: '#f5f0e8',
    previewText: '#3a2e1e',
    previewAccent: '#8b6914',
    card_radius: 4,
    hero_height: 'medium',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'generous',
    card_metadata: 'full',
    layout_variant: 'archival',
    grid_variant: 'catalogue',
    chrome: 'rule',
    object_variant: 'catalogue',
    grid_options: { numbered: true },
    supports_header_image: false,
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Bold and high-contrast. Each work gets its own spread, alternating left and right.',
    primary_color: '#cc0000',
    accent_color: '#cc0000',
    headingFont: 'font-serif',
    bodyFont: 'font-sans',
    body_font: 'work-sans',
    previewBg: '#ffffff',
    previewText: '#000000',
    previewAccent: '#cc0000',
    card_radius: 0,
    hero_height: 'fullscreen',
    grid_columns: 2,
    image_ratio: 'landscape',
    card_padding: 'tight',
    card_metadata: 'title+artist',
    layout_variant: 'standard',
    grid_variant: 'editorial',
    chrome: 'hard',
    object_variant: 'editorial',
    supports_header_image: true,
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Deep navy and gold. Works are framed and matted like plates in a bound volume.',
    primary_color: '#1a2744',
    accent_color: '#b8952a',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'eb-garamond',
    previewBg: '#1a2744',
    previewText: '#f0ead8',
    previewAccent: '#b8952a',
    card_radius: 2,
    hero_height: 'medium',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'full',
    layout_variant: 'standard',
    grid_variant: 'plate',
    chrome: 'soft',
    object_variant: 'panel',
    grid_options: { frame: true },
    supports_header_image: true,
  },
  {
    id: 'cover',
    name: 'Cover',
    description: 'Full-viewport hero, then the collection reveals one wide cinematic band at a time.',
    primary_color: '#1a1a1a',
    accent_color: '#e8d5b0',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'inter',
    previewBg: '#2a2318',
    previewText: '#f5f0e8',
    previewAccent: '#e8d5b0',
    card_radius: 6,
    hero_height: 'fullscreen',
    grid_columns: 3,
    image_ratio: 'portrait',
    card_padding: 'normal',
    card_metadata: 'title+artist',
    layout_variant: 'cover',
    grid_variant: 'stack',
    chrome: 'rule',
    object_variant: 'cinematic',
    object_options: { overlayTitle: true },
    supports_header_image: true,
  },
  {
    id: 'curator',
    name: 'Curator',
    description: 'Text-first. A large introduction, then a reading catalogue with an excerpt for each work.',
    primary_color: '#2d2d2d',
    accent_color: '#7a6a52',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'source-serif',
    previewBg: '#faf8f5',
    previewText: '#2d2d2d',
    previewAccent: '#7a6a52',
    card_radius: 0,
    hero_height: 'none',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'tight',
    card_metadata: 'title+artist',
    layout_variant: 'text-forward',
    grid_variant: 'catalogue',
    chrome: 'rule',
    object_variant: 'essay',
    grid_options: { lead: true },
    supports_header_image: false,
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Asymmetric mosaic of mixed tile sizes. High impact, never a regular pulse.',
    primary_color: '#0d0d0d',
    accent_color: '#e63323',
    headingFont: 'font-serif',
    bodyFont: 'font-sans',
    body_font: 'ibm-plex',
    previewBg: '#ffffff',
    previewText: '#0d0d0d',
    previewAccent: '#e63323',
    card_radius: 0,
    hero_height: 'none',
    grid_columns: 3,
    image_ratio: 'landscape',
    card_padding: 'tight',
    card_metadata: 'title+artist',
    layout_variant: 'magazine',
    grid_variant: 'mosaic',
    chrome: 'hard',
    object_variant: 'editorial',
    object_options: { numbered: true },
    supports_header_image: false,
  },
  {
    id: 'salon',
    name: 'Salon',
    description: 'Fixed sidebar identity, with the collection hung salon-style at natural heights.',
    primary_color: '#1c1917',
    accent_color: '#a3886a',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    body_font: 'karla',
    previewBg: '#fafaf9',
    previewText: '#1c1917',
    previewAccent: '#a3886a',
    card_radius: 4,
    hero_height: 'none',
    grid_columns: 3,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'title+artist',
    layout_variant: 'sidebar',
    grid_variant: 'salon',
    chrome: 'soft',
    object_variant: 'standard',
    supports_header_image: false,
  },
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}