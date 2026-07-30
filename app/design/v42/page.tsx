import { buildPageMetadata } from '@/lib/seo'
import ShelfPage from '../_shelf/ShelfPage'
import { COLD_LOOK, COLD_THEME } from '../_shelf/theme'

export const metadata = buildPageMetadata({
  title: 'Design v42 — The Long Shelf, cold store',
  description: 'The same aisle under fluorescent tubes, with amber demoted to the wordmark.',
  path: '/design/v42',
  noIndex: true,
})

export default function V42() {
  return <ShelfPage id="v42" look={COLD_LOOK} theme={COLD_THEME} dark />
}
