import { createPublicClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import CollectionSearch from '@/components/CollectionSearch'
import { getMuseumStyles, getLayoutVariant } from '@/lib/museum-styles'
import { getPlan } from '@/lib/plans'
import PageViewTracker from '@/components/PageViewTracker'
import { JsonLd } from '@/components/JsonLd'
import { SITE_URL } from '@/lib/seo'

export const revalidate = 3600

export default async function PublicMuseum({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

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

  const totalEstimatedValue = allObjects.reduce((sum: number, o: any) => {
    const val = o.estimated_value ?? o.insured_value
    return sum + (val ? parseFloat(val) : 0)
  }, 0)
  const valueCurrency = allObjects.find((o: any) => o.estimated_value_currency)?.estimated_value_currency || 'GBP'
  const showValueBadge = museum.show_collection_value && totalEstimatedValue > 0

  const isPaid = getPlan(museum.plan).advancedCustomisation
  const isFullMode = getPlan(museum.plan).fullMode
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

  const { tmpl, accent, primary, headingStyle, content } = getMuseumStyles(museum)
  const layoutVariant = getLayoutVariant(museum)

  const styleSettings = {
    template: tmpl.id,
    accentColor: accent,
    card_radius: museum.card_radius ?? tmpl.card_radius,
    grid_columns: museum.grid_columns ?? tmpl.grid_columns,
    image_ratio: museum.image_ratio || tmpl.image_ratio,
    card_padding: museum.card_padding || tmpl.card_padding,
    card_metadata: museum.card_metadata || tmpl.card_metadata,
    darkMode: museum.dark_mode === true,
  }

  const formattedValue = showValueBadge
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: valueCurrency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalEstimatedValue)
    : null

  const statsLine = allObjects.length > 0 && (
    <div className="max-w-6xl mx-auto px-6 pt-8 flex flex-wrap items-center gap-4">
      <p className="text-xs font-mono" style={{ color: 'rgba(128,128,128,0.5)' }}>
        {[
          `${allObjects.length} pieces`,
          distinctCategories > 1 ? `${distinctCategories} categories` : null,
          distinctOrigins > 1 ? `${distinctOrigins} origins` : null,
          museum.collecting_since ? `Since ${museum.collecting_since}` : null,
        ].filter(Boolean).join(' · ')}
      </p>
      {showValueBadge && (
        <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ background: accent + '18', color: accent }}>
          Collection value: approx. {formattedValue}
        </span>
      )}
    </div>
  )

  const emptyState = (
    <div className="text-center py-32" style={{ color: 'rgba(128,128,128,0.5)' }}>
      <div className="text-6xl mb-4">🏛️</div>
      <div className="font-serif text-2xl italic">Collection coming soon</div>
    </div>
  )

  const collectionGrid = allObjects.length === 0
    ? emptyState
    : <CollectionSearch objects={allObjects} slug={slug} settings={styleSettings} />

  // ─── MINIMAL layout ─────────────────────────────────────────────────────────
  // White-cube gallery: no hero box. Giant floating italic title on white, thin
  // rule, quiet stats, then the grid.
  if (layoutVariant === 'minimal') {
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        <div className="max-w-6xl mx-auto px-6 pt-20 pb-10">
          {/* Eyebrow */}
          <div className="text-xs font-mono uppercase tracking-[0.2em] mb-6" style={{ color: content.muted }}>
            {museum.name}
          </div>

          {/* Giant title */}
          <h1
            className="font-normal leading-none mb-8"
            style={{ ...headingStyle, color: content.heading, fontSize: 'clamp(3.5rem, 8vw, 7rem)' }}
          >
            {museum.tagline || 'The Collection'}
          </h1>

          {/* Rule + count */}
          <div className="flex items-center gap-6 mb-6">
            <div className="h-px flex-1" style={{ background: content.border }} />
            <span className="text-xs font-mono shrink-0" style={{ color: content.muted }}>
              {isFullMode ? `${onDisplay} on display` : `${allObjects.length} works`}
              {distinctCategories > 1 ? ` · ${distinctCategories} categories` : ''}
              {museum.collecting_since ? ` · Since ${museum.collecting_since}` : ''}
            </span>
          </div>

          {showValueBadge && (
            <div className="mb-6">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ background: accent + '18', color: accent }}>
                Collection value: approx. {formattedValue}
              </span>
            </div>
          )}

          {museum.collector_bio && (
            <p className="text-sm leading-relaxed max-w-xl font-light mb-8" style={{ color: content.body }}>
              {museum.collector_bio}
            </p>
          )}
        </div>

        {featuredObjects && featuredObjects.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-xs uppercase tracking-widest font-mono" style={{ color: content.muted }}>Featured</div>
              <div className="h-px flex-1" style={{ background: content.border }} />
            </div>
            <div className={`grid gap-4 ${featuredObjects.length === 1 ? 'grid-cols-1 max-w-sm' : featuredObjects.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {featuredObjects.map(obj => (
                <Link key={obj.id} href={`/museum/${slug}/object/${obj.id}`}
                  className="group block overflow-hidden border transition-shadow hover:shadow-md"
                  style={{ borderColor: content.border, borderRadius: `${museum.card_radius ?? 8}px` }}>
                  <div className="relative w-full pb-[56%]" style={{ background: content.cardBg }}>
                    {obj.image_url
                      ? <Image src={obj.image_url} alt={obj.title || ''} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                      : <div className="absolute inset-0 flex items-center justify-center text-4xl">{obj.emoji || '🖼️'}</div>}
                  </div>
                  <div className="p-3" style={{ background: content.cardBg }}>
                    <div className="text-sm font-medium truncate" style={{ ...headingStyle, color: content.heading }}>{obj.title || 'Untitled'}</div>
                    {obj.artist && <div className="text-xs truncate mt-0.5" style={{ color: content.muted }}>{obj.artist}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {collectionGrid}
      </>
    )
  }

  // ─── DRAMATIC layout ─────────────────────────────────────────────────────────
  // Midnight cinema: the dark page IS the hero. Title slams left in giant white
  // type. A full-width gold rule separates identity from collection.
  if (layoutVariant === 'dramatic') {
    const hasHeroImg = !!museum.hero_image_url
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        {/* Identity block — no bounding box, floats on the dark page */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
          <div className="text-xs font-mono uppercase tracking-[0.25em] mb-8" style={{ color: accent }}>
            {museum.name} &nbsp;/&nbsp; {collectionLabel}
          </div>

          {hasHeroImg ? (
            /* If they uploaded a hero image, show it full-width cinematic */
            <div
              className="relative w-full mb-10 overflow-hidden"
              style={{ height: 'clamp(280px, 45vw, 520px)', borderRadius: '2px' }}
            >
              <Image
                src={museum.hero_image_url!}
                alt={museum.name}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: museum.hero_image_position || '50% 50%' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(12,10,9,0.85) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
                <h1
                  className="font-normal leading-none"
                  style={{ ...headingStyle, color: '#ffffff', fontSize: 'clamp(2.5rem, 6vw, 5.5rem)' }}
                >
                  {museum.tagline || 'The Collection'}
                </h1>
              </div>
            </div>
          ) : (
            <h1
              className="font-normal leading-none mb-10"
              style={{ ...headingStyle, color: content.heading, fontSize: 'clamp(3rem, 8vw, 7.5rem)' }}
            >
              {museum.tagline || 'The Collection'}
            </h1>
          )}

          {/* Full-width accent rule */}
          <div className="h-px w-full mb-6" style={{ background: accent }} />

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-xs font-mono" style={{ color: content.muted }}>
              {isFullMode ? `${onDisplay} on display` : `${allObjects.length} works`}
            </span>
            {distinctCategories > 1 && (
              <span className="text-xs font-mono" style={{ color: content.muted }}>{distinctCategories} categories</span>
            )}
            {museum.collecting_since && (
              <span className="text-xs font-mono" style={{ color: content.muted }}>Since {museum.collecting_since}</span>
            )}
            {showValueBadge && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ background: accent + '18', color: accent }}>
                {formattedValue}
              </span>
            )}
          </div>

          {museum.collector_bio && (
            <p className="text-sm leading-relaxed max-w-2xl mt-8 font-light" style={{ color: content.body }}>
              {museum.collector_bio}
            </p>
          )}
        </div>

        {featuredObjects && featuredObjects.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-xs uppercase tracking-widest font-mono" style={{ color: accent }}>Featured Works</div>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div className={`grid gap-3 ${featuredObjects.length === 1 ? 'grid-cols-1 max-w-sm' : featuredObjects.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {featuredObjects.map(obj => (
                <Link key={obj.id} href={`/museum/${slug}/object/${obj.id}`}
                  className="group block overflow-hidden transition-all"
                  style={{ borderRadius: `${museum.card_radius ?? 4}px`, background: content.cardBg }}>
                  <div className="relative w-full pb-[56%]" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {obj.image_url
                      ? <Image src={obj.image_url} alt={obj.title || ''} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                      : <div className="absolute inset-0 flex items-center justify-center text-4xl">{obj.emoji || '🖼️'}</div>}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium truncate" style={{ ...headingStyle, color: content.heading }}>{obj.title || 'Untitled'}</div>
                    {obj.artist && <div className="text-xs truncate mt-0.5" style={{ color: content.muted }}>{obj.artist}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {collectionGrid}
      </>
    )
  }

  // ─── ARCHIVAL layout ─────────────────────────────────────────────────────────
  // Museum catalog: formal double-border centred masthead, ornamental separator,
  // optional two-column bio/info block, then the grid.
  if (layoutVariant === 'archival') {
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        {/* Centred masthead */}
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-0">
          <div
            className="text-center py-10 px-8"
            style={{ border: `1px solid ${content.border}`, outline: `4px solid ${content.border}`, outlineOffset: '-8px' }}
          >
            <div className="text-xs font-mono uppercase tracking-[0.3em] mb-4" style={{ color: content.muted }}>
              {museum.name}
            </div>
            <h1
              className="font-normal leading-tight mb-4"
              style={{ ...headingStyle, color: content.heading, fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {museum.tagline || collectionLabel}
            </h1>
            {/* Ornamental rule */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12" style={{ background: accent }} />
              <div className="w-1.5 h-1.5 rotate-45" style={{ background: accent }} />
              <div className="h-px w-12" style={{ background: accent }} />
            </div>
            <div className="text-xs font-mono" style={{ color: content.muted }}>
              {[
                isFullMode ? `${onDisplay} works on display` : `${allObjects.length} works`,
                distinctCategories > 1 ? `${distinctCategories} media` : null,
                distinctOrigins > 1 ? `${distinctOrigins} origins` : null,
                museum.collecting_since ? `Est. ${museum.collecting_since}` : null,
              ].filter(Boolean).join('  ·  ')}
            </div>
            {showValueBadge && (
              <div className="mt-3">
                <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ background: accent + '18', color: accent }}>
                  Collection value: approx. {formattedValue}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Optional bio / featured two-col block */}
        {(museum.collector_bio || (featuredObjects && featuredObjects.length > 0)) && (
          <div className="max-w-6xl mx-auto px-6 mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {museum.collector_bio && (
                <div>
                  <div className="text-xs uppercase tracking-widest font-mono mb-4" style={{ color: accent }}>Collector's Note</div>
                  <p className="text-sm leading-relaxed font-light" style={{ color: content.body }}>{museum.collector_bio}</p>
                </div>
              )}
              {featuredObjects && featuredObjects.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest font-mono mb-4" style={{ color: accent }}>Featured Works</div>
                  <div className="flex flex-col gap-3">
                    {featuredObjects.slice(0, 3).map(obj => (
                      <Link key={obj.id} href={`/museum/${slug}/object/${obj.id}`}
                        className="group flex items-center gap-3 transition-opacity hover:opacity-75"
                      >
                        <div
                          className="w-14 h-14 flex-shrink-0 overflow-hidden"
                          style={{ background: content.cardBg, border: `1px solid ${content.border}`, borderRadius: `${museum.card_radius ?? 4}px` }}
                        >
                          {obj.image_url
                            ? <img src={obj.image_url} alt={obj.title || ''} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">{obj.emoji || '🖼️'}</div>}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-light truncate" style={{ ...headingStyle, color: content.heading }}>{obj.title || 'Untitled'}</div>
                          {obj.artist && <div className="text-xs truncate" style={{ color: content.muted }}>{obj.artist}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section rule before grid */}
        <div className="max-w-6xl mx-auto px-6 mt-10 mb-0">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1" style={{ background: content.border }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: content.muted }}>{collectionLabel}</span>
            <div className="h-px flex-1" style={{ background: content.border }} />
          </div>
        </div>

        {collectionGrid}
      </>
    )
  }

  // ─── COVER layout ───────────────────────────────────────────────────────────
  if (layoutVariant === 'cover') {
    const heroBg = museum.hero_image_url ? undefined : primary
    const coverHeightMap: Record<string, string> = {
      none: '40vh', compact: '50vh', medium: '65vh', tall: '80vh', fullscreen: '100vh',
    }
    const coverHeight = coverHeightMap[museum.hero_height || 'fullscreen'] || '100vh'
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        {/* Cover hero — height controlled by hero_height setting (default: fullscreen) */}
        <div
          className="flex items-end"
          style={{
            height: coverHeight,
            minHeight: '360px',
            background: heroBg,
            backgroundImage: museum.hero_image_url ? `url(${museum.hero_image_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: museum.hero_image_url ? (museum.hero_image_position || '50% 50%') : 'center',
            position: 'relative',
          }}
        >
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)' }} />

          <div className="relative z-10 w-full px-6 pb-16">
            <div className="max-w-6xl mx-auto">
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {museum.name} — {collectionLabel}
              </div>
              <h1
                className="font-normal leading-tight mb-6"
                style={{ ...headingStyle, color: '#ffffff', fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
              >
                {museum.tagline || 'Explore the collection'}
              </h1>
              <div className="flex items-center gap-4">
                <span className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {isFullMode ? `${onDisplay} works on display` : `${allObjects.length} in collection`}
                </span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {statsLine}

        {museum.collector_bio && (
          <div className="max-w-6xl mx-auto px-6 pt-10 pb-2">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xs uppercase tracking-widest font-mono" style={{ color: accent }}>About the Collector</h2>
              <div className="h-px flex-1" style={{ background: 'rgba(128,128,128,0.12)' }} />
            </div>
            <p className="text-sm leading-relaxed max-w-2xl font-light" style={{ color: content.body }}>
              {museum.collector_bio}
            </p>
          </div>
        )}

        {featuredObjects && featuredObjects.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pt-10 pb-2">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs uppercase tracking-widest font-mono" style={{ color: accent }}>Featured Works</h2>
              <div className="h-px flex-1" style={{ background: 'rgba(128,128,128,0.12)' }} />
            </div>
            <div className={`grid gap-4 ${featuredObjects.length === 1 ? 'grid-cols-1 max-w-sm' : featuredObjects.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {featuredObjects.map(obj => (
                <Link key={obj.id} href={`/museum/${slug}/object/${obj.id}`}
                  className="group block overflow-hidden border transition-shadow hover:shadow-md"
                  style={{ borderColor: 'rgba(128,128,128,0.12)', borderRadius: `${museum.card_radius ?? 6}px` }}>
                  <div className="relative w-full pb-[56%] bg-stone-100">
                    {obj.image_url ? (
                      <Image src={obj.image_url} alt={obj.title || ''}
                        fill sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">{obj.emoji || '🖼️'}</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium truncate" style={{ ...headingStyle, color: content.heading }}>{obj.title || 'Untitled'}</div>
                    {obj.artist && <div className="text-xs truncate mt-0.5" style={{ color: content.muted }}>{obj.artist}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {collectionGrid}
      </>
    )
  }

  // ─── TEXT-FORWARD (Curator) layout ─────────────────────────────────────────
  if (layoutVariant === 'text-forward') {
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        {/* Large text intro */}
        <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="text-xs font-mono uppercase tracking-widest mb-6" style={{ color: accent }}>
            {museum.name} — {collectionLabel}
          </div>
          <h1
            className="font-normal leading-tight mb-6"
            style={{ ...headingStyle, color: content.heading, fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
          >
            {museum.tagline || 'Explore the collection'}
          </h1>
          {museum.collector_bio && (
            <p className="text-base leading-relaxed font-light max-w-xl mx-auto" style={{ color: content.body }}>
              {museum.collector_bio}
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-16" style={{ background: content.border }} />
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: content.muted }}>
              {allObjects.length} works
              {distinctCategories > 1 ? ` · ${distinctCategories} categories` : ''}
              {museum.collecting_since ? ` · Since ${museum.collecting_since}` : ''}
            </span>
            <div className="h-px w-16" style={{ background: content.border }} />
          </div>
          {showValueBadge && (
            <div className="mt-4 flex justify-center">
              <span className="text-xs font-mono px-2.5 py-1 rounded-full" style={{ background: accent + '18', color: accent }}>
                Collection value: approx. {formattedValue}
              </span>
            </div>
          )}
        </div>

        {/* Thin separator */}
        <div className="max-w-6xl mx-auto px-6 mb-6">
          <div className="h-px" style={{ background: content.border }} />
        </div>

        {collectionGrid}
      </>
    )
  }

  // ─── MAGAZINE layout ────────────────────────────────────────────────────────
  if (layoutVariant === 'magazine') {
    const hasMagazineHero = featuredObjects && featuredObjects.length >= 2
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        {/* Magazine masthead */}
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-black">
          <h1
            className="leading-none min-w-0"
            style={{ ...headingStyle, color: content.heading, fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.03em' }}
          >
            {museum.tagline || museum.name}
          </h1>
          <div className="text-right flex-shrink-0 pb-1">
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: accent }}>{museum.name}</div>
            <div className="text-xs font-mono mt-1" style={{ color: content.muted }}>{isFullMode ? `${onDisplay} on display` : `${allObjects.length} in collection`}</div>
          </div>
        </div>

        {/* Asymmetric featured hero grid */}
        {hasMagazineHero ? (
          <div className="max-w-6xl mx-auto px-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:h-[420px]">
              {/* First featured — full width on mobile, 2/3 on desktop */}
              <Link
                href={`/museum/${slug}/object/${featuredObjects![0].id}`}
                className="col-span-1 md:col-span-2 group relative overflow-hidden block aspect-[16/9] md:aspect-auto"
                style={{ borderRadius: 0 }}
              >
                {featuredObjects![0].image_url ? (
                  <Image src={featuredObjects![0].image_url} alt={featuredObjects![0].title || ''}
                    fill priority sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-stone-100 flex items-center justify-center text-6xl">
                    {featuredObjects![0].emoji || '🖼️'}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-lg font-bold text-white leading-tight" style={{ fontFamily: headingStyle.fontFamily, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    {featuredObjects![0].title || 'Untitled'}
                  </div>
                  {featuredObjects![0].artist && (
                    <div className="text-sm text-white/70 mt-1">{featuredObjects![0].artist}</div>
                  )}
                </div>
              </Link>

              {/* Remaining featured — 2-col row on mobile, stacked in right column on desktop */}
              <div className="col-span-1 grid grid-cols-2 md:grid-cols-1 gap-2 md:flex md:flex-col">
                {featuredObjects!.slice(1, 3).map(obj => (
                  <Link
                    key={obj.id}
                    href={`/museum/${slug}/object/${obj.id}`}
                    className="relative overflow-hidden block aspect-[4/3] md:aspect-auto md:flex-1"
                  >
                    {obj.image_url ? (
                      <Image src={obj.image_url} alt={obj.title || ''}
                        fill sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-stone-200 flex items-center justify-center text-4xl">
                        {obj.emoji || '🖼️'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <div className="text-sm font-bold text-white leading-tight" style={{ fontFamily: headingStyle.fontFamily, textTransform: 'uppercase' }}>
                        {obj.title || 'Untitled'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Thin rule below hero */}
            <div className="mt-4 mb-2 flex items-center gap-4">
              <div className="h-px flex-1" style={{ background: content.border }} />
              <span className="text-xs font-mono uppercase tracking-widest" style={{ color: content.muted }}>
                {collectionLabel}
              </span>
              <div className="h-px flex-1" style={{ background: content.border }} />
            </div>
          </div>
        ) : (
          statsLine
        )}

        {collectionGrid}
      </>
    )
  }

  // ─── SIDEBAR layout (no hero — sidebar handles identity) ────────────────────
  if (layoutVariant === 'sidebar') {
    return (
      <>
        <PageViewTracker museumId={museum.id} pageType="home" />

        <div className="px-8 pt-10 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-normal" style={{ ...headingStyle, color: content.heading }}>
              {collectionLabel}
            </h1>
          </div>
          {allObjects.length > 0 && (
            <p className="text-xs font-mono" style={{ color: content.muted }}>
              {[
                `${allObjects.length} pieces`,
                distinctCategories > 1 ? `${distinctCategories} categories` : null,
                isFullMode ? (onDisplay > 0 ? `${onDisplay} on display` : null) : `${allObjects.length} in collection`,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
          {showValueBadge && (
            <span className="inline-block mt-2 text-xs font-mono px-2.5 py-1 rounded-full" style={{ background: accent + '18', color: accent }}>
              Collection value: approx. {formattedValue}
            </span>
          )}
        </div>

        <div className="px-2">
          {collectionGrid}
        </div>
      </>
    )
  }

  // ─── STANDARD layout (all original templates) ───────────────────────────────
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

  const museumUrl = `${SITE_URL}/museum/${slug}`
  const description = museum.seo_description || museum.tagline || museum.name

  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: museum.name,
    description,
    url: museumUrl,
    ...(museum.hero_image_url && { image: museum.hero_image_url }),
    ...(allObjects.length > 0 && { numberOfItems: allObjects.length }),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: museum.name, item: museumUrl },
    ],
  }

  return (
    <>
      <JsonLd data={collectionPageSchema} />
      <JsonLd data={breadcrumbSchema} />
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
                  <span className="font-mono text-sm" style={{ color: heroSubText }}>{isFullMode ? `${onDisplay} works on display` : `${allObjects.length} in collection`}</span>
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
                  {isFullMode ? `${onDisplay} works currently on display` : `${allObjects.length} in collection`}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {statsLine}

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
                    <Image src={obj.image_url} alt={obj.title || ''}
                      fill sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
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

      {collectionGrid}
    </>
  )
}
