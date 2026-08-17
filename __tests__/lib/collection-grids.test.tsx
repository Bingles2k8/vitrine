import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CatalogueList, EditorialGrid, MosaicGrid, PlateGrid,
  SalonGrid, SpotlightGrid, StackGrid, UniformGrid,
} from '@/components/collection/grids'
import type { GridObject, GridTheme } from '@/components/collection/types'
import { TEMPLATES, type GridVariant } from '@/lib/templates'
import { collectionLabels } from '@/lib/publicProfile'

const RENDERERS: Record<GridVariant, (p: { items: GridObject[]; slug: string; theme: GridTheme }) => React.ReactElement> = {
  uniform: UniformGrid,
  plate: PlateGrid,
  catalogue: CatalogueList,
  spotlight: SpotlightGrid,
  mosaic: MosaicGrid,
  salon: SalonGrid,
  editorial: EditorialGrid,
  stack: StackGrid,
}

const items: GridObject[] = [
  {
    id: 'a1', title: 'Spade Guinea', artist: 'Lewis Pingo', year: '1787',
    medium: '22-carat gold', culture: 'United Kingdom', status: 'On Display',
    emoji: '🪙', image_url: 'https://example.test/a.jpg',
    condition_grade: 'Excellent', rarity: '445,500 struck',
    description: 'The last of the guinea denominations.',
  },
  {
    // No image, on loan, missing optional fields — the awkward row.
    id: 'b2', title: 'Silver Groat', artist: '', year: '',
    medium: '', culture: '', status: 'On Loan',
    emoji: '', image_url: null,
    condition_grade: null, rarity: null, description: null,
  },
]

function theme(overrides: Partial<GridTheme> = {}): GridTheme {
  return {
    accent: '#8b6914', heading: '#111', body: '#444', muted: '#999',
    border: '#e5e5e5', cardBg: '#fff', imageBg: '#fafafa',
    headingStyle: { fontFamily: 'serif', fontStyle: 'italic' },
    radius: 4, imageAspect: 'aspect-square', columns: 4,
    padding: 'p-4', metadata: 'full', options: {},
    labels: collectionLabels({ plan: 'hobbyist', collection_profiles: ['coins-banknotes'] }),
    ...overrides,
  }
}

describe('collection grid variants', () => {
  it('every template names a variant that has a renderer', () => {
    for (const t of TEMPLATES) {
      expect(RENDERERS[t.grid_variant], `${t.id} → ${t.grid_variant}`).toBeTypeOf('function')
    }
  })

  it('covers every declared variant across the nine templates', () => {
    const used = new Set(TEMPLATES.map(t => t.grid_variant))
    // `uniform` is the fallback and is deliberately unassigned.
    expect(used.size).toBeGreaterThanOrEqual(7)
  })

  for (const [variant, Grid] of Object.entries(RENDERERS)) {
    describe(variant, () => {
      it('links every item to its object page', () => {
        const html = renderToStaticMarkup(<Grid items={items} slug="demo" theme={theme()} />)
        expect(html).toContain('/museum/demo/object/a1')
        expect(html).toContain('/museum/demo/object/b2')
      })

      it('renders an item with no image, maker, year or description', () => {
        const html = renderToStaticMarkup(<Grid items={[items[1]]} slug="demo" theme={theme()} />)
        expect(html).toContain('Silver Groat')
        expect(html).not.toContain('undefined')
        expect(html).not.toContain('null')
      })

      it('speaks the profile vocabulary for status and condition', () => {
        const html = renderToStaticMarkup(<Grid items={items} slug="demo" theme={theme()} />)
        // coins-banknotes relabels Excellent → Uncirculated. Variants that
        // suppress condition markers simply must not print the canonical word.
        expect(html).not.toContain('>Excellent<')
      })

      it('survives an empty collection', () => {
        expect(() => renderToStaticMarkup(<Grid items={[]} slug="demo" theme={theme()} />)).not.toThrow()
      })
    })
  }

  it('plate draws a frame only when the template asks for one', () => {
    const plain = renderToStaticMarkup(<PlateGrid items={items} slug="demo" theme={theme()} />)
    const framed = renderToStaticMarkup(
      <PlateGrid items={items} slug="demo" theme={theme({ options: { frame: true } })} />,
    )
    expect(plain).not.toContain('outline')
    expect(framed).toContain('outline')
  })

  it('catalogue numbers entries only when the template asks for it', () => {
    const plain = renderToStaticMarkup(<CatalogueList items={items} slug="demo" theme={theme()} />)
    const numbered = renderToStaticMarkup(
      <CatalogueList items={items} slug="demo" theme={theme({ options: { numbered: true } })} />,
    )
    expect(plain).not.toContain('001')
    expect(numbered).toContain('001')
  })

  it('catalogue shows description excerpts only in lead mode', () => {
    const plain = renderToStaticMarkup(<CatalogueList items={items} slug="demo" theme={theme()} />)
    const lead = renderToStaticMarkup(
      <CatalogueList items={items} slug="demo" theme={theme({ options: { lead: true } })} />,
    )
    expect(plain).not.toContain('last of the guinea')
    expect(lead).toContain('last of the guinea')
  })

  it('honours card_metadata: none by suppressing captions', () => {
    const html = renderToStaticMarkup(
      <UniformGrid items={items} slug="demo" theme={theme({ metadata: 'none' })} />,
    )
    expect(html).not.toContain('Lewis Pingo')
  })
})
