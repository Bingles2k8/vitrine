import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { buildPageMetadata, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

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
      sameAs: [] as string[],
    },
    {
      '@type': 'WebApplication',
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

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <JsonLd data={organizationSchema} />

      <PublicNav />

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative flex flex-col lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-3xl lg:max-w-xl lg:flex-shrink-0">
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-8xl italic font-normal leading-none tracking-tight mb-6">
              Your collection,<br />
              <span className="text-amber-500">beautifully</span><br />
              managed.
            </h1>

            <p className="text-lg text-stone-400 font-light leading-relaxed max-w-xl mb-10">
              Vitrine gives every museum — large or small — a professional collection CMS and public-facing website. No technical knowledge required.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-sm px-6 py-3 rounded transition-colors">
                Start for free →
              </Link>
              <a href="#features" className="border border-white/10 hover:border-white/20 text-stone-400 hover:text-white font-mono text-sm px-6 py-3 rounded transition-colors">
                See features
              </a>
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
                <span className="text-xs font-mono text-stone-600">vitrine.app/dashboard</span>
              </div>
            </div>
            <div className="bg-stone-900 flex">
              <div className="w-32 lg:w-44 border-r border-white/5 p-3 flex-shrink-0">
                <div className="text-amber-500 font-serif italic text-base mb-4 px-2">Vitrine.</div>
                <div className="text-xs text-stone-600 uppercase tracking-widest px-2 mb-2">Collections</div>
                <div className="bg-white/10 text-white text-xs font-mono px-3 py-2 rounded mb-1">⬡ Objects</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2 mb-1">◫ Site Builder</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2 mb-1">◉ Staff & Roles</div>
                <div className="text-stone-500 text-xs font-mono px-3 py-2">◈ Analytics</div>
              </div>
              <div className="flex-1 p-3 lg:p-5">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3 mb-4 lg:mb-5">
                  {[['Total', '142'],['On Display','84'],['On Loan','12'],['Restoration','6']].map(([l,v]) => (
                    <div key={l} className="bg-white/5 rounded-lg p-2 lg:p-3 border border-white/5">
                      <div className="text-xs text-stone-500 mb-1">{l}</div>
                      <div className="font-serif text-xl lg:text-2xl text-white">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/5 rounded-lg border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4 px-3 lg:px-4 py-2 border-b border-white/5">
                    {['Object','Year','Medium','Status'].map(h => (
                      <div key={h} className={`text-xs text-stone-600 uppercase tracking-widest${h === 'Medium' ? ' hidden lg:block' : ''}`}>{h}</div>
                    ))}
                  </div>
                  {[
                    ['🏺','The Portland Vase','25 CE','Cameo glass','On Display','emerald'],
                    ['🖼️','The Arnolfini Portrait','1434','Oil on canvas','On Display','emerald'],
                    ['💎',"Tippoo's Tiger",'1793','Wood & metal','On Loan','amber'],
                  ].map(([emoji, title, year, medium, status, color]) => (
                    <div key={title} className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-4 px-3 lg:px-4 py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{emoji}</span>
                        <span className="text-xs text-stone-300 truncate">{title}</span>
                      </div>
                      <div className="text-xs font-mono text-stone-500">{year}</div>
                      <div className="text-xs text-stone-500 hidden lg:block">{medium}</div>
                      <div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {status}
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

      {/* Logos */}
      <div className="border-y border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-stone-600 uppercase tracking-widest text-center mb-8">Designed for institutions of all sizes</p>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {['National museums','Regional galleries','Local heritage centres','University collections','Independent museums'].map(name => (
              <span key={name} className="font-serif italic text-stone-600 text-lg">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">Everything you need</p>
          <h2 className="font-serif text-5xl italic font-normal mb-4">Built for curators,<br />not developers.</h2>
          <p className="text-stone-400 font-light text-lg max-w-xl mb-16">A complete platform for managing your collection and presenting it to the world.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
            {[
              { icon: '🗄️', title: 'Collection CMS', desc: 'Add, edit and organise every item in your collection. Rich metadata fields, status tracking, and image uploads.' },
              { icon: '🌐', title: 'Public Website', desc: 'Your collection beautifully presented online. Visitors can browse, search, and filter your objects with a world-class collection interface.' },
              { icon: '🎨', title: 'Brand Customisation', desc: 'Upload your logo, set your colours, write your story. Your public site looks like yours — Vitrine stays invisible to visitors.' },
              { icon: '🎫', title: 'Ticket Booking', desc: 'Accept ticket bookings online, manage capacity, and issue digital confirmations. Works for free entry and paid exhibitions.' },
              { icon: '👥', title: 'Staff & Roles', desc: 'Invite your team with role-based access. Curators manage items, volunteers add records, directors see everything.' },
              { icon: '📊', title: 'Analytics', desc: 'Understand your collection at a glance — breakdowns by medium, culture, status, and growth over time.' },
            ].map(f => (
              <div key={f.title} className="bg-stone-950 p-8 hover:bg-stone-900 transition-colors">
                <div className="text-3xl mb-5">{f.icon}</div>
                <div className="font-serif text-xl italic text-white mb-3">{f.title}</div>
                <p className="text-sm text-stone-500 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guide CTA */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">How it works</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <h2 className="font-serif text-4xl italic font-normal mb-3">Want to see it in action?</h2>
              <p className="text-stone-400 font-light max-w-lg">Step-by-step guides that walk you through every feature — from adding your first object to selling tickets for an event.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link href="/guide/essentials" className="group bg-stone-900/50 border border-white/8 rounded-2xl p-7 hover:bg-stone-900 hover:border-white/15 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-2">
                  <span className="text-xs font-mono bg-stone-800 text-stone-400 px-2.5 py-1 rounded-full border border-white/5">Community</span>
                  <span className="text-xs font-mono bg-stone-800 text-stone-400 px-2.5 py-1 rounded-full border border-white/5">Hobbyist</span>
                </div>
                <span className="text-stone-600 group-hover:text-stone-400 transition-colors font-mono text-sm">→</span>
              </div>
              <h3 className="font-serif text-2xl italic font-normal mb-2">Essentials guide</h3>
              <p className="text-stone-500 text-sm font-light leading-relaxed mb-5">Everything you need to catalogue your collection and publish it online. Adding objects, customising your site, managing your account.</p>
              <div className="flex flex-wrap gap-2">
                {['Getting started', 'Your collection', 'Public site', 'Customisation', 'Settings'].map(t => (
                  <span key={t} className="text-xs font-mono text-stone-600 bg-white/4 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </Link>
            <Link href="/guide/professional" className="group bg-stone-900/50 border border-amber-500/15 rounded-2xl p-7 hover:bg-stone-900 hover:border-amber-500/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">Professional</span>
                  <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">Institution</span>
                  <span className="text-xs font-mono bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">Enterprise</span>
                </div>
                <span className="text-stone-600 group-hover:text-amber-400 transition-colors font-mono text-sm">→</span>
              </div>
              <h3 className="font-serif text-2xl italic font-normal mb-2">Professional guide</h3>
              <p className="text-stone-500 text-sm font-light leading-relaxed mb-5">The complete platform walkthrough — analytics, event ticketing, compliance documentation, staff management, and more.</p>
              <div className="flex flex-wrap gap-2">
                {['Collection at scale', 'Analytics', 'Ticketing', 'Staff & roles', 'Compliance'].map(t => (
                  <span key={t} className="text-xs font-mono text-stone-600 bg-white/4 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-4">Simple pricing</p>
          <h2 className="font-serif text-5xl italic font-normal mb-4">Right-sized for<br />every museum.</h2>
          <p className="text-stone-400 font-light text-lg max-w-xl mb-16">From village heritage centres to national institutions.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
            {[
              {
                tier: 'Community',
                price: 'Free',
                priceNote: null,
                desc: 'Perfect for small local museums and heritage societies.',
                features: ['Up to 100 collection items', 'Public collection website', 'Basic site customisation', 'Purchase price & value tracking'],
                missing: ['Collections compliance tools', 'Analytics', 'Staff management'],
                cta: 'Start free →',
                ctaHref: '/signup',
                learnMoreHref: '/plans/community',
                featured: false,
                muted: true,
              },
              {
                tier: 'Hobbyist',
                price: '£5',
                priceNote: '/ month',
                desc: 'For hobbyist collectors who want to showcase more.',
                features: ['Up to 500 collection items', 'Public collection website', 'Core site customisation', 'Purchase price & value tracking', 'Wanted list'],
                missing: ['Visit & About pages', 'Collections compliance tools', 'Analytics', 'Staff management'],
                cta: 'Get started →',
                ctaHref: '/signup',
                learnMoreHref: '/plans/hobbyist',
                featured: false,
                muted: false,
              },
              {
                tier: 'Professional',
                price: '£79',
                priceNote: '/ month',
                desc: 'For regional museums ready to go further online.',
                features: ['Up to 5,000 collection items', 'Full public website', '10 staff accounts', 'Collections compliance tools', 'Analytics', '1 GB document storage'],
                missing: ['Priority support'],
                cta: 'Get started →',
                ctaHref: '/signup',
                learnMoreHref: '/plans/professional',
                featured: true,
                muted: false,
              },
              {
                tier: 'Institution',
                price: '£349',
                priceNote: '/ month',
                desc: 'For regional and national collections.',
                features: ['Up to 100,000 collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Priority support', '10 GB document storage'],
                missing: [],
                cta: 'Get started →',
                ctaHref: '/signup',
                learnMoreHref: '/plans/institution',
                featured: false,
                muted: false,
              },
              {
                tier: 'Enterprise',
                price: 'Custom',
                priceNote: null,
                desc: 'For national institutions and large-scale collections.',
                features: ['Unlimited collection items', 'Full public website', 'Unlimited staff accounts', 'Collections compliance tools', 'Advanced analytics', 'Dedicated support', 'Unlimited document storage'],
                missing: [],
                cta: 'Contact us →',
                ctaHref: '/contact/enterprise',
                learnMoreHref: '/plans/enterprise',
                featured: false,
                muted: true,
              },
            ].map(p => (
              <div key={p.tier} className={`rounded-xl border relative flex flex-col ${p.muted ? 'p-6 scale-[0.97] origin-top' : 'p-8'} ${p.featured ? 'bg-stone-900 border-amber-500/30' : p.muted ? 'bg-stone-900/30 border-white/5' : 'bg-stone-900/50 border-white/8'}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-xs font-mono px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2">{p.tier}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-serif text-4xl text-white">{p.price}</span>
                  {p.priceNote && <span className="text-stone-500 text-sm">{p.priceNote}</span>}
                </div>
                <p className="text-sm text-stone-500 font-light mb-6">{p.desc}</p>
                <hr className={`mb-6 ${p.muted ? 'border-white/5' : 'border-white/8'}`} />
                <ul className="space-y-2.5 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-stone-300">
                      <span className="text-amber-500 text-xs">✓</span> {f}
                    </li>
                  ))}
                  {p.missing.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-stone-600">
                      <span className="text-xs">–</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-col gap-2">
                  <Link
                    href={p.learnMoreHref}
                    className="block text-center font-mono text-xs py-2 text-stone-600 hover:text-stone-400 transition-colors"
                  >
                    Learn more
                  </Link>
                  <Link
                    href={p.ctaHref}
                    className={`block text-center font-mono text-sm py-2.5 rounded transition-colors ${p.featured ? 'bg-amber-500 hover:bg-amber-400 text-stone-950' : 'border border-white/10 hover:border-white/20 text-stone-300'}`}
                  >
                    {p.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />

    </div>
  )
}