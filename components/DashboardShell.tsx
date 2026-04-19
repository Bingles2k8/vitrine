'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import CommandPalette from '@/components/CommandPalette'
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp'
import { useGoShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useIsMobile } from '@/hooks/useIsMobile'

interface DashboardShellProps {
  museum: any
  activePath: string
  onSignOut: () => void
  isOwner?: boolean
  staffAccess?: string | null
  children: React.ReactNode
}

export default function DashboardShell({
  museum, activePath, onSignOut, isOwner, staffAccess, children
}: DashboardShellProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // g+key navigation shortcuts
  useGoShortcuts({
    o: () => router.push('/dashboard'),
    e: () => router.push('/dashboard/entry'),
    l: () => router.push('/dashboard/loans'),
    s: () => router.push('/dashboard/staff'),
    b: () => router.push('/dashboard/site'),
    p: () => router.push('/dashboard/plan'),
    v: () => router.push('/dashboard/events'),
  })

  const openSidebar = useCallback(() => setSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobile, sidebarOpen])

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex overflow-x-clip">
      {!isMobile && (
        <Sidebar
          museum={museum}
          activePath={activePath}
          onSignOut={onSignOut}
          isOwner={isOwner}
          staffAccess={staffAccess}
        />
      )}

      {isMobile && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeSidebar}
          />

          <div
            className={`fixed top-0 left-0 bottom-0 z-50 w-56 transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <button
              onClick={closeSidebar}
              className="absolute top-4 right-3 z-10 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              aria-label="Close sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>

            <Sidebar
              museum={museum}
              activePath={activePath}
              onSignOut={onSignOut}
              isOwner={isOwner}
              staffAccess={staffAccess}
              onNavigate={closeSidebar}
            />
          </div>
        </>
      )}

      <main className={`${isMobile ? '' : 'ml-56'} flex-1 flex flex-col min-w-0`}>
        {isMobile && (
          <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center px-4 sticky top-0 z-30">
            <button
              onClick={openSidebar}
              className="mr-3 w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900 dark:hover:text-stone-300 transition-colors"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </button>
            <span className="font-serif text-xl italic text-stone-900 dark:text-stone-100">
              Vitrine<span className="text-amber-600">.</span>
            </span>
            {museum?.slug && (
              <a
                href={`/museum/${museum.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-mono text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded transition-colors"
              >
                View public site ↗
              </a>
            )}
          </div>
        )}
        {!isMobile && museum?.slug && (
          <a
            href={`/museum/${museum.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed top-3 right-6 z-40 text-xs font-mono text-stone-600 dark:text-stone-300 bg-white/90 dark:bg-stone-950/90 backdrop-blur border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded shadow-sm hover:border-stone-400 dark:hover:border-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            View public site ↗
          </a>
        )}
        {museum?.payment_past_due && (
          <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span>Your last payment failed. Please update your payment method to keep your plan active.</span>
            <a href="/dashboard/plan" className="underline font-medium whitespace-nowrap">Update billing →</a>
          </div>
        )}
        {children}
      </main>
      <CommandPalette museumId={museum?.id ?? null} />
      <KeyboardShortcutsHelp />
    </div>
  )
}
