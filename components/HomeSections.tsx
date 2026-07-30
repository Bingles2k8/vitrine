import Link from 'next/link'

export type FeaturedCollection = {
  name: string
  slug: string
  count: number
  preview_image: string | null
  preview_emoji: string
}

/**
 * Everything on the homepage below the hero, lifted out verbatim so an
 * alternative hero can be tried in front of the real page rather than in front
 * of a rewrite of it. Markup is unchanged from app/page.tsx.
 */
export default function HomeSections({ featured }: { featured: FeaturedCollection[] }) {
  return (
    <>
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
    </>
  )
}
