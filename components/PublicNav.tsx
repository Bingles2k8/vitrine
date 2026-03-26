'use client'

import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
  { label: 'Discover', href: '/discover' },
  { label: 'Blog', href: '/blog' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
]

export default function PublicNav({ activePath }: { activePath?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">
            Vitrine<span className="text-amber-500">.</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${activePath === link.href ? 'text-white' : 'text-stone-400 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-stone-400 hover:text-white transition-colors font-mono">
              Sign in
            </Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </Link>
            {/* Hamburger */}
            <button
              onClick={() => setOpen(o => !o)}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-200 ${open ? 'rotate-45 translate-y-[7px]' : ''}`} />
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-px w-5 bg-stone-400 transition-all duration-200 ${open ? '-rotate-45 -translate-y-[7px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed top-16 left-0 right-0 z-40 bg-stone-950 border-b border-white/10 md:hidden">
            <div className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`py-3 text-sm font-mono border-b border-white/5 last:border-0 transition-colors ${activePath === link.href ? 'text-white' : 'text-stone-400'}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="text-center py-2.5 border border-white/10 rounded text-sm font-mono text-stone-400 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="text-center py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono rounded transition-colors">
                  Start for free →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
