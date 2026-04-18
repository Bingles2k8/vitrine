import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { Suspense } from 'react'
import DiscoverFilters from './DiscoverFilters'
import DiscoverCategoryScroll from './DiscoverCategoryScroll'
import DiscoverMobileFilters from './DiscoverMobileFilters'
import { buildPageMetadata } from '@/lib/seo'

export const revalidate = 3600

export const metadata = buildPageMetadata({
  title: 'Discover Public Collections',
  description: 'Browse objects from public collections worldwide on Vitrine. Explore museums, galleries, and private collections.',
  path: '/discover',
  keywords: ['public collections', 'museum collection online', 'browse collections', 'collection discovery'],
})

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categories?: string; museum?: string }>
}) {
  const { q, categories, museum } = await searchParams
  const query = q?.trim() || ''
  const museumQuery = museum?.trim() || ''
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
    .limit(200)

  const filteredMuseums = museumQuery
    ? (museums || []).filter(m => m.name.toLowerCase().includes(museumQuery.toLowerCase()))
    : (museums || [])
  const museumIds = filteredMuseums.map(m => m.id)
  const museumMap = Object.fromEntries((museums || []).map(m => [m.id, m]))

  let objectsQuery = supabase
    .from('objects')
    .select('id, title, description, image_url, category, museum_id, emoji')
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(500)

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

      <PublicNav activePath="/discover" />

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
          <aside className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-6 sticky top-20 max-h-[calc(100vh-5rem)]">
            {/* Search — always visible */}
            <Suspense>
              <DiscoverFilters selectedCategories={selectedCategories} query={query} museumQuery={museumQuery} hideCategories />
            </Suspense>
            {/* Categories — independently scrollable, fade disappears at bottom */}
            <DiscoverCategoryScroll className="flex-1 min-h-0">
              <Suspense>
                <DiscoverFilters selectedCategories={selectedCategories} query={query} museumQuery={museumQuery} hideSearch />
              </Suspense>
            </DiscoverCategoryScroll>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Mobile filters */}
            <div className="lg:hidden mb-6">
              <Suspense>
                <DiscoverMobileFilters selectedCategories={selectedCategories} query={query} museumQuery={museumQuery} />
              </Suspense>
            </div>

            {/* Results count */}
            <div className="text-xs font-mono text-stone-500 mb-6">
              {allObjects.length === 0
                ? 'No objects found'
                : `${allObjects.length} object${allObjects.length === 1 ? '' : 's'}`}
              {selectedCategories.length > 0 && ` in ${selectedCategories.join(', ')}`}
              {query && ` matching "${query}"`}
              {museumQuery && ` from museums matching "${museumQuery}"`}
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

      <PublicFooter />
    </div>
  )
}
