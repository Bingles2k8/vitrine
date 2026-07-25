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
            href="https://apps.apple.com/app/id6771412604"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vitrine Capture on the App Store"
            className="text-stone-500 hover:text-stone-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.06 2.098-.987 3.938-.987 1.837 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.036-.012-3.19-1.226-3.226-4.85-.03-3.026 2.48-4.48 2.594-4.545-1.418-2.09-3.63-2.324-4.406-2.376-2.006-.155-3.686 1.09-4.638 1.09zm3.63-3.304c.837-1.012 1.4-2.42 1.245-3.822-1.2.05-2.65.802-3.514 1.813-.775.898-1.454 2.333-1.272 3.71 1.343.104 2.708-.682 3.54-1.7z" />
            </svg>
          </a>
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
