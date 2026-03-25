import type { Metadata } from "next";

export const SITE_URL = "https://vitrinecms.com";
export const SITE_NAME = "Vitrine";

const DEFAULT_OG_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Vitrine – Collection Management Platform",
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vitrine – Collection Management App for Museums & Collectors",
    template: "%s | Vitrine",
  },
  description:
    "Vitrine gives every museum, gallery, and collector a professional collection CMS and public website. Catalog, organise, and showcase your collection. Free to start.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  verification: { google: "NlYqoxW1EfCqQf17oyVupDlXnOzEG2dtjZPuRqsD-YU" },
};

type PageMetaOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: { url: string; width?: number; height?: number; alt?: string };
  noIndex?: boolean;
};

export function buildPageMetadata(opts: PageMetaOptions): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: opts.title,
      description: opts.description,
      url: `${SITE_URL}${opts.path}`,
      images: [opts.image ?? DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
    ...(opts.noIndex && { robots: { index: false, follow: false } }),
  };
}
