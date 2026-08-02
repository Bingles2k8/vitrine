import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/_preview/"],
      },
    ],
    sitemap: "https://vitrinecms.com/sitemap.xml",
  };
}
