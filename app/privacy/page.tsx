import Link from 'next/link'

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
            <h1 className="font-serif text-3xl italic text-stone-900 dark:text-stone-100 mb-1">Privacy Policy</h1>
            <p className="text-xs font-mono text-stone-400 dark:text-stone-500">Last updated: February 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Who we are</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Vitrine is operated by <strong className="text-stone-900 dark:text-stone-100">Vitrine Ltd.</strong>, a company registered in England and Wales. We provide collection management software for museums and cultural institutions.
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Data controller contact:{' '}
              <a href="mailto:hello@vitrinecms.com" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                hello@vitrinecms.com
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">What data we collect</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              When you use Vitrine, we collect and store the following information:
            </p>
            <ul className="space-y-2">
              {[
                'Your email address — used to identify your account',
                'Museum name, slug, and branding settings — your organisation\'s profile',
                'Collection data — artifact titles, descriptions, images, and associated records you enter',
                'Staff names and email addresses — members of your team added to Vitrine',
                'Depositor names and contact information — entered during object entry procedures',
                'Loan institution contacts — names and emails of partner organisations for loans',
                'Object exit recipient details — names, contacts, and addresses for deaccessioned objects',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We do not collect payment card details, phone numbers (unless you enter them as part of collection records), or sensitive personal categories of data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Why we collect it</h2>
            <div className="space-y-3">
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">Lawful basis: Contract</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  We process your account email and all collection management data because it is necessary to provide the Vitrine service you have signed up to. Without it, we cannot operate the software.
                </p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mb-1">Lawful basis: Consent</p>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  If you accept analytics cookies, we use Vercel Speed Insights to collect anonymous performance data (page load times, Web Vitals). No personal information is included. You may withdraw consent at any time by clearing your browser's local storage or selecting "Essential only" if the cookie banner reappears.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">How long we keep it</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              All data is retained for as long as your account is active. When you delete your account, all associated data — including your museum profile, collection records, and staff information — is permanently deleted from our systems within 24 hours. We do not retain backups of deleted accounts beyond our standard 7-day backup retention window.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Who we share it with</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We do not sell your data. We use the following sub-processors:
            </p>
            <ul className="space-y-2">
              {[
                'Supabase Inc. — database and authentication (servers in EU region)',
                'Vercel Inc. — application hosting and infrastructure',
                'Vercel Speed Insights — anonymous performance analytics (consent only)',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Cookies</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We use two categories of cookies:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                <span><strong className="text-stone-700 dark:text-stone-300">Essential cookies</strong> — session cookies placed by Supabase to keep you signed in. These are strictly necessary and do not require consent.</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                <span><strong className="text-stone-700 dark:text-stone-300">Analytics cookies</strong> — used by Vercel Speed Insights only if you have given consent. You can withdraw consent at any time.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Your rights</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Under UK GDPR and EU GDPR, you have the right to:
            </p>
            <ul className="space-y-2">
              {[
                'Access — request a copy of your personal data (use the "Export my data" feature in Settings)',
                'Rectification — correct inaccurate data',
                'Erasure — delete your account and all associated data (use "Delete account" in Settings)',
                'Portability — receive your data in a machine-readable format (JSON export via Settings)',
                'Object — object to processing based on legitimate interests',
                'Complaint — lodge a complaint with the ICO (ico.org.uk) or your local EU supervisory authority',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
                  <span className="text-stone-300 dark:text-stone-600 mt-0.5 flex-shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              To exercise any right, email{' '}
              <a href="mailto:hello@vitrinecms.com" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                hello@vitrinecms.com
              </a>. We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-stone-400 dark:text-stone-500">Changes to this policy</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              We may update this policy from time to time. Material changes will be communicated by email to the address on your account. Continued use of Vitrine after changes constitutes acceptance.
            </p>
          </section>
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
