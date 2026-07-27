import { buildPageMetadata } from '@/lib/seo'
import GlFold from '../_gl/Fold'
import Turntable from './Turntable'

export const metadata = buildPageMetadata({
  title: 'Design v24 — The Turntable',
  description: 'WebGL gallery: swap the object, the case and the lighting.',
  path: '/design/v24',
  noIndex: true,
})

export default function V24() {
  return (
    <GlFold
      variant="v24"
      kicker="Drag to turn it · change the case and the lights"
      headline={<>However<br />you keep it.</>}
      sub="Cameras, ceramics, watches, records — Vitrine does not care what you collect. Turn it over, put it under glass, light it how you like. The record underneath is the same."
      note="Free for 100 objects · no card · every control here is live"
      scene={<Turntable />}
      overlayPosition="left"
    />
  )
}
