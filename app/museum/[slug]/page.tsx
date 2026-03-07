import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CollectionSearch from '@/components/CollectionSearch'
import { getTemplate } from '@/lib/templates'

const FONT_MAP: Record<string, { google: string; css: string }> = {
  playfair:  { google: 'Playfair+Display:ital,wght@0,400;0,700;1,400',                css: "'Playfair Display', serif" },
  cormorant: { google: 'Cormorant+Garamond:ital,wght@0,400;0,600;1,400',             css: "'Cormorant Garamond', serif" },
  'dm-serif':{ google: 'DM+Serif+Display:ital@0;1',                                  css: "'DM Serif Display', serif" },
  libre:     { google: 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',              css: "'Libre Baskerville', serif" },
  'dm-sans': { google: 'DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,700;1,9..40,300', css: "'DM Sans', sans-serif" },
}

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

  const { count: eventCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('museum_id', museum.id)
    .eq('status', 'published')
  const hasEvents = (eventCount ?? 0) > 0

  const tmpl = getTemplate(museum.template || 'minimal')
  const primary = museum.primary_color || tmpl.primary_color
  const accent = museum.accent_color || tmpl.accent_color

  const styleSettings = {
    template: tmpl.id,
    accentColor: accent,
    card_radius: museum.card_radius ?? tmpl.card_radius,
    grid_columns: museum.grid_columns ?? tmpl.grid_columns,
    image_ratio: museum.image_ratio || tmpl.image_ratio,
    card_padding: museum.card_padding || tmpl.card_padding,
    card_metadata: museum.card_metadata || tmpl.card_metadata,
  }

  const heroPadding: Record<string, string> = {
    none: '', compact: 'py-10', medium: 'py-20', tall: 'py-32', fullscreen: 'py-48',
  }
  const heroHeight = museum.hero_height || tmpl.hero_height
  const showHero = heroHeight !== 'none'
  const heroPad = heroPadding[heroHeight] || 'py-20'

  const navStyles: Record<string, { nav: string; text: string; link: string }> = {
    minimal: { nav: 'bg-white border-b border-stone-100', text: 'text-stone-900', link: 'text-stone-400 hover:text-stone-900' },
    dramatic: { nav: 'bg-stone-950 border-b border-white/5', text: 'text-white', link: 'text-white/50 hover:text-white' },
    archival: { nav: 'bg-amber-50 border-b border-amber-200/50', text: 'text-stone-800', link: 'text-stone-500 hover:text-stone-800' },
    editorial: { nav: 'bg-white border-b-4 border-black', text: 'text-black font-bold', link: 'text-stone-400 hover:text-black' },
    classic: { nav: 'bg-stone-900 border-b border-white/10', text: 'text-amber-100', link: 'text-amber-100/50 hover:text-amber-100' },
  }
  const nav = navStyles[tmpl.id] || navStyles.minimal

  const isLightHero = tmpl.id === 'minimal' || tmpl.id === 'editorial'
  const heroBg = isLightHero ? '#ffffff' : primary
  const hasHeroImage = !!museum.hero_image_url
  const heroText = hasHeroImage ? '#ffffff' : (isLightHero ? '#111111' : '#ffffff')
  const heroSubText = hasHeroImage ? 'rgba(255,255,255,0.7)' : (isLightHero ? '#888888' : 'rgba(255,255,255,0.5)')
  const heroAccent = hasHeroImage ? 'rgba(255,255,255,0.8)' : accent

  const font = FONT_MAP[museum.heading_font || 'playfair'] || FONT_MAP.playfair
  const headingStyle = tmpl.id === 'editorial'
    ? { fontFamily: font.css, fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '-0.02em' }
    : { fontFamily: font.css, fontStyle: 'italic' }

  const pageBg: Record<string, string> = {
    minimal: '#fafaf9', dramatic: '#0c0a09', archival: '#f5f0e8', editorial: '#ffffff', classic: '#111827',
  }

  return (
    <div className="min-h-screen" style={{ background: pageBg[tmpl.id] || '#fafaf9' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${font.google}&display=swap`} />

      <nav className={`sticky top-0 z-50 backdrop-blur-md ${nav.nav}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className={`text-xl flex items-center gap-2 ${nav.text}`} style={headingStyle}>
            {museum.logo_image_url
              ? <img src={museum.logo_image_url} alt={museum.name} className="h-8 w-8 rounded object-cover" />
              : museum.logo_emoji
            }
            {museum.name}
          </div>
          <div className="flex items-center gap-8">
            <Link href={`/museum/${slug}`} className={`text-sm border-b pb-0.5 ${nav.text}`} style={{ borderColor: accent }}>
              Collection
            </Link>
            {hasEvents && (
              <Link href={`/museum/${slug}/events`} className={`text-sm transition-colors ${nav.link}`}>
                Events
              </Link>
            )}
            <Link href={`/museum/${slug}/visit`} className={`text-sm transition-colors ${nav.link}`}>
              Plan Your Visit
            </Link>
          </div>
        </div>
      </nav>

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
        <div className="text-center py-32 text-stone-400">
          <div className="text-6xl mb-4">🏛️</div>
          <div className="font-serif text-2xl italic">Collection coming soon</div>
        </div>
      ) : (
        <CollectionSearch artifacts={allArtifacts} slug={slug} settings={styleSettings} />
      )}

      <footer className="border-t border-white/5 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="font-serif italic text-stone-400">{museum.name}</div>
          <div className="text-xs text-stone-500 font-mono">Powered by Vitrine</div>
        </div>
      </footer>
    </div>
  )
}