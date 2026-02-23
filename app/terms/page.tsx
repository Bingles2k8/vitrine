import Link from 'next/link'

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
            <p className="text-xs font-mono text-stone-400 dark:text-stone-500">Last updated: February 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">1. The service</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Vitrine is a collection management system (CMS) for museums and cultural institutions, operated by <strong className="text-stone-900 dark:text-stone-100">Vitrine Ltd.</strong>, a company registered in England and Wales. By creating an account, you agree to these terms.
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
              Payment processing is not yet active — contact us at{' '}
              <a href="mailto:hello@vitrinecms.com" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                hello@vitrinecms.com
              </a>{' '}
              to discuss paid plans. We reserve the right to change pricing with 30 days' notice.
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
              We aim to maintain high availability but do not guarantee uninterrupted access. We may carry out maintenance, introduce updates, or suspend the service in exceptional circumstances. We will provide reasonable notice where possible.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">7. Limitation of liability</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              To the maximum extent permitted by law, Vitrine Ltd. is not liable for any indirect, incidental, or consequential loss arising from your use of the service — including loss of data, loss of revenue, or business interruption. Our total liability to you will not exceed the amount you paid us in the 12 months preceding the claim (or £100 if you are on the free plan).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">8. Termination</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              You may delete your account at any time from the Settings panel within the dashboard. We reserve the right to suspend or terminate accounts that violate these terms, with or without notice. On termination, all your data will be permanently deleted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">9. Governing law</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">10. Contact</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Questions about these terms:{' '}
              <a href="mailto:hello@vitrinecms.com" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                hello@vitrinecms.com
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
