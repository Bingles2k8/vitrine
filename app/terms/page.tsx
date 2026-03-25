import Link from 'next/link'
import { buildPageMetadata } from '@/lib/seo'

export const metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for Vitrine — the rules and conditions for using our platform.',
  path: '/terms',
  noIndex: true,
})

export default function TermsPage() {
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
            <h1 className="font-serif text-3xl italic text-stone-900 dark:text-stone-100 mb-1">Terms of Service</h1>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-500">Last updated: March 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">1. The service</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Vitrine is a collection management system (CMS) for museums and cultural institutions, operated by Composition Limited, a company registered in England and Wales. By creating an account, you agree to these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">2. Your account</h2>
            <ul className="space-y-2">
              {[
                'You are responsible for maintaining the security of your account credentials.',
                'You must provide accurate information when creating your account.',
                'You are responsible for all activity that occurs under your account.',
                'You must be at least 18 years old, or have the authority to accept these terms on behalf of an organisation.',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">3. Acceptable use</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              You agree to use Vitrine only for lawful purposes relating to the management of museum and cultural heritage collections. You must not:
            </p>
            <ul className="space-y-2">
              {[
                'Upload content that infringes third-party intellectual property rights',
                'Attempt to access another organisation\'s data',
                'Use the service to store or process unlawful content',
                'Reverse engineer or attempt to extract the source code of Vitrine',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">4. Plans and payment</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Vitrine offers free and paid subscription plans. Plan features and limits are described on our{' '}
              <Link href="/#pricing" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">pricing page</Link>.
              Where museums use Vitrine&apos;s ticketing feature to sell tickets to visitors, Composition Limited, the company that owns and operates Vitrine, charges a platform fee of 4% + 20p per transaction on ticket sales. This fee is deducted automatically at the point of sale via Stripe Connect. We reserve the right to change pricing with 30 days&apos; notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">5. Your data</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              You own all data you upload to Vitrine. We do not claim any rights over your collection records, images, or other content. You grant us a limited licence to store and process your data for the purpose of providing the service. See our{' '}
              <Link href="/privacy" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Privacy Policy</Link>{' '}
              for full details of how we handle personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">6. Service availability</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We make no guarantee of uptime, continuous availability, or uninterrupted access to the service. Vitrine may be unavailable at any time due to maintenance, technical failure, infrastructure outages, or circumstances outside our control. We will attempt to provide advance notice of planned downtime where reasonably practicable, but are under no obligation to do so. You should not rely on Vitrine as the sole record of your collection data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">7. Beta and pre-release software</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Vitrine is currently in beta. The service is under active development and is provided on an as-is basis during this period. You may encounter bugs, unexpected behaviour, degraded performance, or temporary data unavailability. Features may be added, changed, or removed without notice. We strongly recommend maintaining your own backups of critical data. By using the service during beta, you acknowledge and accept these limitations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">8. Disclaimer of warranties and limitation of liability</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              The service is provided &quot;as is&quot; and &quot;as available&quot; without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We expressly disclaim all such warranties to the fullest extent permitted by law.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Composition Limited shall not be liable for any damages whatsoever — whether direct, indirect, incidental, special, consequential, punitive, or exemplary — arising out of or in connection with your use of, or inability to use, the service. This includes, without limitation, loss of data, loss of collection records, loss of revenue, loss of profit, reputational harm, business interruption, or any other pecuniary or non-pecuniary loss, whether arising in contract, tort (including negligence), statute, or otherwise, even if we have been advised of the possibility of such damages.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We do not guarantee that data stored on Vitrine will be retained indefinitely. Data may be lost, corrupted, or become inaccessible due to technical failure, account termination, or service discontinuation. You are solely responsible for maintaining independent backups of your collection data. 
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">9. Termination</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              You may delete your account at any time from the Settings panel within the dashboard. We reserve the right to suspend or terminate accounts that violate these terms, with or without notice. On termination, all your data will be permanently deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">10. Dispute resolution and mandatory binding arbitration</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Where permitted by applicable law, we require that any dispute, claim, or controversy arising out of or relating to these terms or the service — including questions of validity, interpretation, or breach — be resolved exclusively by final and binding arbitration, rather than in court. By using Vitrine, you agree to this requirement to the fullest extent allowed by law. Where a claim is not eligible for mandatory arbitration under applicable law, nothing in this clause prevents you from pursuing that claim through the courts.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Arbitration shall be conducted by a single arbitrator under the rules of the London Court of International Arbitration (LCIA), with the seat of arbitration in London, England. Proceedings shall be conducted in English. The arbitrator&apos;s decision shall be final and binding on both parties and may be enforced in any court of competent jurisdiction.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Nothing in this clause prevents either party from seeking urgent interim or injunctive relief from a court of competent jurisdiction where necessary to prevent irreparable harm pending the outcome of arbitration.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Nothing in this clause affects your statutory rights as a consumer under applicable law, including rights under the Consumer Rights Act 2015. 
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">11. Governing law</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              These terms are governed by the laws of England and Wales. Subject to the arbitration clause above, any matters not subject to arbitration shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">12. Contact</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Questions about these terms:{' '}
              <a href="mailto:hello@composition.agency" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                hello@composition.agency
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 flex gap-6 justify-center">
          <Link href="/privacy" className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/" className="text-xs font-mono text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
