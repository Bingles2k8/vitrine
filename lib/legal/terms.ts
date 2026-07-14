import { type LegalDoc, textItems } from './types'

export const termsDoc: LegalDoc = {
  title: 'Terms of Service',
  updated: 'Last updated: March 2026',
  sections: [
    {
      heading: '1. The service',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'Vitrine is a collection management system (CMS) for museums and cultural institutions, operated by Composition Limited, a company registered in England and Wales. By creating an account, you agree to these terms.',
            },
          ],
        },
      ],
    },
    {
      heading: '2. Your account',
      blocks: [
        {
          kind: 'ul',
          items: textItems([
            'You are responsible for maintaining the security of your account credentials.',
            'You must provide accurate information when creating your account.',
            'You are responsible for all activity that occurs under your account.',
            'You must be at least 18 years old, or have the authority to accept these terms on behalf of an organisation.',
          ]),
        },
      ],
    },
    {
      heading: '3. Acceptable use',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'You agree to use Vitrine only for lawful purposes relating to the management of museum and cultural heritage collections. You must not:',
            },
          ],
        },
        {
          kind: 'ul',
          items: textItems([
            'Upload content that infringes third-party intellectual property rights',
            "Attempt to access another organisation's data",
            'Use the service to store or process unlawful content',
            'Reverse engineer or attempt to extract the source code of Vitrine',
          ]),
        },
      ],
    },
    {
      heading: '4. Plans and payment',
      blocks: [
        {
          kind: 'p',
          content: [
            { text: 'Vitrine offers free and paid subscription plans. Plan features and limits are described on our ' },
            { text: 'pricing page', siteHref: '/#pricing' },
            {
              text: ". Where museums use Vitrine's ticketing feature to sell tickets to visitors, Composition Limited, the company that owns and operates Vitrine, charges a platform fee of 4% + 20p per transaction on ticket sales. This fee is deducted automatically at the point of sale via Stripe Connect. We reserve the right to change pricing with 30 days' notice.",
            },
          ],
        },
      ],
    },
    {
      heading: '5. Your data',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'You own all data you upload to Vitrine. We do not claim any rights over your collection records, images, or other content. You grant us a limited licence to store and process your data for the purpose of providing the service. See our ',
            },
            { text: 'Privacy Policy', siteHref: '/privacy' },
            { text: ' for full details of how we handle personal data.' },
          ],
        },
      ],
    },
    {
      heading: '6. Service availability',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'We make no guarantee of uptime, continuous availability, or uninterrupted access to the service. Vitrine may be unavailable at any time due to maintenance, technical failure, infrastructure outages, or circumstances outside our control. We will attempt to provide advance notice of planned downtime where reasonably practicable, but are under no obligation to do so. You should not rely on Vitrine as the sole record of your collection data.',
            },
          ],
        },
      ],
    },
    {
      heading: '7. Beta and pre-release software',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'Vitrine is currently in beta. The service is under active development and is provided on an as-is basis during this period. You may encounter bugs, unexpected behaviour, degraded performance, or temporary data unavailability. Features may be added, changed, or removed without notice. We strongly recommend maintaining your own backups of critical data. By using the service during beta, you acknowledge and accept these limitations.',
            },
          ],
        },
      ],
    },
    {
      heading: '8. Disclaimer of warranties and limitation of liability',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'The service is provided "as is" and "as available" without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We expressly disclaim all such warranties to the fullest extent permitted by law.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            {
              text: 'Composition Limited shall not be liable for any damages whatsoever — whether direct, indirect, incidental, special, consequential, punitive, or exemplary — arising out of or in connection with your use of, or inability to use, the service. This includes, without limitation, loss of data, loss of collection records, loss of revenue, loss of profit, reputational harm, business interruption, or any other pecuniary or non-pecuniary loss, whether arising in contract, tort (including negligence), statute, or otherwise, even if we have been advised of the possibility of such damages.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            {
              text: 'We do not guarantee that data stored on Vitrine will be retained indefinitely. Data may be lost, corrupted, or become inaccessible due to technical failure, account termination, or service discontinuation. You are solely responsible for maintaining independent backups of your collection data.',
            },
          ],
        },
      ],
    },
    {
      heading: '9. Termination',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'You may delete your account at any time from the Settings panel within the dashboard. We reserve the right to suspend or terminate accounts that violate these terms, with or without notice. On termination, all your data will be permanently deleted.',
            },
          ],
        },
      ],
    },
    {
      heading: '10. Dispute resolution and mandatory binding arbitration',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'Where permitted by applicable law, we require that any dispute, claim, or controversy arising out of or relating to these terms or the service — including questions of validity, interpretation, or breach — be resolved exclusively by final and binding arbitration, rather than in court. By using Vitrine, you agree to this requirement to the fullest extent allowed by law. Where a claim is not eligible for mandatory arbitration under applicable law, nothing in this clause prevents you from pursuing that claim through the courts.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            {
              text: "Arbitration shall be conducted by a single arbitrator under the rules of the London Court of International Arbitration (LCIA), with the seat of arbitration in London, England. Proceedings shall be conducted in English. The arbitrator's decision shall be final and binding on both parties and may be enforced in any court of competent jurisdiction.",
            },
          ],
        },
        {
          kind: 'p',
          content: [
            {
              text: 'Nothing in this clause prevents either party from seeking urgent interim or injunctive relief from a court of competent jurisdiction where necessary to prevent irreparable harm pending the outcome of arbitration.',
            },
          ],
        },
        {
          kind: 'p',
          content: [
            {
              text: 'Nothing in this clause affects your statutory rights as a consumer under applicable law, including rights under the Consumer Rights Act 2015.',
            },
          ],
        },
      ],
    },
    {
      heading: '11. Governing law',
      blocks: [
        {
          kind: 'p',
          content: [
            {
              text: 'These terms are governed by the laws of England and Wales. Subject to the arbitration clause above, any matters not subject to arbitration shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
            },
          ],
        },
      ],
    },
    {
      heading: '12. Contact',
      blocks: [
        {
          kind: 'p',
          tight: true,
          content: [
            { text: 'Questions about these terms: ' },
            { text: 'hello@composition.agency', href: 'mailto:hello@composition.agency' },
          ],
        },
      ],
    },
  ],
}
