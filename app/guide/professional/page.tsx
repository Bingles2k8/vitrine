import type { Metadata } from 'next'
import { getGuideSections } from '@/lib/guide'
import GuideLayout from '@/components/guide/GuideLayout'

export const metadata: Metadata = {
  title: 'How Vitrine works — Professional guide',
  description: 'A full guide to Vitrine\'s professional features — analytics, ticketing, compliance, staff management, and more.',
}

export default async function ProfessionalGuidePage() {
  const sections = await getGuideSections('professional')

  return (
    <GuideLayout
      sections={sections}
      title="How Vitrine works"
      subtitle="A full walkthrough of every feature available on the Professional, Institution, and Enterprise plans."
      tierBadges={['Professional', 'Institution', 'Enterprise']}
    />
  )
}
