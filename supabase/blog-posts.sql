-- =============================================================
-- Blog Posts Table
-- =============================================================
-- Blog posts are public content; no INSERT/UPDATE/DELETE policies.
-- All mutations go through the admin panel (service role key).
-- All reads use the anon key (public read policy below).
-- =============================================================

CREATE TABLE blog_posts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL UNIQUE,
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  content      text NOT NULL DEFAULT '',
  keywords     text[] NOT NULL DEFAULT '{}',
  published_at timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_published_at_idx ON blog_posts (published_at DESC);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read blog posts"
  ON blog_posts FOR SELECT
  USING (true);

-- =============================================================
-- Seed: migrate existing MDX posts
-- =============================================================

INSERT INTO blog_posts (slug, title, description, keywords, published_at, updated_at, content)
VALUES (
  'how-to-catalog-your-collection',
  'How to Catalog a Collection: A Complete Beginner''s Guide',
  'A practical guide to cataloguing any collection from scratch — what fields to use, how to photograph items, which tools work best, and habits that keep it up to date.',
  ARRAY[
    'how to catalog a collection',
    'how to catalogue my collection',
    'collection cataloguing guide',
    'how to organise a collection',
    'catalogue my collection digitally'
  ],
  '2026-03-25T00:00:00Z',
  '2026-03-25T00:00:00Z',
  $body$To catalog a collection, create one record per item with consistent fields: what it is, what condition it's in, what it's worth, and when you acquired it. Add a photograph to each record. Store everything in a tool you can search, filter, and export from. A well-maintained catalogue protects your collection and makes it easy to share.

---

## What cataloguing a collection actually means

A catalogue is a structured database of your items. Each item has a record. Each record has fields. The fields capture what matters for your specific collection type — not a random pile of notes, but the same set of information recorded consistently across every item you own.

For a coin collection, that means denomination, country, year, mint mark, grade, and condition. For trading cards: set, card number, player or character, grade, and cert number. For vinyl: artist, album title, label, pressing year, and condition. The specific fields differ by collection type, but the principle is the same.

A catalogue is distinct from a pile, a box, or a spreadsheet with inconsistent columns. It's structured, searchable, and complete — which means it's actually useful. You can find any item instantly, know what your collection is worth, and have documentation ready for insurance or resale.

---

## Step 1: Decide what you're cataloguing

Before you add a single record, decide the scope. Are you cataloguing your entire collection, or starting with a single category? Are you including items in storage, or just what's on display? Do you want a want list alongside items you already own?

Start with your most valuable or most actively traded items first. These deliver the most immediate value from cataloguing — you'll be able to answer insurance questions, track market moves, and verify what you own. Work outward from there toward lower-value items over time.

Include everything eventually. A catalogue that covers 90% of your collection is significantly less useful than one that covers 100%. The gaps are always the items you need to find or verify at the worst moments. A complete catalogue is the goal; getting started with a subset is the sensible way to reach it.

---

## Step 2: Choose your fields

Every catalogue record needs a core set of fields that applies to any collection type. Beyond that core, add fields specific to what you collect.

**Core fields for every record:**
- **Title / Name** — what is this item?
- **Description** — provenance, significance, or history in free text
- **Category** — how you group items within your collection
- **Condition** — a consistent scale (Mint, Near Mint, Fine, Good, Poor — or numeric)
- **Estimated value** — current market value in your currency
- **Acquisition date** and **acquisition price** — what you paid and when
- **Images** — at minimum, one photograph per item

**Segment-specific fields to add:**

| Collection type | Additional fields |
|---|---|
| Coins | Denomination, country, year, mint mark, grade (Sheldon scale), cert number |
| Trading cards | Set, card number, player/character, grading company, grade, cert number |
| Vinyl records | Artist, album, label, catalogue number, pressing country, pressing year |
| Comic books | Series, issue number, grade, CGC/CBCS cert number, variant |
| Books | Author, publisher, edition, ISBN, binding type |
| Stamps | Country, catalogue number (Scott/Stanley Gibbons), perforation, watermark |
| LEGO | Set number, set name, theme, year, completeness (sealed/complete/partial) |
| Wine | Producer, appellation, vintage, bottle size, bin location, drinking window |
| Watches | Brand, model, reference number, movement type, case material, service history |

Choose your fields before you start entering records, so your data is consistent from the beginning.

---

## Step 3: Choose the right tool

The right cataloguing tool depends on your collection size and what you need to do with the data.

**Under 50 items:** A spreadsheet is fine for getting started. One row per item, one column per field, kept consistent. The limitation is that spreadsheets have no native image support, no automatic value totals, and no public sharing — so you'll outgrow this faster than you expect.

**50–500 items:** A dedicated collection management app earns its cost. You gain images per item, automatic value totals, filtering, and a public page to share your collection with other collectors. [Vitrine's free Community plan](/) handles up to 100 items with no credit card required.

**500+ items:** Purpose-built software is essential. Manual spreadsheet management becomes unworkable at this scale. You need proper search, bulk editing, and CSV import to migrate existing data quickly. [Vitrine's Professional plan](/for/coin-collection-app) handles up to 5,000 items with CSV import included.

Whichever tool you use, make sure you can export your data in a standard format. Never use a platform that won't let you get your records out.

---

## Step 4: Enter records consistently

With fields decided and a tool ready, start adding items. The most important principle: **catalogue consistently, not perfectly.** A record with six well-filled fields is more useful than one with twelve fields where several are blank or inconsistent.

Decide which fields are required for every record and fill those in every time — even when you don't have every piece of information. A coin with no condition grade noted is better than no record at all.

Be especially consistent with condition grades. Pick a scale and stick to it. If you use "Mint" for one item, "M" for another, and "9/10" for a third, your condition field becomes useless for filtering and sorting. The Sheldon scale (1–70) for coins, Goldmine scale for vinyl, and PSA/BGS numeric grades for cards are well-established standards worth using.

Record acquisition details while you remember them. The date, where you bought it, and what you paid are easiest to capture at the moment of acquisition — add them to the record immediately.

---

## Step 5: Photograph every item

Photographs are the hardest thing to add retroactively. If you photograph each item as you catalogue it, you won't face the task of going back through your entire collection later.

**Practical tips for collection photography:**
- Use natural light or a simple lightbox — a white card and a window work well
- A smartphone camera is sufficient for most items; specialist equipment is rarely needed
- Photograph the front and back for coins, stamps, trading cards, and graded slabs
- Include the label or certification tag in the frame for graded items
- Name or tag your files by item identifier before uploading, so they stay organised

For [vinyl record collections](/for/vinyl-record-collection-app), photograph the label as well as the sleeve — the label pressing details are often more useful than what's printed on the cover. For [comic book collections](/for/comic-book-collection-app), photograph any graded case labels and note the certification number in the record.

---

## Step 6: Keep it up to date

A catalogue is only useful if it reflects your collection as it actually is. Three habits that keep it current:

**Add new acquisitions the same day.** This is the easiest time to capture accurate condition, price paid, and provenance. Every day that passes makes the details fuzzier. Make it a rule: new item comes in, record goes in.

**Update values periodically.** Once or twice a year, review estimated values for your most significant items. Markets move — particularly for [trading cards](/for/trading-card-collection-app) and [wine collections](/for/wine-collection-app). Keeping values current gives you an accurate picture of what your collection is worth and helps with insurance.

**Record disposals accurately.** When you sell or trade an item, mark it as sold in your catalogue or remove the record entirely. An accurate catalogue only contains what you currently own — a record of sold items is useful context, but it shouldn't inflate your active collection count or value total.

---

## Step 7: Share what you've built

A catalogued collection is straightforward to share. A public collection page does more than look impressive — it helps with trading, establishes provenance, and connects you with other collectors who share your interests. The collector community is small and interconnected; a public catalogue gives others a way to find you.

If privacy matters for certain items, most tools let you mark individual records as private while making the rest of your collection visible. You get the community benefits without exposing items you'd rather keep off the public record.

For [stamp collectors](/for/stamp-collection-app), [art collectors](/for/art-collection-app), and [watch collectors](/for/watch-collection-app), a documented public catalogue also functions as an informal provenance record — useful if you ever need to verify the history of a piece.

---

## Frequently asked questions

**What is the easiest way to catalog a collection?**
Use a dedicated collection management app rather than a spreadsheet. Apps designed for collectors handle images, value tracking, and sharing in a single workflow — add an item, fill in the fields, attach a photo. Start with your most valuable items and work outward. [Vitrine's free plan](/) handles up to 100 items with no credit card required.

**How do I catalog a coin collection?**
The key fields for coins are denomination, country, year, mint mark, grade (using the Sheldon scale), and condition notes. Record both purchase price and current estimated value. Photograph both obverse and reverse in good light. [See the full guide to coin cataloguing with Vitrine](/for/coin-collection-app).

**How do I catalog a trading card collection?**
For trading cards, record set name, card number, player or character, condition, and — if graded — the grading company (PSA, BGS, CGC), grade, and cert number. A complete catalogue makes it easy to find any card and know what it's worth at a glance. [See the full guide to card cataloguing](/for/trading-card-collection-app).

**Should I use a spreadsheet or dedicated software?**
A spreadsheet is fine for under 50 items. Once you need images per item, automatic value totals, or a public page to share your collection, dedicated software saves significant time and effort. [See the full comparison of spreadsheets vs collection management software](/compare/spreadsheet-alternative).

**How do I value my collection for insurance?**
A complete catalogue with purchase prices, current estimated values, and photographs for each item is the foundation of any insurance documentation pack. Most insurers require photographs and values for items above a threshold. Export your catalogue regularly and store a copy separately from the collection itself.

**How do I catalog a LEGO collection?**
For LEGO, the key fields are set number, set name, theme, release year, and completeness (sealed, complete with instructions, complete without instructions, or partial). Note condition of the box if sealed. [See the full guide to LEGO cataloguing with Vitrine](/for/lego-toy-collection-app).$body$
);

INSERT INTO blog_posts (slug, title, description, keywords, published_at, updated_at, content)
VALUES (
  'best-collection-management-software-2026',
  'Best Collection Management Software in 2026',
  'An honest comparison of the best collection management software in 2026 — Vitrine, CatalogIt, Sortly, CLZ, and more — to help collectors find the right tool.',
  ARRAY[
    'best collection management software',
    'collection management app',
    'best collection management app',
    'collection tracker',
    'collection organiser app'
  ],
  '2026-03-25T00:00:00Z',
  '2026-03-25T00:00:00Z',
  $body2$The best collection management software in 2026 is purpose-built for collectors — not repurposed inventory software or a museum CMS with a hobbyist tier stapled on. It catalogues what you actually collect, tracks what it's worth, and gives you a way to share it. Here is every serious option available today, assessed fairly.

---

## What to look for

Before comparing tools, it helps to define what the software needs to do well. For most collectors, the non-negotiables are:

- **Cataloguing** — add items with title, description, condition, year, and category-specific fields
- **Images** — attach photos to each item so you have a visual record
- **Value tracking** — record purchase price and current estimated value, with a running total
- **Search and filter** — find any item instantly by any field
- **Sharing** — show your collection to other collectors, trade contacts, or family
- **Data portability** — export your records; never get locked into a platform

Everything beyond this is a bonus. Grading integration, barcode scanning, and CSV import are all useful — but a tool that does these six things well beats one that half-does twenty.

---

## Vitrine

**Best for:** Hobbyist collectors of any type — coins, trading cards, vinyl records, LEGO, books, stamps, comics, art, wine, watches, and more.

Vitrine is a web-based collection management platform built specifically for personal collectors. Add any item type, attach images, track purchase price and current value, and publish a public collection page your way. The interface is clean and deliberately modern — a contrast to the dated desktop software that dominates this space.

**Pricing:** Free (up to 100 items) · £5/month Hobbyist (up to 500 items) · £79/month Professional (up to 5,000 items, CSV import, analytics)

**Strengths:** Works in any browser on any device · All collection types in one account · Public collection page included · Actively maintained · Free tier with no credit card required

**Limitations:** Barcode scanning is on the roadmap but not yet live · No native mobile app (mobile browser works well)

→ See Vitrine for [coin collectors](/for/coin-collection-app), [trading card collectors](/for/trading-card-collection-app), and [vinyl record collectors](/for/vinyl-record-collection-app).

---

## CatalogIt

**Best for:** Small museums, historical societies, and institutional collections.

CatalogIt is a polished museum CMS with strong cataloguing features, location tracking, and condition reporting. It is designed for institutions with staff cataloguers and compliance requirements — which is evident in both the feature depth and the pricing.

**Pricing:** From around $360/year

**Strengths:** Deep institutional features · iOS app for field cataloguing · Solid image management

**Limitations:** Priced for institutions, not individual collectors · No free tier · Setup complexity is higher than personal-use tools · Public sharing is limited on lower tiers

[See how Vitrine compares to CatalogIt →](/compare/catalogit-alternative)

---

## Sortly

**Best for:** Business inventory — not personal collections.

Sortly is inventory management software used by businesses to track tools, equipment, and stock. Collectors sometimes reach for it because dedicated alternatives have historically been scarce, but it shows: no condition grading fields, no collection value tracking, no public sharing, and pricing that starts at $24/month for features that don't map to collecting.

**Pricing:** Free (severely limited) · From $24/month

**Strengths:** Good QR code and barcode scanning · Reliable for basic item tracking

**Limitations:** Not designed for collecting · No public collection page · No grading or condition fields · Expensive relative to what collectors actually need

[See how Vitrine compares to Sortly →](/compare/sortly-alternative)

---

## CLZ Apps

**Best for:** Collectors focused specifically on comics, books, movies, games, or music — as separate collections.

CLZ has dedicated apps for comics, books, movies, music, and games, each solid within its category. The problem is fragmentation: a separate subscription for every collection type, a desktop-first architecture, and a UI that reflects the early 2000s origins of the product.

**Pricing:** $20–30/year per app

**Strengths:** Deep category-specific features · Barcode scanning · Large community databases

**Limitations:** One subscription per collection type adds up · Desktop-first, web access costs extra · No unified interface for mixed collections

[See how Vitrine compares to CLZ →](/compare/clz-alternative)

---

## Delicious Library — discontinued

**Status: Shut down November 2024.**

Delicious Library was a beloved Mac app for cataloguing books, films, games, and music. It was shut down in late 2024. If you were a Delicious Library user, your collection data is at risk as macOS updates break compatibility. Export your XML data immediately if you still have access.

[See the best Delicious Library alternatives →](/compare/delicious-library-alternative)

---

## Excel and Google Sheets

**Best for:** Getting started with under 50 items.

Spreadsheets are free, flexible, and familiar. For a small collection you're not yet committed to managing properly, a spreadsheet is fine. Past a few hundred items, the lack of images, automatic value totals, and shareable output becomes a real limitation.

[See how to move from spreadsheets to proper collection software →](/compare/spreadsheet-alternative)

---

## Side-by-side comparison

| Tool | Best for | Starting price | Public page | All collection types |
|---|---|---|---|---|
| **Vitrine** | Hobbyist collectors | Free | Yes | Yes |
| CatalogIt | Museums & institutions | $360/year | Limited | Yes |
| Sortly | Business inventory | $24/month | No | No |
| CLZ | Comics, books, media | $20–30/year per app | No | No (per-app) |
| Delicious Library | — | Discontinued | No | No |
| Spreadsheet | Under 50 items | Free | No | Yes |

---

## Which tool is right for you?

If you collect as a hobby — coins, cards, vinyl, comics, LEGO, books, stamps, art, wine, or watches — Vitrine is the right tool. It handles any collection type in one account, starts free, and gives you a public collection page worth sharing.

If you manage an institutional collection with staff, compliance requirements, and a proper budget, CatalogIt is purpose-built for that.

If you are coming from Delicious Library, a spreadsheet, or a tool that's no longer working for you, Vitrine is the most direct upgrade path.

---

## Frequently asked questions

**What is the best free collection management software?**
Vitrine's Community plan is free for up to 100 items and includes a public collection page. It is the best free option for personal collectors in 2026 — no credit card required.

**What is the best collection management app for coins?**
Vitrine supports coin cataloguing with fields for denomination, year, mint mark, grade, and condition notes, and tracks collection value automatically. [See the full coin collection app page](/for/coin-collection-app).

**What is the best app for trading card collections?**
Vitrine handles sports cards, Pokémon cards, and graded slabs including PSA, BGS, and CGC grades. [See the full trading card collection app page](/for/trading-card-collection-app).

**What happened to Delicious Library?**
Delicious Library was shut down in November 2024. [Vitrine is the best replacement](/compare/delicious-library-alternative) for former users — it catalogues books, films, games, and music alongside any other collection type.

**Is there a collection management app that works on all devices?**
Vitrine is a web app that works in any browser on Mac, PC, iPhone, Android, or tablet. Nothing to install.

**Can I import my existing collection data into Vitrine?**
Yes. Professional plan users can import via CSV. Community and Hobbyist users can add items manually using the quick-add form. Most collections migrate in an afternoon.$body2$
);
