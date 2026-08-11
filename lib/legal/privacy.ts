import { type LegalDoc, textItems } from './types'

export const privacyDoc: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'Last updated: August 2026',
  sections: [
    {
      heading: 'Who we are',
      blocks: [
        {
          kind: 'p',
          content: [
            { text: 'Vitrine is operated by ' },
            { text: 'Composition Limited', strong: true },
            {
              text: ', a company registered in England and Wales. We provide collection management software for museums and cultural institutions.',
            },
          ],
        },
        {
          kind: 'p',
          tight: true,
          content: [
            { text: 'Data controller contact: ' },
            { text: 'hello@composition.agency', href: 'mailto:hello@composition.agency' },
          ],
        },
      ],
    },
    {
      heading: 'What data we collect',
      blocks: [
        {
          kind: 'p',
          content: [{ text: 'When you use Vitrine, we collect and store the following information:' }],
        },
        {
          kind: 'ul',
          items: textItems([
            'Your email address — used to identify your account',
            "Museum name, slug, and branding settings — your organisation's profile",
            'Collection data — object titles, descriptions, images, and associated records you enter',
            'Staff names and email addresses — members of your team added to Vitrine',
            'Depositor names and contact information — entered during object entry procedures',
            'Loan institution contacts — names and emails of partner organisations for loans',
            'Object exit recipient details — names, contacts, and addresses for deaccessioned objects',
          ]),
        },
        {
          kind: 'p',
          content: [
            {
              text: 'We do not collect payment card details, phone numbers (unless you enter them as part of collection records), or sensitive personal categories of data.',
            },
          ],
        },
      ],
    },
    {
      heading: 'Why we collect it',
      blocks: [
        {
          kind: 'callout',
          label: 'Lawful basis: Contract',
          content: [
            {
              text: 'We process your account email and all collection management data because it is necessary to provide the Vitrine service you have signed up to. Without it, we cannot operate the software.',
            },
          ],
        },
        {
          kind: 'callout',
          label: 'Lawful basis: Consent',
          content: [
            {
              text: 'If you accept analytics cookies, we use Vercel Speed Insights to collect anonymous performance data (page load times, Web Vitals). No personal information is included. You may withdraw consent at any time by clearing your browser\'s local storage or selecting "Essential only" if the cookie banner reappears.',
            },
          ],
        },
      ],
    },
    {
      heading: 'How long we keep it',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'All data is retained for as long as your account is active. What happens afterwards depends on how your account ends.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            { text: 'If you delete your account', strong: true },
            {
              text: ', everything associated with it is permanently deleted from our systems within 24 hours. That includes your museum profile, collection records, images, documents and staff information. We do not retain backups of deleted accounts beyond our standard 7-day backup retention window.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            { text: 'If your subscription ends', strong: true },
            {
              text: ', nothing is deleted straight away. Your account becomes read-only and your public site stops being visible, but your records are kept so that you can come back or take a copy with you. We keep them for 180 days if you have previously paid, or 30 days if you only ever used a free trial. We email you 30 days and again 7 days before anything is removed. You can download a complete copy of your collection at any point during that window.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            {
              text: 'A small amount of information outlives account deletion, because the law requires us to be able to show how we handled your subscription:',
            },
          ],
        },
        {
          kind: 'ul',
          items: [
            [
              { text: 'Billing compliance records', strong: true },
              {
                text: ', kept for six years. These record each subscription notice we sent you, each cancellation and how it was made, and any refund. Each record holds the email address we sent to, the dates, and the amounts. They do not contain any of your collection data.',
              },
            ],
            [
              { text: 'A deletion record', strong: true },
              {
                text: ', kept for six years. This notes that an account existed, its name, the email address of its owner, and the date and reason it was deleted. It exists so that we can answer a query about an account that no longer exists.',
              },
            ],
          ],
        },
        {
          kind: 'callout',
          label: 'Lawful basis',
          content: [
            {
              text: 'We keep these records under Article 6(1)(c), legal obligation, and Article 6(1)(f), legitimate interests. UK consumer subscription law requires us to give you certain notices and rights, and to be able to demonstrate that we did. Six years matches the limitation period for a contract claim in England and Wales. Because these records are kept to meet a legal obligation, a request to erase them is one of the limited cases where we may not be able to comply, though you can still ask us for a copy of what they contain.',
            },
          ],
        },
      ],
    },
    {
      heading: 'Who we share it with',
      blocks: [
        {
          kind: 'p',
          content: [{ text: 'We do not sell your data. We use the following sub-processors:' }],
        },
        {
          kind: 'ul',
          items: textItems([
            'Supabase Inc: database and authentication (servers in the EU region)',
            'Vercel Inc: application hosting and infrastructure',
            'Vercel Speed Insights: anonymous performance analytics (with consent only)',
            'Cloudflare Inc: storage for the images and documents you upload',
            'Stripe Inc: subscription billing, and ticket payments for museums that sell tickets. Stripe handles card details directly and we never see or store them',
            'Resend Inc: sending email, including account, billing and subscription notices',
            'Upstash Inc: short-lived rate limiting data',
            'Functional Software Inc (Sentry): error reporting, used to diagnose faults',
          ]),
        },
      ],
    },
    {
      heading: 'Cookies',
      blocks: [
        {
          kind: 'p',
          content: [{ text: 'We use two categories of cookies:' }],
        },
        {
          kind: 'ul',
          items: [
            [
              { text: 'Essential cookies', strong: true },
              {
                text: ' — session cookies placed by Supabase to keep you signed in. These are strictly necessary and do not require consent.',
              },
            ],
            [
              { text: 'Analytics cookies', strong: true },
              {
                text: ' — used by Vercel Speed Insights only if you have given consent. You can withdraw consent at any time.',
              },
            ],
          ],
        },
      ],
    },
    {
      heading: 'Your rights',
      blocks: [
        {
          kind: 'p',
          content: [{ text: 'Under UK GDPR and EU GDPR, you have the right to:' }],
        },
        {
          kind: 'ul',
          items: textItems([
            'Access — request a copy of your personal data (use the "Export my data" feature in Settings)',
            'Rectification — correct inaccurate data',
            'Erasure — delete your account and all associated data (use "Delete account" in Settings)',
            'Portability — receive your data in a machine-readable format (JSON export via Settings)',
            'Object — object to processing based on legitimate interests',
            'Complaint — lodge a complaint with the ICO (ico.org.uk) or your local EU supervisory authority',
          ]),
        },
        {
          kind: 'p',
          tight: true,
          content: [
            { text: 'To exercise any right, email ' },
            { text: 'hello@composition.agency', href: 'mailto:hello@composition.agency' },
            { text: '. We will respond within 30 days.' },
          ],
        },
      ],
    },
    {
      heading: 'Changes to this policy',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'We may update this policy from time to time. Material changes will be communicated by email to the address on your account. Continued use of Vitrine after changes constitutes acceptance.',
            },
          ],
        },
      ],
    },
  ],
}
