import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import ClockShelf from '../_shelf/ClockShelf'

export const metadata = buildPageMetadata({
  title: 'Design v44 — The Long Shelf, by the clock',
  description: 'The aisle takes its palette from the visitor’s own time of day.',
  path: '/design/v44',
  noIndex: true,
})

export default function V44() {
  return (
    <>
      <VariantBar current="v44" />
      <ClockShelf />
    </>
  )
}
