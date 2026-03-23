import type { Metadata } from 'next'
import { getGuideSections } from '@/lib/guide'
import GuideLayout from '@/components/guide/GuideLayout'

export const metadata: Metadata = {
  title: 'How Vitrine works — Essentials guide',
  description: 'Everything you need to know to get started with the Community and Hobbyist plans.',
}

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
