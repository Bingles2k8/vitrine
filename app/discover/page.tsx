import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Suspense } from 'react'
import DiscoverFilters from './DiscoverFilters'
import { buildPageMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata = buildPageMetadata({
  title: 'Discover Public Collections',
  description: 'Browse objects from public collections worldwide on Vitrine. Explore museums, galleries, and private collections.',
  path: '/discover',
  keywords: ['public collections', 'museum collection online', 'browse collections', 'collection discovery'],
})

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categories?: string }>
}) {
  const { q, categories } = await searchParams
  const query = q?.trim() || ''
  const selectedCategories = categories ? categories.split(',').filter(Boolean) : []

  // Service role client — bypasses RLS so we can query across all discoverable museums
  // regardless of whether the visitor is logged in. Safe because this is server-only code.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch discoverable museums
  const { data: museums } = await supabase
    .from('museums')
    .select('id, name, slug, collection_category')
    .eq('discoverable', true)

  const museumIds = (museums || []).map(m => m.id)
  const museumMap = Object.fromEntries((museums || []).map(m => [m.id, m]))

  let objectsQuery = supabase
    .from('objects')
    .select('id, title, description, image_url, category, museum_id, emoji')
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (museumIds.length > 0) {
    objectsQuery = objectsQuery.in('museum_id', museumIds)
  } else {
    // No discoverable museums — return empty
    objectsQuery = objectsQuery.in('museum_id', ['00000000-0000-0000-0000-000000000000'])
  }

  if (query) {
    // Strip characters with special meaning in PostgREST filter syntax to prevent injection
    const safeQuery = query.replace(/[,()]/g, '')
    objectsQuery = objectsQuery.or(
      `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
    )
  }

  const { data: objects } = await objectsQuery

  // Filter by category (effective category = object.category ?? museum.collection_category)
  const allObjects = (objects || []).filter(obj => {
    const museum = museumMap[obj.museum_id]
    if (!museum) return false
    if (selectedCategories.length === 0) return true
    const effectiveCategory = obj.category || museum.collection_category
    return effectiveCategory && selectedCategories.includes(effectiveCategory)
  })

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl italic">Vitrine<span className="text-amber-500">.</span></Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm text-amber-400 font-mono">Discover</Link>
            <Link href="/blog" className="text-sm text-stone-400 hover:text-white transition-colors">Blog</Link>
            <a href="/#features" className="text-sm text-stone-400 hover:text-white transition-colors">Features</a>
            <a href="/#pricing" className="text-sm text-stone-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-stone-400 hover:text-white transition-colors font-mono">
              Sign in
            </Link>
            <Link href="/signup" className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-mono px-4 py-2 rounded transition-colors">
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-5xl italic font-normal mb-3">
            Discover Collections
          </h1>
          <p className="text-stone-400 text-lg font-light">
            Browse objects from public collections on Vitrine.
          </p>
        </div>

        <div className="flex gap-10">

          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <Suspense>
              <DiscoverFilters selectedCategories={selectedCategories} query={query} />
            </Suspense>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Mobile filters (search only) */}
            <div className="lg:hidden mb-6">
              <Suspense>
                <DiscoverFilters selectedCategories={selectedCategories} query={query} />
              </Suspense>
            </div>

            {/* Results count */}
            <div className="text-xs font-mono text-stone-500 mb-6">
              {allObjects.length === 0
                ? 'No objects found'
                : `${allObjects.length} object${allObjects.length === 1 ? '' : 's'}`}
              {selectedCategories.length > 0 && ` in ${selectedCategories.join(', ')}`}
              {query && ` matching "${query}"`}
            </div>

            {/* Grid */}
            {allObjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allObjects.map(obj => {
                  const museum = museumMap[obj.museum_id]
                  if (!museum) return null
                  return (
                    <Link
                      key={obj.id}
                      href={`/museum/${museum.slug}/object/${obj.id}`}
                      className="group bg-white/3 border border-white/8 rounded-xl overflow-hidden hover:border-white/15 hover:bg-white/5 transition-all"
                    >
                      {/* Image */}
                      <div className="relative pb-[100%] bg-stone-900 overflow-hidden">
                        {obj.image_url ? (
                          <img
                            src={obj.image_url}
                            alt={obj.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-4xl text-stone-700">
                            {obj.emoji || '🏛️'}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="text-sm font-medium text-stone-100 leading-snug mb-1 line-clamp-2">
                          {obj.title}
                        </div>
                        {obj.description && (
                          <div className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-2">
                            {obj.description}
                          </div>
                        )}
                        <div className="text-xs font-mono text-stone-600 truncate">
                          {museum.name}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <div className="text-stone-400 text-sm font-mono mb-2">No objects found</div>
                <div className="text-stone-600 text-xs max-w-xs">
                  {query || selectedCategories.length > 0
                    ? 'Try adjusting your search or removing some category filters.'
                    : 'No public collections are available yet. Check back soon.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
