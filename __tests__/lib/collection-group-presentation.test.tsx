import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SetCards, { type SetCardData } from '@/components/collection/setCards'
import SetCover from '@/components/collection/SetCover'
import { collectionLabels } from '@/lib/publicProfile'
import {
  SET_TREATMENT, effectiveNavStyle, navStyleMeta, setTreatment,
  SET_NAV_STYLE_META,
} from '@/lib/collectionGroups/presentation'
import {
  formatGroupDates, groupNouns, groupPhase, slugifyGroupTitle, uniqueGroupSlug,
} from '@/lib/collectionGroups'
import { SET_NAV_STYLES } from '@/lib/collectionGroups/types'
import { TEMPLATES, type GridVariant } from '@/lib/templates'
import type { GridObject, GridTheme } from '@/components/collection/types'

const museum = { plan: 'hobbyist', collection_profiles: ['coins-banknotes'] }

const members: GridObject[] = Array.from({ length: 5 }, (_, i) => ({
  id: `o${i}`,
  title: `Item ${i}`,
  artist: 'Maker',
  year: `${1800 + i * 10}`,
  medium: 'Silver',
  culture: 'United Kingdom',
  status: 'On Display',
  emoji: '🪙',
  image_url: i < 4 ? `https://example.test/${i}.jpg` : null,
}))

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
  metadata: 'title+artist',
  options: {},
  labels: collectionLabels(museum),
}

const sets: SetCardData[] = [
  {
    id: 'g1', slug: 'roman-silver', title: 'Roman Silver', subtitle: 'Denarii and antoniniani',
    coverImageUrl: null, coverObjectId: null, dateLabel: null, members, count: 14,
  },
  {
    id: 'g2', slug: 'георгий', title: 'George III', subtitle: null,
    coverImageUrl: null, coverObjectId: null, dateLabel: 'Until 4 June 2026',
    members: members.slice(0, 2), count: 2,
  },
]

describe('set treatments', () => {
  it('maps every grid variant to a treatment', () => {
    const variants: GridVariant[] = [
      'uniform', 'plate', 'catalogue', 'spotlight', 'mosaic', 'salon', 'editorial', 'stack',
    ]
    for (const variant of variants) {
      expect(SET_TREATMENT[variant], variant).toBeTruthy()
    }
  })

  it('covers every shipped template', () => {
    for (const template of TEMPLATES) {
      expect(setTreatment(template.grid_variant), template.id).toBeTruthy()
    }
  })

  it('falls back to plates for an unknown variant', () => {
    expect(setTreatment(undefined)).toBe('plates')
    expect(setTreatment('nonsense' as GridVariant)).toBe('plates')
  })

  it('renders under all four treatments', () => {
    for (const treatment of ['plates', 'ledger', 'tiles', 'feature'] as const) {
      const html = renderToStaticMarkup(
        <SetCards
          treatment={treatment}
          sets={sets}
          slug="demo"
          theme={theme}
          itemPlural="Coins"
        />,
      )
      expect(html, treatment).toContain('Roman Silver')
      expect(html, treatment).toContain('/museum/demo/sets/roman-silver')
    }
  })

  it('renders a single set without crashing on the feature lead/rest split', () => {
    const html = renderToStaticMarkup(
      <SetCards treatment="feature" sets={[sets[0]]} slug="demo" theme={theme} itemPlural="Coins" />,
    )
    expect(html).toContain('Roman Silver')
  })

  it('singularises the count for a one-item set', () => {
    const html = renderToStaticMarkup(
      <SetCards
        treatment="plates"
        sets={[{ ...sets[0], count: 1 }]}
        slug="demo"
        theme={theme}
        itemPlural="Coins"
      />,
    )
    expect(html).toContain('1 coin')
    expect(html).not.toContain('1 coins')
  })
})

describe('cover ladder', () => {
  function render(props: Partial<React.ComponentProps<typeof SetCover>> = {}) {
    return renderToStaticMarkup(
      <SetCover
        members={members}
        aspect="aspect-square"
        radius={8}
        imageBg="#fafaf9"
        border="#e7e5e4"
        accent="#c8961e"
        {...props}
      />,
    )
  }

  it('1 — prefers an uploaded cover', () => {
    const html = render({ coverImageUrl: 'https://example.test/cover.jpg' })
    expect(html).toContain('cover.jpg')
  })

  it('2 — then a nominated member', () => {
    const html = render({ coverObjectId: 'o2' })
    expect(html).toContain('example.test/2.jpg')
  })

  it('3 — then a mosaic of the first four', () => {
    const html = render()
    for (const i of [0, 1, 2, 3]) {
      expect(html).toContain(`example.test/${i}.jpg`)
    }
  })

  it('3 — the mosaic is deterministic, not shuffled', () => {
    expect(render()).toBe(render())
  })

  it('4 — a single image when there are too few for a mosaic', () => {
    const html = render({ members: members.slice(0, 2) })
    expect(html).toContain('example.test/0.jpg')
    expect(html).not.toContain('example.test/1.jpg')
  })

  it('5 — an emoji when nothing has an image', () => {
    const html = render({ members: [{ ...members[4], emoji: '🗿' }] })
    expect(html).toContain('🗿')
  })

  it('falls back to a placeholder for a set with no members at all', () => {
    const html = render({ members: [] })
    expect(html).toContain('🗂️')
  })
})

describe('nav styles', () => {
  it('has metadata for every style, and no extras', () => {
    expect(SET_NAV_STYLE_META.map(m => m.id).sort()).toEqual([...SET_NAV_STYLES].sort())
  })

  it('falls back to grid when there are too few items', () => {
    expect(effectiveNavStyle('coverflow', members.slice(0, 2))).toBe('grid')
    expect(effectiveNavStyle('coverflow', members)).toBe('coverflow')
  })

  it('falls back to grid for a timeline with no dates', () => {
    const undated = members.map(m => ({ ...m, year: null, production_date: null }))
    expect(effectiveNavStyle('timeline', undated)).toBe('grid')
    expect(effectiveNavStyle('timeline', members)).toBe('timeline')
  })

  it('grid is always usable', () => {
    expect(effectiveNavStyle('grid', [])).toBe('grid')
    expect(navStyleMeta('grid').minItems).toBe(1)
  })

  it('returns the grid metadata for an unknown style', () => {
    expect(navStyleMeta('nope' as never).id).toBe('grid')
  })
})

describe('vocabulary', () => {
  it('gives a museum "Exhibitions" and a card collector "Sets"', () => {
    expect(groupNouns({ plan: 'professional', collection_profiles: [] }).plural).toBe('Exhibitions')
    expect(groupNouns({ plan: 'hobbyist', collection_profiles: ['trading-cards'] }).plural).toBe('Sets')
  })

  it('gives a comics collection "Runs"', () => {
    expect(groupNouns({ plan: 'hobbyist', collection_profiles: ['comics'] }).singular).toBe('Run')
  })

  it('falls back safely for a mixed collection', () => {
    const nouns = groupNouns({ plan: 'hobbyist', collection_profiles: ['comics', 'stamps'] })
    expect(nouns.singular).toBeTruthy()
  })
})

describe('slugs', () => {
  it('slugifies a title', () => {
    expect(slugifyGroupTitle('Roman Silver — Denarii!')).toBe('roman-silver-denarii')
  })

  it('strips diacritics rather than dropping the word', () => {
    expect(slugifyGroupTitle('Café Society')).toBe('cafe-society')
  })

  it('never returns an empty slug', () => {
    expect(slugifyGroupTitle('!!!')).toBe('set')
    expect(slugifyGroupTitle('')).toBe('set')
  })

  it('deduplicates within a museum', () => {
    expect(uniqueGroupSlug('roman-silver', ['roman-silver'])).toBe('roman-silver-2')
    expect(uniqueGroupSlug('roman-silver', ['roman-silver', 'roman-silver-2'])).toBe('roman-silver-3')
    expect(uniqueGroupSlug('roman-silver', [])).toBe('roman-silver')
  })
})

describe('dates', () => {
  const now = new Date('2026-04-01T00:00:00Z')

  it('reads a set with no dates as timeless, not past', () => {
    expect(groupPhase({ date_start: null, date_end: null }, now)).toBe('undated')
    expect(formatGroupDates({ date_start: null, date_end: null }, now)).toBeNull()
  })

  it('classifies current, upcoming and past', () => {
    expect(groupPhase({ date_start: '2026-01-01', date_end: '2026-06-01' }, now)).toBe('current')
    expect(groupPhase({ date_start: '2026-09-01', date_end: null }, now)).toBe('upcoming')
    expect(groupPhase({ date_start: null, date_end: '2026-01-01' }, now)).toBe('past')
  })

  it('writes ranges in words rather than raw ISO', () => {
    expect(formatGroupDates({ date_start: '2026-03-12', date_end: '2026-06-04' }, now))
      .toBe('12 March – 4 June 2026')
    expect(formatGroupDates({ date_start: '2026-09-01', date_end: null }, now))
      .toContain('Opens')
    expect(formatGroupDates({ date_start: null, date_end: '2026-06-04' }, now))
      .toContain('Until')
    expect(formatGroupDates({ date_start: '2019-01-01', date_end: null }, now))
      .toContain('Since')
  })

  it('spells out both years when a range crosses one', () => {
    expect(formatGroupDates({ date_start: '2025-11-01', date_end: '2026-02-01' }, now))
      .toBe('1 November 2025 – 1 February 2026')
  })
})
