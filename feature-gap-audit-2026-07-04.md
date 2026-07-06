# Vitrine — Site Audit, Competitor Comparison & Feature Gap Analysis

**Date:** 4 July 2026
**Method:** Full codebase route/feature inventory; competitor research across 13 products (PastPerfect, CatalogIt, eHive, Axiell Collections, Modes, Zetcom MuseumPlus, Artwork Archive, Collector Systems, Omeka S, Gallery Systems TMS/eMuseum, Ticket Tailor, DigiTickets, Art Tickets); user-demand mining from review sites, sector bodies (Collections Trust, AIM), and collector communities. Direct user feedback (in-app survey, support inbox, GitHub issues) does not exist yet — see §2.4.

---

## 1. Where Vitrine stands

**The bundle is the moat.** No surveyed competitor offers collection management + no-code public website + visit info + Stripe event ticketing in one subscription. The closest analogues all require pairing a CMS (PastPerfect, CatalogIt, eHive) with a separate ticketing product (Ticket Tailor, DigiTickets, Art Tickets). This is the sharpest positioning available and should anchor all marketing.

**Already built and genuinely competitive** (verified in code):

- All 21 SPECTRUM 5.1 procedures with registers, quota-enforced RPCs, and compliance RLS
- CSV import **and** export (`api/import/objects`, `CSVImportModal`), full-account export, self-serve deletion
- Barcode/ISBN camera lookup, QR labels, perceptual-hash duplicate detection
- Event ticketing with Stripe Connect payouts, QR tickets, **door scanning** (`dashboard/events/[id]/scan`), refunds
- Password-protected encrypted share links (equivalent to Artwork Archive's "Private Rooms," their headline feature)
- 7-layout public site builder, Discover directory, embed widget, per-object JSON-LD SEO
- Insurance register + printable insurance inventory, valuations with history, risk register
- RBAC with 6 roles, personal loans with reminders, Learn Mode tooltips

**Market timing working in our favour:**

- Gallery Systems is sunsetting EmbARK (their small-museum product) and pushing users up to enterprise TMS — an SMB vacuum
- Axiell ended Adlib support (Jan 2024) — 350+ UK institutions forced to migrate
- PastPerfect's desktop→Web Edition transition is generating bad reviews ("clunky," "many bugs," "takes a ton of time to train")
- Zetcom's published floor is ~£90/user/month; Vitrine's Professional at £79/org/month undercuts the whole mid-market on flat, non-per-seat pricing — which user research says is the #1 stated switching reason

---

## 2. Site audit — what's hurting conversion *today* (fix before building anything)

These are not new features; they are leaks in the existing funnel.

### 2.1 Near-zero Google indexation (P0, from `vitrinecms-seo-audit.md`, still open)
`site:vitrinecms.com` returns ~1 result. 26 SEO segment pages, compare pages, and a blog exist but are invisible. **No feature will move conversion while acquisition is ~0 organic.** Submit sitemap to Search Console, fix the keyword-free homepage H1, fix the blog post that misstates Hobbyist's limit as 500 items (it's 1,000).

### 2.2 Three known data bugs, unfixed since the April Spectrum audit
- **P-3 Critical:** disposals write `disposal_records` but never sync `objects.status`/`disposal_*` — disposals invisible on the object record (two sources of truth)
- **P-2 High:** emergency dashboard queries a non-existent `deleted` column — salvage-priority picker returns nothing
- **P-1 High:** print object report reads 6 wrong column names — blank dates, mis-sorted history

These sit inside the compliance suite that justifies the £79 tier. A Professional customer hitting them churns and tells the sector.

### 2.3 Revenue switched off at the top
- **Institution (£349/mo) is `comingSoon: true`** — literally not purchasable. Any Institution-sized lead currently has nothing to buy.
- **Custom domains** promised as "coming soon" on two paid tiers with zero implementation. For a product whose pitch is "your museum's website," `matts-museum.vitrinecms.com` vs `collection.mymuseum.org` is a real objection at the exact moment someone is deciding to pay.

### 2.4 No feedback loop exists
The Week 5 growth brief specified an in-app survey at the 50-item mark ("What would make this worth £5/month for you?"). It was never built — no survey code exists. There are also no GitHub issues and no support-inbox feedback. **Vitrine currently has no mechanism for hearing users at all.** This is the cheapest high-value item in this entire document.

### 2.5 Under-marketed strengths
Competitor-comparison research initially flagged CSV import, ticket check-in scanning, and private share rooms as Vitrine gaps — all three exist in code. If a researcher briefed on the product missed them, prospects will too. Surface them on /plans, the compare pages, and segment pages. Full-account export should be marketed explicitly as a no-lock-in guarantee (a hard veto issue for the serious-collector segment; cf. Snupps shutdown anxiety, CLZ's CSV-export announcement).

---

## 3. Competitor landscape (condensed)

| Competitor | Segment | Pricing | Beats us on | We beat them on |
|---|---|---|---|---|
| PastPerfect | US small museums (~11k installs) | $870 one-time + add-ons; Web Edition $870–1,500/yr | Membership/donor/fundraising CRM, offline desktop, migration services | Modern UX, integrated public site, ticketing, flat SaaS pricing |
| CatalogIt | Small museums + collectors (our closest analogue) | Free (50 entries) → ~$54–96/mo museums | Native mobile apps w/ capture, Nomenclature vocabularies, HUB aggregator, public API | Ticketing, site builder, SPECTRUM depth, compliance suite |
| eHive | Micro museums, ANZ/UK | Free (200 recs) → $120–1,200/yr | Shared portal network effect, OAI-PMH/API, 5-yr licences | Everything else; their UI and limits are weak (no A/V files) |
| Modes | UK small museums (~650 orgs) | £73–146/user/yr | **Certified** SPECTRUM badge, discipline templates, terminology control, Art UK export | Cloud UX, public site, ticketing, analytics |
| Axiell Collections | Mid/large UK+EU | Quote (thousands/yr) | SPECTRUM certification, archives standards (ISAD(G)), DAM, API, multi-site, services | Price, simplicity, self-serve, all-in-one ops |
| Zetcom MuseumPlus | Mid/large EU (Louvre tier) | From ~£425/mo (5 users) | Exhibitions, thesauri (AAT/GND/Iconclass), API, offline scan app, multilingual | Price (flat vs per-seat), setup time, ticketing/site |
| Gallery Systems TMS | Flagship museums | 5–6 figures | Exhibitions/shipping, rights & repro, IIIF, Getty vocabularies, conservation studio | Entire SMB market (they just abandoned it) |
| Artwork Archive | Artists/private collectors | ~$6–24/mo | Sales/invoicing, appraisal-expiry reminders, tear sheets, integrations | Museum ops, compliance, ticketing, public site depth |
| Collector Systems | HNW collectors/family offices | $85–150/user/mo | Mobile apps, advisor/multi-collection model | Price, breadth |
| Omeka S | Digital humanities/grant projects | Free/self-host | IIIF, OAI-PMH, REST API, linked data, multi-site | Ease of use, hosted simplicity, ops features |
| Ticket Tailor | Indie venues (ticketing) | ~$0.28–0.75/ticket | Timed entry, reserved seating, season passes, checkout donations, Zapier/Mailchimp | We bundle ticketing *with* the CMS |
| DigiTickets | UK attractions | Quote | EPOS/retail, memberships, **Gift Aid on admissions**, timed entry | Price, self-serve, collections |
| Art Tickets (Art Fund) | UK museums | **Free** | Gift Aid + donation capture, Audience Finder benchmarking, Art Fund halo | Everything non-ticketing; but "free + Gift Aid" is a serious pull |

**What wins deals per segment:** UK institutions buy the Collections Trust SPECTRUM Partner badge; small museums buy volunteer-simplicity + migration confidence + flat pricing; collectors buy mobile capture + insurance outputs + data ownership; attractions buy integrated ops (tickets/members/Gift Aid).

---

## 4. Feature gap list — what to build, who benefits, conversion impact

Ordered by expected conversion return, grouped in tiers. "Conversion impact" = effect on Vitrine's own funnel (signup→paid, tier upgrades, churn) unless noted.

### Tier 1 — Direct conversion drivers (next quarter)

**1. In-app feedback survey at the 50-item mark** *(already specced in Week 5 brief)*
- **Benefit:** Users get a voice; you get the real version of this document from actual users.
- **Conversion impact: HIGH, indirect but foundational.** Every future prioritisation decision improves. One modal, one question, pipe to email. Days, not weeks.

**2. Guided migration & legacy importers (PastPerfect / Adlib / Modes / eHive / Excel-with-images)**
- **Benefit:** Museums never start from zero; "data migration is the most time-consuming and challenging part" is the universal adoption blocker. CSV import exists, but the market standard (CatalogIt runs a whole migrations service) is *assisted* migration including images, accession relations, and donor fields. PastPerfect charges extra for conversion — a resentment point.
- **Conversion impact: VERY HIGH.** This is the #1 verified deal-breaker, and two forced-migration windows (Adlib EOL, EmbARK sunset) are open right now — while Modes, the UK incumbent with ~680–700 organisations, remains Windows-desktop-only with no cloud, API, or IIIF story: the single most direct displacement target for a "migrate from Modes" importer. CatalogIt already weaponises this against PastPerfect (free white-glove migrations + 60-day trial). "Free migration from PastPerfect/Modes/Adlib" is both a feature and the strongest ad copy available. Also add in-app **bulk edit** (multi-select) so imported data can be cleaned without re-export.

**3. Donations + Gift Aid on the existing Stripe rail (UK)**
- **Benefit:** Museums add 25p/£1 to donations and admission income; HMRC-compliant declarations and claim exports remove a genuinely painful manual process. Only 56% of eligible museums claim Gift Aid on admissions — whitespace. Also add a donation prompt at ticket checkout and a Donate block on the public site.
- **Conversion impact: VERY HIGH for the UK institutional segment.** Art Tickets (free, with Gift Aid) currently beats Vitrine's paid ticketing for any UK charity; without Gift Aid, ticketing is disqualified at exactly the customers the £79 tier targets. With it, "the ticketing pays for the subscription" becomes the Pro-tier pitch. It also increases *the museum's* revenue, which is the strongest retention story a SaaS can have.

**4. Custom domains (kill the "coming soon")**
- **Benefit:** The public site becomes the museum's real website; credibility with boards and funders.
- **Conversion impact: HIGH on free→paid and Hobbyist→Pro upgrades.** It's the classic willingness-to-pay feature for site builders, it's already promised in the plan cards, and Vercel domain APIs make it a bounded build. Every week it says "coming soon," the plans page trains prospects to discount all other claims.

**5. Ship Vitrine Capture (iOS app currently stuck in App Store review) + market mobile capture**
- **Benefit:** Photograph-and-catalogue from a phone is CatalogIt's entire winning pitch and the top collector expectation (ISBN scanning is table stakes in book cataloguing).
- **Conversion impact: HIGH for the hobbyist 70% of the funnel.** The web app already does browser barcode scanning; a native capture app closes the gap with CatalogIt/Collector Systems. The app is built — the remaining work is review compliance. Follow with offline capture + sync later (recurring wish; deal-breaker only for rural sites).

**6. Insurance-ready exports as a first-class, marketed workflow**
- **Benefit:** Collectors catalogue largely *to get insured*: itemised schedule with photos, values, appraisal dates, condition. Vitrine has valuations, insurance records, and a print page — what's missing is a polished "Insurance Pack" PDF export + **appraisal/valuation expiry reminders** (Artwork Archive's beloved feature).
- **Conversion impact: HIGH for Hobbyist conversions.** Your own ad testing already identified insurance as the strongest hook ("Insurance-ready in 20 minutes"). This makes the ad true. Mostly assembly of existing pieces.

### Tier 2 — Segment unlocks (this year)

**7. Memberships & season passes**
- **Benefit:** Museums run renewals, member pricing on tickets, digital member cards — currently forcing a second system (PastPerfect's membership CRM is precisely why small US museums won't leave it; Ticket Tailor and DigiTickets both sell it).
- **Conversion impact: HIGH institutional; unlocks the "all-in-one ops" claim.** Stripe subscriptions per-museum via Connect is a natural extension of the existing billing rail. Members = recurring museum revenue = Vitrine becomes un-churnable infrastructure.

**8. Exhibitions module**
- **Benefit:** Plan an exhibition, attach objects, venues, dates, checklists; history shows on the object record and can publish to the public site. Present in TMS, Zetcom, Axiell, Modes, CatalogIt, Artwork Archive — Vitrine has only an event category.
- **Conversion impact: MEDIUM-HIGH.** Rarely the trigger to switch, but its absence reads as "not a real museum CMS" in evaluations, and reviewers punish clumsy exhibition logging (PastPerfect's is "incredibly time-consuming"). Also the natural home for public "past exhibitions" pages — SEO surface.

**9. Collections Trust SPECTRUM Partner certification (process, not code)**
- **Benefit:** UK accredited museums start shortlists from the Collections Trust software page; Modes and Axiell win on the badge. Vitrine has the substance (21/21 procedures) without the certificate.
- **Conversion impact: HIGH for UK institutional; near-zero build cost.** Being absent from that list silently removes Vitrine from the exact segment the Professional tier was built for. (Recommended in the SEO audit too.)

**10. Saved searches, object sets & a flexible report builder**
- **Benefit:** Registrars group arbitrary objects (exhibition prep, insurance schedules, board reports); eHive users explicitly ask to "group objects together and save those groupings." Vitrine's exports are fixed CSV/PDF.
- **Conversion impact: MEDIUM on acquisition, HIGH on retention.** Reporting friction is the top source of *post-purchase* negative reviews across the category — it drives churn and review-site scores, which drive future conversion.

**11. Recurring timed-entry admission + school & group bookings**
- **Benefit:** A museum's core ticketing use case is *daily timed admission slots with capacity*, not one-off events — every surveyed ticketing competitor (Ticket Tailor, DigiTickets, Art Tickets, Beyonk, VennerSys) leads with it, and Vitrine's event model doesn't cover it. Group/school bookings replace "a manual nightmare of phone calls and email chains" with request forms, custom pricing, and per-slot capacity.
- **Conversion impact: MEDIUM-HIGH institutional.** Rated the most critical ticketing gap after Gift Aid in the ops research: without recurring timed entry, Vitrine's ticketing only serves museums' *events*, not their front door. Frequently the specific thing that pushes a museum off Eventbrite.

**12. Public-site engagement pack: custom pages, related objects, better search, sharing**
- **Benefit:** Visitors get an About/History/News page (nav is currently hard-coded to Collection/Events/Visit/Wanted), related-object discovery, server-side search with real facets and pagination (currently all client-side — won't scale past a few hundred objects), and share buttons. Museums get a site they can actually call their website.
- **Conversion impact: MEDIUM direct, HIGH compounding.** Public pages are the product's own marketing: every richer museum site is a Vitrine demo with a backlink, and object-page SEO is the organic acquisition engine (currently throttled by §2.1).

### Tier 3 — Standards moat (institution/enterprise, next year)

**13. Public read API + OAI-PMH/LIDO export (aggregators: Museum Data Service, Art UK, Europeana)**
- **Benefit:** Grant-funded digitisation projects *require* harvestable feeds; Modes wins UK deals partly on aggregator pipelines; eHive/CatalogIt tout APIs. Also the ultimate no-lock-in signal. The UK's new **Museum Data Service** (museumdata.uk, launched Sept 2024, targeting 100M records from 1,750 accredited museums) is becoming the national aggregation layer — an early MDS connector is a high-leverage, low-cost credibility play no small-museum SaaS has claimed yet.
- **Conversion impact: MEDIUM now, HIGH for Institution tier.** Gate: don't launch the £349 tier without an interop story — it's what that buyer's grant applications ask about.

**14. Controlled vocabularies (Nomenclature 4.0, Getty AAT/ULAN/TGN)**
- **Benefit:** Consistent terminology → clean public search, credible SPECTRUM cataloguing, funder confidence. Present in CatalogIt, Modes, Axiell, TMS, Zetcom.
- **Conversion impact: MEDIUM.** Autocomplete-from-authority on medium/culture/maker fields covers 80% of the value cheaply.

**15. IIIF image serving (deep zoom)**
- **Benefit:** Sector-standard image interop; Gallery Systems bundles it free; expected in grant-funded image-rich collections. R2 + a serverless IIIF layer is a bounded build.
- **Conversion impact: LOW-MEDIUM now; checkbox-critical for Institution/enterprise later.**

**16. Multilingual public sites; multi-site tenancy for local-authority museum services; conservation photo annotation**
- **Benefit:** Respectively: international visitors; the common UK buying unit of 3–10 museums under one council; condition marking on images (Articheck-style) inside the existing conservation module (treatments already store before/after images — assessments don't).
- **Conversion impact: LOW-MEDIUM each, deal-specific.** Build when a real deal demands them.

### Deliberate non-goals (recommend NOT building)
- **EPOS/retail tills, volunteer scheduling, email-marketing suite** — adjacent categories with entrenched specialists; integrate (Zapier/Mailchimp webhook on ticket sales covers most of it) rather than build.
- **Offline desktop mode** — real but shrinking demand; native-app offline *capture* (item 5 follow-on) covers the defensible part.
- **Live market-price feeds for collectors** — often wished for, rarely a purchase criterion, expensive to license and easy to get embarrassingly wrong.

---

## 5. Recommended sequence

| # | Item | Effort | Conversion lever |
|---|---|---|---|
| 0 | SEO P0s + 3 data bugs + purchasable Institution tier | Days | Unblocks all acquisition; protects £79-tier trust |
| 1 | In-app survey | Days | Starts the real feedback loop |
| 2 | Insurance Pack export + valuation reminders | 1–2 wks | Free→Hobbyist; makes the winning ad true |
| 3 | Custom domains | 1–2 wks | Free→paid & Hobbyist→Pro upgrades |
| 4 | Migration importers + bulk edit ("free migration" campaign) | 3–6 wks | #1 deal-breaker; Adlib/EmbARK churn windows |
| 5 | Ship Vitrine Capture iOS | In review | Hobbyist acquisition vs CatalogIt |
| 6 | Donations + Gift Aid → then Memberships | 4–8 wks each | UK institutional wedge; museum-revenue retention story |
| 7 | Exhibitions + saved sets/reporting + SPECTRUM certification | Quarter | Institutional credibility & retention |
| 8 | Public-site engagement pack | Rolling | Compounding organic acquisition |
| 9 | API/OAI-PMH → vocabularies → IIIF | Pre-Institution-launch | Unlocks £349 tier |

**One-line summary:** the product is unusually complete — the conversion problem is (a) nobody can find it, (b) three trust-destroying bugs in the paid tier, (c) promised-but-missing custom domains, and (d) four segment-unlocking gaps (migration, Gift Aid/donations, memberships, mobile capture) where competitors currently disqualify Vitrine from deals it would otherwise win.
