import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How Vitrine works — Guide',
  description: 'Step-by-step guides for getting the most out of Vitrine.',
}

export default function GuideRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
