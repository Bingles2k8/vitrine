import { createServerSideClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { getMuseumStyles } from '@/lib/museum-styles'
import { buildPageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSideClient()
  const { data: museum } = await supabase.from('museums').select('name').eq('slug', slug).single()
  if (!museum) return {}
  return buildPageMetadata({
    title: `Acquisition Wishlist — ${museum.name}`,
    description: `Objects and artefacts that ${museum.name} is actively seeking to acquire for its collection.`,
    path: `/museum/${slug}/wanted`,
  })
}

const PRIORITY_LABELS: Record<string, string> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#6b7280',
}

export default async function PublicWantedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerSideClient()

  const { data: museum } = await supabase
    .from('museums')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!museum) notFound()
  if (!museum.show_wanted) notFound()

  const { data: items } = await supabase
    .from('wanted_items')
    .select('id, title, year, medium, notes, priority, created_at')
    .eq('museum_id', museum.id)
    .is('acquired_at', null)
    .order('created_at', { ascending: false })

  const allItems = (items || []).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    const pa = order[a.priority as keyof typeof order] ?? 1
    const pb = order[b.priority as keyof typeof order] ?? 1
    if (pa !== pb) return pa - pb
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const { accent, content, headingStyle } = getMuseumStyles(museum)

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <div>
        <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: accent }}>
          {museum.name}
        </div>
        <h1 className="text-5xl mb-3" style={{ ...headingStyle, color: content.heading }}>Wanted List</h1>
        <p className="font-light text-lg leading-relaxed" style={{ color: content.muted }}>
          Items this collection is actively seeking. If you own something on this list, please get in touch.
        </p>
      </div>

      {allItems.length === 0 ? (
        <div className="py-16 text-center" style={{ color: content.muted }}>
          <p className="font-light">Nothing on the wanted list right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allItems.map(item => (
            <div
              key={item.id}
              className="border rounded-lg p-6"
              style={{ borderColor: 'rgba(128,128,128,0.15)' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                <h2 className="text-xl font-light" style={{ ...headingStyle, color: content.heading }}>
                  {item.title}
                </h2>
                <span
                  className="text-xs font-mono px-2 py-1 rounded flex-shrink-0"
                  style={{ color: PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium, background: 'rgba(128,128,128,0.07)' }}
                >
                  {PRIORITY_LABELS[item.priority] || item.priority}
                </span>
              </div>
              {(item.year || item.medium) && (
                <div className="flex gap-3 text-sm mb-3" style={{ color: content.muted }}>
                  {item.year && <span>{item.year}</span>}
                  {item.year && item.medium && <span>·</span>}
                  {item.medium && <span>{item.medium}</span>}
                </div>
              )}
              {item.notes && (
                <p className="text-sm leading-relaxed" style={{ color: content.body }}>
                  {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {museum.contact_email && (
        <div className="pt-4 border-t" style={{ borderColor: 'rgba(128,128,128,0.12)' }}>
          <p className="text-sm font-light" style={{ color: content.muted }}>
            Can you help?{' '}
            <a
              href={`mailto:${museum.contact_email}`}
              className="underline hover:opacity-70 transition-opacity"
              style={{ color: accent }}
            >
              Get in touch →
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
