# About page — full feature expansion, with an audience switch

**Status:** BUILT 2026-08-25. See §10 for what shipped.
**Date:** 2026-08-25
**Scope:** `app/about/page.tsx`, `components/PublicNav.tsx`. No schema changes, no new
API routes, no changes to `lib/plans.ts`.

---

## 0. What changes

Two things.

**One.** `/about` joins the top navigation on every public page. It is currently
reachable only from the footer, which means the page that explains what Vitrine
*is* sits below the page that explains what it costs.

**Two.** The page grows from a 188-line statement of values into the complete
feature account, split by who is reading it. A coin collector and a regional
museum want different pages and today they get the same four paragraphs. The
page gains a switch — **For collectors** / **For museums & galleries** — and each
side tells its own complete story, including its own version of the shared
features, because the shared features are not actually the same on both sides.
A collector on the free plan gets three site templates; a Professional plan gets
fourteen. One page cannot say both without hedging every sentence.

Everything below is checked against source of truth, which for features is
`lib/plans.ts`, `lib/nav.ts`, `lib/templates.ts` and `lib/categories.ts` — not
against the existing marketing copy, which is where the errors live.

---

## 1. The navigation change

`components/PublicNav.tsx:6` holds the nav as data. One line:

```ts
const navLinks = [
  { label: 'Discover', href: '/discover' },
  { label: 'Guides', href: '/guide/essentials' },
  { label: 'Blog', href: '/blog' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/plans' },
  { label: 'About', href: '/about' },   // ← add
]
```

Both the desktop row and the mobile sheet map over this array, so the single
addition covers both. Six items at `max-w-6xl` with a wordmark on the left and
two auth controls on the right is comfortable; the mobile sheet is a vertical
list and does not care.

**Position:** last. About is the lowest-intent item in the set and the
conventional place for it is the end of the row, nearest the account controls.

`PublicNav` already takes an `activePath` prop, so pass `activePath="/about"`
from the About page for the active-state treatment — the Discover page does this
at `app/discover/page.tsx:93` and About currently does not.

---

## 2. Page architecture

### 2.1 The switch

Use a **URL parameter**, not client state: `/about?for=collectors` and
`/about?for=museums`, defaulting to collectors when absent or unrecognised.

Reasons, in order of weight:

- The page stays a **server component**. It currently is one, and it carries two
  JSON-LD blocks and `buildPageMetadata`. Making it `'use client'` to hold a
  `useState` would push all of that around for no gain.
- Each view gets its **own metadata and its own shareable URL**. "Here's what
  Vitrine does for museums" becomes a link that opens on the museum side.
- Both views are **fully crawlable** as distinct documents rather than one
  document with half its content behind a click.

Render the switch as two `<Link>`s styled as a segmented control, with
`scroll={false}` so toggling does not jump the reader to the top. Mark the
inactive one up as a link and the active one as `aria-current="page"`.

**Canonical:** point both at `/about` (the collectors default). Two near-identical
pages competing for the same query is worth avoiding, and the collector side is
the higher-volume audience. Set this in `buildPageMetadata`'s `path` — pass
`/about` for both, not the parameterised URL.

**Metadata per view:**

| | `for=collectors` (default) | `for=museums` |
|---|---|---|
| Title | About Vitrine – Collection Management for Collectors | About Vitrine – Collection Management for Museums & Galleries |
| Description | Vitrine catalogues any collection — coins, cards, vinyl, watches — and gives it a public website. 21 collection types, free to start. | Vitrine runs a museum's documentation: entry, accessioning, loans, conservation, valuation, disposal, and a public site with ticketing. |

### 2.2 What sits above the switch

Unchanged from today, and deliberately so — the answer capsule at
`app/about/page.tsx:106` is written for extraction by AI search engines and it
works. Keep the H1, keep the capsule, keep the positioning paragraph. Add one
sentence introducing the switch.

### 2.3 What sits below the switch

The entire feature body, swapped. Then a shared closing section (CTAs, values)
that both tracks share, because "what we believe" is true regardless of who is
reading.

### 2.4 Section order within each track

Ordered by how much of the product each thing actually is, not by dashboard
order. The public site and Discover are the two largest features and they lead.

**Collectors:** Cataloguing → Your public site → Sets → Discover → Wishlist →
Value tracking → Sharing → Analytics & data → Free tools → What each plan holds

**Museums:** The registers → The object record → Your public site → Events &
ticketing → Sets → Discover → Staff & roles → Analytics → Data & documents →
What each plan holds

---

## 3. Claims discipline

Before any copy: three standing rules this page must not break.

**Never write "Spectrum."** Not the word, not the count "21 procedures", not the
primary/secondary split, not "Procedure N", and no compliance or alignment claim
against it. Collections Trust licenses the standard and Vitrine is not a
validated Partner. Register *names* — Object Entry, Loans In, Conservation —
are general museum practice and are fine. The approved framings already in use
are "Full documentation registers" and "Collections documentation, done
properly". `/compliance` groups the registers functionally into **Everyday
records / Loans & access / Care & risk / Governance & review** and this page
should reuse exactly that grouping. See `docs/` and the standing constraint note.

**Custom domains are "coming soon", never "available".** They are not built —
every public site is a `vitrinecms.com` path. Matt's decision (2026-08-25) is
that advertising them as coming soon is fine, which is what the muted entries in
`lib/plans.ts` already do. On the About page that means: if they are mentioned at
all, they sit in a clearly-forthcoming voice and never in a list of what you get
today. The safest handling on this page is to leave them out entirely — About is
describing what Vitrine *is*, and the pricing cards already carry the note.

**Do not restate prices.** `docs/pricing-claims-policy.md` lists every location
prices appear, and each new one is another place a stale figure can survive. The
About page should state **object and staff limits**, which are stable, and link
to `/plans` for money. The single exception is the existing answer-capsule line
"Plans start free, with paid plans from £5/month" — it earns its place for AI
extraction. Source it from `PLANS.hobbyist.price` rather than typing it, so it
cannot drift. Note also that prices localise to 16 currencies via
`lib/planPricing.ts`, so a hardcoded "£79" is wrong for most readers anyway.

**Support is differentiated, but only at Enterprise.** Dedicated support and an
SLA are a genuine Enterprise commitment and may be stated as such. Every other
tier — Community through Institution — gets the same support, so no Professional
or Institution copy may imply otherwise. In particular "priority support" is not
a thing that exists at any tier.

**Do not claim "advanced analytics" for Institution** (there is no code
difference from Professional) **and do not claim custom integrations** (no
integrations system exists).

---

## 4. Feature inventory — the collector track

Community (free) and Hobbyist (£5/mo). Both are `fullMode: false`, which is the
predicate that turns on collection profiles and simple mode.

### 4.1 Cataloguing

**Fact.** 21 collection profiles in `lib/collectionProfiles/profiles/` re-dress
the interface around what you actually collect. Storage is
`museums.collection_profiles text[]` (ordered, index 0 primary) with a per-object
override at `objects.collection_profile`. Grading lives in eight real
`objects.cert_*` columns because grade and cert number are read by search, sort,
analytics and duplicate detection. Everything else profile-specific goes to
`objects.custom_fields jsonb`, namespaced `profile-id.field`. Profiles relabel
`status` and `condition_grade` for display only — stored values stay canonical.
You can run more than one profile at once.

The 21: antiques, art, automobilia, books, ceramics & glass, coins & banknotes,
comics, fashion & sneakers, general, jewellery, militaria, natural history,
photography & cameras, sports memorabilia, stamps, toys & models, trading cards,
video games, vinyl & music, watches & clocks, wine & spirits.

**Copy.**

> ### It knows what you collect
>
> Most collection software gives you a box called "Artist" and expects you to
> put a mint mark in it. Vitrine asks what you collect and changes to suit.
>
> Pick from 21 collection types and the fields change with them. A card
> collector gets Set, Manufacturer, Player and Cert No. A wine collector gets
> Producer, Vineyard and Vintage. A coin collector gets Denomination, Mint,
> Year and Grade. Collect more than one thing and you can run several at once —
> each object inherits the type of your collection or overrides it on its own.
>
> Grading is a real part of the record, not a note. Grade, grading company and
> certification number are proper fields, so you can search on them, sort by
> them, and see them broken down in your analytics. Everything the type calls
> for is there without you building it.

### 4.2 The public site

**Fact.** This is the largest feature in the product. Every collection gets a
public website at `/museum/[slug]`, themed entirely from `lib/templates.ts` with
no per-museum design columns.

Fourteen templates. Nine standard, five premium (`minPlan: 'professional'` — so
**not available on the collector track**; mention their existence only as an
upgrade note, or omit).

The nine available here, and how each is actually built:

| Template | Grid | Chrome | What it is |
|---|---|---|---|
| **Minimal** | plate | rule | Works matted on white with generous space and a quiet label beneath. A white-cube hang. |
| **Dramatic** | spotlight | rule | Dark and atmospheric. Full-bleed tiles butt together; titles appear as you move across them. Dark only. |
| **Archival** | catalogue | rule | A numbered catalogue. Every entry is a ruled row with its thumbnail, details and date. |
| **Editorial** | editorial | hard | Bold and high-contrast. Each work gets its own spread, alternating left and right. |
| **Classic** | plate | soft | Deep navy and gold. Works are framed and matted like plates in a bound volume. Dark only. |
| **Cover** | stack | rule | Full-viewport hero, then the collection reveals one wide cinematic band at a time. Dark only. |
| **Curator** | catalogue | rule | Text-first. A large introduction, then a reading catalogue with an excerpt for each work. |
| **Magazine** | mosaic | hard | Asymmetric mosaic of mixed tile sizes. High impact, never a regular pulse. |
| **Salon** | salon | soft | Fixed sidebar identity, with the collection hung salon-style at natural heights. |

**Community gets three** — Minimal, Dramatic, Archival (`FREE_TIER_TEMPLATES`).
**Hobbyist gets all nine.**

A template is not a colour scheme. It sets four independent things:

- `layout_variant` — the masthead and hero (8 values: standard, cover,
  text-forward, magazine, sidebar, minimal, dramatic, archival)
- `grid_variant` — how the collection itself lays out (8 + `uniform` fallback),
  implemented in `components/collection/grids.tsx`
- `object_variant` — how a single item's page is arranged (7 values: standard,
  plate, catalogue, cinematic, editorial, essay, panel), so following a work
  through from a salon hang does not land on the same page as every other
  template
- `body_font` — each template pairs a heading face with a body face via
  `BODY_FONT_MAP` in `lib/museum-styles.ts`

Plus `chrome` (soft / rule / hard) which styles the search box and filter chips,
and `grid_options` (`frame`, `numbered`, `lead`). Two templates may share a grid
variant but never share both axes.

Site builder panels available on this track (`app/dashboard/site/page.tsx`):
Template & Colour, Museum Identity, Layout & Style, About & Social, SEO &
Sharing, Collector Identity, Wishlist, Collection Value, and — Hobbyist only —
Vitrine Branding. Visit Information and Embed are Professional+.

Layout & Style controls: heading font, card radius, hero height (none/compact/
medium/tall/full), grid columns (2–5), image shape (square/portrait/landscape),
card padding (tight/normal/generous), card metadata (none/title/+artist/full),
dark mode. Each template declares which of these it reads, so no one is shown a
slider that does nothing.

`lib/publicProfile.ts` carries the profile vocabulary onto the public site —
before it existed, public pages labelled a coin's mint "Artist".

Public routes: `/museum/[slug]`, `/object/[id]`, `/sets`, `/sets/[group]`,
`/wanted`.

Hobbyist adds: changing your public URL slug (`changeSlug`) and removing
"Powered by Vitrine" from the footer (`hideVitrineBranding`).

**Copy.**

> ### Every collection gets a real website
>
> Not a profile page on someone else's platform. A website, at its own address,
> that looks like it was designed for what you collect.
>
> Choose from nine designs. Each one is a whole treatment, not a colour picker —
> it changes the masthead, how the collection is laid out, how a single object's
> page is arranged, and which typefaces the whole thing is set in.
>
> **Minimal** hangs works matted on white with a quiet label beneath, like a
> white cube. **Archival** numbers every entry as a ruled catalogue row.
> **Salon** hangs the collection at natural heights down a masonry column with
> your identity fixed in a sidebar. **Magazine** breaks the rhythm entirely with
> an asymmetric mosaic of mixed tile sizes. **Dramatic** butts full-bleed tiles
> together in the dark and reveals titles as you move across them. **Cover**
> opens on a full-screen hero and then feeds you the collection one wide
> cinematic band at a time. **Curator** puts the writing first. **Classic**
> frames and mats each work in navy and gold like plates in a bound volume.
> **Editorial** gives every work its own spread.
>
> Then adjust it: hero height, columns, image shape, card padding, how much
> label text shows, light or dark, your own colours and fonts. Each design only
> shows you the controls it actually uses, so you are never moving a slider that
> does nothing.
>
> The free plan includes Minimal, Dramatic and Archival. Hobbyist opens all
> nine, lets you choose your own web address, and takes the Vitrine badge off
> the footer.

*(Note for the free-tier reader — worth one line, honestly framed:)*

> Every site is hosted at vitrinecms.com/your-collection. There is nothing to
> set up, nothing to host, and no domain to buy.

### 4.3 Collection Sets

**Fact.** `collection_groups`. Available on **every tier, unlimited** —
`groupsEnabled()` always returns true. Sets are either **manual** (you pick the
members) or **rule-based** (a filter picks them, with per-item include/exclude
overrides). A published set gets a public page, a nav item on your site, and a
place on the homepage.

Rules may only be built on fields already public on the object page —
`RULE_FIELDS` in `lib/collectionGroups/fields.ts` is the boundary, because a set
built on `estimated_value` would publish the ranking through its membership even
though no figure renders.

Eight ways to move through the items inside a set (`SetItems.tsx`): grid,
coverflow, carousel, filmstrip, shelf, contact-sheet, timeline, reel. Four card
treatments (plates / ledger / tiles / feature) derived automatically from your
template's grid variant. Covers resolve down a ladder ending in a 2×2 mosaic of
member images, so nothing needs uploading.

The set is called something different depending on what you collect —
`groupNouns()` resolves it from your active profile, then your Discover
category, then falls back to "Set". Full-mode plans always read "Exhibition".

**Copy.**

> ### Group part of a collection and give it its own page
>
> "Struck in Gold." "Everything from the 1986 Fleer set." "The ones I actually
> paid too much for."
>
> Pick the members by hand, or write a rule and let it fill itself — anything
> matching stays in as you add to the collection, and you can pin or drop
> individual items when the filter gets it slightly wrong.
>
> A published set gets its own page on your site, its own place in the
> navigation, and a card on your homepage. Choose how visitors move through it:
> a plain grid, a cover flow, a carousel, a filmstrip, objects stood on shelves,
> a darkroom contact sheet, a dated timeline, or one item per screen for
> phones. Covers build themselves from the items inside, so there is nothing to
> upload.
>
> Unlimited, on every plan including the free one.

### 4.4 Discover

**Fact.** `/discover` is a public directory of every collection that has opted
in. Second-largest feature.

- **Opt-in per collection.** `museums.discoverable`, toggled from the dashboard
  sidebar. Off by default.
- **62 categories** in `lib/categories.ts`, from Advertising & Signage to Wine
  & Spirits.
- Browses **objects**, not just collections — the grid is individual items from
  across every listed collection.
- Filter by category (multi-select), search objects by text, filter by
  collection name.
- Per-object category override (`objects.category`) falls back to the
  collection's `collection_category`.
- Only objects marked `show_on_site` appear.
- Revalidates hourly.
- **Messaging.** Visitors can contact a listed collection; conversations land in
  the dashboard Inbox, available on every tier and readable by all staff.
  Collections can opt out with `accept_messages`. Attachments: up to 5 per
  message, 10 MB each, images and PDFs, and they do **not** count against
  document storage quota.

**Copy.**

> ### Be found by people who collect what you collect
>
> Discover is a public directory of collections on Vitrine, and it browses
> **objects** rather than accounts. Someone looking for early Staffordshire
> figures sees the figures, then finds the collection they belong to.
>
> Filter by any of 62 collecting categories, search by object, or look up a
> collection by name. Items can carry their own category, so the odd Roman coin
> in a militaria collection still surfaces under Coins & Medals.
>
> Listing is off until you turn it on, and only the objects you have already
> published to your own site ever appear. Turn it on and people can message you
> — about a piece, a trade, a question of attribution — and it arrives in your
> inbox rather than your email. Turn that off separately if you would rather
> just be looked at.

### 4.5 Wishlist

**Fact.** `wanted_items`. **Community and Hobbyist only** (`wishlist: true`;
`false` on Professional and above). Priority and target price per item. Has a
public page at `/museum/[slug]/wanted`, toggled from the site builder's Wishlist
panel.

**Copy.**

> ### Keep track of what you are still after
>
> The list every collector keeps somewhere — a notes app, a spreadsheet, the
> back of their head. Record what you are hunting, how badly you want it, and
> what you are willing to pay.
>
> Publish it to your site and other collectors can see what you are looking for.
> Which is, occasionally, how you find it.

### 4.6 Value tracking

**Fact.** Purchase price and estimated value per object, on every tier including
free. Multi-currency: `lib/fx.ts` supports GBP, USD, EUR, CHF, AUD, CAD, JPY with
per-museum rates, converting to your base currency for totals. Gain/loss is
computed against total paid. A Collection Value panel in the site builder
controls whether figures show publicly; `hide_money_values` hides them.

**Copy.**

> ### What you paid, what it's worth
>
> Record a purchase price and an estimated value against every object and see
> the collection's total, its cost, and the difference between them.
>
> Buy in dollars and sell in pounds and the sums still work — seven currencies
> are supported, converted to whichever you count in.
>
> None of it is public unless you say so. Values are hidden on your site by
> default and stay that way until you decide otherwise.

### 4.7 Private share links — Hobbyist

**Fact.** `shareLinks: null` (unlimited) on Hobbyist and above. **Community is
`0`** — disabled, and the plan copy has always said so. Links can carry an
expiry. Managed at `/dashboard/share`.

**Copy.**

> ### Show someone the collection without publishing it
>
> Create a private link to your collection, send it to a valuer, an insurer, a
> family member or a buyer, and set it to expire when you are done. It works
> without an account at the other end and it does not touch what is on your
> public site.
>
> Unlimited links, from Hobbyist up.

### 4.8 Analytics and data — Hobbyist

**Fact.** The `analytics` flag gates **both** the analytics dashboard and CSV
import/export. Hobbyist and above. Collection analytics: value and acquisition
cost totals, gain/loss, and breakdowns by type, medium and status. **Visitor**
analytics (`visitorAnalytics`) is Professional+ and must not be claimed here.
CSV export is always available to the same flag; import is gated at
`app/api/import/objects/route.ts`.

100 MB document storage on Hobbyist; Community has none.

**Copy.**

> ### Import what you already have, and see what it adds up to
>
> Bring an existing spreadsheet in as CSV, and take the whole collection back
> out the same way whenever you like. Your data is yours and there is a button
> that proves it.
>
> The analytics view breaks the collection down by type, by medium and by
> status, and tracks what you have paid against what it is worth.
>
> Hobbyist also gives you 100 MB for documents — receipts, certificates,
> valuations, provenance — attached to the objects they belong to.

### 4.9 Free tools

**Fact.** `app/tools/insurance-inventory` and `app/tools/condition-report`. Fully
client-side, no account, no email capture. The insurance tool has per-niche
variants.

**Copy.**

> ### Two things you can use without signing up
>
> An **insurance inventory generator** that turns a list of what you own into a
> document an insurer will accept, and a **condition report builder** with a
> damage map you can mark up.
>
> Both run entirely in your browser. Nothing is uploaded, no account is needed,
> and we do not ask for your email.

---

## 5. Feature inventory — the museum track

Professional (£79/mo), Institution (£349/mo), Enterprise (contact). All three
have **identical feature flags** — the differences are limits only: 5,000 /
100,000 / unlimited objects, 10 / unlimited / unlimited staff, 1 GB / 10 GB /
unlimited documents. Copy must not invent feature differences between them.

Note what these plans **lose**: the wishlist and the 21 collection profiles are
both simple-mode features and are switched off here, because a museum record has
fixed professional vocabulary. Do not list them.

### 5.1 The registers

**Fact.** `fullMode: true` replaces the four-group simple sidebar with twenty-one
registers across four groups (`lib/nav.ts`), matching the functional grouping on
`/compliance`.

**Everyday records** — Object Entry, Acquisition & Accessioning, Location &
Movement Control, Inventory, Cataloguing, Object Exit
**Loans & access** — Loans In, Loans Out, Use of Collections, Rights Management,
Reproduction Rights
**Care & risk** — Condition Checking, Conservation & Collections Care,
Valuation, Insurance & Indemnity, Emergency Planning, Loss & Damage Reporting
**Governance & review** — Documentation Planning, Disposal & Deaccession,
Collections Review, Audit Exercises

Each is a real table, not a text field: `entry_records`, `loans`,
`conservation_treatments`, `object_exits`, `locations`, `valuations`,
`risk_register`, `emergency_plans` + `emergency_salvage_priorities`,
`insurance_policies` + `insurance_policy_objects`, `damage_reports`,
`collection_use_records`, `disposal_records`, `collection_reviews`,
`documentation_plans` + `documentation_plan_backlogs`, `audit_records` +
`inventory_exercises`.

Also: donor and depositor tracking on entry records (`depositorTracking`) —
donor details, Entry By, GDPR consent, receipt and terms. And soft delete with a
30-day bin (`objects.deleted_at`).

**Copy.** *(Note the heading avoids any standards claim.)*

> ### Collections documentation, done properly
>
> Not a catalogue with some extra fields. Twenty-one registers, each a real
> record with its own history, grouped the way the work actually divides.
>
> **Everyday records.** Object entry for anything arriving — for acquisition,
> for loan, or for an opinion — before anything else happens to it.
> Accessioning into the permanent collection with a formal register.
> Cataloguing. Location and movement control down to building, floor, room and
> unit. Inventory. Object exit, capturing authorisation, transport and receipt.
>
> **Loans and access.** Loans in and loans out, with dates, insurance,
> conditions and overdue flags. Records of who used what, for research,
> photography, teaching or display. Rights management and reproduction rights,
> so you know what you are allowed to do with an image before someone asks.
>
> **Care and risk.** Condition checking. Conservation treatments with costs and
> before-and-after images. Valuations with method, purpose and valuer. Insurance
> policies with the objects they cover and their renewal dates. Damage and loss
> reports through investigation, repair and claim. A risk register — theft,
> fire, flood, pests, handling — rated and mitigated. Emergency plans with
> salvage priorities, so the most important things come out first.
>
> **Governance and review.** Documentation planning against your backlog.
> Collections review against your collecting policy. Formal audit exercises.
> Disposal and deaccession, with the approval trail that requires.
>
> Entry records carry donor and depositor details, who received the object,
> consent, and the terms it came in under.

### 5.2 The object record

**Fact.** Fourteen tabs (`components/tabs/`): Overview, Entry, Acquisition,
Condition, Conservation, Damage, Documents, Exits, Loans, Location, Rights,
Risk, Valuation, Audit. Ten images per object. QR labels
(`components/QRLabelModal.tsx`) and print/export, both gated to `fullMode`.

**Copy.**

> ### One object, its whole history
>
> Every object opens onto its full record: where it came from and on what terms,
> where it is now and everywhere it has been, its condition and every treatment
> it has had, what it is insured for and what it was last valued at, who has
> borrowed it, what may be done with its image, and every document that belongs
> to it.
>
> Ten photographs per object. Print a catalogue record, or generate a QR label
> for the store — scan it and the object's page opens on your phone.

### 5.3 The public site

**Fact.** Everything in §4.2, plus:

- **Five premium object-led templates**, `minPlan: 'professional'`. These do not
  arrange images in a rhythm — each sizes its frames from the picture's own
  aspect ratio and treats the object as a thing you handle. All five are dark-only
  and each declares a minimum sensible item count.

| Template | Min items | What it is |
|---|---|---|
| **Flip** | 8 | Covers face out in a rack, one square on and the rest raked away. Arrow through them, or click one to bring it forward. |
| **Foil** | 5 | A fanned hand of cards with one held up in its mount. The foil catches the light as you move across it. |
| **Northlight** | 6 | A lit case. Pieces stand on glass shelves under spotlights; pick one and it steps out onto a plinth. |
| **Verso** | 4 | The object on one card face and its catalogue entry on the other. Turn a single card, or turn the whole tray at once. |
| **Viewfinder** | 4 | The collection seen through a finder, one frame at a time. Wind the lever for the next object. |

Each carries its own controls: Northlight has a Gallery/After-hours lighting
switch and per-shelf count, Foil has shine and holder style, Verso has a default
face and a paper stock, Viewfinder has a condition meter. Stored in
`museums.template_options jsonb`.

- **Plan your visit page** (`visitInfo`) — `/museum/[slug]/visit`, plus the
  About and Facilities sections in the builder: opening hours, admission,
  accessibility, directions, seasonal notices.
- **Embed** — an iframe snippet serving `/museum/[slug]/embed`, for putting the
  collection inside an existing site.
- **Visitor analytics** (`visitorAnalytics`) — page views by day and by page
  type, from the `page_views` table.

**Copy.**

> ### Fourteen designs, five of which handle the object rather than arrange it
>
> All nine of the standard templates are here — the white-cube hang, the ruled
> catalogue, the salon, the mosaic, the magazine spread. And five more that only
> Professional plans can select, which do something different: instead of laying
> images out in a rhythm, they size every frame from the object's own proportions
> and treat it as a thing to be handled.
>
> **Northlight** is a lit case — pieces stand on glass shelves under spotlights,
> and the one you pick steps out onto a plinth. There is a switch for gallery
> hours and after hours. **Flip** racks covers face out, one square on and the
> rest raked away, and you arrow through them. **Foil** fans the collection like
> a hand of cards with one held up in its mount, and the foil genuinely catches
> the light as you move. **Verso** puts the object on one face of a card and its
> catalogue entry on the other, and you can turn one card or the whole tray.
> **Viewfinder** shows the collection through a camera finder, one frame at a
> time, and you wind the lever for the next.
>
> Each has its own handful of controls, and each tells you how many objects it
> needs before it reads as itself — a rack of three is not a rack.
>
> Professional plans also add a **Plan your visit** page — opening hours,
> admission, access, directions, seasonal notices — and an **embed code** that
> drops the collection into a website you already have.

### 5.4 Events and ticketing

**Fact.** `ticketing`, Professional+. Tables: `events`, `event_time_slots`,
`ticket_orders`, `tickets`. Free and paid events; paid requires Stripe Connect.
Timed entry slots with capacity. Public booking at `/museum/[slug]/events/[id]`.
Every ticket carries a QR code resolving to `/verify/[code]`, where the code is
`VIT-` plus 32 hex — scanned on the door, it shows the event, slot, buyer and
whether the ticket is valid. Refunds via `/api/ticket-refund`.

**Copy.**

> ### Sell tickets from your own site
>
> Create an event, set capacity, add timed entry slots, and take bookings on
> your collection's website rather than sending people to a third party.
>
> Free events and paid events both work. Paid events go through Stripe and the
> money lands in your account, not ours.
>
> Every ticket carries a QR code. Scan it at the door and you get the event, the
> slot, the name on the booking and whether the ticket is still valid. Refunds
> are handled from the same place.

### 5.5 Staff and roles

**Fact.** `staff_members`, with `access` of Admin / Editor / Viewer. 10 on
Professional, unlimited on Institution and Enterprise. Invitations via
`/api/invite-staff`. The Staff & Roles nav group appears in full mode for owners
and Admins only.

**Copy.**

> ### The rest of the team
>
> Invite colleagues and decide what each of them can do. Admins have full
> access, Editors can change records, Viewers can look but not touch.
>
> Ten accounts on Professional, unlimited on Institution.

### 5.6 Analytics

**Fact.** Both flags on. Collection analytics as §4.8, plus visitor analytics:
total views, today, object views, breakdown by page type, and a per-day bar
chart. No feature difference between Professional, Institution and Enterprise.

**Copy.**

> ### What is in the collection, and who is looking at it
>
> The collection broken down by type, medium and status, with total value
> against total acquisition cost. And on the public side, page views by day,
> which objects are being looked at, and which parts of the site people reach.
>
> Export the whole catalogue to CSV whenever you want it, and bring an existing
> one in the same way.

### 5.7 Documents and storage

**Fact.** 1 GB Professional / 10 GB Institution / unlimited Enterprise.
`museums.storage_used_bytes`, maintained by Postgres triggers. Six sources count
against it: object documents, conservation treatment images, disposal record
documents, emergency plan documents, insurance policy documents, documentation
plan documents. Gallery images and site logo/banner do **not** count.

**Copy.**

> ### Documents where they belong
>
> Deeds of gift, condition reports, valuations, conservation records, insurance
> schedules, loan agreements — attached to the object or the record they relate
> to, not in a shared drive with a filename someone will regret.
>
> 1 GB on Professional, 10 GB on Institution. Object photographs do not count
> against it.

### 5.8 Discover and Sets

Same as §4.3 and §4.4, with one wording change: set vocabulary resolves to
**Exhibition** on full-mode plans, not "Set". Reuse the copy with that noun
swapped and the collector framing ("other collectors", "a trade") replaced by
"researchers, visitors and other institutions".

---

## 6. The plan comparison block

Both tracks end with a limits table. **Limits only — no prices**, with a link to
`/plans`. Read the numbers from `PLANS` at render time rather than typing them,
so the page cannot drift from `lib/plans.ts`.

**Collector track:**

| | Community | Hobbyist |
|---|---|---|
| Objects | 100 | 1,000 |
| Photos per object | 1 | 5 |
| Site templates | 3 | 9 |
| Documents | — | 100 MB |
| Private share links | — | Unlimited |
| Analytics & CSV | — | ✓ |
| Choose your web address | — | ✓ |
| Remove Vitrine badge | — | ✓ |
| Collection sets | Unlimited | Unlimited |
| Wishlist | ✓ | ✓ |
| Discover listing | ✓ | ✓ |

**Museum track:**

| | Professional | Institution | Enterprise |
|---|---|---|---|
| Objects | 5,000 | 100,000 | Unlimited |
| Staff accounts | 10 | Unlimited | Unlimited |
| Documents | 1 GB | 10 GB | Unlimited |
| Everything else | ✓ | ✓ | ✓ |

That last row is deliberate and should stay honest: the three tiers are
identical in features and differ only in size.

---

## 7. Shared closing section

Below both tracks, unchanged in substance from today.

**What we believe** — keep all four values verbatim from
`app/about/page.tsx:65`. They are good and they are true.

**What you can catalogue** — the existing 12-item list. Consider replacing it
with the 21 collection profiles on the collector side, since that list is
generated from real code and the current one is hand-written.

**Get started** — keep the three CTAs. Add a fourth on the museum track pointing
at `/compliance`, which is the deep version of §5.1 and currently has no inbound
link from About.

---

## 8. Implementation

**Files touched:**

- `components/PublicNav.tsx` — one line
- `app/about/page.tsx` — rewritten; add `searchParams`, split the body

**Suggested structure** — keep it one file unless it passes ~600 lines, at which
point extract the two tracks into `app/about/CollectorTrack.tsx` and
`app/about/MuseumTrack.tsx` as server components, with the switch and shared
chrome staying in `page.tsx`.

**Read from source, do not retype:**

```ts
import { PLANS, FREE_TIER_TEMPLATES } from '@/lib/plans'
import { TEMPLATES } from '@/lib/templates'
import { COLLECTION_CATEGORIES } from '@/lib/categories'
```

Template names and descriptions, category count, and every plan limit should be
derived. The prose stays hand-written; the numbers do not.

**Structured data:** keep both existing JSON-LD blocks. Add an `ItemList` of
templates or a `FAQPage` only if there is a real question-and-answer shape —
do not bolt schema onto prose that is not shaped like it.

**Verification:** run the dev server, load `/about`, `/about?for=collectors` and
`/about?for=museums`, check the nav renders six items on desktop and in the
mobile sheet, and check the switch preserves scroll position.

---

## 9. Findings outside this page's scope

All resolved or actioned as of 2026-08-25.

### 9.1 Custom domains — resolved, no change needed

The muted "Custom domain (coming soon)" entries in `hobbyist.featureGroups` and
`institution.featureGroups` are deliberate. Matt's call: not built, but fine to
advertise as coming. They stay, in the greyed not-included group where they are.

### 9.2 Enterprise support claim — resolved, no change needed

"Dedicated support & SLA" on the Enterprise tier is correct. Enterprise is a
contact-us tier and dedicated support is a real, negotiated commitment. The
earlier blanket rule against differentiating support by plan was wrong and has
been retired. What remains wrong is **"Priority support" on Institution**, which
appears in Stripe — see below.

### 9.3 Stripe product descriptions — two are wrong, and production is unverified

Checked 2026-08-25 against the connected account, `acct_1T42eoF1q447WCoN`, in
**test mode** (`livemode: false` on all three products).

**Prices are correct and need no action.** £5 / £79 / £349, and all sixteen
`currency_options` match the round-up arithmetic in `lib/planPricing.ts`
exactly — spot-checked USD $110, EUR €95, CHF 90, SEK 1100, ISK 14000, TRY 5100
against `FX_SNAPSHOT`.

**Professional** (`prod_U2smWpy9dRkWN8`) — **correct.** Reads "full documentation
registers". This is the one that was fixed on 2026-08-11.

**Institution** (`prod_U4mn7somw026Cg`) — **wrong on three counts.** Currently:

> Up to 100,000 collection items. Full public website. Unlimited staff accounts.
> Collections compliance tools. Advanced analytics. Priority support

- "Collections compliance tools" — a compliance claim, the thing the 2026-08-11
  pass existed to remove. Institution was missed; only Professional was fixed.
- "Advanced analytics" — false. Professional and Institution have identical
  analytics code.
- "Priority support" — false. No priority-support tier exists at any plan, and
  per §9.2 dedicated support is Enterprise-only.

Replacement:

> Up to 100,000 collection items. Full public website. Unlimited staff accounts.
> Full documentation registers, analytics and event ticketing. 10 GB document
> storage.

**Hobbyist** (`prod_U4moMFH4aytnRO`) — **understates the product.** Reads "Up to
500 collection items"; `PLANS.hobbyist.objects` is **1,000**. This appears on
hosted checkout and on invoices, so paying customers are being told they get
half of what they are actually buying.

Replacement:

> Up to 1,000 collection items, 5 photos each. Public collection website with
> all site templates. Collection analytics, CSV import and export. 100 MB
> document storage.

**Production, audited 2026-08-25** (`acct_1T42edJvOfVErgzb`, `livemode: true`).

*Billing is completely clean.* Six products exist — three active, three archived
duplicates. The `STRIPE_PRICE_*` env vars all resolve to the **active** trio, so
the archived ones are dead weight and nothing charges against them. Amounts are
£5 / £79 / £349, and all sixteen `currency_options` on all three prices were
checked against `roundUpToIncrement` over `FX_SNAPSHOT` — every one matches,
including the awkward cases (HUF Institution rounds to 150,000 on the 5,000
increment; ISK is zero-decimal at 850 / 14,000 / 59,000). No pricing action.

*Two of three active descriptions were wrong. **Both fixed 2026-08-25** — see
resolution at the end of this section.*

**Institution** — `prod_UQ3z4eQSGjlqV0`. The same three errors as the sandbox,
never fixed:

> Up to 100,000 collection items. Full public website. Unlimited staff accounts.
> Collections compliance tools. Advanced analytics. Priority support

**Hobbyist** — `prod_UQ3zvqS95A8q7m`. Understates the plan by half:

> Up to 500 collection items. Public collection website. Full site customisation

**Professional** — `prod_UQ3zdgNuW3wmkT`. Correct; carries the "full
documentation registers" wording. This is the only one the 2026-08-11 pass
reached, and it reached it on production as well as the sandbox.

The three archived products (`prod_U43CU7vDLaHmpN`, `prod_U439pfYvDJicPn`,
`prod_U4391QWzWriHBr`) all carry stale descriptions too, including the older
"Collections compliance tools" wording on Professional. They are inactive and
unreachable from checkout, but their descriptions still render on historical
invoices for anyone who subscribed against them.

**Resolved 2026-08-25.** Both active descriptions rewritten via the live API and
re-read to confirm. All three active products now correct:

| Product | Id | Description |
|---|---|---|
| Hobbyist | `prod_UQ3zvqS95A8q7m` | Up to 1,000 collection items, 5 photos each. Public collection website with all site templates. Collection analytics, CSV import and export. 100 MB document storage. |
| Professional | `prod_UQ3zdgNuW3wmkT` | (unchanged — was already correct) |
| Institution | `prod_UQ3z4eQSGjlqV0` | Up to 100,000 collection items. Full public website. Unlimited staff accounts. Full documentation registers, analytics and event ticketing. 10 GB document storage. |

The three archived products were **left untouched** pending a decision. They are
unreachable from checkout; their only remaining surface is historical invoices.


---

## 10. What shipped

Built 2026-08-25, all four open decisions resolved as recommended: full depth,
collectors as the default track, premium templates shown to collectors with a
Professional badge, and templates presented with palette swatches.

**Files**

| File | Change |
|---|---|
| `components/PublicNav.tsx` | One line — About added to `navLinks`, last position. Covers desktop row and mobile sheet, which map the same array. |
| `app/about/page.tsx` | Rewritten. `generateMetadata` per track, the switch, shared chrome, values and CTAs. |
| `app/about/CollectorTrack.tsx` | New. Community + Hobbyist. |
| `app/about/MuseumTrack.tsx` | New. Professional + Institution + Enterprise. |
| `app/about/shared.tsx` | New. `Section`, `Point`, `TemplateCard`, `LimitsTable`. |

**Everything numeric is derived**, never typed: profile count and labels from
`COLLECTION_PROFILES`, category count from `COLLECTION_CATEGORIES`, all 14
templates with their descriptions, grid variants, chrome and `minItems` from
`TEMPLATES`, every limit from `PLANS`, the free template count from
`FREE_TIER_TEMPLATES`, and the one surviving price from `PLANS.hobbyist.price`.
The page cannot drift from `lib/`.

**One judgement call not in the plan.** `COLLECTION_PROFILES` lists `general`
first, whose label is "A museum or general collection". Leading a grid of
collecting types with it read as though that were the headline option, so it is
sorted last in `CollectorTrack`. Still counted — the number in the copy is the
whole registry.

**Verified**

- `tsc --noEmit` clean; 733 tests across 39 files pass; no console or server errors.
- Metadata swaps per track — collectors and museums titles both resolve.
- Both tracks canonicalise to `/about`.
- Switch carries correct hrefs and `aria-current`.
- All 14 template cards render with their own `previewBg`/`previewText`/`previewAccent`;
  the Professional badge appears on exactly Flip, Foil, Northlight, Verso, Viewfinder.
- Limits tables read Community 100 / Hobbyist 1,000 and Professional 5,000 /
  Institution 100,000 / Enterprise unlimited, straight from `PLANS`.
- Claim checks pass on both tracks: no "Spectrum", no "custom domain", no
  "priority support". "Wishlist" is absent from the museum track, as it should
  be — it is a simple-mode feature that Professional and above do not have.
- Mobile 375px: no page-level horizontal overflow; the limits table scrolls
  inside its own container.

## 11. Two things worth a decision later

1. **Foil, Verso and Flip are collector designs gated at Professional.** Foil
   fans a hand of graded cards; Verso turns an object over to show its catalogue
   entry. The natural user for both is a trading-card collector on Hobbyist, who
   cannot select them. Worth asking whether that gate is where it should be.
2. **The three archived Stripe products** still carry stale descriptions. They
   are unreachable from checkout and only surface on historical invoices.


---

## 12. Revision, 2026-08-25 (same day)

Two rounds of feedback after the first build.

### 12.1 The template previews now show the layout, not a palette

The three-bar swatch read as filler. Replaced with `app/about/TemplateThumb.tsx`,
a miniature of what each template actually produces. The masthead follows
`layout_variant` (including the sidebar split for Salon), the body follows
`grid_variant`, and every shape is drawn from the real thing: the mosaic uses the
span rhythm from `components/collection/grids.tsx`, the salon hangs uneven
columns, the catalogue draws ruled rows, Foil fans from a pivot below the cards
the way a hand actually opens, Flip rakes its neighbours in 3D, Northlight stands
pieces on lit shelves, Verso shows both card faces, Viewfinder frames one object
in corner brackets. Colours are each template's own `previewBg`/`previewText`/
`previewAccent`.

Not iframes of live sites: fourteen iframes is a lot of page weight for a
thumbnail, and several templates have no published example yet.

**Second pass on the five object-led ones**, which read as plain blocks first
time round. They are the premium set and what they sell is how an object is
presented, so they are drawn with light, depth and card structure:

- **Flip** — a lit front plate with an image area and a gold caption bar, raked
  neighbours carrying a falloff gradient toward the outer edge, standing over
  their own reflection faded back into the page.
- **Foil** — five cards fanned from a pivot below, in holder frames, with the
  held card raised and carrying a real multi-stop iridescent gradient and a
  grader's label strip.
- **Northlight** — two lamps spilling warm light down the case, objects of three
  different silhouettes (standing vessel, low bowl, block) on inset glass
  shelves whose front edges catch the light, and the lit piece glowing on a
  plinth.
- **Verso** — one card mid-turn: the object face rotating away under a shadow
  gradient, a fold, then the record face coming round with a gold heading rule
  and ruled entries.
- **Viewfinder** — an object standing on a ground line inside the frame, an
  accent focus box over it, corner brackets, frame-counter ticks with the
  current frame marked, and the condition needle bottom right.

### 12.2 Copy stripped of AI tells

Measured against `.claude/commands/vitrine-blog-voice.md`, which caps em dashes at
one or two.

| | Before | After |
|---|---|---|
| Em dashes in prose (collector) | 19 | 0 |
| Em dashes in prose (museum) | 12 | 0 |
| "not a X" / "rather than" / "not just" | 15 | 0 |

The negation-contrast construction was the worst of it, and the most
recognisable: "not a note", "not a colour picker", "not a catalogue with some
extra fields", "browses objects rather than accounts". Every one is now a
positive statement. Also cut: rhetorical triads that were not real
enumerations, two self-satisfied closers, and sentence-initial numerals
("3 of the designs", "10 accounts on Professional"). Genuine enumerations stay,
because eight set navigation styles really are eight things.

**Three em dashes remain on the page, all in copy that predates this work** and
was left deliberately rather than quietly rewritten:

1. "Vitrine sits in the gap — modern, web-based, and priced so that…" (positioning)
2. "Collectors have specific needs — grading, provenance, condition reports, value tracking, insurance documentation." (values)
3. "Vitrine is free to try — no credit card required." (CTA)

Three is over the house limit of one or two, and (2) carries both an em dash and
a five-item list, which makes it the most AI-shaped sentence left on the page.
Suggested rewrite for (2): "Collectors have specific needs: grading, provenance,
condition reports, insurance documentation. We build for those." Matt's call.

The answer capsule was left alone on purpose. It is written for AI extraction and
rewriting it risks the AEO work for a stylistic gain.
