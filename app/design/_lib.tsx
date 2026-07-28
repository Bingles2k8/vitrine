import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

/**
 * Shared scaffolding for the /design homepage variants.
 *
 * These pages are review-only concepts for the homepage — they are noindexed
 * and are not linked from the public nav. Each variant is deliberately
 * self-contained so a winning one can be lifted straight into app/page.tsx.
 */

export type FeaturedCollection = {
  name: string
  slug: string
  count: number
  preview_image: string | null
  preview_emoji: string
}

/** Same query the live homepage uses, so variants show real collections. */
export async function getFeaturedCollections(limit = 4): Promise<FeaturedCollection[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: museums } = await supabase
      .from('museums')
      .select('id, name, slug')
      .eq('discoverable', true)
      .is('locked_at', null)
      .limit(limit * 4)

    if (!museums?.length) return []

    const results: FeaturedCollection[] = []

    for (const museum of museums) {
      if (results.length >= limit) break

      const { count } = await supabase
        .from('objects')
        .select('*', { count: 'exact', head: true })
        .eq('museum_id', museum.id)
        .eq('show_on_site', true)
        .is('deleted_at', null)

      if (!count) continue

      const { data: obj } = await supabase
        .from('objects')
        .select('image_url, emoji')
        .eq('museum_id', museum.id)
        .eq('show_on_site', true)
        .is('deleted_at', null)
        .not('image_url', 'is', null)
        .limit(1)
        .maybeSingle()

      results.push({
        name: museum.name,
        slug: museum.slug,
        count,
        preview_image: obj?.image_url ?? null,
        preview_emoji: obj?.emoji ?? '🏛️',
      })
    }

    return results
  } catch {
    return []
  }
}

export type WallObject = {
  id: string
  title: string
  emoji: string | null
  image_url: string | null
  museum: string
  slug: string
}

/** Real published objects, for variants that use the collection itself as the hero. */
export async function getWallObjects(limit = 24): Promise<WallObject[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: museums } = await supabase
      .from('museums')
      .select('id, name, slug')
      .eq('discoverable', true)
      .is('locked_at', null)
      .limit(40)

    if (!museums?.length) return []

    const byId = new Map(museums.map(m => [m.id, m]))

    const { data: objects } = await supabase
      .from('objects')
      .select('id, title, emoji, image_url, museum_id')
      .in('museum_id', museums.map(m => m.id))
      .eq('show_on_site', true)
      .is('deleted_at', null)
      .not('image_url', 'is', null)
      .limit(limit)

    if (!objects?.length) return []

    return objects.flatMap(o => {
      const m = byId.get(o.museum_id)
      if (!m) return []
      return [{
        id: o.id as string,
        title: (o.title as string) ?? 'Untitled',
        emoji: o.emoji as string | null,
        image_url: o.image_url as string | null,
        museum: m.name as string,
        slug: m.slug as string,
      }]
    })
  } catch {
    return []
  }
}

export const VARIANTS = [
  { id: 'v31', name: 'Store, dark', thesis: 'Spectrum 1/5 — the dark end. Crates labelled with real object photos.' },
  { id: 'v32', name: 'Store, lit', thesis: 'Spectrum 2/5 — strip lights on, real prints hung along the wall.' },
  { id: 'v33', name: 'Workroom', thesis: 'Spectrum 3/5 — the midpoint. A bench, a task lamp, a pinboard of real objects.' },
  { id: 'v34', name: 'Showroom', thesis: 'Spectrum 4/5 — bright room, low blocks, big framed prints.' },
  { id: 'v35', name: 'Studio', thesis: 'Spectrum 5/5 — the clean end. Cyclorama, colour, one real print behind.' },
  { id: 'v26', name: 'White Cube', thesis: 'Daylit white gallery. Skylight, no spotlight, black type.' },
  { id: 'v27', name: 'After Hours', thesis: 'Cold security lighting, mirror floor, glowing case edges.' },
  { id: 'v28', name: 'Afternoon', thesis: 'Sun through a window onto a table. Terracotta, not black.' },
  { id: 'v29', name: 'The Store', thesis: 'The racking behind the gallery, lit by one swinging bulb.' },
  { id: 'v30', name: 'Studio', thesis: 'Cyclorama, softboxes, colour. A product shot, not a museum.' },
  { id: 'v21', name: 'Orbit & Inspect', thesis: 'Drag to orbit the plinth, click to lift the glass, swap the object.' },
  { id: 'v22', name: 'Walk the Room', thesis: 'A corridor of lit plinths. Steer with the pointer, hold to walk faster.' },
  { id: 'v23', name: 'The Beam', thesis: 'You hold the spotlight. Everything you are not lighting is undocumented.' },
  { id: 'v24', name: 'The Turntable', thesis: 'Turn the object, take the case off, change the lighting. All live.' },
  { id: 'v25', name: 'Assembly', thesis: 'Scroll and the exhibit builds itself: plinth, object, glass.' },
  { id: 'v16', name: 'The Gallery', thesis: 'A raymarched WebGL room. The fold is a lit gallery, not a picture of one.' },
  { id: 'v17', name: 'Loud', thesis: 'Maximalist type at 19vw, object marquees, three colours, no whitespace.' },
  { id: 'v18', name: 'Immersion', thesis: 'One enormous object filling the screen, drifting, cross-fading.' },
  { id: 'v19', name: 'The Pile', thesis: 'Your collection as a physics pile you can grab and throw.' },
  { id: 'v20', name: 'Torchlight', thesis: 'A dark attic. Your cursor is the torch. Objects exist where you point.' },
  { id: 'v11', name: 'The Case', thesis: 'A real glass vitrine in CSS 3D. Cursor-lit, tactile, physical.' },
  { id: 'v12', name: "Curator's Table", thesis: 'A draggable canvas of real objects. Grab it, fling it, open one.' },
  { id: 'v13', name: 'Zoom', thesis: 'One continuous scroll-driven pull-back from serial number to whole collection.' },
  { id: 'v14', name: 'Kinetic Ledger', thesis: 'Kinetic type plus a record that catalogues itself as you watch.' },
  { id: 'v15', name: 'Spotlight', thesis: 'The homepage is a live search across real collections.' },
  { id: 'v1', name: 'Accession', thesis: 'Craft as credibility — the page is a museum object label.' },
  { id: 'v2', name: 'First Object', thesis: 'Catalogue something before you sign up. Commitment, not screenshots.' },
  { id: 'v3', name: 'The Wall', thesis: 'Real collections as the hero. Aspiration and live proof.' },
  { id: 'v4', name: 'The Switch', thesis: 'Spreadsheet pain vs a proper record. Import is the CTA.' },
  { id: 'v5', name: 'The Register', thesis: 'An archival dossier for the museum buyer. No marketing gloss.' },
  { id: 'v6', name: 'Two Doors', thesis: 'Self-select collector or institution; the whole page rewrites.' },
  { id: 'v7', name: 'Plain Offer', thesis: 'Direct response. Price, objections, guarantee, repeated CTA.' },
  { id: 'v8', name: 'One Object', thesis: 'A single object travels shoebox → record → public page.' },
  { id: 'v9', name: 'The Workbench', thesis: 'Dense, keyboard-first tool for the serious cataloguer.' },
  { id: 'v10', name: 'Display Case', thesis: 'Gallery-white, huge type, one decision on the page.' },
] as const

/** Thin review bar so the variants can be clicked through side by side. */
export function VariantBar({ current }: { current: string }) {
  const active = VARIANTS.find(v => v.id === current)

  return (
    <div className="type-mono sticky top-0 z-[60] w-full border-b border-black/10 bg-white text-[11px] text-neutral-700 print:hidden">
      <div className="mx-auto flex max-w-none items-center gap-3 overflow-x-auto px-3 py-1.5">
        <Link href="/design" className="shrink-0 font-semibold text-black hover:underline">
          design ↩
        </Link>
        <span className="shrink-0 text-neutral-400">|</span>
        {VARIANTS.map(v => (
          <Link
            key={v.id}
            href={`/design/${v.id}`}
            className={`shrink-0 rounded px-1.5 py-0.5 ${
              v.id === current ? 'bg-black text-white' : 'hover:bg-black/5'
            }`}
          >
            {v.id}
          </Link>
        ))}
        {active && (
          <span className="ml-2 hidden shrink-0 text-neutral-500 md:inline">
            {active.name} — {active.thesis}
          </span>
        )}
      </div>
    </div>
  )
}
