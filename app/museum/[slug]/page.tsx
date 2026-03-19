import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CollectionSearch from '@/components/CollectionSearch'
import { getMuseumStyles } from '@/lib/museum-styles'
import { getPlan } from '@/lib/plans'
import PageViewTracker from '@/components/PageViewTracker'

export default async function PublicMuseum({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { data: objects } = await supabase
    .from('objects')
    .select('*')
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const allObjects = objects || []
  const onDisplay = allObjects.filter(a => a.status === 'On Display').length
  const collectionLabel = museum.collection_label || 'Collection'
  const distinctCategories = new Set(allObjects.map((o: any) => o.medium).filter(Boolean)).size
  const distinctOrigins = new Set(allObjects.map((o: any) => o.culture).filter(Boolean)).size

  const isPaid = getPlan(museum.plan).advancedCustomisation
  const { data: featuredObjects } = isPaid ? await supabase
    .from('objects')
    .select('id, title, artist, image_url, emoji, condition_grade, rarity')
    .eq('museum_id', museum.id)
    .eq('show_on_site', true)
    .eq('is_featured', true)
    .is('deleted_at', null)
    .order('featured_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(6) : { data: [] }

  const { tmpl, accent, primary, headingStyle } = getMuseumStyles(museum)

  const heroPadding: Record<string, string> = {
    none: '', compact: 'py-10', medium: 'py-20', tall: 'py-32', fullscreen: 'py-48',
  }
  const heroHeight = museum.hero_height || tmpl.hero_height
  const showHero = heroHeight !== 'none'
  const heroPad = heroPadding[heroHeight] || 'py-20'

  const isLightHero = tmpl.id === 'minimal' || tmpl.id === 'editorial'
  const heroBg = isLightHero ? '#ffffff' : primary
  const hasHeroImage = !!museum.hero_image_url
  const heroText = hasHeroImage ? '#ffffff' : (isLightHero ? '#111111' : '#ffffff')
  const heroSubText = hasHeroImage ? 'rgba(255,255,255,0.7)' : (isLightHero ? '#888888' : 'rgba(255,255,255,0.5)')
  const heroAccent = hasHeroImage ? 'rgba(255,255,255,0.8)' : accent

  const styleSettings = {
    template: tmpl.id,
    accentColor: accent,
    card_radius: museum.card_radius ?? tmpl.card_radius,
    grid_columns: museum.grid_columns ?? tmpl.grid_columns,
    image_ratio: museum.image_ratio || tmpl.image_ratio,
    card_padding: museum.card_padding || tmpl.card_padding,
    card_metadata: museum.card_metadata || tmpl.card_metadata,
  }

  return (
    <>
      <PageViewTracker museumId={museum.id} pageType="home" />
      {showHero && (
        <div className={`px-6 ${heroPad} relative`} style={{
          background: heroBg,
          backgroundImage: museum.hero_image_url ? `url(${museum.hero_image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: museum.hero_image_url ? (museum.hero_image_position || '50% 50%') : 'center',
        }}>
          {museum.hero_image_url && <div className="absolute inset-0 bg-black/40" />}
          <div className="max-w-6xl mx-auto relative z-10">
            {tmpl.id === 'editorial' ? (
              <>
                <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: heroAccent }}>
                  {museum.name} — {collectionLabel}
                </div>
                <h1 className="leading-none mb-6" style={{ ...headingStyle, color: heroText, fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
                  {museum.tagline || 'The Collection'}
                </h1>
                <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-black" />
                  <span className="font-mono text-sm" style={{ color: heroSubText }}>{onDisplay} works on display</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs uppercase tracking-widest mb-4 font-mono" style={{ color: heroAccent }}>
                  {museum.name}
                </div>
                <h1 className="font-normal leading-tight mb-4" style={{ ...headingStyle, color: heroText, fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
                  {museum.tagline || 'Explore the collection'}
                </h1>
                <p className="text-lg font-light" style={{ color: heroSubText }}>
                  {onDisplay} works currently on display
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {allObjects.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-8">
          <p className="text-xs font-mono" style={{ color: 'rgba(128,128,128,0.5)' }}>
            {[
              `${allObjects.length} pieces`,
              distinctCategories > 1 ? `${distinctCategories} categories` : null,
              distinctOrigins > 1 ? `${distinctOrigins} origins` : null,
              museum.collecting_since ? `Since ${museum.collecting_since}` : null,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {museum.collector_bio && (
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-2">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xs uppercase tracking-widest font-mono" style={{ color: accent }}>About the Collector</h2>
            <div className="h-px flex-1" style={{ background: 'rgba(128,128,128,0.12)' }} />
          </div>
          <p className="text-sm leading-relaxed max-w-2xl font-light" style={{ color: 'rgba(128,128,128,0.8)' }}>
            {museum.collector_bio}
          </p>
        </div>
      )}

      {featuredObjects && featuredObjects.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-2">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xs uppercase tracking-widest font-mono" style={{ color: accent }}>
              Featured Works
            </h2>
            <div className="h-px flex-1" style={{ background: 'rgba(128,128,128,0.12)' }} />
          </div>
          <div className={`grid gap-4 ${featuredObjects.length === 1 ? 'grid-cols-1 max-w-sm' : featuredObjects.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {featuredObjects.map(obj => (
              <Link key={obj.id} href={`/museum/${slug}/object/${obj.id}`}
                className="group block overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                style={{ borderColor: 'rgba(128,128,128,0.12)', borderRadius: `${museum.card_radius ?? 8}px` }}>
                <div className="relative w-full pb-[56%] bg-stone-100 dark:bg-stone-800">
                  {obj.image_url ? (
                    <img src={obj.image_url} alt={obj.title || ''}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">{obj.emoji || '🖼️'}</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate" style={headingStyle}>
                    {obj.title || 'Untitled'}
                  </div>
                  {obj.artist && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">{obj.artist}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {allObjects.length === 0 ? (
        <div className="text-center py-32" style={{ color: 'rgba(128,128,128,0.5)' }}>
          <div className="text-6xl mb-4">🏛️</div>
          <div className="font-serif text-2xl italic">Collection coming soon</div>
        </div>
      ) : (
        <CollectionSearch objects={allObjects} slug={slug} settings={styleSettings} />
      )}
    </>
  )
}
