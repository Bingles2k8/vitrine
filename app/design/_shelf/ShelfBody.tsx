import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import type { Theme } from './theme'

const POINTS = [
  {
    title: 'Every object, one record',
    body: 'Photographs, measurements, what you paid, where it came from and where it is now. The things an insurer, a valuer or an executor will ask for.',
  },
  {
    title: 'Findable in seconds',
    body: 'Search the whole collection by anything you can remember about it. Location down to the shelf, so you never turn the house over again.',
  },
  {
    title: 'A page worth showing',
    body: 'Publish the parts you want public and keep valuations private. Your collection gets a site; your numbers stay yours.',
  },
]

/**
 * Everything below the fold. Shared so a page that changes theme at runtime and
 * a page with a fixed one render exactly the same thing.
 */
export default function ShelfBody({ theme, dark }: { theme: Theme; dark: boolean }) {
  return (
    <>
      {/* A band whose hero ends on a different colour from its page needs the
          handover made somewhere. Without this, midday's black foot butts
          straight into a white section and the join reads as a mistake. */}
      {theme.footRgb && (
        <div
          aria-hidden
          className="h-32 w-full"
          style={{
            background: `linear-gradient(180deg, rgb(${theme.footRgb}) 0%, rgba(${theme.footRgb},0.55) 30%, rgba(${theme.footRgb},0.18) 60%, rgba(${theme.footRgb},0) 100%)`,
          }}
        />
      )}
      <section className={`border-t ${theme.sectionBorder}`}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className={`mb-4 font-mono text-xs uppercase tracking-widest ${theme.eyebrow}`}>
            Everything a collector needs
          </p>
          <h2 className={`mb-12 font-serif text-4xl italic leading-tight sm:text-5xl ${theme.headline}`}>
            One place for
            <br />
            your whole collection.
          </h2>

          <div className={`grid gap-px overflow-hidden rounded-xl sm:grid-cols-3 ${dark ? 'bg-white/5' : 'bg-stone-900/10'}`}>
            {POINTS.map(p => (
              <div key={p.title} className={`p-8 transition-colors ${theme.cardBg} ${theme.cardHover}`}>
                <div className={`mb-3 font-serif text-xl italic ${theme.cardTitle}`}>{p.title}</div>
                <p className={`text-sm leading-relaxed ${theme.body}`}>{p.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link href="/signup" className={`rounded px-6 py-3 font-mono text-sm transition-colors ${theme.ctaPrimary}`}>
              Start free →
            </Link>
            <Link href="/design" className={`font-mono text-xs uppercase tracking-widest transition-colors ${theme.fine}`}>
              Back to concepts
            </Link>
          </div>
        </div>
      </section>

      {dark ? (
        <PublicFooter />
      ) : (
        <footer className={`border-t px-6 py-8 ${theme.sectionBorder}`}>
          <div className={`mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between ${theme.body}`}>
            <span className="font-serif italic">
              Vitrine<span className={theme.logoDot}>.</span>
            </span>
            <span className={`font-mono text-xs ${theme.fine}`}>© 2026 Composition Limited.</span>
          </div>
        </footer>
      )}
    </>
  )
}
