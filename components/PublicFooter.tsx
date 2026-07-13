import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-stone-500">
        <span className="font-serif italic">Vitrine<span className="text-amber-500">.</span></span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/about" className="hover:text-stone-300 transition-colors">About</Link>
          <Link href="/faq" className="hover:text-stone-300 transition-colors">FAQ</Link>
          <Link href="/blog" className="hover:text-stone-300 transition-colors">Blog</Link>
          <Link href="/tools" className="hover:text-stone-300 transition-colors">Free tools</Link>
          <Link href="/discover" className="hover:text-stone-300 transition-colors">Discover</Link>
          <Link href="/guide/essentials" className="hover:text-stone-300 transition-colors">Guide</Link>
          <Link href="/for" className="hover:text-stone-300 transition-colors">Who is Vitrine for?</Link>
          <Link href="/compare" className="hover:text-stone-300 transition-colors">Compare</Link>
          <Link href="/compliance" className="hover:text-stone-300 transition-colors">Compliance</Link>
          <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://play.google.com/store/apps/details?id=com.bingles.vitrinecapture"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vitrine Capture on Google Play"
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.6 2.3a1 1 0 0 0-.6.92v17.56a1 1 0 0 0 .6.92l10.02-9.7L3.6 2.3z" />
              <path d="M16.9 8.9 5.6 2.4l9.06 8.77L16.9 8.9z" />
              <path d="m14.66 12.83-9.06 8.77 11.3-6.5-2.24-2.27z" />
              <path d="m20.4 10.85-2.86-1.64-2.45 2.79 2.45 2.48 2.86-1.64a1 1 0 0 0 0-1.99z" />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/vitrinecms/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vitrine on Instagram"
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <span className="text-xs text-stone-700 font-mono">© 2026 Composition Limited.</span>
        </div>
      </div>
    </footer>
  )
}
