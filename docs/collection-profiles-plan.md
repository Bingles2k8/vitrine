# Collection Profiles — implementation plan

**Status:** design agreed, not yet built
**Date:** 2026-08-12
**Scope:** Vitrine web app. VitrineCapture mirrors this via a published contract (§12).

---

## 1. What this is

A collector picks **what they collect**, and the Vitrine UI re-dresses itself to match.
A card collector sees *Set / Manufacturer*, *Grade*, *Print Run*. A wine collector sees
*Producer*, *Vintage*, *Bottle Size*. Nobody is asked for "Culture / Origin" or offered
"Oil on canvas" in a materials dropdown unless that's genuinely what they collect.

Mostly this is a presentation layer: the same `objects` columns back every profile, and
switching profile never migrates, orphans, or loses data. There are **two deliberate
exceptions**, where relabelling an existing column would be a lie rather than a translation:

- **Certification & grading** (§5.5) — first-class columns. A PSA 10 with cert number
  84927361 is not "rarity". It is cross-domain (cards, coins, comics, banknotes, video
  games, diamonds, autographs), structured, searchable, and value-determining.
- **Per-profile detail fields** (§5.6) — a `custom_fields` JSONB for the domain long tail
  that has no column at all: ABV, matrix/runout, calibre, page quality, style code.

Both are additive. Neither breaks the "switching profile loses nothing" guarantee — see
invariant G.

---

## 2. What already exists (do not rebuild)

| Thing | Where | Current use |
|---|---|---|
| `museums.collection_category` (text) | `objects`/`museums` schema | Discover directory filter only |
| `objects.category` (text) | schema | Per-object Discover override |
| `COLLECTION_CATEGORIES` — 34 entries | `lib/categories.ts` | Feeds two `<select>`s |
| Category picker (dashboard) | `app/dashboard/page.tsx:464` | Hidden behind "Listed in Discover" toggle |
| Category picker (settings) | `components/Sidebar.tsx:530` | Same, in the settings panel |
| Simple/full UI axis | `museums.ui_mode`, `getPlan().fullMode` | Community+Hobbyist = simple |
| Per-field relabelling precedent | `OverviewTab.tsx:316,352` — `fullMode ? 'Medium' : 'Medium / Material'` | Ad-hoc ternaries |
| Status relabelling precedent | `SIMPLE_MODE_STATUS_LABELS` in `components/tabs/shared.ts` | Stored value stable, label swapped |
| Field help text | `lib/learn-descriptions.ts` (1,131 lines), keyed `objects.artist` etc. | Learn Mode tooltips |
| Autocomplete that learns from collection + static list | `components/AutocompleteInput.tsx` | `staticList` prop |

The two ad-hoc precedents (`fullMode ? …` ternaries and `SIMPLE_MODE_STATUS_LABELS`) are
exactly what this system generalises. Both get folded into it.

### The load-bearing coincidence

`PLANS.community.fullMode === false` and `PLANS.hobbyist.fullMode === false`; every paid
museum tier is `true`. So **"profiles are Community + Hobbyist only" and "profiles apply
in simple mode" are the same predicate.** Only the ~20 fields rendered when
`fullMode === false` need profile treatment — not the ~130-column full-mode surface.

This is the single biggest scope reduction in the plan. Guard everything with one helper
so the coincidence is explicit rather than accidental:

```ts
// lib/collectionProfiles/index.ts
export function profilesEnabled(plan: PlanId) {
  return !getPlan(plan).fullMode   // community + hobbyist
}
```

If a paid tier ever gets simple mode, profiles follow it correctly and for free.

---

## 3. Decisions recorded

| Question | Decision |
|---|---|
| Field adaptation depth | **Relabel + reorder + hide**, *plus* first-class certification columns and a per-profile `custom_fields` JSONB. *(Revised 2026-08-12 — see below.)* |
| UI reach | Object form labels + vocab lists; nav & app terminology; analytics, list columns, search filters. **Not** the public site. |
| Cardinality | **Multiple active profiles per collection**, with a per-object profile. |
| Tier gating | **Community + Hobbyist only.** Paid museum tiers keep today's fixed vocabulary. |

### Revision: dedicated fields are in scope after all

The original decision was relabel-only, with the honest caveat that a card collector would
get `rarity` relabelled to "Grade / Cert No." rather than a real cert field. That caveat
was accepted as the cost of a fast v1; on review it is now in scope.

The revision splits into two tiers, because "add a dedicated field" has two very different
answers depending on the field:

| | Tier A — Certification | Tier B — Detail fields |
|---|---|---|
| **Storage** | Real typed columns on `objects` | `custom_fields` JSONB |
| **Why** | Cross-domain, identical shape everywhere, needs indexing, sorting, filtering, analytics, duplicate detection, and an outbound verify link | Domain-specific, long tail, no cross-profile meaning, only ever displayed and searched as text |
| **Survives profile switch** | Always — it's a column | Yes, retained but hidden (invariant G) |
| **Examples** | PSA / BGS / CGC / PCGS / NGC / PMG / WATA / GIA authority, grade, cert number, subgrades | ABV, bottle size, matrix runout, calibre, page quality, style code, perforation |

Putting certification in the JSONB would have been the easy call and the wrong one. "Show
me every PSA 10 I own", "sort by grade", "warn me this cert number is already in my
collection", and "by grade" analytics all need a real column. The long tail genuinely does
not.

This adds roughly two phases to the build (§11) and one new invariant (G). It does not
disturb anything in §§6–7 that was already designed — the field registry was built to
iterate a list of field keys, and both tiers are just more entries in that list.

---

## 4. Data model

Two new columns. Both additive, both nullable/defaulted, no backfill required.

```sql
-- supabase/collection-profiles.sql

-- Ordered set of active profiles. Element 0 is the primary.
-- Values are CollectionProfile ids (slugs), NOT category display strings.
alter table museums
  add column if not exists collection_profiles text[] not null default '{}';

-- Which profile an individual object uses. Null = fall back to primary.
alter table objects
  add column if not exists collection_profile text;

create index if not exists objects_collection_profile_idx
  on objects (museum_id, collection_profile)
  where collection_profile is not null;

-- ── Tier A: certification & grading (§5.5) ───────────────────────────────
alter table objects
  add column if not exists cert_authority     text,     -- 'PSA', 'CGC', 'PCGS', 'GIA'…
  add column if not exists cert_number        text,     -- as printed on the slab / report
  add column if not exists cert_grade         text,     -- display grade: '10', 'MS-65', 'VF'
  add column if not exists cert_grade_numeric numeric,  -- derived, for sort + analytics
  add column if not exists cert_grade_scale   text,     -- which scale cert_grade came from
  add column if not exists cert_date          date,
  add column if not exists cert_subgrades     jsonb,    -- {"centering":9.5,"corners":10,…}
  add column if not exists cert_notes         text;

-- Cert numbers are the strongest duplicate signal we have (§7.11).
create index if not exists objects_cert_number_idx
  on objects (museum_id, cert_authority, cert_number)
  where cert_number is not null;

-- ── Tier B: per-profile detail fields (§5.6) ─────────────────────────────
alter table objects
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

create index if not exists objects_custom_fields_gin
  on objects using gin (custom_fields jsonb_path_ops);
```

### Notes on the migration

- **No RPC change needed.** `insert_object_if_quota_ok` builds the row with
  `jsonb_populate_record(NULL::objects, v_data)` (`supabase/insert-object-quota-rpc.sql:64`).
  A nested JSONB value populates a `jsonb` column correctly, and the new text columns come
  through as-is. Verify with one insert during Phase 1 rather than assuming.
- **No RLS change needed.** All new columns live on `objects`, which is already covered.
- **No storage-quota interaction.** `custom_fields` is small structured text; the six
  quota sources in `cached-storage-usage.sql` are untouched.
- `custom_fields` is `not null default '{}'` so every read site can assume an object, never
  a null. Existing rows backfill to `{}` automatically.
- `cert_grade_numeric` is **derived on write, never user-entered** — parsed from
  `cert_grade` by the profile's grade scale. It exists purely so "sort by grade" and
  "by grade" analytics don't have to parse strings at query time.

### Why certification gets columns and details get JSONB

The dividing line is **"does anything other than a form field need to read this?"**

`cert_number` is read by duplicate detection, by search, by the verify-link builder, and by
a uniqueness warning. `cert_grade_numeric` is read by sorting and by an analytics
breakdown. Those are `where` clauses and `order by` clauses — they want a column and an
index. Wrapping them in JSONB means either `custom_fields->>'cert_number'` scattered through
the codebase or a functional index per key, and it means the data evaporates from search
the moment someone switches profile.

`abv` is read by one form field and one detail row. It never appears in a `where` clause.
JSONB is exactly right, and a column would be 20 near-empty columns on an already
130-column table.

### Why a new `objects.collection_profile` rather than reusing `objects.category`

`objects.category` holds a **display string** from `COLLECTION_CATEGORIES` and is already
consumed by Discover (`app/discover/page.tsx:81` — `obj.category || museum.collection_category`).
Overloading it with profile slugs would either break Discover's filter matching or force
profile ids to be display strings forever. Keep them separate:

- `objects.category` — Discover taxonomy, display string, unchanged behaviour.
- `objects.collection_profile` — UI profile slug, new, internal.

Each profile declares which category it maps to, so setting a profile can *offer* to set
the matching category too (see §8.3). Discover is untouched.

### Why `collection_category` stays

`museums.collection_category` remains the Discover listing category, unchanged. When a
primary profile is set and the museum has no category yet, mirror the primary profile's
`category` into it. Never overwrite a category the user chose explicitly.

---

## 5. The profile registry

New directory `lib/collectionProfiles/`:

```
lib/collectionProfiles/
  types.ts          — interfaces below
  index.ts          — registry, resolution helpers, profilesEnabled()
  vocab.ts          — shared vocabulary fragments (conditions, generic types)
  profiles/
    general.ts            — fallback; identical to today's simple mode
    trading-cards.ts
    coins-banknotes.ts
    stamps.ts
    watches-clocks.ts
    vinyl-music.ts
    wine-spirits.ts
    art.ts
    comics.ts
    books.ts
    toys-models.ts
    video-games.ts
    militaria.ts
    sports-memorabilia.ts
    fashion-sneakers.ts
    jewellery.ts
    ceramics-glass.ts
    natural-history.ts
    automobilia.ts
    photography-cameras.ts
    antiques.ts
```

### 5.1 Types

```ts
// lib/collectionProfiles/types.ts

/** Only columns rendered in simple mode may be overridden. Compile-time enforced. */
export type ProfileFieldKey =
  | 'emoji' | 'title' | 'artist' | 'production_date' | 'production_date_qualifier'
  | 'medium' | 'object_type' | 'culture' | 'rarity' | 'number_of_parts'
  | 'status' | 'description' | 'inscription'
  | 'dimension_height' | 'dimension_width' | 'dimension_depth' | 'dimension_weight'
  | 'condition_grade' | 'current_location'
  | 'insured_value' | 'estimated_value' | 'year'

export interface FieldOverride {
  /** Replaces the hardcoded <label>. */
  label?: string
  /** Replaces the input placeholder. */
  placeholder?: string
  /** Replaces the Learn Mode description for this field under this profile. */
  help?: string
  /** Removes the field from the form entirely for this profile. */
  hidden?: boolean
}

export interface CollectionProfile {
  /** Stable slug. Never change once shipped — it is persisted in two tables. */
  id: string
  /** Display name in the picker. */
  label: string
  /** One-line description shown under the label in the picker. */
  blurb: string
  emoji: string
  /** Which COLLECTION_CATEGORIES entry this maps to, for Discover. */
  category: CollectionCategory

  /** App-wide terminology. Used only when this is the sole active profile (§6). */
  nouns: {
    item: string          // 'Card'
    itemPlural: string    // 'Cards'
    collection: string    // 'Collection'
    addItem: string       // 'Add Card'
  }

  /** Per-field label/placeholder/help/hidden overrides. */
  fields: Partial<Record<ProfileFieldKey, FieldOverride>>

  /** Render order within the Object Information card. Omitted fields keep default order after these. */
  fieldOrder?: ProfileFieldKey[]

  vocab: {
    /** Replaces OBJECT_TYPES for the object_type autocomplete. */
    objectTypes?: string[]
    /** Replaces MEDIUMS for the medium autocomplete. */
    mediums?: string[]
    /** Replaces CULTURES for the culture autocomplete. */
    cultures?: string[]
    /** Replaces EMOJIS in the icon picker. */
    emojis?: string[]
    /**
     * Relabels the five canonical condition grades.
     * Keys MUST be the canonical stored values — see §9 invariant C.
     */
    conditionLabels?: Partial<Record<CanonicalConditionGrade, string>>
    /** Relabels the seven canonical statuses. Same invariant. */
    statusLabels?: Partial<Record<CanonicalStatus, string>>
  }

  /** Tier A — certification. Omit entirely for profiles where grading isn't a thing. */
  certification?: CertificationConfig

  /** Tier B — per-profile detail fields stored in objects.custom_fields. */
  customFields?: CustomFieldDef[]

  /** Objects-list table columns after Title. Max 3. May reference cert or custom fields. */
  listColumns?: { field: ListColumnKey; label: string }[]

  /** Analytics breakdown cards. Replaces the hardcoded "By Artist / Maker". */
  breakdowns?: { field: BreakdownKey; title: string }[]
}

/** listColumns / breakdowns may point at a plain field, a cert column, or a custom key. */
export type ListColumnKey =
  | ProfileFieldKey
  | 'cert_authority' | 'cert_grade' | 'cert_number'
  | `custom:${string}`
export type BreakdownKey = ListColumnKey
```

### 5.1a Tier A types — certification

```ts
export interface GradingAuthority {
  /** Stored in objects.cert_authority. Stable — persisted. */
  id: string
  /** Display name, e.g. 'PSA (Professional Sports Authenticator)'. */
  label: string
  /** Which scale this authority grades on. */
  scale: string
  /**
   * Template for the public cert-lookup page, {cert} substituted.
   * MUST be omitted unless verified against the grader's live site — see §5.5.
   * When absent, the cert number renders as plain text with no link.
   */
  verifyUrl?: string
  /** Beckett-style component subgrades, if this authority issues them. */
  subgrades?: string[]
}

export interface GradingScale {
  id: string
  /** Ordered best → worst. Display strings; also the accepted input values. */
  grades: string[]
  /** grade → numeric, for sorting and analytics. */
  numeric: Record<string, number>
  /** grade → canonical condition_grade, so condition derives from the slab (§5.5). */
  toCondition: Record<string, CanonicalConditionGrade>
}

export interface CertificationConfig {
  /** Card heading, e.g. 'Grading & Certification', 'Diamond Certification'. */
  title: string
  /** Field labels within the card — domains disagree on what to call these. */
  labels?: {
    authority?: string   // 'Grading Company' | 'Laboratory' | 'Authenticator'
    number?: string      // 'Cert Number' | 'Report Number' | 'Serial'
    grade?: string       // 'Grade' | 'Clarity' | 'Rating'
    date?: string
  }
  authorities: GradingAuthority[]
  scales: GradingScale[]
  /** When true, a graded item's condition_grade is derived and read-only (§5.5). */
  derivesCondition: boolean
}
```

### 5.1b Tier B types — detail fields

```ts
export interface CustomFieldDef {
  /**
   * Key inside objects.custom_fields. Stable — persisted. Namespaced by profile
   * to guarantee no cross-profile collisions: 'trading-cards.card_number'.
   */
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean'
  placeholder?: string
  help?: string
  /** Required for type 'select'. */
  options?: string[]
  /** type 'number' only. */
  unit?: string          // '%', 'ml', 'g'
  min?: number
  max?: number
  /** Render width in the details grid. Default 'half'. */
  width?: 'half' | 'full'
}
```

### 5.2 Worked example — Trading Cards

```ts
// lib/collectionProfiles/profiles/trading-cards.ts
export const tradingCards: CollectionProfile = {
  id: 'trading-cards',
  label: 'Trading Cards & TCGs',
  blurb: 'Sports cards, Pokémon, Magic, graded slabs',
  emoji: '🃏',
  category: 'Trading Cards & TCGs',

  nouns: { item: 'Card', itemPlural: 'Cards', collection: 'Collection', addItem: 'Add Card' },

  fields: {
    title:            { label: 'Card Name', placeholder: 'e.g. Charizard, Base Set' },
    artist:           { label: 'Set / Manufacturer', placeholder: 'e.g. Topps, Panini, Wizards of the Coast',
                        help: 'Who printed the card, and the set it belongs to.' },
    production_date:  { label: 'Year Printed', placeholder: 'e.g. 1999' },
    object_type:      { label: 'Card Type', placeholder: 'e.g. Rookie, Holo Rare…' },
    medium:           { label: 'Finish / Parallel', placeholder: 'e.g. Holo, Refractor, Foil…' },
    rarity:           { label: 'Print Run / Rarity', placeholder: 'e.g. 1 of 99, Short Print' },
    culture:          { hidden: true },
    inscription:      { label: 'Signatures & Markings', placeholder: 'Autographs, stamps, print marks…' },
    number_of_parts:  { hidden: true },
    current_location: { label: 'Stored In', placeholder: 'e.g. Binder 3, Slab box A' },
  },

  fieldOrder: ['title', 'artist', 'production_date', 'object_type', 'medium', 'rarity',
               'condition_grade', 'description', 'inscription', 'current_location'],

  vocab: {
    objectTypes: ['Base', 'Rookie', 'Insert', 'Parallel', 'Holo Rare', 'Reverse Holo',
                  'Full Art', 'Secret Rare', 'Autograph', 'Relic / Patch', 'Promo',
                  'Error / Misprint', 'Graded Slab', 'Sealed Pack', 'Sealed Box', 'Other'],
    mediums:     ['Holo', 'Reverse Holo', 'Refractor', 'Prizm', 'Foil', 'Textured',
                  'Matte', 'Gloss', 'Gold', 'Rainbow', 'Cracked Ice', 'Non-foil', 'Other'],
    emojis:      ['🃏','🎴','⚡','🔥','💧','🌿','⭐','🏆','🥇','💎','📦','🧊','👑','🐉','🎯','🧿'],
    conditionLabels: {
      Excellent: 'Mint / Gem Mint',
      Good:      'Near Mint',
      Fair:      'Lightly Played',
      Poor:      'Heavily Played',
      Critical:  'Damaged',
    },
    statusLabels: {
      'On Display':    'In Display Case',
      'Storage':       'In Binder / Box',
      'Restoration':   'Away for Grading',
      'Deaccessioned': 'Sold / Traded',
    },
  },

  certification: {
    title: 'Grading & Certification',
    labels: { authority: 'Grading Company', number: 'Cert Number', grade: 'Grade' },
    derivesCondition: true,
    authorities: [
      { id: 'PSA',  label: 'PSA',            scale: 'psa10' },
      { id: 'BGS',  label: 'Beckett (BGS)',  scale: 'bgs10',
        subgrades: ['Centering', 'Corners', 'Edges', 'Surface'] },
      { id: 'CGC',  label: 'CGC Cards',      scale: 'psa10' },
      { id: 'SGC',  label: 'SGC',            scale: 'psa10' },
      { id: 'TAG',  label: 'TAG',            scale: 'psa10' },
      { id: 'RAW',  label: 'Ungraded / Raw', scale: 'raw' },
    ],
    scales: [
      { id: 'psa10',
        grades:  ['10','9.5','9','8.5','8','7','6','5','4','3','2','1.5','1','Authentic'],
        numeric: { '10':10,'9.5':9.5,'9':9,'8.5':8.5,'8':8,'7':7,'6':6,'5':5,
                   '4':4,'3':3,'2':2,'1.5':1.5,'1':1,'Authentic':0 },
        toCondition: { '10':'Excellent','9.5':'Excellent','9':'Excellent',
                       '8.5':'Good','8':'Good','7':'Good',
                       '6':'Fair','5':'Fair','4':'Fair',
                       '3':'Poor','2':'Poor','1.5':'Poor','1':'Critical','Authentic':'Fair' } },
      // bgs10 and raw defined alongside; bgs10 adds 10 'Black Label' at the top.
    ],
  },

  customFields: [
    { key: 'trading-cards.card_number', label: 'Card Number', type: 'text',
      placeholder: 'e.g. 4/102' },
    { key: 'trading-cards.print_run',   label: 'Print Run',   type: 'number',
      help: 'Total number printed, if the set discloses it.' },
    { key: 'trading-cards.language',    label: 'Language',    type: 'select',
      options: ['English','Japanese','German','French','Spanish','Italian','Korean',
                'Chinese','Portuguese','Other'] },
    { key: 'trading-cards.sealed',      label: 'Sealed / Unopened', type: 'boolean' },
  ],

  listColumns: [
    { field: 'artist',          label: 'Set' },
    { field: 'production_date', label: 'Year' },
    { field: 'cert_grade',      label: 'Grade' },
  ],

  breakdowns: [
    { field: 'artist',         title: 'By Set' },
    { field: 'cert_grade',     title: 'By Grade' },
    { field: 'cert_authority', title: 'By Grading Company' },
  ],
}
```

### 5.3 Worked example — Wine & Spirits

```ts
fields: {
  title:            { label: 'Wine / Bottle', placeholder: 'e.g. Château Margaux' },
  artist:           { label: 'Producer / Vineyard', placeholder: 'e.g. Domaine de la Romanée-Conti' },
  production_date:  { label: 'Vintage', placeholder: 'e.g. 2015, NV' },
  culture:          { label: 'Region / Appellation', placeholder: 'e.g. Bordeaux, Rioja, Islay' },
  object_type:      { label: 'Style', placeholder: 'e.g. Red, Single Malt…' },
  medium:           { label: 'Grape / Mash Bill', placeholder: 'e.g. Cabernet Sauvignon, 100% barley' },
  rarity:           { label: 'Bottle No. / Release', placeholder: 'e.g. 214 of 500, Cask 1147' },
  dimension_height: { hidden: true },
  dimension_width:  { hidden: true },
  dimension_depth:  { hidden: true },
  dimension_weight: { label: 'Bottle Size', placeholder: 'e.g. 750' },
  inscription:      { label: 'Label & Capsule Notes', placeholder: 'Label condition, fill level, capsule…' },
  current_location: { label: 'Stored In', placeholder: 'e.g. Cellar rack B, Row 4' },
},
vocab: {
  objectTypes: ['Red', 'White', 'Rosé', 'Sparkling', 'Champagne', 'Dessert', 'Fortified',
                'Single Malt', 'Blended Whisky', 'Bourbon', 'Rye', 'Rum', 'Gin', 'Cognac',
                'Armagnac', 'Tequila / Mezcal', 'Vermouth', 'Liqueur', 'Other'],
  cultures:    ['Bordeaux','Burgundy','Champagne','Rhône','Loire','Alsace','Tuscany','Piedmont',
                'Rioja','Ribera del Duero','Douro','Mosel','Rheingau','Napa Valley','Sonoma',
                'Willamette','Barossa','Margaret River','Marlborough','Central Otago','Stellenbosch',
                'Mendoza','Maipo','Speyside','Islay','Highland','Lowland','Campbeltown',
                'Kentucky','Tennessee','Cognac','Jerez','Other'],
  conditionLabels: { Excellent: 'Pristine', Good: 'Good', Fair: 'Signs of Age',
                     Poor: 'Poor', Critical: 'Compromised' },
  statusLabels: { 'On Display': 'On Display', 'Storage': 'In Cellar',
                  'Restoration': 'Away', 'Deaccessioned': 'Drunk / Sold' },
},

// No `certification` block — wine has no grading authority. The card simply
// doesn't render for this profile.

customFields: [
  { key: 'wine-spirits.abv',            label: 'ABV', type: 'number', unit: '%',
    min: 0, max: 100 },
  { key: 'wine-spirits.bottle_size_ml', label: 'Bottle Size', type: 'number', unit: 'ml',
    placeholder: '750' },
  { key: 'wine-spirits.cask_number',    label: 'Cask / Barrel No.', type: 'text' },
  { key: 'wine-spirits.bottles_held',   label: 'Bottles Held', type: 'number', min: 1,
    help: 'Use for a case or multiple identical bottles logged as one record.' },
],
```

### 5.4 The remaining profiles

Author each to the same shape. The table below fixes the four highest-signal mappings per
profile so the build is unambiguous; fill the rest by the same logic.

Note the `rarity` column below: with certification promoted to real columns, the profiles
that were borrowing `rarity` to hold cert numbers now use it for actual rarity. That is a
direct improvement from the revision, not just a relocation.

| Profile | `artist` → | `production_date` → | `culture` → | `rarity` → | Cert? |
|---|---|---|---|---|---|
| general (fallback) | Maker / Brand | Date | Origin | Edition / Rarity | — |
| trading-cards | Set / Manufacturer | Year Printed | *hidden* | Print Run / Rarity | ✅ grading |
| coins-banknotes | Mint / Issuing Authority | Year Struck | Country of Issue | Mintage | ✅ grading |
| stamps | Issuing Post / Printer | Year of Issue | Country of Issue | Rarity | ✅ expertising |
| watches-clocks | Brand / Manufacturer | Year of Manufacture | Country of Origin | Reference / Serial No. | ✅ papers |
| vinyl-music | Artist | Release Year | Label / Country | Pressing / Edition | — |
| wine-spirits | Producer / Vineyard | Vintage | Region / Appellation | Bottle No. / Release | — |
| art | Artist | Date | Culture / School | Edition | ✅ COA |
| comics | Publisher / Creators | Cover Date | *hidden* | Print Run / Variant | ✅ grading |
| books | Author / Publisher | Publication Date | Place of Publication | Edition / Printing | — |
| toys-models | Brand / Manufacturer | Year Released | *hidden* | Item No. / Edition | ✅ grading |
| video-games | Publisher / Developer | Release Year | Region (NTSC/PAL) | Edition / Variant | ✅ grading |
| militaria | Maker / Regiment | Date | Country / Service | Pattern / Serial No. | ✅ proof/deact. |
| sports-memorabilia | Team / Player | Year | League / Country | Edition | ✅ authentication |
| fashion-sneakers | Brand / Designer | Season / Year | Country of Manufacture | Colourway | ✅ authentication |
| jewellery | Maker / Designer | Date | Origin | Hallmark / Carat | ✅ lab report |
| ceramics-glass | Maker / Factory | Date | Origin | Pattern / Mark | — |
| natural-history | Collector / Locality | Age / Period | Geological Formation | Specimen No. | — |
| automobilia | Marque / Manufacturer | Year | Country of Origin | Chassis / Part No. | — |
| photography-cameras | Make / Model | Year | Country of Origin | Serial No. | — |
| antiques | Maker / Retailer | Date | Origin | Edition / Mark | — |

**`general` is special:** it must render byte-identically to today's simple mode. It is the
regression baseline — a Community user who never picks anything sees zero change. It has
no `certification` block and no `customFields`.

---

### 5.5 Certification & grading (Tier A)

### The generalisation

"PSA cert number" looks card-specific but the shape is identical across nine of the
twenty-one profiles. Every one of them is *some organisation issued an opinion about this
item, recorded under a reference number, on a defined scale, on a date*:

| Domain | Authorities | Scale | What the number is called |
|---|---|---|---|
| Trading cards | PSA, BGS, CGC, SGC, TAG | 1–10 (half points) | Cert Number |
| Comics | CGC, CBCS, PGX | 0.5–10.0 | Certification Number |
| Coins | PCGS, NGC, ANACS, ICG | Sheldon 1–70 | Certification Number |
| Banknotes | PMG, PCGS Banknote | 1–70 + EPQ/PPQ | Serial / Cert Number |
| Video games | WATA, VGA, CGC | 0.5–10 + seal rating | Certification Number |
| Stamps | PSE, Philatelic Foundation, BPA, RPS | Expertising opinion | Certificate Number |
| Diamonds / jewellery | GIA, IGI, AGS, HRD | 4Cs (clarity/colour grades) | Report Number |
| Autographs / sports | JSA, PSA-DNA, Beckett Auth. | Authentic / graded 1–10 | Certification Number |
| Sneakers | StockX, GOAT, CheckCheck | Pass / Fail | Verification ID |

Two outliers reuse the same columns for a related concept, which is why the config carries
overridable `labels`:

- **Watches** — `cert_authority` = the issuing body (manufacturer, COSC), `cert_number` =
  archive extract / certificate number, `cert_grade` = the box-and-papers completeness.
  Labelled "Papers & Provenance" rather than "Grading".
- **Militaria** — proof house marks and, for UK/EU collectors, **deactivation certificate
  references**. This is a legal-compliance record, not a quality opinion, and is arguably
  the single most valuable field in that profile. Labelled "Proof & Certification".

### Verify links — handle with care

Every major grader has a public cert-lookup page, and a "Verify this cert →" link is a
genuinely strong feature. **But do not populate `verifyUrl` from memory.** URL patterns
change, and a link that 404s on a collector's £4,000 slab is worse than no link.

Rule: `verifyUrl` is omitted by default. Before shipping, open each grader's live lookup
page, confirm the query-string format, and add the template one at a time. Any authority
without a verified template renders its cert number as plain selectable text. Ship Phase 3a
with **zero** verify links and add them as they're each confirmed — the feature degrades
cleanly.

### Condition derives from the grade

A slabbed card's condition *is* its grade; asking for both invites contradiction. When
`certification.derivesCondition` is true and `cert_grade` is set:

- `condition_grade` is written from `scale.toCondition[grade]` on save.
- The condition control renders read-only with the note *"Set from PSA 10"* and a
  "Set manually" escape hatch that clears `cert_grade`.
- Invariant B holds — the value stored in `condition_grade` is still one of the canonical
  five, so `CONDITION_STYLES`, the analytics colour map, and every existing query are
  unaffected.

This is the payoff for having kept condition canonical in the original design.

### Where it renders

A **Certification card** in `OverviewTab`, between Object Information and Condition,
rendered only when `profile.certification` exists:

```
┌─ Grading & Certification ─────────────────────────────┐
│ Grading Company [PSA        ▾]  Grade [10        ▾]   │
│ Cert Number     [84927361      ]  Graded [2024-03-11] │
│ ┌ Subgrades (BGS only) ─────────────────────────────┐ │
│ │ Centering 9.5  Corners 10  Edges 9.5  Surface 10  │ │
│ └───────────────────────────────────────────────────┘ │
│ Notes [                                             ] │
│ ⚠ You already have an item with PSA cert 84927361.    │
└───────────────────────────────────────────────────────┘
```

Selecting an authority filters the Grade dropdown to that authority's scale. Selecting
`RAW` / "Ungraded" clears the cert fields and re-enables manual condition.

---

### 5.6 Detail fields (Tier B)

Stored in `objects.custom_fields` as a flat object keyed by the **namespaced** `key` from
the registry:

```json
{
  "trading-cards.card_number": "4/102",
  "trading-cards.print_run": 1999,
  "trading-cards.language": "English",
  "trading-cards.sealed": false
}
```

Namespacing is what makes invariant G work: a collection running both `trading-cards` and
`wine-spirits` can never have one profile's `language` collide with another's, and values
from a deactivated profile sit inert rather than being reinterpreted.

### Rendering

A **Details card** after Object Information, rendered only when the resolved profile has
`customFields`. Two-column grid, `width: 'full'` fields span both. Field types map to:
`text` → input, `number` → number input with unit suffix, `select` → native select,
`date` → date input, `boolean` → the existing toggle style used in the settings panel.

### Validation

Build a Zod schema per profile from the registry at module load, and extend
`objectCreateSchema` in `lib/validations.ts` with:

```ts
custom_fields: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .default({})
  .superRefine(validateAgainstRegistry)   // unknown keys rejected, types + min/max enforced
```

Rejecting unknown keys matters — `custom_fields` is user-writable JSONB and without it the
column is an unbounded free-for-all that will end up holding junk from a stale client.

### The catalogue

Three to five fields per profile. Resist growth; anything reaching for a sixth is usually
better served by `description`.

| Profile | Detail fields (`type`) |
|---|---|
| trading-cards | Card Number (text) · Print Run (number) · Language (select) · Sealed (bool) |
| coins-banknotes | Denomination (text) · Mint Mark (text) · Metal & Fineness (text) · Serial Number (text) |
| stamps | Catalogue No. — SG/Scott (text) · Perforation (text) · Watermark (text) · Gum (select) · Mint or Used (select) |
| watches-clocks | Reference Number (text) · Serial Number (text) · Movement / Calibre (text) · Box & Papers (select) |
| vinyl-music | Catalogue Number (text) · Matrix / Runout (text) · Speed (select 33⅓/45/78) · Format (select LP/12″/7″/EP/Box) |
| wine-spirits | ABV (number %) · Bottle Size (number ml) · Cask No. (text) · Bottles Held (number) |
| art | Edition Number (text) · Signed & Where (text) · Framed (bool) |
| comics | Issue Number (text) · Variant Cover (text) · Page Quality (select White→Brittle) · Key Issue Notes (text, full) |
| books | ISBN (text) · Edition Statement (text) · Binding (select) · Dust Jacket (select) · Signed (bool) |
| toys-models | Item / Set Number (text) · Scale (text) · Piece Count (number) · Sealed (bool) |
| video-games | Platform (select) · Region (select NTSC-U/NTSC-J/PAL) · Completeness (select Sealed/CIB/Loose) |
| militaria | Pattern / Mark (text) · Proof Marks (text) · Deactivation Cert Ref (text) · Serial Number (text) |
| sports-memorabilia | Player / Team (text) · Event Date (date) · Game Used (bool) · Signed (bool) |
| fashion-sneakers | Size (text) · Style Code / SKU (text) · Colourway (text) · Condition Grade — DS/VNDS/Used (select) |
| jewellery | Carat Weight (number ct) · Metal & Fineness (text) · Principal Stone (text) · Ring / Chain Size (text) |
| ceramics-glass | Pattern Name (text) · Factory Mark (text) · Pieces in Set (number) |
| natural-history | Species / Taxon (text) · Locality (text) · Formation / Period (text) · Permit Reference (text) |
| automobilia | Chassis / VIN (text) · Part Number (text) · Fits Model (text) |
| photography-cameras | Serial Number (text) · Lens Mount (text) · Shutter Count (number) · Working (select) |
| antiques | *(none — relabelling is sufficient)* |
| general | *(none)* |

**`natural-history.permit_reference` is worth calling out.** CITES permits and collecting
licences are a real legal obligation for fossil, mineral, and taxidermy collectors, and
today the only home for that is free-text `description`. Note that `objects.ethics_cites`
already exists but is a full-mode-only boolean, so simple-mode collectors cannot reach it —
this field is the accessible counterpart, not a duplicate.

---

## 6. Resolution rules

Three distinct resolutions. Getting these right is the crux of the multi-profile decision.

### 6.1 Which profile dresses an object's form

```
resolveObjectProfile(object, museum, plan):
  if !profilesEnabled(plan)            → MUSEUM_FIXED   (today's behaviour, no profile)
  if object.collection_profile is set  → registry[object.collection_profile] ?? GENERAL
  if museum.collection_profiles[0]     → registry[that] ?? GENERAL
  else                                 → GENERAL
```

Unknown slug always degrades to `general`, never throws. A profile removed in a future
release must not brick a saved object.

### 6.2 Which nouns dress the nav and app chrome

Multi-profile creates a real conflict: a collection holding cards *and* watches cannot
honestly call the sidebar "Cards".

```
resolveAppNouns(museum, plan):
  if !profilesEnabled(plan)                  → museum nouns  ('Object', 'Objects')
  if museum.collection_profiles.length === 1 → that profile's nouns
  else                                       → NEUTRAL_NOUNS ('Item', 'Items', 'Collection', 'Add Item')
```

**This is a judgement call, flag it as such.** The alternative — always use the primary
profile's nouns — reads as a bug the moment a user adds a second profile ("Add Card" while
adding a watch). Neutral fallback is the safe default. It lives in one constant
(`NEUTRAL_NOUNS`) so flipping to primary-wins is a one-line change if it feels too timid
in use.

Note that even NEUTRAL_NOUNS is an improvement for collectors: "Item / Items / Add Item"
beats "Object / Objects / Object Entry" for a hobbyist.

### 6.3 Which vocab a list/analytics/filter surface uses

These are collection-wide, not per-object, so per-object profiles can't drive them.

```
resolveCollectionProfile(museum, plan):
  if !profilesEnabled(plan)                  → MUSEUM_FIXED
  if museum.collection_profiles.length === 1 → that profile
  else                                       → GENERAL   (neutral labels, union of vocabs)
```

For a multi-profile collection, autocomplete `staticList` becomes the **deduplicated union**
of every active profile's list for that field. `AutocompleteInput` already merges the static
list with values learned from the collection, so a union is consistent with how it behaves
today and needs no component change — just a different `staticList` value.

---

## 7. Surface-by-surface changes

### 7.1 New files

| File | Contents |
|---|---|
| `lib/collectionProfiles/types.ts` | §5.1 |
| `lib/collectionProfiles/index.ts` | Registry map, `profilesEnabled`, the three resolvers from §6, `NEUTRAL_NOUNS`, `MUSEUM_FIXED` |
| `lib/collectionProfiles/vocab.ts` | `CANONICAL_CONDITION_GRADES`, `CANONICAL_STATUSES`, shared fragments |
| `lib/collectionProfiles/scales.ts` | Shared `GradingScale` definitions (`psa10`, `bgs10`, `sheldon70`, `cgc10`, `raw`) reused across profiles |
| `lib/collectionProfiles/profiles/*.ts` | 21 profile definitions |
| `lib/collectionProfiles/certification.ts` | `parseGradeNumeric`, `conditionFromGrade`, `buildVerifyUrl`, authority/scale lookup |
| `lib/collectionProfiles/customFields.ts` | Registry→Zod builder, value coercion, `readCustomField` helper |
| `components/CollectionProfilePicker.tsx` | Multi-select card grid. Used by onboarding + settings. |
| `components/ObjectProfileSelect.tsx` | Small per-object select, rendered only when >1 active profile |
| `components/CertificationCard.tsx` | §5.5 card — authority, grade, cert no., date, subgrades, dupe warning |
| `components/CustomFieldsCard.tsx` | §5.6 details grid, renders from `CustomFieldDef[]` |
| `app/api/objects/cert-lookup/route.ts` | Duplicate-cert check (§7.11) |
| `supabase/collection-profiles.sql` | §4 migration |
| `__tests__/collectionProfiles.test.ts` | §10 |
| `__tests__/certification.test.ts` | Grade parsing, condition derivation, scale integrity |

### 7.2 `components/tabs/OverviewTab.tsx` — the main edit

Currently ~25 hardcoded `<label>`/`placeholder` literals in the simple-mode path. Replace
with a resolved profile lookup.

```tsx
const profile = resolveObjectProfile(object, museum, museum.plan)
const f = (key: ProfileFieldKey, fallback: string) => profile.fields[key]?.label ?? fallback
const ph = (key: ProfileFieldKey, fallback?: string) => profile.fields[key]?.placeholder ?? fallback
const shown = (key: ProfileFieldKey) => !profile.fields[key]?.hidden
```

Then, field by field:

```tsx
{shown('artist') && (
  <div>
    <label className={labelCls} data-learn="objects.artist">
      {f('artist', 'Artist / Maker')} {publicLabel}
    </label>
    <input value={form.artist} onChange={e => set('artist', e.target.value)}
           placeholder={ph('artist')} className={inputCls} />
  </div>
)}
```

The existing `fullMode ? 'Medium' : 'Medium / Material'` ternaries collapse into the same
call — full mode resolves to `MUSEUM_FIXED`, whose `fields` map carries today's full-mode
labels. **Delete the ternaries; do not layer profiles on top of them.**

`fieldOrder` is applied by rendering the Object Information card's children from an array
rather than as static JSX. Extract each field into a small `renderField(key)` switch inside
the component; iterate `profile.fieldOrder ?? DEFAULT_ORDER`.

Vocab lists: pass `profile.vocab.objectTypes ?? OBJECT_TYPES` (etc.) into `AutocompleteInput`'s
`staticList`. Emoji picker: `profile.vocab.emojis ?? EMOJIS`.

Status buttons: keep `SIMPLE_MODE_STATUSES` as the value set; change only the label lookup
to `profile.vocab.statusLabels?.[s] ?? SIMPLE_MODE_STATUS_LABELS[s] ?? s`.

Condition: same pattern against `CONDITION_GRADES`, and `CONDITION_STYLES` continues to key
off the **canonical** grade so colours stay correct.

At the top of the card, render `<ObjectProfileSelect>` when `museum.collection_profiles.length > 1`.

**Two new cards** slot into the tab, both conditional on the resolved profile:

```tsx
{profile.certification && (
  <CertificationCard config={profile.certification} form={form} set={set}
                      canEdit={canEdit} museumId={museum.id} objectId={object.id} />
)}
{profile.customFields?.length > 0 && (
  <CustomFieldsCard defs={profile.customFields} values={form.custom_fields ?? {}}
                    onChange={next => set('custom_fields', next)} canEdit={canEdit} />
)}
```

Order in the tab: Images → Icon → Object Information → **Certification** → **Details** →
Condition → Location → Value → Documents. Certification sits above Condition deliberately,
because when `derivesCondition` is true it *drives* the field below it.

The condition control gains a derived state:

```tsx
const derived = profile.certification?.derivesCondition && form.cert_grade
  ? conditionFromGrade(profile.certification, form.cert_authority, form.cert_grade)
  : null
// when derived: render read-only + "Set from PSA 10" + a "Set manually" button
```

### 7.2a `components/tabs/ValuationTab.tsx` and `ConditionTab.tsx`

Both are full-mode-only surfaces, so **no change** — profiles never reach them. Confirm
this rather than assume it; `ConditionTab` writes `condition_grade`, and if it is ever
exposed in simple mode it must respect the derived-condition lock.

### 7.3 `components/Sidebar.tsx`

- `navItem('/dashboard', '⬡', 'Collection Overview')` → `` `${nouns.collection} Overview` ``
- `navItem('/dashboard/entry', '🗂', 'Add Object')` → `nouns.addItem`
- Simple-mode section header "Record" → unchanged
- Settings panel: **lift the category select out from under the Discover toggle** into its
  own always-visible "What you collect" section (Community/Hobbyist only), rendering
  `<CollectionProfilePicker>`. Discover's own category select stays where it is and keeps
  working; when profiles are set and no category is chosen, prefill from the primary.

Add `collection_profiles` to the `NavCache` type and the museum select so nav nouns don't
flash on load — `NavCache` already caches `plan`, `name`, `logo_emoji` for exactly this reason.

### 7.4 `components/CommandPalette.tsx`

`{ path: '/dashboard', icon: '⬡', label: 'Objects' }` and `'Add Object'` become functions of
`nouns`. The nav array is currently a module-level constant; make it a function
`navItems(nouns)` called inside the component.

### 7.5 `app/dashboard/page.tsx` (objects list)

- Table headers at lines 619–623: `Object` → `nouns.item`; `Year` / `Medium` columns replaced
  by `profile.listColumns` when defined (max 3, keep `Status` and `Public` fixed).
- Empty state (`Your collection is empty` / `Add your first object to begin.`) uses `nouns`.
- The Discover category select stays; add a note linking to the new profile picker.

### 7.6 `components/SearchFilterBar.tsx`

- `Medium` (line 171), `Object Type` (180), `Artist / Maker` (190) labels → profile labels.
- Sort options `Date Made` → profile's `production_date` label.
- The filter's dropdown options come from the same resolved vocab as the form.
- **New, when the resolved profile has `certification`:** a Grading Company select and a
  Grade select (populated from that authority's scale), plus a "Graded only" toggle.
  Sort gains **Grade (high → low)**, backed by `cert_grade_numeric` — which is precisely
  why that derived column exists.
- **Custom fields are deliberately not filterable in v1.** They're searchable as text via
  the existing object search, but each one added as a facet is another control in an
  already-busy bar. Revisit once real collections exist to show which ones matter.

### 7.7 `app/dashboard/analytics/page.tsx`

- `<BreakdownCard title="By Artist / Maker" …>` (line 408) → iterate `profile.breakdowns`,
  defaulting to `[{ field: 'artist', title: 'By Artist / Maker' }]`. `BreakdownKey` resolves
  three ways: a plain column, a `cert_*` column, or `custom:<key>` read out of the JSONB.
- **New for graded collections:** "By Grade" and "By Grading Company" breakdowns, and a
  *Graded vs Raw* split on the summary row. This is the analytics view a card or coin
  collector actually wants, and it is only possible because grade is a real column.
- The analytics query at line 205 selects an explicit column list — add
  `cert_authority, cert_grade, cert_grade_numeric, custom_fields` to it.
- `Top Objects by Value` → `` `Top ${nouns.itemPlural} by Value` ``
- Medium filter placeholder `"e.g. Oil, Watercolour"` → profile placeholder.
- `Collection Status` bar labels already use `SIMPLE_MODE_STATUS_LABELS`; route through the
  profile status label lookup instead.

### 7.8 `lib/learn-descriptions.ts`

Do **not** fork the file. Keep it as the base, and resolve help text as:

```
profile.fields[key]?.help ?? learnDescriptions[`objects.${key}`].description
```

Only write `help` where the museum wording is actively wrong for the domain (roughly 6–10
fields per profile). The `technical` block is never overridden.

### 7.9 `app/onboarding/page.tsx`

Insert **new Step 2 — "What do you collect?"**, making it four steps
(`TOTAL_STEPS`, the `1 | 2 | 3` state type, and the step-dot loop all need updating).

Shown to everyone, because plan selection is Step 4 and the tier isn't known yet. This is
fine and is in fact a benefit: the answer also seeds `collection_category` for Discover on
every tier, and if a Professional user later downgrades their profile is already set.

Copy: *"What do you collect? Pick one or more — Vitrine will use the right words for your
collection. You can change this any time."* Plus a prominent "A museum or general
collection" option that maps to `general` and changes nothing.

### 7.10 CSV import/export

`app/api/import/objects/route.ts` maps CSV headers to columns. Profile labels change what
users expect the headers to be. Minimum viable handling:

- The **downloadable CSV template** uses the resolved profile's labels as headers.
- The importer accepts **both** the canonical column name and every profile's label as
  aliases for that column (build a reverse alias map from the registry at module load).
- Export uses profile labels as headers.

Skipping this leaves a card collector downloading a template that says "Artist / Maker"
immediately after the app spent all day calling it "Set / Manufacturer".

Certification and detail fields extend the same mechanism:

- The template gains the profile's cert columns (`Grading Company`, `Grade`, `Cert Number`,
  `Graded Date`) and one column per `CustomFieldDef`, headed by its label.
- `csvImportRowSchema` and `objectCreateSchema` in `lib/validations.ts` gain the cert
  columns and `custom_fields`; the importer assembles the JSONB from the mapped columns.
- The importer derives `cert_grade_numeric` and `condition_grade` on the way in, using the
  same helpers as the form — never a second implementation. A CSV of 400 slabbed cards is
  the single most likely first action of a real card collector, and it must produce the
  same rows the form would.
- Unknown detail columns are **skipped with a warning row**, not rejected wholesale. A
  partially-matching CSV should still import.

### 7.11 Duplicate detection — a free win

`components/DuplicateSearchModal.tsx` currently matches on title text via
`/api/objects/search`. A cert number is a globally unique identifier, which makes it a far
stronger signal than a fuzzy title match.

Add `app/api/objects/cert-lookup/route.ts`: given `museum_id`, `cert_authority`,
`cert_number`, return any existing object with that pair (the partial index from §4 makes
this a single index hit). Call it on blur of the cert-number input and render an inline
warning with a link to the existing record.

This is worth doing in the same phase as the Certification card — it is perhaps 30 lines,
and it catches the most common real-world data error in graded collecting: logging the same
slab twice from two different photos.

---

## 8. UX detail

### 8.1 The picker

Card grid, each card = emoji + label + blurb, multi-select with a checkmark. First one
selected becomes primary and is badged "Primary"; drag or a "Make primary" action reorders.
Search box above the grid once the list exceeds ~20.

Selecting nothing is valid → `general`.

### 8.2 Changing profiles later

- Adding a profile: instant, no confirmation.
- Removing a profile that objects still reference: warn with a count —
  *"12 items use the Watches & Clocks profile. They'll fall back to your primary profile's
  labels. No data will be deleted."* — then null out `objects.collection_profile` for those
  rows (a single scoped `update`, not a delete).
- Because nothing is destructive, no "are you sure" beyond that count.

### 8.3 Discover interaction

When the primary profile changes and `museums.collection_category` is empty, set it to the
primary profile's `category`. If it's already set, leave it and show a one-line hint in the
Discover section: *"Your Discover category is X. Your collection profile is Y."* Never
silently overwrite a user's explicit Discover choice.

---

## 9. Invariants — the things that will break if violated

**A. Stored status values never change.** `status` drives real behaviour (`On Loan` filters,
`Deaccessioned` protection triggers, the `on-loan` register, deaccession-protection SQL).
Profiles may only supply *labels*. Any profile whose `statusLabels` keys aren't a subset of
`CANONICAL_STATUSES` must fail a test.

**B. Stored condition grades never change.** `CONDITION_STYLES` and the analytics colour maps
key off `Excellent | Good | Fair | Poor | Critical`. Profiles relabel; the five canonical
values persist.

The certification revision *strengthens* rather than weakens this. Collectors who want the
native 1–10 scale now get it properly, in `cert_grade` — a real field with its own sort and
its own analytics — while `condition_grade` stays canonical and is derived from it
(§5.5). The earlier compromise of cramming PSA 1–10 into five relabelled tiers is gone;
the five tiers are now just the colour-coded summary underneath the real grade.

**C. Profile ids are permanent.** They're persisted in `museums.collection_profiles` and
`objects.collection_profile`. Renaming a slug orphans rows. Change `label` freely; never `id`.

**D. Unknown slugs degrade, never throw.** Every registry lookup goes through
`registry[id] ?? GENERAL`.

**E. Full mode is untouched.** Every profile read is behind `profilesEnabled(plan)`. A
Professional or Institution user must see zero diff. Snapshot-test this.

**F. The public site is out of scope — but reconsider one line.** `app/museum/[slug]/**`
hardcodes `obj.artist` as the subtitle in all five templates and on the object detail page.
Leaving it means a card collector's public site shows the set name with no label, which is
fine — it renders as a bare subtitle with no field name attached.

Certification makes this exclusion cost slightly more: **a graded item's grade is the single
most public-facing fact about it**, and "PSA 10" next to the title is the difference between
a collection page and a showcase. That is a genuine argument for one narrow exception — a
grade badge on the object detail page and the featured-object hero — while still leaving
the template subtitle logic alone. It is a decision, not an oversight; flagging it rather
than quietly doing it. If taken, it's a Phase 9 and roughly a half-day.

**G. Deactivating a profile never deletes data.** Removing a profile from
`museums.collection_profiles` nulls `objects.collection_profile` for affected rows (§8.2)
and stops rendering that profile's detail fields — but the values stay in `custom_fields`
and every cert column is untouched. Re-adding the profile makes them visible again,
unchanged. This is what namespaced keys buy: an inert value can never be misread as
belonging to a different profile. **Never write a migration that prunes `custom_fields`.**

**G2. Derived certification columns resolve the authority registry-wide, never
through the active profile.** *(Added during the build — this was a real bug,
caught in browser verification.)*

`cert_grade_numeric` and `cert_grade_scale` describe the **certificate**, not the
UI. The first implementation derived them from the resolved profile's
`certification` config, which looked right and passed every unit test. But once a
profile was deactivated, the resolved profile became `general`, which has no
certification config — so the next save of any graded item silently wrote
`cert_grade_numeric = null`. Grade sorting broke while the grade itself still
displayed correctly, which is close to undetectable by eye.

Write paths must call `deriveCertificationForWrite(authority, grade)`, which scans
every profile for the authority. Only *rendering* uses the active profile's config.

**H. `custom_fields` is validated against the registry on every write.** It is user-writable
JSONB reached by an authenticated client. Unknown keys are rejected, types coerced, `min`/
`max` enforced — server-side in `lib/validations.ts`, not just in the form component. The
one deliberate exception is invariant G: keys belonging to a *known but currently inactive*
profile are preserved on update rather than rejected, otherwise saving an object would
silently strip them.

---

## 10. Tests

`__tests__/collectionProfiles.test.ts`:

1. Every profile id is unique and matches `/^[a-z0-9-]+$/`.
2. Every profile's `category` exists in `COLLECTION_CATEGORIES`.
3. Every `statusLabels` key ∈ `CANONICAL_STATUSES` (invariant A).
4. Every `conditionLabels` key ∈ `CANONICAL_CONDITION_GRADES` (invariant B).
5. Every `fields` key and `fieldOrder` entry ∈ `ProfileFieldKey` (type-level, plus a runtime
   check for the JSON contract in §12).
6. `resolveObjectProfile` returns `MUSEUM_FIXED` for every `fullMode` plan (invariant E).
7. `resolveObjectProfile` returns `GENERAL` for an unknown slug (invariant D).
8. `resolveAppNouns` returns `NEUTRAL_NOUNS` for 0 and 2+ active profiles, and the profile's
   nouns for exactly 1.
9. `general.fields` is empty, and `general` has no `certification` and no `customFields` —
   i.e. the fallback genuinely changes nothing.
10. The CSV alias map has no collisions (two profiles mapping the same label to different columns).

`__tests__/certification.test.ts`:

11. Every `GradingAuthority.scale` resolves to a scale defined in that profile or in `scales.ts`.
12. For every scale: `numeric` and `toCondition` have a key for **every** grade in `grades`
    — a missing entry means a silently unsortable or condition-less grade.
13. Every `toCondition` value ∈ `CANONICAL_CONDITION_GRADES` (invariant B).
14. `numeric` is strictly monotonic in `grades` order — catches a mis-ordered scale, which
    would otherwise sort a collection wrongly and be very hard to spot by eye.
15. `buildVerifyUrl` returns `null` for every authority without a `verifyUrl`, and never
    emits a URL containing an unsubstituted `{cert}`.
16. `conditionFromGrade` returns `null` (not a throw) for an unknown authority/grade pair.

Custom fields:

17. Every `CustomFieldDef.key` is globally unique and starts with `${profile.id}.`.
18. Every `type: 'select'` def has a non-empty `options`.
19. The generated Zod schema rejects an unknown key, a wrong type, and an out-of-range number.
20. The generated Zod schema **preserves** keys belonging to a known-but-inactive profile
    (invariant G) — the regression test for the one behaviour most likely to be broken by a
    later "tidy up validation" change.

Existing suites to re-run: `plans`, `validations`, `import-objects`, `storage`.

---

## 11. Build order

Each phase is independently shippable and leaves the app working.

| Phase | Work | Risk |
|---|---|---|
| **1** | Full §4 migration (profiles + cert columns + `custom_fields`); `types.ts`, `index.ts`, `vocab.ts`, `scales.ts`, `certification.ts`, `customFields.ts`; `general` + `MUSEUM_FIXED` only; test suite §10; verify `insert_object_if_quota_ok` round-trips the new columns | None — nothing renders differently |
| **2** | Author the 20 real profiles as pure data, including `certification` and `customFields` blocks. **No `verifyUrl` values yet.** | None — still unwired |
| **3** | `OverviewTab` rewiring (labels, placeholders, hidden, vocab, `fieldOrder`, `ObjectProfileSelect`). Delete the `fullMode ? …` ternaries. | Medium — biggest single file change |
| **3a** | `CertificationCard` + derived condition lock + `cert-lookup` duplicate warning + `cert_grade_numeric` derivation on write | Medium — new write path |
| **3b** | `CustomFieldsCard` + registry→Zod validation in `lib/validations.ts` (invariants G and H) | Medium — user-writable JSONB |
| **4** | `CollectionProfilePicker`; settings panel section; onboarding Step 2 | Low |
| **5** | Nav nouns: `Sidebar`, `CommandPalette`, dashboard empty states | Low |
| **6** | List columns, `SearchFilterBar` (incl. grade filter + sort), analytics breakdowns | Low |
| **7** | CSV template / import aliases / cert + custom columns / export headers | Medium — must reuse the Phase 3a derivation helpers, not reimplement |
| **8** | Verify each grader's cert-lookup URL against its live site, add `verifyUrl` one authority at a time | Low — but do not batch or guess |
| **9** | *Optional, decide first:* grade badge on the public object page (invariant F) | Low |
| **10** | What's New entry in `lib/whatsNew.ts` (id `collection-profiles`) | None |

Phases 1–2 are ~70% of the typing and ~0% of the risk. Phases 3, 3a, and 3b are where care
is needed — 3a because it introduces a derived write (`condition_grade` from `cert_grade`),
3b because it opens a user-writable JSONB column.

Phase 8 is deliberately last and deliberately incremental: verify links are the one part of
this that can be *wrong* rather than merely absent, and the feature degrades to plain text
cleanly if a template is never confirmed.

**Still out of scope, noted for later:** per-profile *public site* templates, custom-field
filtering in `SearchFilterBar`, and user-defined custom fields (as opposed to
registry-defined). The last one is a meaningfully different product — it needs a field
designer UI, per-museum schema storage, and a migration story — and should not be
back-doored into this system by loosening invariant H.

---

## 12. Contract for VitrineCapture

Capture must not duplicate the registry — it will drift within a release. Publish it:

**`GET /api/collection-profiles`** — public, cacheable, no auth.

```json
{
  "version": "2026-08-12",
  "canonical": {
    "statuses": ["Entry","On Display","Storage","On Loan","Restoration","Conservation","Deaccessioned"],
    "conditionGrades": ["Excellent","Good","Fair","Poor","Critical"],
    "fieldKeys": ["title","artist","production_date","..."],
    "certColumns": ["cert_authority","cert_number","cert_grade","cert_grade_numeric",
                    "cert_grade_scale","cert_date","cert_subgrades","cert_notes"]
  },
  "neutralNouns": { "item": "Item", "itemPlural": "Items", "collection": "Collection", "addItem": "Add Item" },
  "profiles": [ { /* CollectionProfile — including certification + customFields — verbatim */ } ]
}
```

The `certification` and `customFields` blocks serialise as-is; that is the whole point of
having defined them as plain data rather than as code. Capture gets grading authorities,
scales, condition mappings, and detail-field definitions for free, and stays in step
automatically when a profile is edited.

**`GET /api/museum/profile`** (authenticated) — returns the signed-in collection's
`collection_profiles` array and `plan`, so Capture can run the same three resolvers.

Rules for Capture:
- Cache the registry by `version`; refetch on mismatch.
- Implement the §6 resolvers identically. They are pure functions of the JSON — port them,
  don't reinvent them.
- Send `collection_profile` on object create so the web app dresses the record correctly.
- Respect invariants A and B: send canonical status/condition values, display labels only.
- **Do not derive `condition_grade` on device.** Send `cert_authority` + `cert_grade` and let
  the server derive it, so there is exactly one implementation of the mapping. Same for
  `cert_grade_numeric`.
- **Send `custom_fields` with namespaced keys** exactly as they appear in the registry.
  Unknown keys are rejected server-side (invariant H), so a stale cached registry surfaces
  as a clear validation error rather than silent data loss.
- Never prune `custom_fields` keys the device doesn't recognise — send back what was
  fetched, unchanged (invariant G).

Ship the endpoint in Phase 1 so Capture can build against it while phases 3–8 land.

### Capture's real opportunity here

Certification is the feature that most justifies a camera-first companion app. A graded slab
has the authority, grade, and cert number **printed on the label**, and most graders print a
barcode or QR alongside it. Vitrine already ships `@zxing/browser`, `qr-scanner`, and
`jsqr`, and `objects.barcode` and `BarcodeScannerModal` already exist.

So the natural Capture flow is: photograph the slab → read the label → prefill authority,
grade, and cert number → post to `cert-lookup` (§7.11) → either warn "already in your
collection" or create the record. That turns cataloguing a 400-card graded collection from
a day of typing into an afternoon of pointing a phone at slabs.

Worth designing the Capture side around, but note it depends on nothing in this plan beyond
the columns landing in Phase 1 — the OCR/barcode work is entirely Capture's, and it can
proceed in parallel.

---

## 13. Category list expansion

Two distinct lists, and conflating them is the trap:

- **`COLLECTION_CATEGORIES`** — the Discover taxonomy. Long, granular, cheap to extend
  (plain text column, no constraint). Users pick from it to be found.
- **Collection profiles** — hand-authored UI treatments. ~21 in v1. Expensive to add.

Many categories map to one profile (Whisky → `wine-spirits`; Fossils, Minerals, Taxidermy →
`natural-history`). Every category maps to *some* profile, defaulting to `general`. Add a
`categoryToProfile: Record<CollectionCategory, string>` map in the registry.

Proposed additions to `lib/categories.ts` (existing 34 → 61), keeping alphabetical order:

```
Advertising & Signage
Autographs & Memorabilia
Aviation & Maritime
Banknotes & Paper Money
Board Games & Puzzles
Bottles & Breweriana
Cameras & Optical Equipment
Dolls & Bears
Fossils & Minerals
Handbags & Accessories
Kitchenalia & Domestic
Lighting & Lamps
LEGO & Building Sets
Medical & Pharmacy
Model Railways
Motorcycles
Pens & Writing Instruments
Perfume & Vanity
Pins, Badges & Buttons
Postcards
Religious & Devotional
Rugs & Carpets
Sneakers & Streetwear
Space & Astronomy
Sports Memorabilia
Taxidermy
Tools & Workshop
```

Note `Sports Memorabilia` is deliberately split from the existing `Sports & Games`, and
`Banknotes & Paper Money` from `Coins & Medals` — both are large enough communities to
warrant their own Discover facet even though they share a profile.

Safe to add: the column is unconstrained text and both consumers (`DiscoverFilters`,
`DiscoverMobileFilters`) render the array directly. Existing rows are unaffected.
