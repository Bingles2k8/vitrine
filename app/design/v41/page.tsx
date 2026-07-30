import { buildPageMetadata } from '@/lib/seo'
import ShelfPage from '../_shelf/ShelfPage'
import { STONE_LOOK, STONE_THEME } from '../_shelf/theme'

export const metadata = buildPageMetadata({
  title: 'Design v41 — The Long Shelf, stone',
  description: 'The endless aisle in the live Vitrine palette: stone, tungsten, amber.',
  path: '/design/v41',
  noIndex: true,
})

export default function V41() {
  return <ShelfPage id="v41" look={STONE_LOOK} theme={STONE_THEME} dark />
}
