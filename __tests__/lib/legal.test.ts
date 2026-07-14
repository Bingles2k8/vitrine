import { describe, it, expect } from 'vitest'
import { privacyDoc } from '@/lib/legal/privacy'
import { termsDoc } from '@/lib/legal/terms'
import type { Inline, LegalDoc } from '@/lib/legal/types'

// The bare /legal/privacy and /legal/terms pages are what the Vitrine Capture
// iOS app opens. App Store Guideline 3.1.3(f) only exempts the free app from IAP
// while it presents no call to action to purchase outside the app, so those pages
// must offer no route back into the site. The app was rejected three times over
// exactly this.
//
// Renderers drop `siteHref` links to plain text on the bare pages, but a plain
// `href` renders as an anchor on both. So the invariant to protect is: no `href`
// in the shared content may point at this site.

function inlinesOf(doc: LegalDoc): Inline[] {
  return doc.sections.flatMap(section =>
    section.blocks.flatMap(block => {
      switch (block.kind) {
        case 'p':
        case 'callout':
          return block.content
        case 'ul':
          return block.items.flat()
      }
    })
  )
}

const docs: [string, LegalDoc][] = [
  ['privacy', privacyDoc],
  ['terms', termsDoc],
]

describe.each(docs)('%s legal document', (_name, doc) => {
  it('has sections', () => {
    expect(doc.sections.length).toBeGreaterThan(0)
  })

  it('only ever hard-links off-site, so the bare /legal page stays link-free', () => {
    const hrefs = inlinesOf(doc)
      .filter((node): node is Extract<Inline, { href: string }> => 'href' in node)
      .map(node => node.href)

    for (const href of hrefs) {
      expect(
        href.startsWith('mailto:') || href.startsWith('https://'),
        `"${href}" renders as a link on /legal/* — on-site destinations must use siteHref so they degrade to plain text`
      ).toBe(true)
    }
  })

  it('routes every on-site destination through siteHref', () => {
    const siteHrefs = inlinesOf(doc)
      .filter((node): node is Extract<Inline, { siteHref: string }> => 'siteHref' in node)
      .map(node => node.siteHref)

    for (const href of siteHrefs) {
      expect(href.startsWith('/')).toBe(true)
    }
  })
})

describe('terms', () => {
  it('keeps the pricing-page wording but models it as a degradable site link', () => {
    const pricing = inlinesOf(termsDoc).find(node => node.text === 'pricing page')
    expect(pricing).toBeDefined()
    expect(pricing).toHaveProperty('siteHref', '/#pricing')
  })
})
