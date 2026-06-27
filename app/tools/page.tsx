import Link from 'next/link'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export const metadata = buildPageMetadata({
  title: 'Free Tools for Collectors & Museums',
  description:
    'Free tools for collectors and museums. Generate a collection insurance inventory or a museum condition report right in your browser.',
  path: '/tools',
  keywords: ['free collector tools', 'free museum tools', 'collection inventory tool', 'condition report generator'],
})

const TOOLS = [
  {
    href: '/tools/insurance-inventory',
    title: 'Collection Insurance Inventory Generator',
    blurb:
      'Document any collection for insurance — list items with condition, value and photos, then download a clean insurer-ready PDF (and a CSV that imports into Vitrine).',
    tag: 'For collectors',
  },
  {
    href: '/tools/condition-report',
    title: 'Museum Condition Report Generator',
    blurb:
      'Produce a professional condition report with a visual damage map. Mark damage on a photo of the object, record the assessment, and download a formatted PDF.',
    tag: 'For museums & registrars',
  },
]

export default function Page() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Free Tools for Collectors & Museums',
          url: `${SITE_URL}/tools`,
          isPartOf: { '@type': 'WebSite', name: 'Vitrine', url: SITE_URL },
        }}
      />
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-24">
        <h1 className="text-3xl sm:text-4xl font-serif leading-tight mb-4 mt-2">Tools for collectors &amp; museums</h1>
        <p className="text-stone-400 leading-relaxed max-w-2xl mb-12">
          A few small, useful tools for cataloguing and documenting collections — free to use, and they run
          entirely in your browser. Built by the team behind <span className="text-stone-200">Vitrine</span>,
          the collection-management platform.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-6 hover:border-amber-500/40 hover:bg-white/[0.05] transition-colors"
            >
              <div className="text-[11px] font-mono uppercase tracking-widest text-stone-500 mb-3">{t.tag}</div>
              <h2 className="text-lg font-semibold text-stone-100 mb-2 group-hover:text-amber-300 transition-colors">{t.title}</h2>
              <p className="text-sm text-stone-400 leading-relaxed">{t.blurb}</p>
              <span className="mt-4 inline-block text-sm font-mono text-amber-400">Open tool →</span>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
