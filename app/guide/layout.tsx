import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'How Vitrine Works – Guide',
  description: 'Step-by-step guides for getting the most out of Vitrine. Learn how to catalog, organise, and showcase your collection.',
  path: '/guide',
})

export default function GuideRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
