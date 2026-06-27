import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

type Crumb = { label: string; href: string }

export default function ToolShell({
  title,
  intro,
  crumbs,
  children,
  faqs,
}: {
  title: string
  intro: string
  crumbs?: Crumb[]
  children: React.ReactNode
  faqs?: { question: string; answer: string }[]
}) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <PublicNav />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-24">
        {/* Breadcrumb */}
        <nav className="text-xs text-stone-500 mb-6 flex flex-wrap gap-1.5">
          <Link href="/tools" className="hover:text-stone-300">Free tools</Link>
          {crumbs?.map((c) => (
            <span key={c.href}>
              <span className="text-stone-700">/</span>{' '}
              <Link href={c.href} className="hover:text-stone-300">{c.label}</Link>
            </span>
          ))}
        </nav>

        {/* Hero */}
        <h1 className="text-3xl sm:text-4xl font-serif leading-tight mb-4 mt-2">{title}</h1>
        <p className="text-stone-400 leading-relaxed max-w-2xl mb-10">{intro}</p>

        {children}

        {/* FAQ */}
        {faqs && faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="text-sm uppercase tracking-widest text-stone-500 mb-6">Questions</h2>
            <div className="space-y-5">
              {faqs.map((f) => (
                <div key={f.question} className="border-t border-white/5 pt-5">
                  <h3 className="text-stone-200 font-medium mb-1.5">{f.question}</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
