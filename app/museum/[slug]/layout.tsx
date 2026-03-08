import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { getMuseumStyles } from '@/lib/museum-styles'
import { getPlan } from '@/lib/plans'
import MuseumNav from '@/components/MuseumNav'

export default async function MuseumLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()

  const { count: eventCount } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('museum_id', museum.id)
    .eq('status', 'published')

  const hasEvents = (eventCount ?? 0) > 0
  const hasVisitInfo = getPlan(museum.plan).visitInfo

  const { pageBg, font, navStyle, accent, headingStyle } = getMuseumStyles(museum)

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${font.google}&display=swap`} />

      <MuseumNav
        slug={slug}
        museumName={museum.name}
        logoEmoji={museum.logo_emoji}
        logoImageUrl={museum.logo_image_url}
        navClass={navStyle.nav}
        navTextClass={navStyle.text}
        navLinkClass={navStyle.link}
        accent={accent}
        headingStyle={headingStyle}
        hasEvents={hasEvents}
        hasVisitInfo={hasVisitInfo}
      />

      {children}

      <footer className="border-t py-10 mt-10" style={{ borderColor: 'rgba(128,128,128,0.12)' }}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div style={{ color: 'rgba(128,128,128,0.5)', fontFamily: headingStyle.fontFamily, fontStyle: 'italic' }}>
            {museum.name}
          </div>
          <div className="text-xs font-mono" style={{ color: 'rgba(128,128,128,0.35)' }}>
            Powered by Vitrine
          </div>
        </div>
      </footer>
    </div>
  )
}
