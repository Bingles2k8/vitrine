import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-stone-500">
        <span className="font-serif italic">Vitrine<span className="text-amber-500">.</span></span>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/about" className="hover:text-stone-300 transition-colors">About</Link>
          <Link href="/faq" className="hover:text-stone-300 transition-colors">FAQ</Link>
          <Link href="/for" className="hover:text-stone-300 transition-colors">Who is Vitrine for?</Link>
          <Link href="/compare" className="hover:text-stone-300 transition-colors">Compare</Link>
          <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
        </div>
        <span className="text-xs text-stone-700 font-mono">© 2026 Composition Limited.</span>
      </div>
    </footer>
  )
}
