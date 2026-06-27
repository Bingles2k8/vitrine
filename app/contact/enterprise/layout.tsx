import { buildPageMetadata } from '@/lib/seo'

// The page itself is a client component, so metadata lives here.
export const metadata = buildPageMetadata({
  title: 'Enterprise Enquiries – Talk to Us',
  description:
    'Contact Vitrine about Enterprise plans, non-profit discounts, and large-scale collection management for museums and institutions.',
  path: '/contact/enterprise',
})

export default function EnterpriseContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
