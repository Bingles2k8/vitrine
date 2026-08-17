import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { GALLERY_PRESET, OBJECT_LAYOUTS, type ObjectLayoutProps, type ObjectTheme } from '@/components/collection/object-layouts'
import { TEMPLATES } from '@/lib/templates'

function theme(overrides: Partial<ObjectTheme> = {}): ObjectTheme {
  return {
    accent: '#8b6914', heading: '#111', body: '#444', muted: '#999',
    border: '#e5e5e5', cardBg: '#fff',
    headingStyle: { fontFamily: 'serif', fontStyle: 'italic' },
    chrome: 'rule', radius: 4, options: {},
    ...overrides,
  }
}

function props(overrides: Partial<ObjectLayoutProps> = {}): ObjectLayoutProps {
  return {
    theme: theme(),
    back: <a href="/museum/demo">Back</a>,
    gallery: <div>GALLERY</div>,
    eyebrow: 'United Kingdom',
    title: 'George III Spade Guinea',
    maker: 'Lewis Pingo',
    rarity: { label: 'Mintage', value: '445,500 struck' },
    certification: <div>CERT</div>,
    actions: <button>Message</button>,
    meta: [
      { label: 'Year Struck', value: '1787' },
      { label: 'Metal / Composition', value: '22-carat gold' },
    ],
    description: 'The last of the guinea denominations.',
    prose: [{ label: 'Provenance', value: 'Purchased at auction, 2010.' }],
    extras: <div>EXTRAS</div>,
    footer: <div>FOOTER</div>,
    ...overrides,
  }
}

/** The barest possible object: a title and nothing else. */
function bare(): ObjectLayoutProps {
  return props({
    eyebrow: null, maker: null, rarity: null, certification: null,
    actions: null, meta: [], description: null, prose: [],
    extras: null, footer: null,
  })
}

describe('object page layouts', () => {
  it('every template names a variant that has a layout', () => {
    for (const t of TEMPLATES) {
      expect(OBJECT_LAYOUTS[t.object_variant], `${t.id} → ${t.object_variant}`).toBeTypeOf('function')
      expect(GALLERY_PRESET[t.object_variant], `${t.id} gallery preset`).toBeDefined()
    }
  })

  it('spreads the nine templates across distinct layouts', () => {
    const used = new Set(TEMPLATES.map(t => t.object_variant))
    expect(used.size).toBeGreaterThanOrEqual(6)
  })

  for (const [variant, Layout] of Object.entries(OBJECT_LAYOUTS)) {
    describe(variant, () => {
      it('renders every block it is given', () => {
        const html = renderToStaticMarkup(<Layout {...props()} />)
        expect(html).toContain('George III Spade Guinea')
        expect(html).toContain('Lewis Pingo')
        expect(html).toContain('GALLERY')
        expect(html).toContain('CERT')
        expect(html).toContain('EXTRAS')
        expect(html).toContain('FOOTER')
        expect(html).toContain('The last of the guinea denominations.')
        expect(html).toContain('Provenance')
        expect(html).toContain('22-carat gold')
      })

      it('labels the rarity value rather than printing it bare', () => {
        const html = renderToStaticMarkup(<Layout {...props()} />)
        expect(html).toContain('Mintage')
        expect(html).toContain('445,500 struck')
      })

      it('renders an object that has nothing but a title', () => {
        const html = renderToStaticMarkup(<Layout {...bare()} />)
        expect(html).toContain('George III Spade Guinea')
        expect(html).not.toContain('undefined')
        expect(html).not.toContain('null')
        expect(html).not.toContain('NaN')
      })

      it('does not emit an empty metadata container', () => {
        const html = renderToStaticMarkup(<Layout {...props({ meta: [] })} />)
        expect(html).not.toContain('<dl')
        expect(html).not.toContain('<table')
      })

      it('breaks long single-word titles rather than overflowing', () => {
        // Hero-scale type on a 375px viewport is where this bites.
        const html = renderToStaticMarkup(
          <Layout {...props({ title: 'Unteilbarkeitserklaerungsurkunde' })} />,
        )
        expect(html).toContain('Unteilbarkeitserklaerungsurkunde')
      })
    })
  }

  it('cinematic overlays the title only when the template asks', () => {
    const below = renderToStaticMarkup(<OBJECT_LAYOUTS.cinematic {...props()} />)
    const over = renderToStaticMarkup(
      <OBJECT_LAYOUTS.cinematic {...props({ theme: theme({ options: { overlayTitle: true } }) })} />,
    )
    expect(below).not.toContain('linear-gradient')
    expect(over).toContain('linear-gradient')
  })

  it('editorial adds a catalogue kicker only when numbered', () => {
    const plain = renderToStaticMarkup(<OBJECT_LAYOUTS.editorial {...props()} />)
    const numbered = renderToStaticMarkup(
      <OBJECT_LAYOUTS.editorial {...props({ theme: theme({ options: { numbered: true } }) })} />,
    )
    expect(plain).not.toContain('Catalogue entry')
    expect(numbered).toContain('Catalogue entry')
  })

  it('essay holds the record back until after the prose', () => {
    const html = renderToStaticMarkup(<OBJECT_LAYOUTS.essay {...props()} />)
    expect(html.indexOf('last of the guinea')).toBeLessThan(html.indexOf('Details'))
  })

  it('gallery presets never mat a full-bleed cinematic image', () => {
    expect(GALLERY_PRESET.cinematic.frame).toBe('none')
    expect(GALLERY_PRESET.cinematic.fit).toBe('cover')
    expect(GALLERY_PRESET.panel.frame).toBe('matted')
  })
})
