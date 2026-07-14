import Link from 'next/link'
import LegalSections from '@/components/legal/LegalSections'
import { privacyDoc } from '@/lib/legal/privacy'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for Vitrine — how we collect, use, and protect your data.',
  path: '/privacy',
  noIndex: true,
})

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link href="/" className="font-serif text-2xl italic text-stone-900 dark:text-stone-100">
            Vitrine<span className="text-amber-600">.</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-10 space-y-8">
          <div>
            <h1 className="font-serif text-3xl italic text-stone-900 dark:text-stone-100 mb-1">{privacyDoc.title}</h1>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-500">{privacyDoc.updated}</p>
          </div>

          <LegalSections doc={privacyDoc} siteLinks />
        </div>

        <div className="mt-8 flex gap-6 justify-center">
          <Link href="/terms" className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            Terms of Service
          </Link>
          <Link href="/" className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
