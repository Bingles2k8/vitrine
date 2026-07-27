'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

export type SpotObject = {
  id: string
  title: string
  museum: string
  slug: string
  image: string | null
  emoji: string
}

const PROMPTS = ['a Leica', 'ammonite', 'Beatles', 'Braun', 'Victorian', 'a pocket watch', 'militaria']

/**
 * The homepage is the search. Typing filters real published objects
 * instantly — and an empty result is the strongest pitch on the page.
 */
export default function Spotlight({ objects }: { objects: SpotObject[] }) {
  const [q, setQ] = useState('')
  const [promptI, setPromptI] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (q) return
    const t = setInterval(() => setPromptI(n => (n + 1) % PROMPTS.length), 2600)
    return () => clearInterval(t)
  }, [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') setQ('')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return objects
    return objects.filter(
      o => o.title.toLowerCase().includes(term) || o.museum.toLowerCase().includes(term)
    )
  }, [q, objects])

  return (
    <div>
      {/* The search itself */}
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative border-b-2 border-white/25 focus-within:border-white">
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search published collections"
            className="type-book w-full bg-transparent py-6 pr-24 text-[1.8rem] text-white outline-none placeholder:text-white/25 sm:text-[2.6rem]"
            placeholder={`Search for ${PROMPTS[promptI]}…`}
          />
          <div className="type-mono absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-white/30">
            {q ? (
              <button onClick={() => setQ('')} className="hover:text-white">
                clear ✕
              </button>
            ) : (
              <span className="hidden sm:inline">press /</span>
            )}
          </div>
        </div>

        <div className="type-mono mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-white/35">
          <span>
            {results.length.toLocaleString()} of {objects.length.toLocaleString()} published objects
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">All catalogued in Vitrine by their owners</span>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto mt-12 max-w-none px-2">
        {results.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {results.slice(0, 48).map(o => (
              <Link
                key={o.id}
                href={o.slug ? `/museum/${o.slug}` : '/discover'}
                className="group relative block aspect-square overflow-hidden bg-[#111]"
              >
                {o.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={o.image}
                    alt={o.title}
                    loading="lazy"
                    className="h-full w-full object-cover grayscale-[35%] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-3xl opacity-60">
                    {o.emoji}
                  </span>
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/45 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="type-book line-clamp-2 text-[13px] leading-snug text-white">{o.title}</div>
                  <div className="type-mono mt-1 truncate text-[9px] uppercase tracking-[0.14em] text-white/50">
                    {o.museum}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* The best sales pitch on the page */
          <div className="mx-auto max-w-2xl px-4 py-20 text-center">
            <p className="type-mono mb-6 text-[11px] uppercase tracking-[0.22em] text-white/30">
              No results for &ldquo;{q}&rdquo;
            </p>
            <h2 className="type-book text-[2rem] leading-tight text-white sm:text-[2.8rem]">
              Nobody has catalogued that yet.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-white/55">
              Which is the whole problem. Almost everything anyone owns is undocumented — no
              photographs, no valuation, no condition, no proof. Be the first record of it.
            </p>
            <Link
              href="/signup"
              className="type-mono mt-9 inline-block bg-white px-9 py-4 text-[12px] uppercase tracking-[0.16em] text-black hover:bg-white/85"
            >
              Catalogue it yourself — free
            </Link>
          </div>
        )}
      </div>

      {results.length > 48 && (
        <p className="type-mono mt-8 text-center text-[11px] uppercase tracking-[0.16em] text-white/30">
          Showing 48 ·{' '}
          <Link href="/discover" className="underline underline-offset-4 hover:text-white">
            browse everything in Discover →
          </Link>
        </p>
      )}
    </div>
  )
}
