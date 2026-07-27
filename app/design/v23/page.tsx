import { buildPageMetadata } from '@/lib/seo'
import GlFold from '../_gl/Fold'
import Beam from './Beam'

export const metadata = buildPageMetadata({
  title: 'Design v23 — The Beam',
  description: 'WebGL gallery: you hold the spotlight.',
  path: '/design/v23',
  noIndex: true,
})

export default function V23() {
  return (
    <GlFold
      variant="v23"
      kicker="You are holding the light"
      headline={<>Nothing<br />here is<br />documented.</>}
      sub="Point the beam and see what you own. Everything outside it is exactly what an undocumented collection is worth to an insurer, an executor or a buyer — nothing."
      note="Free for 100 objects · no card · click to lock the beam"
      scene={<Beam />}
    />
  )
}
