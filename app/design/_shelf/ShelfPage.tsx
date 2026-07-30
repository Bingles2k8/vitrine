import { VariantBar } from '../_lib'
import ShelfBody from './ShelfBody'
import ShelfHero from './ShelfHero'
import type { Look } from './aisle'
import type { Theme } from './theme'

/** A shelf variant pinned to one palette. */
export default function ShelfPage({
  id,
  look,
  theme,
  dark,
}: {
  id: string
  look: Look
  theme: Theme
  /** Whether the footer sits on a dark page; it ships with dark-only styling. */
  dark: boolean
}) {
  return (
    <div className={`min-h-screen ${theme.page}`}>
      <VariantBar current={id} />
      <ShelfHero look={look} theme={theme} />
      <ShelfBody theme={theme} dark={dark} />
    </div>
  )
}
