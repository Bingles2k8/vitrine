# VitrineCapture — Collection Profiles integration

**Handoff from the Vitrine web app session, 2026-08-13.**
Web-side spec: `docs/collection-profiles-plan.md` in the `Bingles2k8/vitrine` repo.
Everything described here is **shipped and live** on vitrinecms.com.

You are implementing the Capture-side half. Read §1–§3 before writing code — the
integration is mostly *consuming a published registry correctly*, and the failure
modes are subtle rather than loud.

---

## 1. What was built, in one paragraph

Community and Hobbyist users now choose **what they collect** (trading cards, wine,
watches, coins, comics, …). The web UI re-dresses itself to match: field labels,
placeholders, controlled vocabularies, which fields are hidden, field order, nav
wording, list columns, filters and analytics. Two things also gained real storage —
**certification/grading** (typed columns, cross-domain) and **per-profile detail
fields** (a validated JSONB bag). Paid museum tiers are completely unaffected.

Capture must speak the same language, or a card photographed on a phone will arrive
in the web app labelled "Artist / Maker".

---

## 2. The golden rule

> **Capture never hardcodes a profile, a label, a grading scale, or a field list.
> It fetches the registry and resolves at runtime.**

The registry is published as JSON and versioned. If Capture duplicates any of it, the
two will drift within one release and there is no test that will catch it.

---

## 3. The two endpoints

### 3.1 `GET /api/collection-profiles` — public, cacheable, no auth

Returns the entire registry. Cache it by `version`; refetch when `version` changes.

```jsonc
{
  "version": "2026-08-12",          // bump = your cache is stale
  "canonical": {
    "statuses": ["Entry","On Display","Storage","On Loan","Restoration","Conservation","Deaccessioned"],
    "conditionGrades": ["Excellent","Good","Fair","Poor","Critical"],
    "fieldKeys": ["emoji","title","artist","production_date", …],
    "defaultFieldOrder": ["title","artist","production_date", …],
    "certColumns": ["cert_authority","cert_number","cert_grade","cert_grade_numeric",
                    "cert_grade_scale","cert_date","cert_subgrades","cert_notes"],
    "categories": [ …62 Discover categories… ]
  },
  "neutralNouns": { "item":"Item","itemPlural":"Items","collection":"Collection","addItem":"Add Item" },
  "museumNouns":  { "item":"Object","itemPlural":"Objects","collection":"Collection","addItem":"Add Object" },
  "categoryToProfile": { "Trading Cards & TCGs": "trading-cards", … },
  "profiles": [ /* 21 CollectionProfile objects, verbatim */ ]
}
```

### 3.2 `GET /api/museum/profile` — authenticated

The signed-in collection's state, plus the answers resolved server-side so you can
cross-check your port of the resolvers.

```jsonc
{
  "museum_id": "…",
  "plan": "hobbyist",
  "ui_mode": "simple",
  "collection_profiles": ["trading-cards"],   // ordered; [0] is primary
  "collection_category": "Trading Cards & TCGs",
  "resolved": {
    "profilesEnabled": true,
    "primaryProfile": "trading-cards",
    "nouns": { "item":"Card","itemPlural":"Cards","collection":"Collection","addItem":"Add Card" }
  }
}
```

**Use `resolved` as a test oracle.** Write one test that asserts your local resolvers
produce exactly what the server says for the signed-in account. That single test
catches almost every way this integration can silently rot.

---

## 4. The profile shape

```ts
interface CollectionProfile {
  id: string                  // stable slug, persisted — never rename
  label: string
  blurb: string
  emoji: string
  category: string            // maps to a Discover category

  nouns: { item, itemPlural, collection, addItem }

  fields: Partial<Record<FieldKey, {
    label?: string
    placeholder?: string
    help?: string
    hidden?: boolean
  }>>

  fieldOrder?: FieldKey[]     // partial; unlisted fields follow in default order

  vocab: {
    objectTypes?: string[]
    mediums?: string[]
    cultures?: string[]
    emojis?: string[]
    conditionLabels?: Record<CanonicalConditionGrade, string>  // RELABEL ONLY
    statusLabels?: Record<CanonicalStatus, string>             // RELABEL ONLY
  }

  certification?: CertificationConfig   // §6
  customFields?: CustomFieldDef[]       // §7
  listColumns?: { field, label }[]
  breakdowns?: { field, title }[]
}
```

`fields` is sparse — a missing key means "use the app's default label". Do **not**
treat absence as "hide".

---

## 5. The three resolvers — port these exactly

All three are pure functions of the two JSON payloads. Reimplement them verbatim; do
not improvise.

```
profilesEnabled(plan):
  → true when the plan is simple-mode (Community, Hobbyist).
  → Simplest correct implementation for Capture: trust
    `resolved.profilesEnabled` from /api/museum/profile. Don't re-derive plan rules.

// 5.1 — which profile dresses one item's capture form
resolveObjectProfile(object, museum):
  if !profilesEnabled                  → MUSEUM_FIXED  (museum wording, no profile UI)
  if object.collection_profile is set  → registry[that] ?? GENERAL
  if museum.collection_profiles[0]     → registry[that]
  else                                 → GENERAL

// 5.2 — app chrome wording (nav, buttons, screen titles)
resolveAppNouns(museum):
  if !profilesEnabled                        → museumNouns
  if museum.collection_profiles.length === 1 → that profile's nouns
  else                                       → neutralNouns

// 5.3 — collection-wide surfaces (lists, filters, any summary screen)
resolveCollectionProfile(museum):
  if !profilesEnabled                        → MUSEUM_FIXED
  if museum.collection_profiles.length === 1 → that profile
  else                                       → GENERAL
```

**Why 5.2 and 5.3 fall back to neutral on ≥2 profiles:** a collection holding cards
*and* watches cannot honestly title a button "Add Card". Per-item wording still uses
5.1, so the capture form itself is always correct.

**Unknown slug always degrades to `general`, never throws.** A profile retired in a
future release must not brick a saved item on someone's phone.

---

## 6. Certification — the part most worth getting right for Capture

### 6.1 Why it matters here

A graded slab has the grading company, grade, and certificate number **printed on the
label**, and most graders print a barcode or QR beside it. Vitrine web already ships
`@zxing/browser`, `qr-scanner` and `jsqr`; `objects.barcode` and a barcode scanner
modal already exist.

**This is Capture's strongest feature in the whole integration:**

> photograph slab → OCR/scan the label → prefill authority + grade + cert number →
> call the duplicate check → create or warn.

That turns cataloguing a 400-card graded collection from days of typing into an
afternoon of pointing a phone at slabs. The OCR/barcode work is entirely yours; it
depends on nothing beyond the columns, which are already live.

### 6.2 The data model

```jsonc
"certification": {
  "title": "Grading & Certification",
  "labels": { "authority":"Grading Company","number":"Cert Number","grade":"Grade","date":"Graded" },
  "derivesCondition": true,
  "authorities": [
    { "id":"PSA", "label":"PSA", "scale":"psa10" },
    { "id":"BGS", "label":"Beckett (BGS)", "scale":"bgs10",
      "subgrades":["Centering","Corners","Edges","Surface"] },
    { "id":"RAW", "label":"Ungraded / Raw", "scale":"raw" }
  ],
  "scales": [
    { "id":"psa10",
      "grades":["10","9.5","9", …,"Authentic"],       // ordered best → worst
      "numeric":{ "10":10, "9.5":9.5, … },            // for sorting
      "toCondition":{ "10":"Excellent", "8":"Good", … } }
  ]
}
```

Ten profiles carry certification (cards, coins/banknotes, comics, video games,
stamps, jewellery, sports memorabilia, fashion/sneakers, art, toys/models), plus two
that reuse the same columns for a related concept via overridable `labels`:

- **watches-clocks** — "Papers & Provenance": archive extracts, COSC certificates,
  box-and-papers completeness.
- **militaria** — "Proof & Certification": proof house marks and **deactivation
  certificate references**, which is a legal-compliance record for UK/EU collectors.

### 6.3 Rules for Capture

1. **Selecting an authority filters the grade list** to that authority's scale. A PSA
   9 is not a PCGS grade. Changing authority must clear an incompatible grade.
2. **Send `cert_authority` + `cert_grade` and nothing derived.** The server computes
   `cert_grade_numeric`, `cert_grade_scale` and `condition_grade`. Do not compute them
   on device — see §9.
3. **Never send a display label as a value.** `cert_authority` is `"PSA"`, not
   `"PSA (Professional Sports Authenticator)"`.
4. **`verifyUrl` is absent for every authority right now.** That is deliberate: a link
   that 404s on someone's £4,000 slab is worse than no link, so each grader's URL is
   being confirmed against its live site before being added. If `verifyUrl` is
   missing, render the cert number as plain selectable text. If it is present,
   substitute `{cert}` (URL-encoded) and never render a URL still containing `{cert}`.

### 6.4 Duplicate check — implement this

`GET /api/objects/cert-lookup?museum_id=…&cert_authority=…&cert_number=…&exclude=<objectId>`

Returns `{ "match": { "id","title","emoji" } | null }`.

A cert number is a globally unique identifier, so this is a far stronger duplicate
signal than a fuzzy title match. Call it on blur/scan-complete, debounced ~500 ms, and
warn with a link to the existing record before creating a second one. This catches the
single most common real-world error in graded collecting: logging the same slab twice
from two different photos — which is *far* more likely on a phone than on a desktop.

---

## 7. Detail fields (`custom_fields`)

Per-profile long tail — ABV, matrix/runout, calibre, page quality, style code. 3–5
per profile.

```jsonc
"customFields": [
  { "key":"trading-cards.card_number", "label":"Card Number", "type":"text", "placeholder":"e.g. 4/102" },
  { "key":"trading-cards.print_run",   "label":"Print Run",   "type":"number", "min":1 },
  { "key":"trading-cards.language",    "label":"Language",    "type":"select", "options":["English","Japanese", …] },
  { "key":"trading-cards.sealed",      "label":"Sealed / Unopened", "type":"boolean" }
]
```

Types: `text | number | select | date | boolean`. Optional `unit`, `min`, `max`,
`help`, `width: 'half'|'full'`.

Stored as a flat object on `objects.custom_fields`, keyed by the **namespaced** key:

```json
{ "trading-cards.card_number": "4/102", "trading-cards.print_run": 1999 }
```

Rules for Capture:

- **Send the namespaced key exactly as published.** Unknown keys are rejected
  server-side, so a stale cached registry surfaces as a clear validation error rather
  than silent data loss.
- **Never prune keys you don't recognise.** If you fetched an item and are sending it
  back, return every key you received, unchanged. Keys belonging to a currently
  *inactive* profile are deliberately preserved — see §9, invariant G.
- Coerce to the declared type: `number` as a JSON number, `boolean` as a real boolean,
  `select` as one of `options` (server matching is case-insensitive but send the
  canonical casing), `date` as `YYYY-MM-DD`.
- Server bounds: ≤40 keys, key ≤128 chars, string values ≤2000 chars, no nested
  objects or arrays. There is a DB CHECK constraint enforcing this, so violating it is
  a hard write failure, not a warning.

---

## 8. Writing an object

Create goes through `POST /api/objects` (Zod-validated, quota-enforced). Accepted
profile-related fields:

```jsonc
{
  "title": "Charizard, Base Set",
  "collection_profile": "trading-cards",   // null = inherit the collection's primary
  "cert_authority": "PSA",
  "cert_number": "84927361",
  "cert_grade": "10",
  "cert_date": "2024-03-11",
  "cert_subgrades": { "Centering": 9.5, "Corners": 10 },   // BGS-style only
  "cert_notes": "…",
  "custom_fields": { "trading-cards.card_number": "4/102" }
  // do NOT send cert_grade_numeric / cert_grade_scale / condition_grade
}
```

**Always set `collection_profile` when the collection has more than one active
profile.** Otherwise the item inherits the primary and a watch gets card labels.

---

## 9. Invariants — violating these causes silent data damage

These are the ones that bite. None of them fail loudly.

**A. Never invent a `status` value.** Send only `canonical.statuses`. Status drives
real behaviour on the web side (On Loan filtering, deaccession protection triggers).
`statusLabels` is display only.

**B. Never invent a `condition_grade`.** Send only `canonical.conditionGrades`. The
web app's condition colours and analytics key off those five exact strings.
`conditionLabels` is display only — a card collector sees "Mint / Gem Mint" but the
stored value is `"Excellent"`.

**G. Deactivating a profile must not delete data.** `custom_fields` values from an
inactive profile stay in the record, hidden. This is why keys are namespaced. If
Capture strips unrecognised keys on write, it will quietly destroy data the web app
went out of its way to preserve.

**G2. Do not derive certification values on device.** *(This was a real bug on the web
side, caught only in browser testing — every unit test passed.)*

The derived columns `cert_grade_numeric` and `cert_grade_scale` describe the
**certificate**, not the UI. The first web implementation derived them from the
*active* profile's certification config. It looked right. But once a profile was
deactivated, the resolved profile became `general` — which has no certification config
— so the next save silently wrote `cert_grade_numeric = null`. Grade sorting broke
while the grade itself still displayed correctly, which is close to undetectable.

The fix on the web side resolves the authority across the *whole registry*. For
Capture the safe equivalent is simpler: **send `cert_authority` + `cert_grade` and let
the server derive the rest.** If you ever do need a numeric grade on device (for local
sorting), resolve the authority by scanning every profile's `certification.authorities`
— never just the active profile's.

**E. Museum tiers see nothing.** If `resolved.profilesEnabled` is false, render the
existing museum vocabulary and hide all profile UI, certification card included.

---

## 10. Suggested build order

| Phase | Work |
|---|---|
| 1 | Fetch + cache both endpoints. Port the three resolvers. Add the cross-check test against `resolved` (§3.2). |
| 2 | Apply `fields` labels/placeholders/hidden + `fieldOrder` to the capture form. Swap `vocab` lists. Relabel status/condition **display only**. |
| 3 | App nouns from `resolveAppNouns` — nav, buttons, screen titles, empty states. |
| 4 | Certification UI: authority → filtered grades → cert number → date → subgrades. Wire the `cert-lookup` duplicate warning. |
| 5 | Detail fields from `customFields`, with the five input types. |
| 6 | Per-item profile picker, shown only when >1 active profile. |
| 7 | **The payoff:** OCR/barcode read of a slab label to prefill authority + grade + cert number. |

Phase 7 is the reason to do this at all — everything before it is parity with the web
app; phase 7 is something the web app can't do.

---

## 11. Quick reference

| Thing | Value |
|---|---|
| Registry | `GET /api/collection-profiles` (public, `s-maxage=3600`) |
| Collection state | `GET /api/museum/profile` (auth) |
| Duplicate cert check | `GET /api/objects/cert-lookup` (auth) |
| Create object | `POST /api/objects` |
| Profiles | 21, incl. `general` fallback |
| Profiles with certification | 12 (10 grading + watches papers + militaria proof) |
| Canonical statuses | 7 — never invent one |
| Canonical condition grades | 5 — never invent one |
| Tier gate | Community + Hobbyist only (`resolved.profilesEnabled`) |
| Base URL | `https://vitrinecms.com` |

**Known-good test account** (hobbyist, `trading-cards` profile active, one object
carrying PSA cert `84927361` with card detail fields populated) — ask Matt for the
credentials; they're in his notes, not in this file.

---

## 12. Open items on the web side, for awareness

- **Verify URLs are not yet populated** for any grading authority (§6.3, rule 4).
  When they land, they arrive automatically through the registry — no Capture change.
- **The public collection site is untouched.** It still uses `artist` as the object
  subtitle regardless of profile. A grade badge on public object pages is an open
  decision, not an oversight.
- **Custom fields are not filterable** in the web app's search bar yet, by choice.
