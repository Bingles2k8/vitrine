import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SetItems from '@/components/collection/SetItems'
import GroupSection from '@/components/collection/GroupSection'
import { SetChips, SetPager } from '@/components/collection/SetContext'
import { objectHref, toGridObject } from '@/components/collection/types'
import { collectionLabels } from '@/lib/publicProfile'
import { groupSetsByPhase, hasDatedSets, setsByObject } from '@/lib/collectionGroups/publicSets'
import { SET_NAV_STYLES } from '@/lib/collectionGroups/types'
import type { GridObject, GridTheme } from '@/components/collection/types'

const museum = { plan: 'hobbyist', collection_profiles: ['coins-banknotes'] }

const theme: GridTheme = {
  accent: '#c8961e',
  heading: '#1c1917',
  body: '#57534e',
  muted: '#a8a29e',
  border: '#e7e5e4',
  cardBg: '#ffffff',
  imageBg: '#fafaf9',
  headingStyle: { fontFamily: 'serif' },
  radius: 8,
  imageAspect: 'aspect-square',
  columns: 4,
  padding: 'p-4',
  metadata: 'full',
  options: {},
  labels: collectionLabels(museum),
}

const items: GridObject[] = Array.from({ length: 8 }, (_, i) => ({
  id: `o${i}`,
  title: `Item ${i}`,
  artist: 'Lewis Pingo',
  year: `${1780 + i}`,
  medium: 'Silver',
  culture: 'United Kingdom',
  status: 'On Display',
  emoji: '🪙',
  image_url: `https://example.test/${i}.jpg`,
}))

describe('objectHref — set context', () => {
  it('omits the parameter when there is no set', () => {
    expect(objectHref('demo', 'abc')).toBe('/museum/demo/object/abc')
    expect(objectHref('demo', 'abc', null)).toBe('/museum/demo/object/abc')
  })

  it('carries the set through', () => {
    expect(objectHref('demo', 'abc', 'roman-silver'))
      .toBe('/museum/demo/object/abc?set=roman-silver')
  })

  it('encodes a slug safely', () => {
    expect(objectHref('demo', 'abc', 'a b&c')).toContain('set=a%20b%26c')
  })
})

describe('toGridObject — invariant Q', () => {
  it('drops everything the public grid does not render', () => {
    const grid = toGridObject({
      id: 'x', title: 'Guinea', artist: 'Pingo', emoji: '🪙',
      estimated_value: 40000, insured_value: 55000,
      acquisition_source: 'A private donor', current_location: 'Safe 2, shelf B',
      provenance: 'Purchased 1974', barcode: 'VTR-0001',
    })

    const serialised = JSON.stringify(grid)
    for (const leak of ['40000', '55000', 'private donor', 'Safe 2', 'Purchased 1974', 'VTR-0001']) {
      expect(serialised, leak).not.toContain(leak)
    }
    expect(grid.title).toBe('Guinea')
  })
})

describe('SetItems — every nav style renders', () => {
  for (const navStyle of SET_NAV_STYLES) {
    it(`renders ${navStyle}`, () => {
      const html = renderToStaticMarkup(
        <SetItems
          items={items}
          slug="demo"
          setSlug="roman-silver"
          theme={theme}
          navStyle={navStyle}
          gridVariant="uniform"
        />,
      )
      expect(html.length).toBeGreaterThan(0)
      expect(html).toContain('Item 0')
    })
  }

  it('carries the set into item links from every style', () => {
    for (const navStyle of SET_NAV_STYLES) {
      const html = renderToStaticMarkup(
        <SetItems
          items={items}
          slug="demo"
          setSlug="roman-silver"
          theme={theme}
          navStyle={navStyle}
          gridVariant="uniform"
        />,
      )
      expect(html, navStyle).toContain('set=roman-silver')
    }
  })

  it('renders nothing for an empty set', () => {
    const html = renderToStaticMarkup(
      <SetItems items={[]} slug="demo" setSlug="s" theme={theme} navStyle="grid" gridVariant="uniform" />,
    )
    expect(html).toBe('')
  })

  it('narrows the grid rather than leaving gaps for a two-item set', () => {
    const html = renderToStaticMarkup(
      <SetItems
        items={items.slice(0, 2)}
        slug="demo"
        setSlug="s"
        theme={theme}
        navStyle="grid"
        gridVariant="uniform"
      />,
    )
    expect(html).toContain('grid-cols-2')
    expect(html).not.toContain('lg:grid-cols-4')
  })

  it('shows a per-item note in the caption', () => {
    const noted = [{ ...items[0], note: 'The only one with the mint mark.' }]
    const html = renderToStaticMarkup(
      <SetItems items={noted} slug="demo" setSlug="s" theme={theme} navStyle="grid" gridVariant="uniform" />,
    )
    expect(html).toContain('The only one with the mint mark.')
  })
})

describe('GroupSection', () => {
  it('shows one row and links to the full set', () => {
    const html = renderToStaticMarkup(
      <GroupSection
        title="Roman Silver"
        subtitle="Denarii"
        dateLabel={null}
        href="/museum/demo/sets/roman-silver"
        members={items}
        total={14}
        slug="demo"
        setSlug="roman-silver"
        theme={theme}
        gridVariant="uniform"
        itemPlural="Coins"
      />,
    )
    expect(html).toContain('Roman Silver')
    expect(html).toContain('View all 14')
    // One row of a four-column grid: items 0–3 present, item 4 held back.
    expect(html).toContain('Item 3')
    expect(html).not.toContain('Item 5')
  })

  it('renders nothing when there is nothing visible in it — invariant U', () => {
    const html = renderToStaticMarkup(
      <GroupSection
        title="Empty" subtitle={null} dateLabel={null}
        href="/x" members={[]} total={0}
        slug="demo" setSlug="s" theme={theme} gridVariant="uniform" itemPlural="Coins"
      />,
    )
    expect(html).toBe('')
  })
})

describe('SetPager', () => {
  const colors = {
    heading: '#000', body: '#333', muted: '#999', border: '#eee',
    cardBg: '#fff', accent: '#c8961e', headingStyle: {}, radius: 8,
  }

  it('shows the position and both neighbours', () => {
    const html = renderToStaticMarkup(
      <SetPager
        slug="demo" setSlug="roman-silver" setTitle="Roman Silver"
        previous={items[0]} next={items[2]} index={1} total={8} colors={colors}
      />,
    )
    expect(html).toContain('2 of 8')
    expect(html).toContain('Item 0')
    expect(html).toContain('Item 2')
  })

  it('holds the layout at the ends rather than shifting', () => {
    const html = renderToStaticMarkup(
      <SetPager
        slug="demo" setSlug="s" setTitle="S"
        previous={null} next={items[1]} index={0} total={8} colors={colors}
      />,
    )
    expect(html).toContain('1 of 8')
    expect(html).not.toContain('Previous')
  })
})

describe('SetChips', () => {
  const colors = {
    heading: '#000', body: '#333', muted: '#999', border: '#eee',
    cardBg: '#fff', accent: '#c8961e', headingStyle: {}, radius: 8,
  }

  it('renders nothing when the object is in no sets', () => {
    const html = renderToStaticMarkup(
      <SetChips slug="demo" sets={[]} label="In these sets" colors={colors} />,
    )
    expect(html).toBe('')
  })

  it('links each set', () => {
    const html = renderToStaticMarkup(
      <SetChips
        slug="demo"
        sets={[{ id: 'g1', slug: 'roman-silver', title: 'Roman Silver' }]}
        label="In these sets"
        colors={colors}
      />,
    )
    expect(html).toContain('/museum/demo/sets/roman-silver')
  })
})

describe('index grouping', () => {
  const set = (id: string, phase: 'undated' | 'current' | 'upcoming' | 'past') => ({
    group: { id, slug: id, title: id } as never,
    members: [items[0]],
    count: 1,
    dateLabel: null,
    phase,
  })

  it('puts undated sets first, then current, upcoming, past', () => {
    const buckets = groupSetsByPhase([
      set('c', 'past'), set('a', 'current'), set('d', 'undated'), set('b', 'upcoming'),
    ])
    expect(buckets.map(b => b.phase)).toEqual(['undated', 'current', 'upcoming', 'past'])
  })

  it('omits phases with nothing in them', () => {
    const buckets = groupSetsByPhase([set('a', 'current')])
    expect(buckets).toHaveLength(1)
  })

  it('only sections the index when something carries dates', () => {
    expect(hasDatedSets([set('a', 'undated')])).toBe(false)
    expect(hasDatedSets([set('a', 'undated'), set('b', 'current')])).toBe(true)
  })
})

describe('setsByObject', () => {
  it('maps each object to every set it appears in', () => {
    const a = { group: { id: 'g1' } as never, members: [items[0], items[1]], count: 2, dateLabel: null, phase: 'undated' as const }
    const b = { group: { id: 'g2' } as never, members: [items[1]], count: 1, dateLabel: null, phase: 'undated' as const }
    const map = setsByObject([a, b])
    expect(map.get('o0')).toHaveLength(1)
    expect(map.get('o1')).toHaveLength(2)
    expect(map.get('o7')).toBeUndefined()
  })
})
