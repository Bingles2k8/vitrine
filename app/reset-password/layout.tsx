import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Reset Password',
  description: 'Set a new password for your Vitrine account.',
  path: '/reset-password',
  noIndex: true,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
