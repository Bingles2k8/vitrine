import { createClient } from '@supabase/supabase-js'
import PublicFooter from '@/components/PublicFooter'
import PublicNav from '@/components/PublicNav'
import { Suspense } from 'react'
import DiscoverFilters from './DiscoverFilters'
import DiscoverCategoryScroll from './DiscoverCategoryScroll'
import DiscoverMobileFilters from './DiscoverMobileFilters'
import DiscoverGrid, { type DiscoverItem } from './DiscoverGrid'
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

  // Fetch discoverable museums (excluding locked)
  const { data: museums } = await supabase
    .from('museums')
    .select('id, name, slug, collection_category')
    .eq('discoverable', true)
    .is('locked_at', null)
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

            <DiscoverGrid
              items={allObjects.reduce<DiscoverItem[]>((acc, obj) => {
                const museum = museumMap[obj.museum_id]
                if (!museum) return acc
                acc.push({
                  id: obj.id,
                  title: obj.title,
                  description: obj.description,
                  image_url: obj.image_url,
                  emoji: obj.emoji,
                  museum_slug: museum.slug,
                  museum_name: museum.name,
                  effective_category: obj.category || museum.collection_category,
                })
                return acc
              }, [])}
              query={query}
              selectedCategories={selectedCategories}
              museumQuery={museumQuery}
            />
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
