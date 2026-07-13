# Vitrine — Full SEO + AI-SEO (AEO/GEO) Audit

**Date:** 7 July 2026
**Site:** vitrinecms.com
**Type:** SaaS — collection management software (small museums / archives + hobbyist collectors), UK-based, global market
**Method:** Live raw-HTML crawl of key page types (schema/canonical/robots verified in source, not just rendered markdown), full codebase read (`lib/seo.ts`, `components/JsonLd.tsx`, all marketing routes), sitemap inventory (152 URLs), and competitor + AI-query research across Google, the museum sector (Collections Trust), and hobbyist collector niches.

---

## 0. Headline assessment

**Vitrine's on-site SEO and AI-SEO are already strong — top ~10–15% of SaaS sites at this stage.** This is not a site with foundational problems. The previous two audits (16 May, 11 June) were acted on thoroughly:

- Every public page has a unique, keyword-led title, description, and **self-referencing canonical**.
- **Structured data is extensive and correct**: Organization + WebApplication + AggregateOffer on the homepage; FAQPage on product/segment/compare/tool pages; Article with a **named Person author (Matthew Bingham) and real `dateModified`** on blog posts; BreadcrumbList sitewide; VisualArtwork/Event/CollectionPage on museum content.
- **A hand-built, data-driven `llms.txt`** (dynamic route, regenerated from live data so it can't drift) — most competitors have nothing.
- **robots.txt allows all AI crawlers** (GPTBot, ClaudeBot, PerplexityBot, Google-Extended all fall under a permissive `*`).
- **Deep content**: 26 `/for` segment pages (~900–1,300 unique words each), 8 `/compare` alternative pages, 7 blog posts, a Spectrum-5.1 compliance page (~2,800 words covering all 21 procedures), and free tools. 152 URLs total.

**So the honest framing:** the biggest remaining ranking gains are **NOT on the site** — they are (1) **off-site authority/presence** (the site is invisible on the exact third-party sources AI assistants cite) and (2) **indexation/domain authority** (a young domain needs links + time). On-site work remaining is a short list of **real bugs and refinements**, not a rebuild.

The rest of this document is: the target query map (what we should rank for + AI questions), then the prioritised fix list.

---

## 1. What Vitrine should rank for — target query map

### 1a. Traditional search — head & mid-tail

| Cluster | Representative queries | Current coverage | Verdict |
|---|---|---|---|
| Category head | "collection management software", "collections management system" | Homepage (H1, title), llms.txt | ✅ Covered, but head terms are authority-gated (needs links) |
| Museum sector | "museum collection management software", "small museum software", "collections management system for museums" | `/for/museum-collection-management-software`, `/compliance` | ✅ Strong |
| Spectrum | "Spectrum 5.1 software", "Spectrum compliant collections management", "Spectrum procedures software" | `/compliance` (title + H1 + 21 procedures) | ✅ Best page on the site |
| Institutional niches | "local history society software", "university archive management", "photography archive software" | Dedicated `/for` pages | ✅ Smart long-tail |
| Hobby "type + app" | "vinyl record collection app", "coin collection app", "watch collection app" … (22 types) | 22 `/for/{type}-collection-app` pages | ✅ Excellent programmatic coverage |
| "X alternative" | "Discogs alternative", "CatalogIt alternative", "Sortly/CLZ/Delicious Library/iCollect/Collectify/spreadsheet alternative" | 8 `/compare` pages | ✅ Strong |
| "how to catalogue X" | how to catalogue a coin/stamp/vinyl collection | 3 blog posts + segment pages | 🟡 Expandable |

### 1b. High-value queries NOT yet targeted (the gaps)

| Missing query | Why it matters | Recommended page |
|---|---|---|
| **"PastPerfect alternative"** | PastPerfect is the dominant incumbent (**12,000+ museums**); it's desktop-first, US-priced ($1,295+), no built-in public website. This is Vitrine's single strongest institutional wedge — and there is **no compare page for it.** | `/compare/pastperfect-alternative` |
| **"CatalogIt / eHive / Axiell / CollectiveAccess alternative"** (museum incumbents) | CatalogIt exists; eHive, Axiell, CollectiveAccess, TMS do not. These are exactly the names AI answers list for "best museum collection software". | `/compare/ehive-alternative`, `/compare/axiell-alternative` |
| **"Numista / OpenNumismat / EzStamp alternative"** (hobby incumbents) | The `/for` pages mention them, but a dedicated compare page ranks for the alternative query. | Add to relevant `/compare` |
| **"cloud PastPerfect" / "PastPerfect online"** | People searching for a modern/cloud PastPerfect are the ideal buyer. | Cover within PastPerfect compare page |
| More **"how to catalogue X"** (watches, comics, LEGO, art, trading cards) | Matches existing `/for` inventory; each is a HowTo-schema citation magnet. | Blog posts, 1–2/month |
| **"collection insurance inventory" / "how to value my collection"** | You already have the free tools — but little editorial content feeding them. | Blog + link to `/tools` |

### 1c. AI-assistant questions Vitrine should be the answer to

These are the natural-language prompts (ChatGPT / Perplexity / Google AI Overviews / Claude) where Vitrine *should* surface. Marked with current realistic likelihood of being cited **today**:

**Institutional / museum:**
- "What's the best collection management software for a small museum?" — ❌ *not cited (see §3)*
- "What's an affordable / cloud alternative to PastPerfect?" — ❌ *no page, not cited*
- "What collections software is Spectrum 5.1 compliant?" — 🟡 *strong page, weak authority*
- "What software do small museums use to catalogue their collection?" — ❌
- "How much does museum collection management software cost?" — 🟡 *pricing is public + schema'd, good*

**Hobbyist:**
- "What's the best app to catalogue my [vinyl / coin / watch / comic] collection?" — 🟡 *great pages, low authority*
- "What's a good Discogs alternative that lets me own my data?" — 🟡 *excellent page, needs links*
- "How do I catalogue my [X] collection?" — 🟡 *blog covers some*
- "Is there a free way to make a website for my collection?" — 🟡 *Community plan; underdeveloped as an answer*

**The pattern:** the *pages* to answer these questions exist and are well-structured. What's missing is **the authority and third-party corroboration that makes an AI trust and cite them** (§3). On-site AEO structure is done; off-site GEO presence is the bottleneck.

---

## 2. On-site SEO — findings & fixes

Ordered by leverage. File:line references are exact.

### P0 — Real bugs

**2.1 `/faq` FAQPage schema is malformed (JSX dumped into JSON-LD).**
In `app/faq/page.tsx`, several `faqs[].answer` values are **React/JSX nodes** (e.g. `:29-44, 78-85, 88-94, 112-119`), but they're passed straight into `acceptedAnswer.text` and `JSON.stringify`'d (`:145`). `JSON.stringify` of a React element yields garbage `{"type":...,"props":...}` text, so those Q&As are **invalid in the emitted FAQPage schema** — Google may drop the whole block and AI can't extract them. *Fix:* store answers as plain strings (or a `plainText` field parallel to the JSX) and serialize the string. This is the flagship FAQ page — worth fixing first.

**2.2 Noindexed pages are in the sitemap.**
`/privacy` and `/terms` are `noIndex:true` (`privacy/page.tsx:8`, `terms/page.tsx:8`) but still emitted in `app/sitemap.ts`. Submitting a noindex URL in the sitemap is a contradictory signal GSC flags. *Fix:* drop them from `sitemap.ts` (or a `noindexPaths` filter).

### P1 — Missing metadata / weak signals

**2.3 Museum sub-pages have no canonical and no OG.**
`/museum/[slug]/visit`, `/events`, `/wanted`, `/events/[id]` set inline `title`/`description` only and **do not go through `buildPageMetadata`**, so no self-canonical, no OG object (`museum/[slug]/visit/page.tsx:17`, `events/page.tsx:18`, `wanted/page.tsx:13`, `events/[id]/page.tsx:54`). *Fix:* route them through `buildPageMetadata` with their own `path`.

**2.4 `/plans/[tier]` H1 is the price string only.**
The visible H1 renders `{details.priceDisplay}` (e.g. "£5", `plans/[tier]/page.tsx:535`); the plan name is a `<p>` above it. A price is a terrible H1. *Fix:* H1 = `"{Plan name} plan — {short value line}"`, price becomes a subhead.

**2.5 Homepage keyword H1 is styled as a tiny eyebrow.**
The real `<h1>` ("Collection management software for museums & collectors", `app/page.tsx:138-140`) is correct text but rendered `font-mono text-xs uppercase`; the big visual headline "Your collection, beautifully managed." is a `<p>`. Text-wise the H1 is fine for SEO — this is a low-priority semantic/visual nit, not a ranking problem. Consider making the keyword line the visual headline, or leave as-is.

**2.6 No `apple-touch-icon`.** `app/icon.svg` correctly auto-generates the favicon (Next.js convention — the previous audit's "no favicon" was wrong), but there's no `app/apple-icon.png` for iOS home-screen/social. Minor. *Fix:* add `app/apple-icon.png` (180×180).

### P2 — Refinements

- **2.7 Per-page OG images.** Every marketing page (`/for/*`, `/compare/*`, `/blog/*`, `/plans/*`, tools) shares one generic `og-default.jpg` (`lib/seo.ts:57`). Per-segment / per-post OG images (even templated via `next/og`) lift social + AI-surface CTR. Only museum pages override today.
- **2.8 `/compare` Article dates are "today" on every request.** `datePublished`/`dateModified = new Date()` (`compare/[competitor]/page.tsx:101`) — churny, and arguably deceptive freshness. *Fix:* use fixed authored dates + real edit dates.
- **2.9 `/compare` index missing a tagline for `discogs-alternative`** (`compare/page.tsx:20-28` lists 7 of 8). Cosmetic.
- **2.10 Twitter card has no `site`/`creator` handle** (`lib/seo.ts:31`). Add `@` handle once the account exists.
- **2.11 Museum public pages load Google Fonts with `display=block`** (`museum/[slug]/layout.tsx:104-109`) → FOIT, hurts LCP on the pages you most want indexed for museum names. *Fix:* `display=swap` (or `optional`).
- **2.12 No web analytics / measurement.** No GA4, Plausible, or PostHog found. You can't run the monthly AI-visibility loop or track GSC-to-AI referral without it. *Fix:* add GA4 + confirm Google Search Console is receiving the sitemap.

---

## 3. AI-SEO (AEO / GEO) — the real opportunity

**On-site AEO structure: A-grade.** Answer capsules, FAQPage everywhere, breadcrumbs, named-author Article schema, comparison tables, and a live `llms.txt` are exactly what the Princeton GEO research and current AI-citation patterns reward. Two on-site adds:

- **3.1 Add `HowTo` schema to the "how to catalogue X" posts.** These are step-by-step guides but currently only carry `Article` schema (verified: `/blog/how-to-catalogue-a-stamp-collection` has Article, not HowTo). HowTo is a primary citation format for "how do I…" AI answers.
- **3.2 Add `WebSite` + `SearchAction` (sitelinks search box)** to the homepage `@graph`, and consider `SoftwareApplication` alongside `WebApplication` (the former is the more common entity AI matches to "software" queries).

**Off-site GEO presence: this is the bottleneck, and it's not a code problem.** AI assistants answer "best collection management software" by citing **third-party sources Vitrine is absent from**. Confirmed today:

| Source AI assistants cite | Vitrine present? | Action |
|---|---|---|
| **Collections Trust `/software` (Spectrum Partners)** — the museum sector's authority page, a `.org` backlink | ❌ | **Apply for Spectrum Partner listing** (collectionstrust.org.uk). Highest-value single action for institutional. |
| **Capterra / G2 / SoftwareAdvice** (B2B SaaS review sites — heavily cited by ChatGPT/AI Overviews for "best X software") | ❌ | Create vendor profiles; seed first reviews from beta museums. Unlocks `aggregateRating`. |
| **Wikipedia "Collections management system"** software list | ❌ | Get listed (needs independent coverage first — chicken/egg; pursue after press/reviews). |
| **Reddit** (r/museums, r/vinyl, r/coins, etc. — 1.8% of ChatGPT citations) | ❌/thin | Authentic participation (you already have a Reddit engagement routine — point it at these). |
| **"Best collection software" listicles** (wifitalents, zipdo, wonderfulmuseums, capterra roundups) | ❌ | Outreach to be included. |

**Why this matters more than any on-site tweak:** current AI answers to your money queries cite PastPerfect, CatalogIt, CollectiveAccess, Sortly, CLZ, eHive — *because those brands appear on Capterra, G2, Collections Trust, and Wikipedia.* Until Vitrine is present there, its excellent on-site pages won't be surfaced, because the AI never sees corroboration. **Reviews + directory listings + the Collections Trust backlink are the unlock.**

Secondary: **no `aggregateRating`/`Review` schema exists** (`grep` confirms none) — you can't add it honestly until you have real reviews, which is another reason to prioritise Capterra/G2.

---

## 4. Prioritised action plan

### This week — on-site (all small, high-confidence code fixes)
1. **Fix the `/faq` JSX-in-schema bug** (2.1) — flagship page emitting invalid FAQPage.
2. **Remove `/privacy` + `/terms` from the sitemap** (2.2).
3. **Route museum sub-pages through `buildPageMetadata`** for canonicals + OG (2.3).
4. **Give `/plans/[tier]` a real H1** (2.4).
5. **`display=swap` on museum Google Fonts** (2.11).
6. **Confirm the sitemap is submitted in Google Search Console** and check the Indexed count (the May audit's #1 issue — verify it's resolved).

### This month — off-site (the ranking unlock)
7. **Apply for the Collections Trust Spectrum Partner listing** — highest-value institutional action. *(Long-standing open item.)*
8. **Create Capterra + G2 + SoftwareAdvice profiles**; ask 3–5 beta museums for reviews. Then add `aggregateRating` schema.
9. **Build `/compare/pastperfect-alternative`** — the biggest missing high-intent page.
10. **Add `HowTo` schema** to the how-to blog posts (3.1) and **`WebSite`+`SearchAction`** to the homepage (3.2).

### Ongoing
11. Publish 1–2 "how to catalogue [X]" posts/month (HowTo schema) mapped to `/for` pages, each linking to the matching segment + compare page.
12. Add compare pages for eHive / Axiell / CollectiveAccess as institutional push continues.
13. Per-page OG images (templated) for `/for`, `/compare`, `/blog` (2.7).
14. **Monthly AI-visibility check:** run ~15–20 of the §1c queries through ChatGPT / Perplexity / Google AI Overviews; log whether Vitrine is cited and who is. (Needs GA4 + a simple spreadsheet — 2.12.)

---

## 5. What is genuinely already done well (do not "fix")
- Canonicals on all standard marketing pages; correct `noindex` on auth/legal/share/embed.
- Comprehensive, correct JSON-LD via `components/JsonLd.tsx` + `lib/seo.ts` (centralised — easy to extend).
- Named-author Article schema with real modified dates; visible bylines.
- 26 substantial `/for` pages + 8 `/compare` pages + strong compliance page.
- Dynamic, drift-proof `llms.txt`.
- Permissive robots.txt (all AI crawlers allowed); clean disallow of `/admin /api /dashboard /_preview`.
- Server-rendered marketing pages, self-hosted fonts, ISR (`revalidate=3600`).

**Bottom line:** the site is built right. Ranking now depends on **authority (links + reviews + directory presence)** and **a handful of small on-site fixes** — not on any large SEO/AISEO rebuild.

---

*Audit produced 7 July 2026. On-site claims verified against live raw HTML (JSON-LD confirmed in source, not rendered markdown) and the current codebase with file:line references. Off-site/indexation claims (GSC index count, review-site presence) should be confirmed in Google Search Console, which was not accessible during this audit.*
