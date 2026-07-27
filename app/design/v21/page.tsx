import { buildPageMetadata } from '@/lib/seo'
import GlFold from '../_gl/Fold'
import Orbit from './Orbit'

export const metadata = buildPageMetadata({
  title: 'Design v21 — Orbit & Inspect',
  description: 'WebGL gallery: orbit the case, lift the glass, swap the object.',
  path: '/design/v21',
  noIndex: true,
})

export default function V21() {
  return (
    <GlFold
      variant="v21"
      kicker="Drag the room · click to lift the case"
      headline={<>Pick it<br />up.</>}
      sub="Orbit the plinth, zoom in, lift the glass and turn the thing over. This is what your collection feels like when every object has a record behind it."
      note="Free for 100 objects · no card · drag anywhere to look around"
      scene={<Orbit />}
    />
  )
}
