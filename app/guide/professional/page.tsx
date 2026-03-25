import { buildPageMetadata } from '@/lib/seo'
import { getGuideSections } from '@/lib/guide'
import GuideLayout from '@/components/guide/GuideLayout'

export const metadata = buildPageMetadata({
  title: 'Vitrine Professional Guide – Advanced Features',
  description: 'A full guide to Vitrine\'s professional features — analytics, ticketing, compliance tools, staff management, and more.',
  path: '/guide/professional',
  keywords: ['vitrine professional features', 'museum analytics', 'collection ticketing', 'staff management'],
})

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
