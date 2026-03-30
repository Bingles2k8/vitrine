'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

interface MuseumNavProps {
  slug: string
  museumName: string
  logoEmoji: string
  logoImageUrl?: string | null
  navClass: string
  navTextClass: string
  navLinkClass: string
  navBg: string
  accent: string
  headingStyle: React.CSSProperties
  hasEvents: boolean
  hasVisitInfo: boolean
  hasWanted: boolean
}

export default function MuseumNav({
  slug, museumName, logoEmoji, logoImageUrl,
  navClass, navTextClass, navLinkClass, navBg,
  accent, headingStyle, hasEvents, hasVisitInfo, hasWanted,
}: MuseumNavProps) {
  const pathname = usePathname()
  const isCollection = pathname === `/museum/${slug}`
  const isEvents = pathname.startsWith(`/museum/${slug}/events`)
  const isVisit = pathname === `/museum/${slug}/visit`
  const isWanted = pathname === `/museum/${slug}/wanted`
  const [mobileOpen, setMobileOpen] = useState(false)

  function linkClass(active: boolean) {
    return active
      ? `text-sm border-b pb-0.5 ${navTextClass}`
      : `text-sm transition-colors ${navLinkClass}`
  }

  const navLinks = (
    <>
      <Link
        href={`/museum/${slug}`}
        className={linkClass(isCollection)}
        style={isCollection ? { borderColor: accent } : {}}
        onClick={() => setMobileOpen(false)}
      >
        Collection
      </Link>
      {hasEvents && (
        <Link
          href={`/museum/${slug}/events`}
          className={linkClass(isEvents)}
          style={isEvents ? { borderColor: accent } : {}}
          onClick={() => setMobileOpen(false)}
        >
          Events
        </Link>
      )}
      {hasVisitInfo && (
        <Link
          href={`/museum/${slug}/visit`}
          className={linkClass(isVisit)}
          style={isVisit ? { borderColor: accent } : {}}
          onClick={() => setMobileOpen(false)}
        >
          Plan Your Visit
        </Link>
      )}
      {hasWanted && (
        <Link
          href={`/museum/${slug}/wanted`}
          className={linkClass(isWanted)}
          style={isWanted ? { borderColor: accent } : {}}
          onClick={() => setMobileOpen(false)}
        >
          Wanted
        </Link>
      )}
    </>
  )

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md ${navClass}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={`/museum/${slug}`}
          className={`text-xl flex items-center gap-2 min-w-0 mr-4 ${navTextClass}`}
          style={headingStyle}
          onClick={() => setMobileOpen(false)}
        >
          {logoImageUrl
            ? <img src={logoImageUrl} alt={museumName} className="h-8 w-8 rounded object-cover flex-shrink-0" />
            : <span className="flex-shrink-0">{logoEmoji}</span>
          }
          <span className="truncate">{museumName}</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks}
        </div>

        {/* Mobile hamburger button */}
        <button
          className={`md:hidden flex-shrink-0 p-2 -mr-2 transition-opacity hover:opacity-70 ${navTextClass}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t backdrop-blur-md" style={{ background: navBg, borderColor: 'rgba(128,128,128,0.15)' }}>
          <div className="max-w-6xl mx-auto px-6 py-2 flex flex-col">
            <Link
              href={`/museum/${slug}`}
              className={`py-3 text-sm border-b ${navTextClass}`}
              style={{ borderColor: 'rgba(128,128,128,0.1)', ...(isCollection ? { borderBottomColor: accent, borderBottomWidth: '1px' } : {}) }}
              onClick={() => setMobileOpen(false)}
            >
              Collection
            </Link>
            {hasEvents && (
              <Link
                href={`/museum/${slug}/events`}
                className={`py-3 text-sm border-b ${isEvents ? navTextClass : navLinkClass}`}
                style={{ borderColor: 'rgba(128,128,128,0.1)' }}
                onClick={() => setMobileOpen(false)}
              >
                Events
              </Link>
            )}
            {hasVisitInfo && (
              <Link
                href={`/museum/${slug}/visit`}
                className={`py-3 text-sm border-b ${isVisit ? navTextClass : navLinkClass}`}
                style={{ borderColor: 'rgba(128,128,128,0.1)' }}
                onClick={() => setMobileOpen(false)}
              >
                Plan Your Visit
              </Link>
            )}
            {hasWanted && (
              <Link
                href={`/museum/${slug}/wanted`}
                className={`py-3 text-sm ${isWanted ? navTextClass : navLinkClass}`}
                onClick={() => setMobileOpen(false)}
              >
                Wanted
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
