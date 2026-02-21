import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function VisitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-stone-200 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/museum/${slug}`} className="font-serif text-2xl italic text-stone-900">
            {museum.logo_emoji} {museum.name}
          </Link>
          <div className="flex items-center gap-8">
            <Link href={`/museum/${slug}`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
              Collection
            </Link>
            <Link href={`/museum/${slug}/visit`} className="text-sm text-stone-900 border-b border-stone-900 pb-0.5">
              Plan Your Visit
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-xs uppercase tracking-widest text-stone-400 mb-3">Visit</div>
        <h1 className="font-serif text-5xl italic text-stone-900 mb-2">Plan Your Visit</h1>
        <p className="text-stone-400 font-light text-lg mb-12">We'd love to welcome you.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="border border-stone-200 rounded-lg p-6">
            <h2 className="font-serif text-xl italic text-stone-900 mb-4">Opening Hours</h2>
            {museum.opening_hours ? (
              <p className="text-sm text-stone-500 leading-relaxed">{museum.opening_hours}</p>
            ) : (
              <p className="text-sm text-stone-400 italic">Opening hours not set yet.</p>
            )}
          </div>

          <div className="border border-stone-200 rounded-lg p-6">
            <h2 className="font-serif text-xl italic text-stone-900 mb-4">Getting Here</h2>
            {museum.address ? (
              <p className="text-sm text-stone-500 leading-relaxed">{museum.address}</p>
            ) : (
              <p className="text-sm text-stone-400 italic">Address not set yet.</p>
            )}
          </div>
        </div>

        <div className="border border-stone-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">{museum.logo_emoji}</div>
          <h2 className="font-serif text-2xl italic text-stone-900 mb-2">{museum.name}</h2>
          <p className="text-stone-400 text-sm mb-6">Free entry to the permanent collection.</p>
          <Link
            href={`/museum/${slug}`}
            className="inline-block bg-stone-900 text-white text-sm font-mono px-6 py-3 rounded"
          >
            Browse the collection →
          </Link>
        </div>
      </div>
    </div>
  )
}