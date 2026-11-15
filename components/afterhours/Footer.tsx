import Link from 'next/link'

const LINKS = [
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Blog', href: '/blog' },
  { label: 'Free tools', href: '/tools' },
  { label: 'Discover', href: '/discover' },
  { label: 'Guide', href: '/guide/essentials' },
  { label: 'Who is Vitrine for?', href: '/for' },
  { label: 'Compare', href: '/compare' },
  { label: 'Compliance', href: '/compliance' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fr">
          <div>
            <Link className="logo" href="/">Vitrine</Link>
            <p>Collection management for museums and collectors.</p>
            <div className="fsoc">
              <a href="https://apps.apple.com/app/id6771412604" target="_blank" rel="noopener noreferrer" aria-label="Vitrine Capture on the App Store">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.06 2.098-.987 3.938-.987 1.837 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.036-.012-3.19-1.226-3.226-4.85-.03-3.026 2.48-4.48 2.594-4.545-1.418-2.09-3.63-2.324-4.406-2.376-2.006-.155-3.686 1.09-4.638 1.09zm3.63-3.304c.837-1.012 1.4-2.42 1.245-3.822-1.2.05-2.65.802-3.514 1.813-.775.898-1.454 2.333-1.272 3.71 1.343.104 2.708-.682 3.54-1.7z" />
                </svg>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.bingles.vitrinecapture" target="_blank" rel="noopener noreferrer" aria-label="Vitrine Capture on Google Play">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.6 2.3a1 1 0 0 0-.6.92v17.56a1 1 0 0 0 .6.92l10.02-9.7L3.6 2.3z" />
                  <path d="M16.9 8.9 5.6 2.4l9.06 8.77L16.9 8.9z" />
                  <path d="m14.66 12.83-9.06 8.77 11.3-6.5-2.24-2.27z" />
                  <path d="m20.4 10.85-2.86-1.64-2.45 2.79 2.45 2.48 2.86-1.64a1 1 0 0 0 0-1.99z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/vitrinecms/" target="_blank" rel="noopener noreferrer" aria-label="Vitrine on Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
          <ul>
            {LINKS.map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
          </ul>
        </div>
        <p className="legal">© 2026 Composition Limited.</p>
        <span className="fwm" aria-hidden="true">Vitrine</span>
      </div>
    </footer>
  )
}
