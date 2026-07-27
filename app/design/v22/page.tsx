import { buildPageMetadata } from '@/lib/seo'
import GlFold from '../_gl/Fold'
import Walk from './Walk'

export const metadata = buildPageMetadata({
  title: 'Design v22 — Walk the Room',
  description: 'WebGL gallery: a corridor of plinths you walk down.',
  path: '/design/v22',
  noIndex: true,
})

export default function V22() {
  return (
    <GlFold
      variant="v22"
      kicker="Move to steer · hold to walk faster"
      headline={<>Room<br />after room.</>}
      sub="Every plinth is an object with a record behind it — maker, date, what you paid, what it is worth now, which shelf it lives on. Keep walking; the collection does not run out."
      note="Free for 100 objects · no card · the corridor loops forever"
      scene={<Walk />}
      overlayPosition="left"
    />
  )
}
