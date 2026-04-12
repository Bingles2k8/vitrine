import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Log In',
  description: 'Log in to your Vitrine account.',
  path: '/login',
  noIndex: true,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
