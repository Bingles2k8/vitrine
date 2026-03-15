import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-serif text-7xl italic text-amber-500 mb-6">404</p>
        <h1 className="text-2xl font-semibold mb-3">Page not found</h1>
        <p className="text-stone-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="text-sm text-stone-400 hover:text-white transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors"
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
