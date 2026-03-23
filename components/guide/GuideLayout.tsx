'use client'

import { useState } from 'react'
import type React from 'react'

const ICONS: Record<string, string> = {
  rocket: '🚀',
  library: '🏛️',
  globe: '🌐',
  palette: '🎨',
  'bar-chart': '📊',
  ticket: '🎟️',
  users: '👥',
  shield: '🛡️',
  settings: '⚙️',
}

const prose = [
  '[&_h2]:font-serif [&_h2]:text-3xl [&_h2]:italic [&_h2]:font-normal [&_h2]:mb-2 [&_h2]:text-white',
  '[&_h3]:font-mono [&_h3]:text-sm [&_h3]:text-stone-300 [&_h3]:mt-8 [&_h3]:mb-3',
  '[&_p]:text-stone-400 [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-sm',
  '[&_ul]:space-y-2 [&_ul]:mb-4',
  '[&_ul_li]:text-sm [&_ul_li]:text-stone-300 [&_ul_li]:flex [&_ul_li]:gap-2',
  '[&_ul_li]:before:content-["✓"] [&_ul_li]:before:text-amber-500 [&_ul_li]:before:flex-shrink-0',
  '[&_strong]:text-stone-200 [&_strong]:font-medium',
  '[&_code]:text-amber-400 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-amber-500/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded',
  '[&_hr]:border-white/8 [&_hr]:my-8',
  '[&_table]:w-full [&_table]:text-sm [&_table]:mb-6',
  '[&_th]:text-left [&_th]:font-mono [&_th]:text-xs [&_th]:text-stone-500 [&_th]:uppercase [&_th]:tracking-widest [&_th]:pb-2 [&_th]:border-b [&_th]:border-white/8',
  '[&_td]:py-2 [&_td]:border-b [&_td]:border-white/5 [&_td]:text-stone-400 [&_td]:text-xs',
].join(' ')

interface SectionItem {
  slug: string
  title: string
  icon: string
  description: string
  content: React.ReactNode
}

interface Props {
  sections: SectionItem[]
  title: string
  subtitle: string
  tierBadges: string[]
}

export default function GuideLayout({ sections, title, subtitle, tierBadges }: Props) {
  const [activeSlug, setActiveSlug] = useState(sections[0]?.slug ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)

  const active = sections.find(s => s.slug === activeSlug) ?? sections[0]

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="font-serif text-xl italic">Vitrine<span className="text-amber-500">.</span></a>
          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm text-stone-400 hover:text-white transition-colors font-mono hidden sm:block">Sign in</a>
            <a href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </a>
          </div>
        </div>
      </nav>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header className="pt-28 pb-10 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <a href="/#pricing" className="inline-flex items-center gap-2 text-xs font-mono text-stone-500 hover:text-stone-300 transition-colors mb-6">
            ← All plans
          </a>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {tierBadges.map(t => (
              <span key={t} className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-4xl italic font-normal mb-2">{title}</h1>
          <p className="text-stone-400 font-light">{subtitle}</p>
        </div>
      </header>

      {/* ── Mobile section picker ─────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-16 z-40 bg-stone-950 border-b border-white/5 px-6 py-3">
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="w-full flex items-center justify-between bg-stone-900 border border-white/8 rounded-lg px-4 py-3 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{ICONS[active?.icon] ?? '📄'}</span>
            <span className="text-sm font-mono text-stone-200">{active?.title}</span>
          </div>
          <span className={`text-stone-500 text-xs transition-transform duration-200 ${mobileOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {mobileOpen && (
          <div className="absolute left-6 right-6 top-full mt-1 bg-stone-900 border border-white/8 rounded-xl overflow-hidden shadow-2xl z-50">
            {sections.map(s => (
              <button
                key={s.slug}
                onClick={() => { setActiveSlug(s.slug); setMobileOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 last:border-0 transition-colors ${
                  s.slug === activeSlug ? 'bg-amber-500/10 text-amber-400' : 'hover:bg-white/3 text-stone-400'
                }`}
              >
                <span className="text-base flex-shrink-0">{ICONS[s.icon] ?? '📄'}</span>
                <div>
                  <div className="text-sm font-mono">{s.title}</div>
                  <div className="text-xs text-stone-600">{s.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main: sidebar + content ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <nav className="sticky top-28 space-y-1">
            {sections.map(s => {
              const isActive = s.slug === activeSlug
              return (
                <button
                  key={s.slug}
                  onClick={() => setActiveSlug(s.slug)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'hover:bg-white/4 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{ICONS[s.icon] ?? '📄'}</span>
                  <div>
                    <div className={`text-sm font-mono ${isActive ? 'text-amber-400' : ''}`}>{s.title}</div>
                    <div className="text-xs text-stone-600 leading-snug mt-0.5">{s.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Content — all sections pre-rendered server-side, show/hide with CSS */}
        <main className="flex-1 min-w-0 max-w-3xl">
          {sections.map(s => (
            <div key={s.slug} className={s.slug === activeSlug ? 'block' : 'hidden'}>
              <div className="mb-8">
                <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-2">
                  {ICONS[s.icon]} {s.title}
                </p>
                <p className="text-stone-500 text-sm">{s.description}</p>
              </div>
              <div className={prose}>
                {s.content}
              </div>
            </div>
          ))}
        </main>

      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6 mt-16">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="font-serif italic text-stone-600">Vitrine<span className="text-amber-500">.</span></span>
          <div className="flex gap-5">
            <a href="/privacy" className="text-xs text-stone-600 hover:text-stone-400 font-mono transition-colors">Privacy</a>
            <a href="/terms" className="text-xs text-stone-600 hover:text-stone-400 font-mono transition-colors">Terms</a>
          </div>
          <span className="text-xs text-stone-700 font-mono">© 2026 Composition Limited.</span>
        </div>
      </footer>

    </div>
  )
}
