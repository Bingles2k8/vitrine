import { buildPageMetadata } from '@/lib/seo'
import ShelfPage from '../_shelf/ShelfPage'
import { DAY_LOOK, DAY_THEME } from '../_shelf/theme'

export const metadata = buildPageMetadata({
  title: 'Design v43 — The Long Shelf, daylight',
  description: 'The aisle with the shutters open: paper page, ink type, depth from haze.',
  path: '/design/v43',
  noIndex: true,
})

export default function V43() {
  return <ShelfPage id="v43" look={DAY_LOOK} theme={DAY_THEME} dark={false} />
}
