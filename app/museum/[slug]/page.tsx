import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CollectionSearch from '@/components/CollectionSearch'

export default async function PublicMuseum({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('*')
    .eq('museum_id', museum.id)
    .in('status', ['On Display', 'On Loan'])
    .order('created_at', { ascending: false })

  const allArtifacts = artifacts || []
  const onDisplay = allArtifacts.filter(a => a.status === 'On Display').length

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-stone-200 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif text-2xl italic text-stone-900">
            {museum.logo_emoji} {museum.name}
          </div>
          <div className="flex items-center gap-8">
            <Link href={`/museum/${slug}`} className="text-sm text-stone-900 border-b border-stone-900 pb-0.5">
              Collection
            </Link>
            <Link href={`/museum/${slug}/visit`} className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
              Plan Your Visit
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ background: museum.primary_color || '#0f0e0c' }} className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs uppercase tracking-widest mb-4" style={{ color: museum.accent_color || '#c8961e' }}>
            {museum.name}
          </div>
          <h1 className="font-serif text-5xl md:text-7xl italic text-white font-normal leading-tight mb-4">
            {museum.tagline || 'Explore the collection'}
          </h1>
          <p className="text-white/50 text-lg font-light mt-4">
            {onDisplay} works currently on display
          </p>
        </div>
      </div>

      {allArtifacts.length === 0 ? (
        <div className="text-center py-32 text-stone-300">
          <div className="text-6xl mb-4">🏛️</div>
          <div className="font-serif text-2xl italic">Collection coming soon</div>
        </div>
      ) : (
        <CollectionSearch
          artifacts={allArtifacts}
          slug={slug}
          accentColor={museum.accent_color || '#c8961e'}
        />
      )}

      <footer className="border-t border-stone-100 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="font-serif italic text-stone-400">{museum.name}</div>
          <div className="text-xs text-stone-300 font-mono">Powered by Vitrine</div>
        </div>
      </footer>
    </div>
  )
}