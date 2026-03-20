'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

interface MuseumSidebarProps {
  slug: string
  museumName: string
  logoEmoji?: string
  logoImageUrl?: string
  accent: string
  headingStyle: React.CSSProperties
  contentHeading: string
  contentBody: string
  contentMuted: string
  contentBorder: string
  pageBg: string
  hasEvents: boolean
  hasVisitInfo: boolean
  socialLinks: { url: string; icon: React.ReactNode }[]
}

export default function MuseumSidebar({
  slug,
  museumName,
  logoEmoji,
  logoImageUrl,
  accent,
  headingStyle,
  contentHeading,
  contentBody,
  contentMuted,
  contentBorder,
  pageBg,
  hasEvents,
  hasVisitInfo,
  socialLinks,
}: MuseumSidebarProps) {
  const pathname = usePathname()
  const isCollection = !pathname.includes('/visit') && !pathname.includes('/events')
  const isEvents = pathname.includes('/events')
  const isVisit = pathname.includes('/visit')

  const navItems = [
    { href: `/museum/${slug}`, label: 'Collection', active: isCollection, always: true },
    { href: `/museum/${slug}/events`, label: 'Events', active: isEvents, always: hasEvents },
    { href: `/museum/${slug}/visit`, label: 'Visit', active: isVisit, always: hasVisitInfo },
  ].filter(i => i.always)

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40 overflow-y-auto"
      style={{
        width: '240px',
        background: pageBg,
        borderRight: `1px solid ${contentBorder}`,
      }}
    >
      {/* Logo + museum name */}
      <div className="px-8 pt-10 pb-8">
        <Link href={`/museum/${slug}`} className="block group">
          <div className="mb-4">
            {logoImageUrl ? (
              <img src={logoImageUrl} alt={museumName} className="h-10 w-10 object-contain rounded" />
            ) : (
              <span className="text-3xl">{logoEmoji || '🏛️'}</span>
            )}
          </div>
          <div
            className="text-sm leading-snug group-hover:opacity-70 transition-opacity"
            style={{ ...headingStyle, color: contentHeading }}
          >
            {museumName}
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="mx-8 mb-6" style={{ height: '1px', background: contentBorder }} />

      {/* Nav links */}
      <nav className="flex-1 px-8">
        <div className="flex flex-col gap-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-mono uppercase tracking-widest py-2 transition-colors"
              style={{
                color: item.active ? accent : contentMuted,
                borderLeft: item.active ? `2px solid ${accent}` : '2px solid transparent',
                paddingLeft: '12px',
                marginLeft: '-2px',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="px-8 pb-8 pt-4 flex items-center gap-3">
          {socialLinks.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: contentMuted }}
              className="hover:opacity-70 transition-opacity"
            >
              {s.icon}
            </a>
          ))}
        </div>
      )}

      {/* Powered by */}
      <div className="px-8 pb-6">
        <div className="text-xs font-mono" style={{ color: contentMuted, opacity: 0.5 }}>
          Vitrine
        </div>
      </div>
    </aside>
  )
}
