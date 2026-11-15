'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const LINKS = [
  { label: 'Discover', href: '/discover' },
  { label: 'Guides', href: '/guide/essentials' },
  { label: 'Blog', href: '/blog' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/plans' },
  { label: 'About', href: '/about' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <nav aria-label="Main">
      <div className="wrap">
        <Link className="logo" href="/">Vitrine</Link>
        <div className="links">
          {LINKS.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        </div>
        <div className="navr">
          <button type="button" className="menubtn" aria-expanded={open} aria-controls="ah-menu" onClick={() => setOpen(o => !o)}>
            {open ? 'Close' : 'Menu'}
          </button>
          <Link className="login" href="/login">Sign in</Link>
          <Link className="btn solid" href="/signup">Start free</Link>
        </div>
      </div>
      {open && (
        <div className="mpanel" id="ah-menu">
          {LINKS.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>)}
          <Link className="mlogin" href="/login" onClick={() => setOpen(false)}>Sign in</Link>
        </div>
      )}
    </nav>
  )
}
