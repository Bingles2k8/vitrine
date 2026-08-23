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
  // ── object-led. These do not arrange images in a rhythm; they treat the
  //    object as a thing you handle. Each sizes its frames from the picture's
  //    own aspect and fills the surround from its matte, so none of them reads
  //    the grid controls (columns, image shape, card padding).
  | 'flip'       // cover-flow rack: one plate square on, the rest raked away
  | 'foil'       // a fanned hand of cards, and one held up in its mount
  | 'northlight' // a lit case: shelves, spotlights, one piece brought forward
  | 'verso'      // object on one card face, its catalogue record on the other
  | 'viewfinder' // the collection seen through a finder, one frame at a time

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

/**
 * A control in the site editor's Layout & Style panel.
 *
 * Every template declares which of these it actually reads. The panel renders
 * that list and nothing else, so a collector is never shown a slider that does
 * nothing — the grid controls are meaningless to a rack or a card flip.
 */
export type ControlId =
  | 'headingFont'
  | 'cardRadius'
  | 'heroHeight'
  | 'gridColumns'
  | 'imageRatio'
  | 'cardPadding'
  | 'cardMetadata'
  | 'darkMode'

/** Everything the nine original templates read, which is all of it. */
export const ALL_CONTROLS: ControlId[] = [
  'headingFont', 'cardRadius', 'heroHeight', 'gridColumns',
  'imageRatio', 'cardPadding', 'cardMetadata', 'darkMode',
]

/**
 * A lever belonging to one template, stored in `museums.template_options`
 * under that template's id. Deliberately limited: a template is a decision,
 * and three switches is the point at which it stops being one.
 */
export interface TemplateOption {
  id: string
  label: string
  /** Shown under the control. Say what it changes, not how it works. */
  help?: string
  type: 'boolean' | 'enum'
  default: string | boolean
  /** enum only. */
  choices?: { value: string; label: string }[]
}

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
  /** Lowest plan that may select this template. Undefined means every paid
   *  plan, which is what the original nine have always been. */
  minPlan?: 'community' | 'hobbyist' | 'professional' | 'institution' | 'enterprise'
  /** The template has no light rendering, so the dark-mode toggle is disabled
   *  and explained. Replaces two hardcoded id lists in the site editor. */
  forcesDark?: boolean
  /** Which Layout & Style controls this template reads. */
  controls: ControlId[]
  /** Per-template levers, stored under `museums.template_options[template.id]`. */
  options?: TemplateOption[]
  /** Below this many published items the template does not read as itself —
   *  a rack of three is not a rack. Surfaced in the picker, never enforced. */
  minItems?: number
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
    controls: ALL_CONTROLS,
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
    controls: ALL_CONTROLS,
    forcesDark: true,
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
    controls: ALL_CONTROLS,
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
    controls: ALL_CONTROLS,
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
    controls: ALL_CONTROLS,
    forcesDark: true,
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
    controls: ALL_CONTROLS,
    forcesDark: true,
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
    controls: ALL_CONTROLS,
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
    controls: ALL_CONTROLS,
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
    controls: ALL_CONTROLS,
  },
  // ── Object-led. Premium tier. ────────────────────────────────────────────
  // These treat the object as a thing you handle rather than an image in a
  // rhythm, so they read almost none of the grid controls. Each sizes its
  // frames from the picture's own aspect and fills the surround from its
  // matte, which is what lets inconsistent photography still line up.
  {
    id: 'flip',
    name: 'Flip',
    description: 'Covers face out in a rack, one square on and the rest raked away. Arrow through them, or click one to bring it forward.',
    primary_color: '#08070a',
    accent_color: '#c8a260',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
    body_font: 'archivo',
    previewBg: '#08070a',
    previewText: '#f2f0ea',
    previewAccent: '#c8a260',
    card_radius: 0,
    hero_height: 'compact',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'title+artist',
    layout_variant: 'standard',
    grid_variant: 'flip',
    chrome: 'rule',
    object_variant: 'plate',
    supports_header_image: false,
    controls: ['headingFont', 'cardMetadata'],
    minPlan: 'professional',
    forcesDark: true,
    minItems: 8,
    options: [
      {
        id: 'rake',
        label: 'Rake angle',
        help: 'How sharply the covers either side turn away from the reader.',
        type: 'enum',
        default: '60',
        choices: [
          { value: '46', label: 'Shallow' },
          { value: '60', label: 'Standard' },
          { value: '72', label: 'Steep' },
        ],
      },
    ],
  },
  {
    id: 'foil',
    name: 'Foil',
    description: 'A fanned hand of cards with one held up in its mount. The foil catches the light as you move across it.',
    primary_color: '#0a0812',
    accent_color: '#d84fa8',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
    body_font: 'manrope',
    previewBg: '#0a0812',
    previewText: '#efe9f5',
    previewAccent: '#d84fa8',
    card_radius: 6,
    hero_height: 'compact',
    grid_columns: 4,
    image_ratio: 'portrait',
    card_padding: 'normal',
    card_metadata: 'title+artist',
    layout_variant: 'standard',
    grid_variant: 'foil',
    chrome: 'soft',
    object_variant: 'plate',
    supports_header_image: false,
    controls: ['headingFont', 'cardMetadata'],
    minPlan: 'professional',
    forcesDark: true,
    minItems: 5,
    options: [
      {
        id: 'shine',
        label: 'Foil shine',
        help: 'A moving highlight across each card. Turn it off for a matte collection.',
        type: 'boolean',
        default: true,
      },
      {
        id: 'holder',
        label: 'Show cards',
        help: 'Mounted draws a holder around the featured card, with its grade on the label.',
        type: 'enum',
        default: 'mounted',
        choices: [
          { value: 'mounted', label: 'Mounted' },
          { value: 'loose', label: 'Loose' },
        ],
      },
    ],
  },
  {
    id: 'northlight',
    name: 'Northlight',
    description: 'A lit case. Pieces stand on glass shelves under spotlights; pick one and it steps out onto a plinth.',
    primary_color: '#101216',
    accent_color: '#c8a86a',
    headingFont: 'font-serif',
    bodyFont: 'font-sans',
    body_font: 'jost',
    previewBg: '#101216',
    previewText: '#eef1f4',
    previewAccent: '#c8a86a',
    card_radius: 0,
    hero_height: 'compact',
    grid_columns: 5,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'title',
    layout_variant: 'standard',
    grid_variant: 'northlight',
    chrome: 'rule',
    object_variant: 'panel',
    supports_header_image: false,
    controls: ['headingFont', 'cardMetadata'],
    minPlan: 'professional',
    forcesDark: true,
    minItems: 6,
    options: [
      {
        id: 'lighting',
        label: 'Lighting',
        help: 'After hours drops the room to a cold blue and lifts the spotlights.',
        type: 'enum',
        default: 'gallery',
        choices: [
          { value: 'gallery', label: 'Gallery' },
          { value: 'night', label: 'After hours' },
        ],
      },
      {
        id: 'perShelf',
        label: 'Pieces per shelf',
        type: 'enum',
        default: '5',
        choices: [
          { value: '3', label: 'Three' },
          { value: '4', label: 'Four' },
          { value: '5', label: 'Five' },
        ],
      },
    ],
  },
  {
    id: 'verso',
    name: 'Verso',
    description: 'The object on one card face and its catalogue entry on the other. Turn a single card, or turn the whole tray at once.',
    primary_color: '#0c0b0a',
    accent_color: '#c9a75c',
    headingFont: 'font-serif',
    bodyFont: 'font-sans',
    body_font: 'karla',
    previewBg: '#0c0b0a',
    previewText: '#ece7dc',
    previewAccent: '#c9a75c',
    card_radius: 2,
    hero_height: 'compact',
    grid_columns: 5,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'title+artist',
    layout_variant: 'standard',
    grid_variant: 'verso',
    chrome: 'rule',
    object_variant: 'catalogue',
    supports_header_image: false,
    controls: ['headingFont', 'cardMetadata'],
    minPlan: 'professional',
    forcesDark: true,
    minItems: 4,
    options: [
      {
        id: 'face',
        label: 'Opens showing',
        help: 'Which side of the tray a visitor sees first.',
        type: 'enum',
        default: 'object',
        choices: [
          { value: 'object', label: 'The objects' },
          { value: 'record', label: 'The records' },
        ],
      },
      {
        id: 'paper',
        label: 'Record card',
        type: 'enum',
        default: 'bone',
        choices: [
          { value: 'bone', label: 'Bone' },
          { value: 'slate', label: 'Slate' },
        ],
      },
    ],
  },
  {
    id: 'viewfinder',
    name: 'Viewfinder',
    description: 'The collection seen through a finder, one frame at a time. Wind the lever for the next object.',
    primary_color: '#0b0c0d',
    accent_color: '#ff6b3d',
    headingFont: 'font-sans',
    bodyFont: 'font-sans',
    body_font: 'chivo',
    previewBg: '#0b0c0d',
    previewText: '#eceff1',
    previewAccent: '#ff6b3d',
    card_radius: 0,
    hero_height: 'compact',
    grid_columns: 4,
    image_ratio: 'landscape',
    card_padding: 'tight',
    card_metadata: 'title+artist',
    layout_variant: 'standard',
    grid_variant: 'viewfinder',
    chrome: 'hard',
    object_variant: 'plate',
    supports_header_image: false,
    controls: ['headingFont', 'cardMetadata'],
    minPlan: 'professional',
    forcesDark: true,
    minItems: 4,
    options: [
      {
        id: 'meter',
        label: 'Condition meter',
        help: 'A needle reading recorded condition. Hide it if your collection is not graded.',
        type: 'boolean',
        default: true,
      },
    ],
  },
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}
/** Templates a plan may select. */
export function templatesForPlan(plan: string): Template[] {
  const order = ['community', 'hobbyist', 'professional', 'institution', 'enterprise']
  const at = order.indexOf(plan)
  return TEMPLATES.filter(t => !t.minPlan || (at >= 0 && at >= order.indexOf(t.minPlan)))
}

/** Whether one template is locked to this plan. */
export function isTemplateLocked(t: Template, plan: string): boolean {
  if (!t.minPlan) return false
  const order = ['community', 'hobbyist', 'professional', 'institution', 'enterprise']
  const at = order.indexOf(plan)
  return at < 0 || at < order.indexOf(t.minPlan)
}

/** Resolved options for a template, defaults filled in. */
export function templateOptions(
  t: Template,
  stored: Record<string, Record<string, unknown>> | null | undefined,
): Record<string, string | boolean> {
  const saved = (stored ?? {})[t.id] ?? {}
  const out: Record<string, string | boolean> = {}
  for (const o of t.options ?? []) {
    const v = saved[o.id]
    out[o.id] = (typeof v === 'string' || typeof v === 'boolean') ? v : o.default
  }
  return out
}
