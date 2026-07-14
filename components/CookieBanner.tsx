'use client'

import { useState, useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CookieBanner() {
  const [consent, setConsent] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  // The banner links to /privacy, which would put site chrome — and from there a
  // route to the pricing page — on the otherwise bare /legal/* pages the iOS app
  // opens. Those pages must offer no path to purchase outside the app (App Store
  // Guideline 3.1.3(f)), so the banner stays off. Nothing is lost: these pages
  // set no cookies and this also keeps Speed Insights off them.
  const isBareLegalPage = pathname?.startsWith('/legal/') ?? false

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent')
    if (stored) {
      setConsent(stored)
    } else {
      setShow(true)
    }
  }, [])

  function accept() {
    localStorage.setItem('cookie-consent', 'all')
    setConsent('all')
    setShow(false)
  }

  function reject() {
    localStorage.setItem('cookie-consent', 'essential')
    setConsent('essential')
    setShow(false)
  }

  if (isBareLegalPage) return null

  return (
    <>
      {consent === 'all' && <SpeedInsights />}
      {show && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 shadow-lg">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 flex-1 leading-relaxed">
              We use essential cookies to keep you signed in, and — with your consent — analytics to improve Vitrine.
              See our{' '}
              <Link href="/privacy" className="underline hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                Privacy Policy
              </Link>.
            </p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={reject}
                className="text-xs font-mono px-4 py-2 border border-stone-200 dark:border-stone-700 rounded text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Essential only
              </button>
              <button
                onClick={accept}
                className="text-xs font-mono px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 rounded transition-colors"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
