import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import CollectionSearch from '@/components/CollectionSearch'
import { getMuseumStyles } from '@/lib/museum-styles'

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
    .eq('show_on_site', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const allArtifacts = artifacts || []
  const onDisplay = allArtifacts.filter(a => a.status === 'On Display').length

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
                  {museum.name} — Permanent Collection
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

      {allArtifacts.length === 0 ? (
        <div className="text-center py-32" style={{ color: 'rgba(128,128,128,0.5)' }}>
          <div className="text-6xl mb-4">🏛️</div>
          <div className="font-serif text-2xl italic">Collection coming soon</div>
        </div>
      ) : (
        <CollectionSearch artifacts={allArtifacts} slug={slug} settings={styleSettings} />
      )}
    </>
  )
}
