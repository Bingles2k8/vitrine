import LegalSections from './LegalSections'
import type { LegalDoc } from '@/lib/legal/types'

/**
 * Chrome-free shell for the /legal/* routes opened by the Vitrine Capture iOS
 * app in an SFSafariViewController.
 *
 * Deliberately contains no logo, nav, footer, or back link, and passes
 * siteLinks={false} so the body cannot link back into the site. App Store
 * Guideline 3.1.3(f) permits the free app to omit IAP only while it offers no
 * call to action to purchase outside the app; a reviewer reaching the pricing
 * page from here is what got the app rejected three times.
 *
 * The cookie banner is suppressed on these paths in components/CookieBanner.tsx
 * — it carries a link to /privacy, which is site chrome by another name.
 */
export default function BareLegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="min-h-screen bg-white dark:bg-stone-950 px-5 py-10 sm:px-6 sm:py-14">
      <article className="mx-auto max-w-2xl space-y-8">
        <header>
          <h1 className="font-serif text-2xl sm:text-3xl italic text-stone-900 dark:text-stone-100 mb-1">
            {doc.title}
          </h1>
          <p className="text-xs font-mono text-stone-400 dark:text-stone-500">{doc.updated}</p>
        </header>

        <LegalSections doc={doc} siteLinks={false} scale="comfortable" />
      </article>
    </main>
  )
}
