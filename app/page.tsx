import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Vitrine – Collection Management App for Museums & Collectors',
  description:
    'Vitrine gives every museum, gallery, and collector a professional collection CMS and public website. Catalog, organise, and showcase your collection. Free to start.',
  path: '/',
  keywords: [
    'collection management software',
    'museum CMS',
    'collection tracker',
    'catalog my collection',
    'collection management app',
    'collection organiser',
  ],
})

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Vitrine',
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        'Vitrine is a modern collection management platform for museums, galleries, and hobbyist collectors.',
      sameAs: ['https://www.instagram.com/vitrinecms/'],
    },
    {
      '@type': 'WebSite',
      name: 'Vitrine',
      url: SITE_URL,
      publisher: { '@type': 'Organization', name: 'Vitrine', url: SITE_URL },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/discover?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      // Declares both SoftwareApplication (the common query target) and its
      // WebApplication subtype so the entity matches "software" and "app" queries.
      '@type': ['SoftwareApplication', 'WebApplication'],
      name: 'Vitrine',
      url: SITE_URL,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Any (Web Browser)',
      description:
        'Catalog, organise, and showcase your collections with Vitrine. The modern collection management platform for museums and collectors.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'GBP',
        lowPrice: '0',
        highPrice: '349',
        offerCount: 4,
      },
    },
  ],
}

type FeaturedCollection = {
  name: string
  slug: string
  count: number
  preview_image: string | null
  preview_emoji: string
}

async function getFeaturedCollections(): Promise<FeaturedCollection[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: museums } = await supabase
      .from('museums')
      .select('id, name, slug')
      .eq('discoverable', true)
      .is('locked_at', null)
      .limit(10)

    if (!museums?.length) return []

    const results: FeaturedCollection[] = []

    for (const museum of museums) {
      if (results.length >= 4) break

      const { count } = await supabase
        .from('objects')
        .select('*', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
        .eq('show_on_site', true)
        .is('deleted_at', null)

      if (!count) continue

      const { data: obj } = await supabase
        .from('objects')
        .select('image_url, emoji')
        .eq('museum_id', museum.id)
        .eq('show_on_site', true)
        .is('deleted_at', null)
        .not('image_url', 'is', null)
        .limit(1)
        .maybeSingle()

      results.push({
        name: museum.name,
        slug: museum.slug,
        count,
        preview_image: obj?.image_url ?? null,
        preview_emoji: obj?.emoji ?? '🏛️',
      })
    }

    return results
  } catch {
    return []
  }
}

export default async function Home() {
  const featured = await getFeaturedCollections()

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={organizationSchema} />

      <PublicNav />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="pt-40 pb-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-3xl lg:max-w-xl lg:flex-shrink-0">

            <h1 className="font-mono text-xs text-amber-500 uppercase tracking-widest mb-5">
              Collection management software for museums &amp; collectors
            </h1>
            <p className="font-serif text-4xl sm:text-6xl lg:text-8xl italic font-normal leading-none tracking-tight mb-6">
              Your collection,<br />
              <span className="text-amber-500">beautifully</span><br />
              managed.
            </p>

            <p className="text-lg text-stone-400 font-light leading-relaxed max-w-xl mb-10">
              An easy-to-use Collection Management System<br />with a beautiful public website built in.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors">
                Start for free →
              </Link>
              <Link href="/discover" className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-6 py-3 rounded transition-colors">
                Browse examples
              </Link>
            </div>
            <p className="text-xs text-stone-600 mt-4 font-mono">Free plan available · No credit card required</p>
          </div>

          {/* Mockup */}
          <div className="mt-20 lg:mt-0 lg:absolute lg:left-[50%] lg:right-[-25%] border border-white/8 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-stone-900 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-mono text-stone-600">vitrine.app/my-collection</span>
              </div>
            </div>
            <div className="bg-stone-900 flex">
              <div className="w-32 lg:w-44 border-r border-white/5 p-3 flex-shrink-0">
                <div className="text-amber-500 font-serif italic text-base mb-4 px-2">Vitrine.</div>
                <div className="text-xs text-stone-600 uppercase tracking-widest px-2 mb-2">My collection</div>
                <div className="bg-white/10 text-white text-xs font-mono px-3 py-2 rounded mb-1">⬡ Objects</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2 mb-1">◫ My site</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2 mb-1">◈ Analytics</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2">⋯ Settings</div>
              </div>
              <div className="flex-1 p-3 lg:p-5">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3 mb-4 lg:mb-5">
                  {[['Total', '347'], ['Est. value', '£12,400'], ['Added this year', '48'], ['For sale', '3']].map(([l, v]) => (
                    <div key={l} className="bg-white/5 rounded-lg p-2 lg:p-3 border border-white/5">
                      <div className="text-xs text-stone-500 mb-1">{l}</div>
                      <div className="font-serif text-xl lg:text-2xl text-white">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4 px-3 lg:px-4 py-2 border-b border-white/5">
                    {['Object', 'Year', 'Value', 'Condition'].map(h => (
                      <div key={h} className={`text-xs text-stone-600 uppercase tracking-widest${h === 'Value' ? ' hidden lg:block' : ''}`}>{h}</div>
                    ))}
                  </div>
                  {[
                    ['💿', 'Beatles — Please Please Me', '1963', '£340', 'Mint', 'emerald'],
                    ['📻', 'Braun T3 Pocket Radio', '1958', '£210', 'Good', 'amber'],
                    ['📷', 'Leica M3 (Chrome)', '1954', '£1,200', 'Excellent', 'emerald'],
                  ].map(([emoji, title, year, value, condition, color]) => (
                    <div key={title} className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4 px-3 lg:px-4 py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{emoji}</span>
                        <span className="text-xs text-stone-300 truncate">{title}</span>
                      </div>
                      <div className="text-xs font-mono text-stone-500">{year}</div>
                      <div className="text-xs font-mono text-stone-500 hidden lg:block">{value}</div>
                      <div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {condition}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live collections (social proof) ─────────────────── */}
      <div className="border-y border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-stone-600 uppercase tracking-widest text-center mb-8">
            Example collections
          </p>
          <div className="flex flex-wrap items-stretch justify-center gap-4">
            {featured.map(col => (
              <Link
                key={col.slug}
                href={`/museum/${col.slug}`}
                className="group flex items-center gap-3 bg-stone-900/50 border border-white/8 rounded-lg px-5 py-3.5 hover:border-white/15 hover:bg-stone-900 transition-all"
              >
                {col.preview_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={col.preview_image}
                    alt=""
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="text-xl flex-shrink-0">{col.preview_emoji}</span>
                )}
                <div>
                  <div className="font-serif italic text-sm text-stone-300 group-hover:text-white transition-colors">{col.name}</div>
                  <div className="text-xs font-mono text-stone-600">{col.count.toLocaleString()} objects</div>
                </div>
              </Link>
            ))}
            <Link
              href="/discover"
              className="flex items-center gap-2 border border-dashed border-white/10 rounded-lg px-5 py-3.5 text-stone-600 hover:text-stone-400 hover:border-white/20 transition-all font-mono text-xs"
            >
              Browse all collections →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">Everything a collector needs</p>
          <h2 className="font-serif text-5xl italic font-normal mb-4">One place for<br />your whole collection.</h2>
          <p className="text-stone-400 font-light text-lg max-w-xl mb-16">Whether it&apos;s 10 items or 1,000 — every piece deserves a proper record.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
            {[
              { icon: '🗄️', title: 'Your catalog', desc: 'Add every item with photos, notes, acquisition details, condition, and estimated value. Up to 1,000 objects and 5 photos each on Hobbyist.' },
              { icon: '🌐', title: 'Your public site', desc: 'Get a beautiful public site at vitrine.app/your-collection instantly. Pick a template, add your logo, and share it with anyone.' },
              { icon: '📊', title: 'Track what matters', desc: 'Monitor your collection\'s growth, value over time, and condition history. Know exactly what you have and what it\'s worth.' },
              { icon: '📥', title: 'Import & export', desc: 'Already have a spreadsheet? Import your whole collection in minutes with CSV. Export anytime — your data is always yours.' },
              { icon: '🔗', title: 'Share links', desc: 'Create private share links for specific pieces — perfect for insurance claims, fellow collectors, or potential buyers.' },
              { icon: '🎨', title: 'Make it yours', desc: 'Upload your logo, set your colour scheme, write your collection story. Your site looks like yours, not like a generic app.' },
            ].map(f => (
              <div key={f.title} className="bg-stone-950 p-8 hover:bg-stone-900 transition-colors">
                <div className="text-3xl mb-5">{f.icon}</div>
                <div className="font-serif text-xl italic text-white mb-3">{f.title}</div>
                <p className="text-sm text-stone-500 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}

            {/* Compliance — Pro+ callout */}
            <Link
              href="/compliance"
              className="bg-stone-950 hover:bg-stone-900 p-8 md:col-span-3 group transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📋</span>
                  <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">Professional+</span>
                </div>
                <div className="font-serif text-xl italic text-white mb-3">Collections documentation, done properly</div>
                <p className="text-sm text-stone-500 leading-relaxed font-light max-w-2xl">
                  The registers a working museum actually needs, built in — object entry, acquisition, loans, condition checks, conservation, valuation, insurance, deaccession, audits and more.
                </p>
              </div>
              <span className="text-amber-500 font-mono text-sm group-hover:text-amber-400 transition-colors shrink-0 self-start md:self-center">
                See what&apos;s included →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">Simple pricing</p>
          <h2 className="font-serif text-5xl italic font-normal mb-4">Start free.<br />Go further for £5/mo.</h2>
          <p className="text-stone-400 font-light text-lg max-w-xl mb-16">No hidden fees. Cancel anytime. Your data is always exportable.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

            {/* Community */}
            <div className="rounded-xl border bg-stone-900/30 border-white/5 p-7 flex flex-col">
              <div className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">Community</div>
              <div className="font-serif text-4xl text-white mb-4">Free</div>
              <p className="text-sm text-stone-500 font-light mb-6">Start cataloguing your collection today.</p>
              <hr className="border-white/5 mb-6" />
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  'Up to 100 objects',
                  '1 photo per object',
                  'Public collection website',
                  'Value & condition tracking',
                  'Wishlist',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-stone-400">
                    <span className="text-amber-500 text-xs mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center font-mono text-sm py-2.5 rounded border border-white/10 hover:border-white/20 text-stone-300 transition-colors">
                Start free →
              </Link>
              <p className="text-center text-xs font-mono text-stone-600 mt-2">No credit card required</p>
            </div>

            {/* Hobbyist */}
            <div className="rounded-xl border bg-stone-900 border-amber-500/30 p-7 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-xs font-mono px-3 py-1 rounded-full">
                Most popular
              </div>
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-2">Hobbyist</div>
              <div className="font-serif text-4xl text-white mb-4">
                £5<span className="text-2xl text-stone-400">/mo</span>
              </div>
              <p className="text-sm text-stone-500 font-light mb-6">For collectors who are serious about their collection.</p>
              <hr className="border-white/8 mb-6" />
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  'Everything in Community',
                  'Up to 1,000 objects',
                  '5 photos per object',
                  'Collection analytics',
                  'CSV bulk import & export',
                  '100 MB document storage',
                  'All site templates',
                  'Remove Vitrine branding',
                  'Unlimited share links',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-stone-300">
                    <span className="text-amber-500 text-xs mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center font-mono text-sm py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors">
                Get Hobbyist →
              </Link>
              <p className="text-center text-xs font-mono text-stone-600 mt-2">Cancel anytime</p>
            </div>

            {/* Professional teaser */}
            <div className="rounded-xl border bg-stone-900/50 border-white/8 p-7 flex flex-col">
              <div className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">Professional</div>
              <div className="font-serif text-4xl text-white mb-1">
                £79<span className="text-2xl text-stone-400">/mo</span>
              </div>
              <p className="text-xs font-mono text-amber-500/80 mb-4">30 days free trial</p>
              <p className="text-sm text-stone-500 font-light mb-6">For small museums and galleries.</p>
              <hr className="border-white/8 mb-6" />
              <ul className="space-y-2.5 mb-8 flex-1">
                {[
                  'Up to 5,000 objects, 10 staff',
                  'Event ticketing',
                  'Entry, loans & conservation registers',
                  'Visitor & collection analytics',
                  'Plan your visit page',
                  '1 GB document storage',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-stone-300">
                    <span className="text-amber-500 text-xs mt-0.5 shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center font-mono text-sm py-2.5 rounded border border-white/10 hover:border-white/20 text-stone-300 transition-colors">
                Start free trial →
              </Link>
            </div>

          </div>

          <p className="text-center text-sm text-stone-600 font-mono">
            Larger institution?{' '}
            <Link href="/plans/institution" className="text-stone-500 hover:text-stone-400 underline underline-offset-2 transition-colors">
              See Institution & Enterprise plans →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Museum callout ──────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="bg-stone-900/50 border border-white/8 rounded-2xl p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">For museums & institutions</p>
              <h2 className="font-serif text-3xl italic font-normal mb-3">Running a gallery or museum?</h2>
              <p className="text-stone-400 font-light max-w-lg">
                Professional and Institution plans include event ticketing, full collections documentation registers, visitor analytics, staff roles, and a full public-facing website — everything a public institution needs from one platform.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Link href="/signup" className="block text-center font-mono text-sm px-8 py-3 rounded border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors whitespace-nowrap">
                Start professional trial →
              </Link>
              <Link href="/compliance" className="block text-center font-mono text-xs py-2 text-stone-600 hover:text-stone-400 transition-colors">
                See what&apos;s included →
              </Link>
              <Link href="/guide/professional" className="block text-center font-mono text-xs py-2 text-stone-600 hover:text-stone-400 transition-colors">
                Read the guide →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free tools ──────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-3">Free tools</p>
          <h2 className="font-serif text-3xl italic font-normal mb-4">Try before you sign up</h2>
          <p className="text-stone-400 font-light max-w-2xl mb-10">
            A couple of free tools that run entirely in your browser — no account needed. Useful on their own, and a quick taste of how Vitrine handles your collection.
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            <Link href="/tools/insurance-inventory" className="group rounded-xl border border-white/8 bg-white/[0.02] p-6 hover:border-amber-500/30 hover:bg-white/[0.04] transition-colors">
              <h3 className="font-serif text-lg italic text-white mb-2 group-hover:text-amber-300 transition-colors">Insurance inventory generator</h3>
              <p className="text-sm text-stone-400 leading-relaxed mb-4">Document any collection for insurance — list items with condition, value and photos, then download an insurer-ready PDF.</p>
              <span className="font-mono text-sm text-amber-500">Open tool →</span>
            </Link>
            <Link href="/tools/condition-report" className="group rounded-xl border border-white/8 bg-white/[0.02] p-6 hover:border-amber-500/30 hover:bg-white/[0.04] transition-colors">
              <h3 className="font-serif text-lg italic text-white mb-2 group-hover:text-amber-300 transition-colors">Condition report generator</h3>
              <p className="text-sm text-stone-400 leading-relaxed mb-4">Produce a professional museum condition report with a visual damage map, then download a formatted PDF.</p>
              <span className="font-mono text-sm text-amber-500">Open tool →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-white/5 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-5xl italic font-normal mb-5">
            Give your collection<br />
            <span className="text-amber-500">the home it deserves.</span>
          </h2>
          <p className="text-stone-400 font-light text-lg mb-10">
            Start cataloguing today. Free plan available, or go serious with Hobbyist for £5/mo.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-8 py-3.5 rounded transition-colors">
              Get started — £5/mo →
            </Link>
            <Link href="/signup" className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-8 py-3.5 rounded transition-colors">
              Start free
            </Link>
          </div>
          <p className="text-xs text-stone-600 font-mono mt-5">No credit card required for free plan · Cancel paid plans anytime</p>
          <p className="text-xs text-stone-600 font-mono mt-3">
            Want a tour first?{' '}
            <Link href="/guide/essentials" className="text-stone-400 hover:text-amber-400 underline underline-offset-2 transition-colors">
              See how it works →
            </Link>
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
