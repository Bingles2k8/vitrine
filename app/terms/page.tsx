import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import LegalSections from '@/components/legal/LegalSections'
import { termsDoc } from '@/lib/legal/terms'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for Vitrine — the rules and conditions for using our platform.',
  path: '/terms',
  noIndex: true,
})

export default function TermsPage() {
  // The public site is dark everywhere; this page used to follow the visitor's
  // system theme instead, which left a dark nav sitting on a light page.
  // Scoping `dark` here rather than hardcoding colours keeps LegalSections
  // working for /legal/*, which is still theme-aware and must stay that way
  // for the iOS app.
  return (
    <main className="dark min-h-screen bg-stone-950 px-6 pb-16 pt-28 text-stone-100">
      <PublicNav />

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-white/10 bg-stone-900 p-10 space-y-8">
          <div>
            <h1 className="font-serif text-3xl italic text-stone-100 mb-1">{termsDoc.title}</h1>
            <p className="text-xs font-mono text-stone-500">{termsDoc.updated}</p>
          </div>

          <LegalSections doc={termsDoc} siteLinks />
        </div>

        <div className="mt-8 flex justify-center gap-6">
          <Link href="/privacy" className="text-xs font-mono text-stone-500 transition-colors hover:text-stone-100">
            Privacy Policy
          </Link>
          <Link href="/" className="text-xs font-mono text-stone-500 transition-colors hover:text-stone-100">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
