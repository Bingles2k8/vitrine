import { segments } from '@/lib/segments'
import { competitors } from '@/lib/competitors'
import { getAllPosts } from '@/lib/blog'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { SITE_URL } from '@/lib/seo'

// Regenerated from the same data sources as the sitemap so it can never drift
// from what's actually live (segments, comparisons, blog posts, plan facts).
export const revalidate = 3600

function planLine(id: (typeof PLAN_ORDER)[number]): string {
  const p = PLANS[id]
  const objects = p.objects === null ? 'Unlimited items' : `Up to ${p.objects.toLocaleString()} items`
  return `- **${p.label}** – ${p.price}. ${objects}. ${p.features.slice(1, 4).join(', ')}.`
}

export async function GET() {
  const posts = await getAllPosts()

  const body = `# Vitrine

> Vitrine is a collection management platform for museums, galleries, and hobbyist collectors.
> Catalog, organise, track value, and showcase collections of coins, stamps, trading cards,
> vinyl records, comic books, LEGO, watches, wine, art, books, and more. Free to start;
> museum-grade plans include Spectrum 5.1-aligned compliance procedures.

## Core Pages

- [Homepage](${SITE_URL}): Product overview, features, and pricing
- [About](${SITE_URL}/about): Company mission and what Vitrine is
- [Pricing](${SITE_URL}/plans): All plans compared, with full feature table
- [FAQ](${SITE_URL}/faq): Common questions about Vitrine answered
- [Discover](${SITE_URL}/discover): Browse public collections on Vitrine
- [Spectrum 5.1 Compliance](${SITE_URL}/compliance): Collection management procedures for museums

## Guides

- [Essentials Guide](${SITE_URL}/guide/essentials): Getting started with Community and Hobbyist plans
- [Professional Guide](${SITE_URL}/guide/professional): Advanced features — analytics, ticketing, staff management

## Pricing

Vitrine offers ${PLAN_ORDER.length} tiers:

${PLAN_ORDER.map(planLine).join('\n')}

Plan details: ${PLAN_ORDER.map((id) => `[${PLANS[id].label}](${SITE_URL}/plans/${id})`).join(' · ')}

## Collection Type Landing Pages

${segments.map((s) => `- [${s.metaTitle}](${SITE_URL}/for/${s.slug})`).join('\n')}

## Comparisons & Alternatives

${competitors.map((c) => `- [${c.metaTitle}](${SITE_URL}/compare/${c.slug})`).join('\n')}

## Blog

${posts.map((p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`).join('\n')}

## Legal

- [Privacy Policy](${SITE_URL}/privacy)
- [Terms of Service](${SITE_URL}/terms)
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
