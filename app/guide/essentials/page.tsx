import { buildPageMetadata } from '@/lib/seo'
import { getGuideSections } from '@/lib/guide'
import GuideLayout from '@/components/guide/GuideLayout'

export const metadata = buildPageMetadata({
  title: 'Vitrine Essentials Guide – Getting Started',
  description: 'Everything you need to know to get started with Vitrine. Step-by-step guide for Community and Hobbyist plan users.',
  path: '/guide/essentials',
  keywords: ['how to use vitrine', 'collection management guide', 'getting started catalog'],
})

export default async function EssentialsGuidePage() {
  const sections = await getGuideSections('essentials')

  return (
    <GuideLayout
      sections={sections}
      title="How Vitrine works"
      subtitle="Everything you need to know to get started — from adding your first object to publishing your collection website."
      tierBadges={['Community', 'Hobbyist']}
    />
  )
}
