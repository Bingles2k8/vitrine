import type { MetadataRoute } from "next";
import { segments } from "@/lib/segments";
import { competitors } from "@/lib/competitors";
import { getAllPosts } from "@/lib/blog";
import { PLAN_ORDER } from "@/lib/plans";
import { createPublicClient } from "@/lib/supabase-server";
import { NICHE_SLUGS } from "@/app/tools/insurance-inventory/niches";

const BASE = "https://vitrinecms.com";

// Bump when static marketing pages change meaningfully. A stable date is more
// useful to crawlers than new Date(), which claims every page changed on every request.
const STATIC_LASTMOD = new Date("2026-06-11");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  let museumEntries: MetadataRoute.Sitemap = []
  let objectEntries: MetadataRoute.Sitemap = []
  try {
    // Public client: the cookie-bound server client has no session here, so
    // RLS returned no rows and museums silently vanished from the sitemap.
    const supabase = createPublicClient()
    // museums/objects have no updated_at column — selecting it errored and the
    // catch below silently dropped every museum from the sitemap. Use created_at.
    const { data: museums } = await supabase
      .from('museums')
      .select('id, slug, created_at')
      .eq('discoverable', true)
      .is('locked_at', null)

    if (museums) {
      museumEntries = museums.map((m) => ({
        url: `${BASE}/museum/${m.slug}`,
        lastModified: new Date(m.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

      const museumIds = museums.map((m) => m.id)
      const { data: objects } = await supabase
        .from('objects')
        .select('id, museum_id, created_at')
        .in('museum_id', museumIds)
        .eq('show_on_site', true)
        .is('deleted_at', null)

      if (objects) {
        const slugById = Object.fromEntries(museums.map((m) => [m.id, m.slug]))
        objectEntries = objects.map((o) => ({
          url: `${BASE}/museum/${slugById[o.museum_id]}/object/${o.id}`,
          lastModified: new Date(o.created_at),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      }
    }
  } catch {
    // Sitemap generation should never fail; museum/object entries are best-effort
  }
  return [
    {
      url: BASE,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/about`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/faq`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/discover`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE}/plans`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...PLAN_ORDER.map((tier) => ({
      url: `${BASE}/plans/${tier}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${BASE}/compliance`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/contact/enterprise`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE}/guide/essentials`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/guide/professional`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/for`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...segments.map((s) => ({
      url: `${BASE}/for/${s.slug}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE}/compare`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...competitors.map((c) => ({
      url: `${BASE}/compare/${c.slug}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${BASE}/blog`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${BASE}/tools`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/tools/insurance-inventory`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...NICHE_SLUGS.map((slug) => ({
      url: `${BASE}/tools/insurance-inventory/${slug}`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE}/tools/condition-report`,
      lastModified: STATIC_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...museumEntries,
    ...objectEntries,
  ];
}
