import { type LegalDoc, textItems } from './types'

export const privacyDoc: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'Last updated: February 2026',
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
              text: 'All data is retained for as long as your account is active. When you delete your account, all associated data — including your museum profile, collection records, and staff information — is permanently deleted from our systems within 24 hours. We do not retain backups of deleted accounts beyond our standard 7-day backup retention window.',
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
            'Supabase Inc. — database and authentication (servers in EU region)',
            'Vercel Inc. — application hosting and infrastructure',
            'Vercel Speed Insights — anonymous performance analytics (consent only)',
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
