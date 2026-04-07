import React from 'react'
import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const metadata = buildPageMetadata({
  title: 'FAQ – Common Questions About Vitrine',
  description:
    'Answers to the most common questions about Vitrine — pricing, supported collection types, how to catalog your collection, data export, security, and more.',
  path: '/faq',
  keywords: [
    'collection management software FAQ',
    'how to catalog collection',
    'vitrine pricing',
    'collection management app questions',
  ],
})

const faqs: { question: string; answer: React.ReactNode }[] = [
  {
    question: 'What is Vitrine?',
    answer:
      'Vitrine is a modern collection management platform that helps museums, galleries, and hobbyist collectors catalog, organise, and showcase their collections. It provides a professional CMS, a public-facing website, and tools for valuation, insurance documentation, ticketing, and more. Plans start free.',
  },
  {
    question: 'What types of collections can I manage with Vitrine?',
    answer: (
      <>
        Vitrine supports any type of physical or digital collection. Popular use cases include{' '}
        <Link href="/for/coin-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">coins</Link>,{' '}
        <Link href="/for/trading-card-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">trading cards</Link>,{' '}
        <Link href="/for/vinyl-record-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">vinyl records</Link>,{' '}
        <Link href="/for/book-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">books</Link>,{' '}
        <Link href="/for/wine-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">wine</Link>,{' '}
        <Link href="/for/watch-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">watches</Link>,{' '}
        <Link href="/for/art-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">art</Link>,{' '}
        <Link href="/for/photography-archive-management" className="text-amber-400 hover:text-amber-300 transition-colors">photography</Link>,{' '}
        <Link href="/for/antique-collection-app" className="text-amber-400 hover:text-amber-300 transition-colors">antiques</Link>, and{' '}
        <Link href="/for/museum-collection-management-software" className="text-amber-400 hover:text-amber-300 transition-colors">museum objects</Link>.{' '}
        If you can describe it, you can catalogue it in Vitrine.
      </>
    ),
  },
  {
    question: 'How much does Vitrine cost?',
    answer:
      'Vitrine offers four plans. Community is free for up to 100 items. Hobbyist costs £5/month and includes up to 1,000 items, a public website, and full cataloguing tools. Professional costs £79/month and adds analytics, event ticketing, compliance tools, and staff roles. Institution costs £349/month for full museum-grade features. Enterprise pricing is available for large organisations.',
  },
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. The Community plan is permanently free and includes core cataloguing features for small collections. No credit card is required to sign up. You can upgrade to a paid plan at any time as your collection grows.',
  },
  {
    question: 'How do I start cataloguing my collection?',
    answer:
      'Sign up for a free account at vitrinecms.com, create your first collection, and begin adding items. Each item can include a title, description, images, condition notes, acquisition date, value estimate, and custom fields. You can add items one by one, or bulk-import via CSV on Professional and above.',
  },
  {
    question: 'Can I import my existing collection data?',
    answer:
      'Yes, on Professional plans and above. Vitrine supports bulk import via CSV, making it straightforward to migrate from a spreadsheet or another collection management tool. The import tool maps your columns to Vitrine fields and flags any rows that need review before committing. Community and Hobbyist users can add items individually.',
  },
  {
    question: 'Can I export my collection data?',
    answer:
      'Yes. You can export your full collection as a CSV at any time. Your data always belongs to you — Vitrine does not lock you in.',
  },
  {
    question: 'Does Vitrine create a public website for my collection?',
    answer:
      'Yes. Every Vitrine account gets a public-facing website at a vitrinecms.com subdomain. Visitors can browse your collection, view object details, and — on Professional and above — book event tickets. You control exactly which items are publicly visible.',
  },
  {
    question: 'Is Vitrine suitable for professional museums and galleries?',
    answer: (
      <>
        Yes. The Professional and Institution plans are designed for organisations that need staff role management, analytics dashboards, event ticketing,{' '}
        <Link href="/compliance" className="text-amber-400 hover:text-amber-300 transition-colors">compliance and risk tools</Link>,
        conservation records, loans management, and more. The Institution plan mirrors the feature set of much more expensive museum CMS tools, at a fraction of the cost.
      </>
    ),
  },
  {
    question: 'How is Vitrine different from using a spreadsheet?',
    answer: (
      <>
        Spreadsheets are flexible but lack images, structured fields, access control, a public website, valuation tracking, and audit trails. Vitrine gives you all of these, with a purpose-built interface for collections. It also scales as your collection grows — thousands of items remain just as easy to search and filter as ten.{' '}
        <Link href="/compare/spreadsheet-alternative" className="text-amber-400 hover:text-amber-300 transition-colors">See a detailed comparison →</Link>
      </>
    ),
  },
  {
    question: 'Does Vitrine support multiple users and staff roles?',
    answer:
      'Yes. Professional and Institution plans include staff management with configurable roles (e.g., registrar, curator, volunteer). Each role can be granted or restricted access to specific parts of the dashboard. All changes are logged for audit purposes.',
  },
  {
    question: 'Is my collection data secure?',
    answer:
      'Yes. Vitrine is built on Supabase with row-level security, meaning each account\'s data is strictly isolated. All data is encrypted in transit and at rest. Private collection items are never publicly accessible. We do not sell or share your collection data.',
  },
  {
    question: 'Can I use Vitrine on my phone or tablet?',
    answer:
      'Yes. Vitrine is a web application that works on any modern browser, including mobile browsers on iPhone and Android. The cataloguing interface and public collection website are both fully responsive.',
  },
  {
    question: 'Does Vitrine help with insurance documentation?',
    answer: (
      <>
        Yes. You can record acquisition value, current estimated value, condition reports, and provenance for each item. This creates a structured inventory that insurers typically require. You can export your full collection as a CSV at any time.{' '}
        <Link href="/compliance" className="text-amber-400 hover:text-amber-300 transition-colors">See all compliance tools →</Link>
      </>
    ),
  },
  {
    question: 'Can I track the value of my collection over time?',
    answer:
      'Yes, on all plans. Each item has fields for purchase price and your own estimated current value. Your dashboard shows total paid vs estimated value across the collection. Professional and above also support formal recorded valuations with date, valuer, method, and supporting documents.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer:
      'You can export all your data as CSV before cancelling. After cancellation, your account and data are retained for 30 days, during which you can reactivate. After 30 days, data is permanently deleted in accordance with our privacy policy.',
  },
  {
    question: 'Do you offer discounts for non-profit organisations?',
    answer:
      'Yes. Registered charities and non-profit cultural organisations can apply for a discount on Professional and Institution plans. Contact us via the enterprise enquiry form with details of your organisation.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'FAQ',
      item: `${SITE_URL}/faq`,
    },
  ],
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      <PublicNav />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-stone-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li><Link href="/" className="hover:text-stone-300 transition-colors">Home</Link></li>
            <li className="text-stone-700">/</li>
            <li className="text-stone-300">FAQ</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl italic font-normal leading-tight mb-4">
            Frequently asked<br />
            <span className="text-amber-500">questions</span>
          </h1>
          {/* Answer capsule — structured for AI extraction */}
          <p className="text-lg text-stone-400 leading-relaxed max-w-2xl">
            Vitrine is a collection management platform for museums, galleries, and hobbyist collectors.
            Plans start free. Here are the answers to the questions we hear most often.
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-8">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-white/5 pb-8">
              <h2 className="text-lg font-medium text-white mb-3">
                {faq.question}
              </h2>
              <p className="text-stone-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 border border-white/10 rounded-lg">
          <h2 className="text-xl font-medium text-white mb-2">Still have questions?</h2>
          <p className="text-stone-400 mb-6">
            Read our step-by-step guides or start a free account to explore Vitrine yourself — no credit card required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/guide/essentials"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Read the guide
            </Link>
            <Link
              href="/blog"
              className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Visit the blog
            </Link>
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-5 py-2.5 rounded transition-colors"
            >
              Start for free →
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
