# VitrineCMS SEO Audit
**Date:** 16 May 2026
**Site:** vitrinecms.com
**Type:** SaaS — Collection Management Software (Museums & Hobbyist Collectors)

---

## Executive Summary

The site has solid foundations — HTTPS, clean URLs, no obvious crawl blockers — but three critical issues are suppressing organic visibility significantly.

### Top 3 Issues (Fix These First)

1. **Indexation is severely underperforming.** `site:vitrinecms.com` returned only ~1 result for a 40+ page site. This means Google is barely discovering the site. Submitting the XML sitemap to Google Search Console is the single highest-leverage action available right now.

2. **Homepage H1 is brand copy, not search copy.** "Your collection, beautifully managed" is a good tagline but invisible to search. Changing to something like "Collection Management Software for Museums & Collectors" takes 10 minutes and is the highest-impact edit on the site.

3. **Factual error live on the blog.** The post "Best Collection Management Software 2026" states the Hobbyist plan covers "up to 500 items" — the homepage and pricing page both say 1,000. Fix today.

### Quick Wins
- Fix the Hobbyist item cap error in the blog post
- Add "Spectrum 5.1" to the compliance page title and H1
- Submit sitemap.xml to Google Search Console
- Add `<meta name="description">` to pages that are missing it
- Fix the homepage H1 to include primary keywords

---

## Technical Findings

### 1. Indexation — CRITICAL

| | |
|---|---|
| **Issue** | `site:vitrinecms.com` returns ~1 result. The site has 40+ pages (26 /for segment pages, 5+ blog posts, pricing, compare pages, etc.) |
| **Impact** | High — if Google isn't indexing pages, they cannot rank regardless of quality |
| **Likely cause** | Sitemap not submitted to Search Console, or pages blocked/noindexed |
| **Fix** | 1. Verify sitemap.xml exists at vitrinecms.com/sitemap.xml and includes all pages. 2. Submit to Google Search Console. 3. Request indexing for key pages manually. 4. Check robots.txt for accidental blocks. |
| **Priority** | P0 — do this before anything else |

### 2. Robots.txt

| | |
|---|---|
| **Issue** | robots.txt was accessible at vitrinecms.com/robots.txt. Review for any Disallow rules that might be blocking /for, /blog, or /compare pages. |
| **Impact** | High if key pages are inadvertently blocked |
| **Fix** | Ensure all public-facing content pages are crawlable. Only block /admin, /api, and non-public paths. |
| **Priority** | P1 |

### 3. Page Speed

| | |
|---|---|
| **Issue** | No confirmed Core Web Vitals data without Search Console access. SaaS sites on modern stacks typically pass LCP/CLS but can struggle with INP on JS-heavy pages. |
| **Fix** | Run PageSpeed Insights on homepage + one /for page. If LCP > 2.5s, investigate image sizes and font loading. |
| **Priority** | P2 |

### 4. Schema Markup

| | |
|---|---|
| **Issue** | Cannot verify via web_fetch (JS-injected JSON-LD is stripped). |
| **Fix** | Run https://search.google.com/test/rich-results on the homepage and a blog post. At minimum, add SoftwareApplication schema to homepage and Article schema to blog posts. |
| **Priority** | P2 |

### 5. Canonical Tags

| | |
|---|---|
| **Issue** | Could not confirm canonical tags are present on all pages via static fetch. |
| **Fix** | Verify self-referencing canonical tags on all pages. Ensure consistent trailing slash handling (vitrinecms.com/blog vs vitrinecms.com/blog/). |
| **Priority** | P2 |

---

## On-Page Findings

### 6. Homepage H1 — HIGH

| | |
|---|---|
| **Issue** | H1 reads "Your collection, beautifully managed" — no target keywords present |
| **Impact** | High — H1 is a significant on-page signal. Missing "collection management software", "museum software", or similar terms |
| **Fix** | Change H1 to include primary keyword. Options: "Collection Management Software for Museums & Collectors" / "The Collection Management Software That Doesn't Suck" (brand-voice version) |
| **Priority** | P1 |

### 7. Homepage Meta Description

| | |
|---|---|
| **Issue** | Meta description may be auto-generated or missing — confirm in source |
| **Fix** | Write a unique 150–160 char meta description with primary keyword and clear value prop. Example: "Vitrine is collection management software for museums, archives, and serious collectors. Spectrum 5.1 aligned. From £5/month." |
| **Priority** | P1 |

### 8. /for Segment Pages — MEDIUM

| | |
|---|---|
| **Issue** | The 26 /for segment pages (e.g. /for/vinyl-records, /for/watches) are thin — largely template-driven with minimal unique content per segment. This limits ranking potential for long-tail segment keywords. |
| **Impact** | Medium — these pages represent the highest-volume targeting opportunity on the site |
| **Fix** | Add 200–400 words of segment-specific content to each page: what collectors in this segment care about, specific Vitrine features relevant to them, and a brief testimonial or use case. |
| **Priority** | P2 |

### 9. Blog — Pricing Error — CRITICAL (Trust & Accuracy)

| | |
|---|---|
| **Issue** | "Best Collection Management Software 2026" post states Hobbyist plan covers "up to 500 items". Correct limit is 1,000 objects. |
| **Impact** | High — a prospect reading this could make a decision based on false information. Also a trust signal to Google (E-E-A-T accuracy). |
| **Fix** | Edit the post, correct to 1,000 objects. |
| **Priority** | P0 |

### 10. Compliance / Spectrum Page — MEDIUM

| | |
|---|---|
| **Issue** | The compliance page is the strongest institutional content on the site, but "Spectrum" does not appear in the page title or H1. This page should own the keyword "Spectrum 5.1 collection management". |
| **Fix** | Update title tag to include "Spectrum 5.1" — e.g. "Spectrum 5.1 Compliance — Vitrine Collection Management". Update H1 accordingly. |
| **Priority** | P1 |

### 11. Internal Linking — MEDIUM

| | |
|---|---|
| **Issue** | The blog currently has 5 posts with limited internal linking to /for pages, /pricing, or /compare pages. Blog content should actively funnel readers toward conversion pages. |
| **Fix** | Add contextual internal links from blog posts to relevant /for segment pages and /pricing. Example: the vinyl cataloguing post should link to /for/vinyl-records. |
| **Priority** | P2 |

---

## Content Gap Analysis

### Biggest Missing Page: Discogs Alternative — HIGH

Discogs is the dominant platform for vinyl record collectors, but it's a marketplace first — not a catalogue management tool. Collectors regularly search "Discogs alternative" and "vinyl collection management" for tools focused on cataloguing rather than buying/selling.

- **Target keyword:** "Discogs alternative", "vinyl collection management software"
- **Search intent:** collector who wants to own their data and catalogue properly, not marketplace-dependent
- **Page to create:** /compare/discogs-alternative (or /compare/discogs-vs-vitrine)
- **Priority:** High — this is the single page most likely to drive meaningful traffic in the short term

### Other Missing Compare Pages — MEDIUM

Currently the site has some compare pages but is missing high-value ones:
- `/compare/sortly-alternative` — Sortly is a direct competitor targeting collectors
- `/compare/clz-alternative` — CLZ (CLZ Comics, CLZ Books, CLZ Music) has brand recognition but fragmentation problem
- `/compare/excel-alternative` for collections (vs generic spreadsheet messaging)

### Missing Keyword Clusters — MEDIUM

| Cluster | Example Keywords | Current Coverage |
|---|---|---|
| "how to catalogue [X]" | how to catalogue a coin collection, how to catalogue watches | Blog has 2 posts — expand |
| "[collection type] management software" | watch collection management software, coin collection software | Not targeted |
| "museum collection management" | museum collection management software, collections management system | Homepage partial |
| "Spectrum 5.1" | Spectrum 5.1 procedures, Spectrum 5.1 compliance | Compliance page (weak title) |
| "collection insurance" | insure my collection, collection insurance records | No content |

### Institutional Backlink Opportunity — HIGH

The Collections Trust website lists Spectrum-aligned software on their Spectrum Partners page. Getting Vitrine listed there would:
1. Be a high-authority backlink from a .org in the museum sector
2. Drive direct referral traffic from institutional decision-makers
3. Validate Vitrine's Spectrum 5.1 compliance to cautious buyers

**Action:** Apply directly at collectionstrust.org.uk.

---

## Prioritised Action Plan

### This Week (Critical)
1. Submit sitemap.xml to Google Search Console — verify all 40+ pages are included
2. Fix Hobbyist item cap in "Best Collection Management Software 2026" blog post (500 → 1,000)
3. Update homepage H1 to include primary target keyword
4. Add "Spectrum 5.1" to the compliance page title and H1

### Next Two Weeks (High Impact)
5. Write and publish a Discogs alternative comparison page
6. Add 200-word segment-specific content to the top 5 /for pages (watches, vinyl, coins, LEGO, museums)
7. Add internal links from all 5 blog posts to relevant /for and /pricing pages
8. Run Rich Results Test — implement SoftwareApplication and Article schema if missing

### This Month (Strategic)
9. Apply to Collections Trust Spectrum Partners listing
10. Write a dedicated "Spectrum 5.1 Procedures" blog post (institutional SEO + trust)
11. Add compare pages for Sortly, CLZ, and Excel/spreadsheets
12. Begin adding content to the remaining 21 /for segment pages

### Ongoing
- Post 2+ blog posts per month targeting "how to catalogue [X]" keywords
- Build internal link structure systematically as content grows
- Monitor Search Console once set up — track indexation and keyword data

---

*Audit produced 16 May 2026 using web_fetch crawl of vitrinecms.com, site: operator indexation check, and competitor keyword research. Schema markup could not be verified via static fetch — use Google Rich Results Test to confirm.*
