# Vitrine — Feature Gap Priority Table

Ranked by overall importance. Each item scored on **Acquisition** (ability to capture *new* users / win deals) and **Retention** (ability to keep and upgrade *existing* users). Scores: ●●● High · ●●○ Medium · ●○○ Low.

Full evidence and per-item write-ups: `feature-gap-audit-2026-07-04.md`.

## Part A — Funnel fixes (not features; do these first)

These leak conversion *today*. No new feature pays off until they're fixed.

| # | Item | Acquisition | Retention | Why it ranks here | Effort |
|---|------|:---:|:---:|-------------------|--------|
| 0 | **SEO / Google indexation** (`site:` returns ~1 result) | ●●● | ●○○ | Zero organic discovery = the top of the funnel is empty; every feature below is throttled until fixed | Days |
| 1 | **Fix 3 Spectrum-audit bugs** (disposal sync, emergency column, print columns) | ●○○ | ●●● | Live defects inside the £79 compliance tier; a paying customer who hits them churns and tells the sector | Days |
| 2 | **Make Institution tier (£349) purchasable** (`comingSoon:true`) | ●●● | ●○○ | Largest leads currently have nothing to buy | Hours |
| 3 | **In-app feedback survey** (50-item mark; already specced) | ●○○ | ●●● | You have no way to hear users at all; foundational for every decision below | Days |
| 4 | **Market strengths you already have** (CSV import, door-scanning, private share links) | ●●● | ●●○ | Built but invisible; prospects miss what a briefed researcher missed | Days |

## Part B — Feature gaps (ranked by importance)

| Rank | Feature gap | Acquisition | Retention | Segment | Why it wins new users | Why it retains | Effort |
|:---:|-------------|:---:|:---:|---------|----------------------|----------------|--------|
| 1 | **Guided migration importers + bulk edit** (PastPerfect / Modes / Adlib / Excel-with-images) | ●●● | ●●○ | All | #1 verified deal-breaker; two forced-migration windows open now (Adlib EOL, EmbARK sunset); Modes (~700 UK orgs) is desktop-only. "Free migration" is the strongest ad you have | Clean imported data + bulk edit lowers early abandonment | 3–6 wks |
| 2 | **Donations + Gift Aid** (on existing Stripe rail) | ●●● | ●●● | UK institutional | Without Gift Aid, ticketing is disqualified for UK charities — the exact £79-tier buyer; Art Tickets beats you on "free + Gift Aid" today | Adds 25% to the museum's own revenue → makes Vitrine un-churnable infrastructure | 4–8 wks |
| 3 | **Ship Vitrine Capture (iOS) + market mobile capture** | ●●● | ●●○ | Hobbyist (~70% of funnel) | Phone photo-capture is CatalogIt's whole winning pitch; ISBN scan is table stakes for book/coin collectors | Faster cataloguing = users reach the "worth paying" threshold sooner | In review |
| 4 | **Custom domains** (kill "coming soon") | ●●○ | ●●● | Paid tiers | Classic willingness-to-pay feature for a site builder; already promised on the plans page | Site becomes the museum's real website → switching cost, board credibility | 1–2 wks |
| 5 | **Insurance-ready exports + valuation-expiry reminders** | ●●● | ●●○ | Hobbyist / collector | Your own ad testing found insurance the strongest hook; makes "insurance-ready in 20 min" literally true | Recurring reminders create habitual return visits | 1–2 wks |
| 6 | **Memberships & season passes** | ●●○ | ●●● | Institutional | Unlocks the "all-in-one ops" claim; PastPerfect's membership CRM is exactly why small US museums won't leave it | Member renewals = recurring museum revenue tied to Vitrine | 4–8 wks |
| 7 | **Recurring timed-entry admission + school/group bookings** | ●●○ | ●●○ | Institutional | Museums' core ticket use case is daily timed entry, not one-off events; most critical ticketing gap after Gift Aid; pushes museums off Eventbrite | Front-door dependency = daily active use | 3–5 wks |
| 8 | **SPECTRUM Partner certification** (process, not code) | ●●● | ●○○ | UK institutional | UK Accreditation shortlists start from the Collections Trust software list; Modes/Axiell win on the badge you lack despite having the substance | — (credibility, not stickiness) | Low cost |
| 9 | **Exhibitions module** | ●●○ | ●●○ | Institutional | Its absence reads as "not a real museum CMS" in evaluations; every mid/high competitor has it | Daily registrar workflow + public "past exhibitions" pages | Quarter |
| 10 | **Saved searches, object sets & report builder** | ●●○ | ●●● | Registrars / boards | — | Reporting friction is the #1 source of *post-purchase* negative reviews across the category → drives churn & review scores | 3–5 wks |
| 11 | **Public-site engagement pack** (custom pages, related objects, server-side faceted search, sharing) | ●●○ | ●●○ | All | Every richer museum site is a Vitrine demo with a backlink → compounding organic acquisition | Public search is client-side today — won't scale past a few hundred objects | Rolling |
| 12 | **Public read API + OAI-PMH/LIDO** (Museum Data Service, Art UK, Europeana) | ●●○ | ●●○ | Institution / grant-funded | Grant projects *require* harvestable feeds; early MDS connector is unclaimed by any small-museum SaaS | Ultimate no-lock-in signal → removes a veto objection | Quarter |
| 13 | **Controlled vocabularies** (Nomenclature 4.0, Getty AAT/ULAN/TGN) | ●●○ | ●●○ | Institutional | Credible SPECTRUM cataloguing; present in CatalogIt/Modes/Axiell/TMS/Zetcom | Cleaner data + better public search over time | 2–4 wks |
| 14 | **IIIF image serving** (deep zoom) | ●○○ | ●●○ | Institution / enterprise | Checkbox-critical for grant-funded image-rich collections; Gallery Systems bundles it free | Expected by funders for digitisation projects | 2–4 wks |
| 15 | **Multilingual sites / multi-site tenancy / conservation photo annotation** | ●●○ | ●●○ | Deal-specific | Multi-site is the common UK local-authority buying unit (3–10 museums per council) | Build when a real deal demands it | Per deal |

## Part C — Deliberate non-goals (do NOT build)

| Item | Reason |
|------|--------|
| EPOS / retail tills | Entrenched specialists (DigiTickets, VennerSys); integrate, don't build |
| Volunteer scheduling | Adjacent category (Volgistics); integrate |
| Email-marketing suite | Zapier/Mailchimp webhook on ticket sales covers it |
| Offline desktop mode | Shrinking demand; native-app offline capture covers the defensible part |
| Live market-price feeds | Wished for, rarely a purchase criterion, expensive and easy to get embarrassingly wrong |

---

**One-line read:** capture is won by items **1, 2, 3, 5, 8** (migration, Gift Aid, mobile capture, insurance exports, certification); retention is won by items **2, 4, 6, 10** (Gift Aid revenue, custom domains, memberships, reporting). Items 1 and 2 score high on both and are the clear first builds.
