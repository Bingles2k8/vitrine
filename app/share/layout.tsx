import type { Metadata } from 'next'

// Private, password-protectable share links — never index.
export const metadata: Metadata = {
  title: 'Shared collection',
  robots: { index: false, follow: false },
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children
}
