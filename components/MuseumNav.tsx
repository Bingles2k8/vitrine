'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

interface MuseumNavProps {
  slug: string
  museumName: string
  logoEmoji: string
  logoImageUrl?: string | null
  navClass: string
  navTextClass: string
  navLinkClass: string
  accent: string
  headingStyle: React.CSSProperties
  hasEvents: boolean
  hasVisitInfo: boolean
}

export default function MuseumNav({
  slug, museumName, logoEmoji, logoImageUrl,
  navClass, navTextClass, navLinkClass,
  accent, headingStyle, hasEvents, hasVisitInfo,
}: MuseumNavProps) {
  const pathname = usePathname()
  const isCollection = pathname === `/museum/${slug}`
  const isEvents = pathname.startsWith(`/museum/${slug}/events`)
  const isVisit = pathname === `/museum/${slug}/visit`

  function linkClass(active: boolean) {
    return active
      ? `text-sm border-b pb-0.5 ${navTextClass}`
      : `text-sm transition-colors ${navLinkClass}`
  }

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md ${navClass}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={`/museum/${slug}`} className={`text-xl flex items-center gap-2 ${navTextClass}`} style={headingStyle}>
          {logoImageUrl
            ? <img src={logoImageUrl} alt={museumName} className="h-8 w-8 rounded object-cover" />
            : logoEmoji
          }
          {museumName}
        </Link>
        <div className="flex items-center gap-8">
          <Link
            href={`/museum/${slug}`}
            className={linkClass(isCollection)}
            style={isCollection ? { borderColor: accent } : {}}
          >
            Collection
          </Link>
          {hasEvents && (
            <Link
              href={`/museum/${slug}/events`}
              className={linkClass(isEvents)}
              style={isEvents ? { borderColor: accent } : {}}
            >
              Events
            </Link>
          )}
          {hasVisitInfo && (
            <Link
              href={`/museum/${slug}/visit`}
              className={linkClass(isVisit)}
              style={isVisit ? { borderColor: accent } : {}}
            >
              Plan Your Visit
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
