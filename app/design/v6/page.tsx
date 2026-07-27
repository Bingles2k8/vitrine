import { buildPageMetadata } from '@/lib/seo'
import { VariantBar } from '../_lib'
import Fork from './Fork'

export const metadata = buildPageMetadata({
  title: 'Design v6 — Two Doors',
  description: 'Homepage concept: the visitor self-selects and the page rewrites.',
  path: '/design/v6',
  noIndex: true,
})

export default function V6() {
  return (
    <>
      <VariantBar current="v6" />
      <Fork />
    </>
  )
}
