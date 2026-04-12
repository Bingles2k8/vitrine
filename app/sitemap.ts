import type { MetadataRoute } from "next";
import { segments } from "@/lib/segments";
import { competitors } from "@/lib/competitors";
import { getAllPosts } from "@/lib/blog";
import { createServerSideClient } from "@/lib/supabase-server";

const BASE = "https://vitrinecms.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  let museumEntries: MetadataRoute.Sitemap = []
  let objectEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = await createServerSideClient()
    const { data: museums } = await supabase
      .from('museums')
      .select('id, slug, updated_at')
      .eq('discoverable', true)

    if (museums) {
      museumEntries = museums.map((m) => ({
        url: `${BASE}/museum/${m.slug}`,
        lastModified: new Date(m.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

      const museumIds = museums.map((m) => m.id)
      const { data: objects } = await supabase
        .from('objects')
        .select('id, museum_id, updated_at')
        .in('museum_id', museumIds)
        .eq('show_on_site', true)
        .is('deleted_at', null)

      if (objects) {
        const slugById = Object.fromEntries(museums.map((m) => [m.id, m.slug]))
        objectEntries = objects.map((o) => ({
          url: `${BASE}/museum/${slugById[o.museum_id]}/object/${o.id}`,
          lastModified: new Date(o.updated_at),
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
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${BASE}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/discover`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE}/guide/essentials`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/guide/professional`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...segments.map((s) => ({
      url: `${BASE}/for/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...competitors.map((c) => ({
      url: `${BASE}/compare/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${BASE}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...museumEntries,
    ...objectEntries,
  ];
}
