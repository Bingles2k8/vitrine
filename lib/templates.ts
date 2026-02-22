export interface Template {
  id: string
  name: string
  description: string
  primary_color: string
  accent_color: string
  headingFont: string
  bodyFont: string
  previewBg: string
  previewText: string
  previewAccent: string
  card_radius: number
  hero_height: string
  grid_columns: number
  image_ratio: string
  card_padding: string
  card_metadata: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, white, lots of breathing room. Lets the art speak.',
    primary_color: '#111111',
    accent_color: '#111111',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    previewBg: '#ffffff',
    previewText: '#111111',
    previewAccent: '#111111',
    card_radius: 8,
    hero_height: 'compact',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'title+artist',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Dark and atmospheric with warm gold highlights.',
    primary_color: '#0f0e0c',
    accent_color: '#c8961e',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    previewBg: '#0f0e0c',
    previewText: '#f5f2ec',
    previewAccent: '#c8961e',
    card_radius: 4,
    hero_height: 'tall',
    grid_columns: 3,
    image_ratio: 'portrait',
    card_padding: 'normal',
    card_metadata: 'full',
  },
  {
    id: 'archival',
    name: 'Archival',
    description: 'Warm parchment tones. Classic British museum energy.',
    primary_color: '#5c4a2a',
    accent_color: '#8b6914',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    previewBg: '#f5f0e8',
    previewText: '#3a2e1e',
    previewAccent: '#8b6914',
    card_radius: 4,
    hero_height: 'medium',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'generous',
    card_metadata: 'full',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Bold and high-contrast. Magazine-like energy.',
    primary_color: '#cc0000',
    accent_color: '#cc0000',
    headingFont: 'font-serif',
    bodyFont: 'font-sans',
    previewBg: '#ffffff',
    previewText: '#000000',
    previewAccent: '#cc0000',
    card_radius: 0,
    hero_height: 'fullscreen',
    grid_columns: 2,
    image_ratio: 'landscape',
    card_padding: 'tight',
    card_metadata: 'title+artist',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Deep navy and gold. Formal, traditional, distinguished.',
    primary_color: '#1a2744',
    accent_color: '#b8952a',
    headingFont: 'font-serif italic',
    bodyFont: 'font-sans',
    previewBg: '#1a2744',
    previewText: '#f0ead8',
    previewAccent: '#b8952a',
    card_radius: 2,
    hero_height: 'medium',
    grid_columns: 4,
    image_ratio: 'square',
    card_padding: 'normal',
    card_metadata: 'full',
  },
]

export function getTemplate(id: string): Template {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}