'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

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
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: `/museum/${slug}`, label: 'Collection', active: isCollection, always: true },
    { href: `/museum/${slug}/events`, label: 'Events', active: isEvents, always: hasEvents },
    { href: `/museum/${slug}/visit`, label: 'Visit', active: isVisit, always: hasVisitInfo },
  ].filter(i => i.always)

  const logoBlock = (
    <>
      <div className="mb-4">
        {logoImageUrl ? (
          <img src={logoImageUrl} alt={museumName} className="h-10 w-10 object-contain rounded" />
        ) : (
          <span className="text-3xl">{logoEmoji || '🏛️'}</span>
        )}
      </div>
      <div
        className="text-sm leading-snug"
        style={{ ...headingStyle, color: contentHeading }}
      >
        {museumName}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
        style={{ background: pageBg, borderBottom: `1px solid ${contentBorder}` }}
      >
        <Link href={`/museum/${slug}`} className="flex items-center gap-2 min-w-0" onClick={() => setOpen(false)}>
          {logoImageUrl ? (
            <img src={logoImageUrl} alt={museumName} className="h-7 w-7 object-contain rounded flex-shrink-0" />
          ) : (
            <span className="text-xl flex-shrink-0">{logoEmoji || '🏛️'}</span>
          )}
          <span className="text-sm truncate" style={{ ...headingStyle, color: contentHeading }}>{museumName}</span>
        </Link>
        <button
          className="flex-shrink-0 p-2 -mr-2 hover:opacity-70 transition-opacity"
          style={{ color: contentMuted }}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? (
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

      {/* Backdrop overlay (mobile only) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col z-40 overflow-y-auto transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{
          width: '240px',
          background: pageBg,
          borderRight: `1px solid ${contentBorder}`,
        }}
      >
        {/* Logo + museum name */}
        <div className="px-8 pt-20 md:pt-10 pb-8">
          <Link href={`/museum/${slug}`} className="block group" onClick={() => setOpen(false)}>
            <div className="group-hover:opacity-70 transition-opacity">
              {logoBlock}
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
                onClick={() => setOpen(false)}
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
    </>
  )
}
