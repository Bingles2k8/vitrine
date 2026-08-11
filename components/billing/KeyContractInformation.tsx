'use client'

import type { KeyContractInfo } from '@/lib/billing/keyContractInfo'

/**
 * The key contract information panel.
 *
 * Rendered immediately before the customer is sent to Stripe Checkout, and
 * again on the account subscription screen.
 *
 * Everything here is visible at once by design. DMCCA requires this
 * information to be given before the customer is bound, and information hidden
 * behind a disclosure control has not been given. So: no accordion, no
 * "read more", no tooltip, no link out to the terms. If this panel ever grows
 * long enough to feel like it needs collapsing, shorten the wording rather than
 * hiding it.
 *
 * Where a trial applies, the trial block is rendered first and with the same
 * visual weight as everything else, because the rules require the trial terms
 * to be at least as prominent as the trial offer.
 */
export default function KeyContractInformation({
  info,
  className = '',
}: {
  info: KeyContractInfo
  className?: string
}) {
  return (
    <section
      className={`rounded-lg border border-stone-200 dark:border-stone-700 p-4 ${className}`}
      aria-labelledby="key-contract-info-heading"
      data-testid="key-contract-information"
      data-version={info.version}
    >
      <h2
        id="key-contract-info-heading"
        className="text-sm font-medium text-stone-900 dark:text-stone-100"
      >
        Key contract information
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
        Please read this before you subscribe. We will email you a copy to keep.
      </p>

      {info.provides.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium text-stone-700 dark:text-stone-300">
            What the {info.planLabel} plan gives you
          </h3>
          <ul className="mt-1.5 space-y-1">
            {info.provides.map((f) => (
              <li key={f} className="text-xs text-stone-600 dark:text-stone-400 flex gap-2">
                <span aria-hidden="true" className="text-stone-400">
                  •
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {info.trial && (
        <TermList
          heading="Your free trial"
          terms={info.trial}
          // Shaded so the trial terms cannot read as small print next to the
          // offer itself.
          className="mt-4 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-3"
        />
      )}

      {info.introductoryPrice && (
        <TermList
          heading="Introductory price"
          terms={info.introductoryPrice}
          className="mt-4 rounded border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-3"
        />
      )}

      <TermList heading="Your subscription" terms={info.terms} className="mt-4" />
    </section>
  )
}

function TermList({
  heading,
  terms,
  className = '',
}: {
  heading: string
  terms: { label: string; value: string }[]
  className?: string
}) {
  return (
    <div className={className}>
      <h3 className="text-xs font-medium text-stone-700 dark:text-stone-300">{heading}</h3>
      <dl className="mt-1.5 space-y-2">
        {terms.map((t) => (
          <div key={t.label} className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-0.5">
            <dt className="text-xs text-stone-500 dark:text-stone-400">{t.label}</dt>
            <dd className="text-xs text-stone-700 dark:text-stone-300 sm:col-span-2 leading-relaxed">
              {t.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
