/**
 * Live site preview.
 *
 * The site editor needs to show a collector what their unsaved changes look
 * like. The public page reads a saved row, so an iframe pointed at it shows
 * the last save rather than the current form.
 *
 * Rather than reimplementing every template a second time in the editor — which
 * is what the old preview did, and why it could never show a rack or a card
 * flip — the settings travel to the real page in the URL and are merged over
 * the fetched row before anything renders. The preview is then the actual page,
 * server-rendered, correct by construction.
 *
 * Two things keep that safe. Only presentation fields are accepted, so a
 * crafted URL can change how a page looks and nothing else; and the caller
 * decides whether the viewer is allowed a preview at all.
 */

/** The only fields a preview may override. Everything here is presentation. */
export const PREVIEWABLE = [
  'name', 'tagline', 'logo_emoji', 'logo_image_url', 'hero_image_url',
  'hero_image_position', 'header_image_zoom', 'heading_font',
  'primary_color', 'accent_color', 'template', 'template_options',
  'card_radius', 'hero_height', 'grid_columns', 'image_ratio',
  'card_padding', 'card_metadata', 'dark_mode', 'footer_text',
  'collection_label', 'collecting_since', 'collector_bio',
] as const

export type PreviewSettings = Partial<Record<(typeof PREVIEWABLE)[number], unknown>>

/** Keep only previewable keys, dropping anything else silently. */
export function pickPreviewable(input: Record<string, unknown>): PreviewSettings {
  const out: PreviewSettings = {}
  for (const k of PREVIEWABLE) {
    if (input[k] !== undefined) (out as Record<string, unknown>)[k] = input[k]
  }
  return out
}

/** URL-safe base64 of the allowlisted settings. */
export function encodePreview(input: Record<string, unknown>): string {
  const json = JSON.stringify(pickPreviewable(input))
  const b64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json, 'utf8').toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a preview payload. Returns null for anything malformed — a bad
 * parameter must render the saved site, never an error page.
 */
export function decodePreview(raw: string | undefined | null): PreviewSettings | null {
  if (!raw || raw.length > 8000) return null
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const json = typeof atob === 'function'
      ? decodeURIComponent(escape(atob(b64)))
      : Buffer.from(b64, 'base64').toString('utf8')
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return pickPreviewable(parsed as Record<string, unknown>)
  } catch {
    return null
  }
}

/** Merge a decoded payload over a museum row for rendering only. */
export function applyPreview<T extends Record<string, unknown>>(
  museum: T,
  settings: PreviewSettings | null,
): T {
  return settings ? ({ ...museum, ...settings } as T) : museum
}
