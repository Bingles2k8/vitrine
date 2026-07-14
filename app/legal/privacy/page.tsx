import BareLegalPage from '@/components/legal/BareLegalPage'
import { privacyDoc } from '@/lib/legal/privacy'
import { buildPageMetadata } from '@/lib/seo'

// Bare copy of /privacy for the Vitrine Capture iOS app. Public, no auth.
export const metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for Vitrine — how we collect, use, and protect your data.',
  path: '/legal/privacy',
  noIndex: true,
})

export default function LegalPrivacyPage() {
  return <BareLegalPage doc={privacyDoc} />
}
