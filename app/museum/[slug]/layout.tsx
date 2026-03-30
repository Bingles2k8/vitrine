import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { getMuseumStyles, getLayoutVariant } from '@/lib/museum-styles'
import { getPlan } from '@/lib/plans'
import MuseumNav from '@/components/MuseumNav'
import MuseumSidebar from '@/components/MuseumSidebar'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSideClient()
  const { data: museum } = await supabase
    .from('museums')
    .select('name, tagline, seo_description, hero_image_url, plan')
    .eq('slug', slug)
    .single()

  if (!museum) return {}

  const isPaid = getPlan(museum.plan).advancedCustomisation
  const description = isPaid
    ? (museum.seo_description || museum.tagline || museum.name)
    : (museum.tagline || museum.name)

  return {
    title: museum.name,
    description,
    openGraph: isPaid ? {
      title: museum.name,
      description: description ?? '',
      images: museum.hero_image_url ? [museum.hero_image_url] : [],
      type: 'website',
    } : undefined,
  }
}

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
  const hasWanted = museum.show_wanted === true
  const isPaid = getPlan(museum.plan).advancedCustomisation

  const { pageBg, font, navStyle, accent, headingStyle, content } = getMuseumStyles(museum)
  const layoutVariant = getLayoutVariant(museum)

  const socialLinks = isPaid ? [
    { url: museum.social_instagram, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    )},
    { url: museum.social_twitter, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )},
    { url: museum.social_facebook, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )},
    { url: museum.social_website, icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    )},
  ].filter(s => s.url) : []

  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${font.google}&display=block`} />
    </>
  )

  const standardFooter = (
    <footer className="border-t py-10 mt-10" style={{ borderColor: 'rgba(128,128,128,0.12)' }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
        <div style={{ color: 'rgba(128,128,128,0.5)', fontFamily: headingStyle.fontFamily, fontStyle: 'italic' }}>
          {isPaid && museum.footer_text ? museum.footer_text : museum.name}
        </div>
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {socialLinks.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(128,128,128,0.45)' }}
                className="hover:opacity-70 transition-opacity">
                {s.icon}
              </a>
            ))}
          </div>
        )}
        <div className="text-xs font-mono" style={{ color: 'rgba(128,128,128,0.35)' }}>
          Powered by Vitrine
        </div>
      </div>
    </footer>
  )

  if (layoutVariant === 'sidebar') {
    return (
      <div className="min-h-screen flex" style={{ background: pageBg }}>
        {fonts}
        <MuseumSidebar
          slug={slug}
          museumName={museum.name}
          logoEmoji={museum.logo_emoji}
          logoImageUrl={museum.logo_image_url}
          accent={accent}
          headingStyle={headingStyle}
          contentHeading={content.heading}
          contentBody={content.body}
          contentMuted={content.muted}
          contentBorder={content.border}
          pageBg={pageBg}
          hasEvents={hasEvents}
          hasVisitInfo={hasVisitInfo}
          hasWanted={hasWanted}
          socialLinks={socialLinks}
        />
        <main className="flex-1 min-w-0 pt-14 md:pt-0 md:ml-[240px]">
          {children}
          <footer className="border-t py-8 mt-10" style={{ borderColor: content.border }}>
            <div className="px-8 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs font-mono" style={{ color: content.muted }}>
                {isPaid && museum.footer_text ? museum.footer_text : museum.name}
              </div>
              <div className="text-xs font-mono" style={{ color: content.muted, opacity: 0.5 }}>
                Powered by Vitrine
              </div>
            </div>
          </footer>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ background: pageBg }}>
      {fonts}

      <MuseumNav
        slug={slug}
        museumName={museum.name}
        logoEmoji={museum.logo_emoji}
        logoImageUrl={museum.logo_image_url}
        navClass={navStyle.nav}
        navTextClass={navStyle.text}
        navLinkClass={navStyle.link}
        navBg={pageBg}
        accent={accent}
        headingStyle={headingStyle}
        hasEvents={hasEvents}
        hasVisitInfo={hasVisitInfo}
        hasWanted={hasWanted}
      />

      {children}

      {standardFooter}
    </div>
  )
}
