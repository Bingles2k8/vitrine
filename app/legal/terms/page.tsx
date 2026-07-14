import BareLegalPage from '@/components/legal/BareLegalPage'
import { termsDoc } from '@/lib/legal/terms'
import { buildPageMetadata } from '@/lib/seo'

// Bare copy of /terms for the Vitrine Capture iOS app. Public, no auth.
export const metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for Vitrine — the rules and conditions for using our platform.',
  path: '/legal/terms',
  noIndex: true,
})

export default function LegalTermsPage() {
  return <BareLegalPage doc={termsDoc} />
}
