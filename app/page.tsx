import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <h1 className="font-serif text-5xl italic text-stone-900 mb-4">Vitrine.</h1>
        <p className="text-stone-500 mb-8">Museum CMS — coming soon</p>
        <Link href="/login" className="bg-stone-900 text-white px-6 py-3 rounded text-sm font-mono">
          Sign in →
        </Link>
      </div>
    </main>
  )
}