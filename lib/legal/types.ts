// Shared content model for the legal documents. The same source renders twice:
// the marketing pages (/privacy, /terms) with site chrome, and the bare pages
// (/legal/privacy, /legal/terms) that the iOS app opens in an in-app browser.
//
// App Store Guideline 3.1.3(f) allows the free Capture app to omit IAP only if
// there is no call to action for purchase outside the app. The bare pages must
// therefore contain no route back into the site, so `siteHref` links degrade to
// plain text there — see LINK_MODES in components/legal/LegalDocument.tsx.

/** A run of text inside a paragraph or list item. */
export type Inline =
  /** Plain text. */
  | { text: string }
  /** Bolded text. */
  | { text: string; strong: true }
  /** Off-site link (mailto:, ico.org.uk). Rendered as an anchor everywhere. */
  | { text: string; href: string }
  /** On-site link. An anchor with chrome; plain text when bare. */
  | { text: string; siteHref: string }

export type Block =
  /** `tight` omits leading-relaxed, matching the original contact paragraphs. */
  | { kind: 'p'; content: Inline[]; tight?: true }
  | { kind: 'ul'; items: Inline[][] }
  /** Shaded box with a mono label, used for the GDPR lawful-basis callouts. */
  | { kind: 'callout'; label: string; content: Inline[] }

export type Section = {
  heading: string
  blocks: Block[]
}

export type LegalDoc = {
  title: string
  updated: string
  sections: Section[]
}

/** Convenience for the common case of a list of plain-text items. */
export function textItems(items: string[]): Inline[][] {
  return items.map(text => [{ text }])
}
