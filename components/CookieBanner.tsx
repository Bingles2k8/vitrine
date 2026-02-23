'use client'

import { useState, useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Link from 'next/link'

export default function CookieBanner() {
  const [consent, setConsent] = useState<string | null>(null)
  const [show, setShow] = useState(false)

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
                className="text-xs font-mono px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded hover:bg-stone-700 dark:hover:bg-stone-200 transition-colors"
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
