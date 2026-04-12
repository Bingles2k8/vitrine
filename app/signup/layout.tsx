import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Sign Up',
  description: 'Create your free Vitrine account.',
  path: '/signup',
  noIndex: true,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
