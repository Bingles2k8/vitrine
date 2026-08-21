# Collection Groups — implementation plan

**Status:** built 2026-08-21. **Migration not yet run** — see §0.
**Date:** 2026-08-21
**Scope:** Vitrine web app. No VitrineCapture contract changes.

---

## 0. What shipped, and how it differs from the plan below

Everything in §7 is built, plus one thing the plan did not have. The plan text
is left as written; this section records the deltas.

**Before any of it works:** run `supabase/collection-groups.sql` in the Supabase
SQL editor. The tables do not exist yet. The code degrades safely without them —
verified against the live database with the tables absent: museum pages render
200, the nav item is absent, `/sets` 404s — so deploying ahead of the migration
breaks nothing.

### Added — set navigation styles

A ninth axis, `collection_groups.nav_style`, chosen per set: how visitors move
through the **items inside** a set. Eight styles in
`components/collection/SetItems.tsx`, all theme-driven, none with dependencies:

| | |
|---|---|
| `grid` | The museum's own grid variant. Default. |
| `coverflow` | Items angle away on both sides and swing forward. Drag, wheel, arrow keys, click a neighbour. Mirrored deck via `WebkitBoxReflect` where supported. |
| `carousel` | One at a time, arrows either side, dot strip. |
| `filmstrip` | Large stage above, scrolling thumbnails below that follow the keyboard. |
| `shelf` | Items stood in rows on drawn shelves with contact shadows. |
| `contact-sheet` | Dense numbered frames on a dark ground, darkroom proof. |
| `timeline` | Along a rail, earliest first, snap-scrolled, year under each tick. |
| `reel` | One item per screen, vertical snap. Strongest on a phone. |

`effectiveNavStyle()` falls back to `grid` when a style has too little to work
with (a cover flow of two, a timeline where nothing is dated) rather than
blocking the choice in the editor — an owner may be mid-build with two items and
twelve to come. The editor says so instead.

Homepage sections always render as `grid` regardless: six cover flows stacked on
one front page would be unusable, and the styles belong to the set's own page.

### Changed — no cover upload

§3.1(b) worried about unlimited sets × uncounted cover images. Rather than
count them against the quota, **uploaded covers are not built at all.** The
cover ladder (§8.2) resolves to a member mosaic, and the editor offers a picker
that nominates an existing member as the cover. Zero new storage, no upload
step, and the concern in §3.1(b) never arises. `cover_image_url` exists on the
table for a later change of mind.

### Changed — the object page does not fetch the collection

The plan implied `loadPublicSets` everywhere. On an item page that would mean a
whole-collection fetch just to name the sets an item is in. Split in two:

- `loadObjectSets()` — two small queries; a rule is evaluated against the single
  object, so no collection-wide read.
- `loadSetWalk()` — only when `?set=` is present, and returns null when the
  object is not really in that set, which is what enforces invariant W.

Both use `SET_OBJECT_COLUMNS`, not `select('*')`.

### Changed — searching inside a stepped style drops to the grid

Filtering a cover flow leaves the visitor mid-deck with no view of what
survived. An active filter in `SetBrowser` renders the grid and returns to the
chosen style when cleared.

### Caught during the build

`trackViewSchema` in `lib/validations.ts` has its own `page_type` enum mirroring
the `page_views` CHECK constraint. Widening one without the other silently drops
every view of the new pages. Both widened.

### Deliberately not done

- CSV import/export of membership (§7.10 — both sides or neither).
- Uploaded covers, per above.
- Custom-field rule conditions.
- Merging the `is_featured` strip into sets.
- Regenerating `lib/database.types.ts` — the Supabase clients are untyped, so
  nothing needs it to compile, but it is worth doing on the next pass.

---

## 1. What this is

A collector picks items out of their collection and gathers them under a name — *1962
Topps Set*, *Roman Silver*, *The Burnley Bequest*, *Everything from the 2019 auction* —
and that grouping shows up on their public site.

A group is an **editorial object**, not a taxonomy value. It has a title, an intro, a
cover image, an order, a draft/published state and a page of its own. That is the thing
the public site cannot do today: `medium` chips already slice the collection
taxonomically, and `is_featured` already picks six items for the homepage, but nothing
lets a collector say *here are these fourteen things, and here is why they belong
together*.

Membership comes two ways, and both live in one model:

- **Manual** — you pick the items.
- **Rule-based** — you save a filter ("medium is Silver, and year is before 1900") and
  the group stays live as the collection grows, with manual include/exclude overrides on
  top.

And it is built to be **browsed**. A visitor can walk in at the top — nav → index → a set
→ its items → the next item in the set — or from the bottom, arriving at one object from
search and finding the two sets it belongs to. Every published set has at least three
routes in (§7.9), and every surface wears the museum's own template (§8), because a set
index that looks like a different product is worse than no set index.

---

## 2. What already exists (do not rebuild)

| Thing | Where | Current use |
|---|---|---|
| `objects.is_featured` / `featured_order` | schema | Flat homepage strip, max 6, paid-tier only |
| Medium filter chips | `components/CollectionSearch.tsx:76` | Built from distinct `medium` values at render |
| Grid variants (8) | `components/collection/grids.tsx` | Per-template collection layout |
| `toGridObject()` | `components/collection/types.ts` | **Strips non-public columns before the client boundary** |
| Public vocabulary layer | `lib/publicProfile.ts` | `collectionLabels()` / `objectLabels()` |
| Profile registry (21) | `lib/collectionProfiles/profiles/` | Per-hobby field labels and vocab |
| Bulk select + bulk bar | `app/dashboard/page.tsx:620` | Status / visibility / bin — gated `canEdit && fullMode` |
| Dashboard filter vocabulary | `components/SearchFilterBar.tsx:9` — `FilterState` | 11 filter fields, already the right shape for rules |
| New-public-sub-route precedent | `app/museum/[slug]/wanted/page.tsx` | Toggle column on `museums`, own metadata, `getMuseumStyles` |
| Junction-table precedent | `insurance_policy_objects`, `emergency_event_objects` | Many-to-many object membership |
| Saved scope precedent | `object_share_links.scope_filter` (JSONB) | Private passcode shares |
| Asset upload | `uploadToR2('museum-assets', …)` — `app/dashboard/site/page.tsx:231` | Hero + logo |

---

## 3. Decisions recorded

Agreed 2026-08-21:

| # | Decision |
|---|---|
| D1 | Curated sets with their own public pages — **not** lightweight tags |
| D2 | Available on **every tier, unlimited**. No new plan flag, no count limit |
| D3 | Surfaces: homepage sections + collection filter chips, **chosen per group** by the owner |
| D4 | ~~**No** dedicated nav item and **no** groups index page~~ — **revised, see below** |
| D5 | Membership is manual **or** rule-based (saved filter), with manual overrides |
| D6 | Sets must be **browsable**: an index, browsing within a set, and set-aware item pages |

### Revision: D4 is reversed — sets get an index and a nav item

D4 was tested by tracing every path a visitor would actually have, and it did not
survive. Under D4 a group's reachability looked like this:

| Settings | Position | Reachable? |
|---|---|---|
| Section | top 6 | Yes — section header link |
| Section + chip | 7th+ | Chip only; the page unreachable |
| Section only | 7th+ | **Nothing. Invisible.** |
| Chip only | any | Chip filters the grid; title, cover and notes never seen |
| Neither | any | Direct URL only |

Two failures. The third row was a hole created by the six-section render cap — a group
the owner explicitly set to "show as section" rendering nowhere. And for a chip-only
group, everything that makes it a set rather than a saved filter (intro, cover, per-item
notes) was authored and then shown to nobody.

So **D6 supersedes D4**: `/museum/[slug]/sets` exists, it is in the nav, and the whole
feature is built to be browsed rather than stumbled upon. §8 is the presentation spec;
§7.5–7.8 are the surfaces.

Carried as defaults unless overruled:

- Flat groups. No nesting. An object may be in any number of groups.
- `show_on_site = false` always wins. A hidden object is invisible inside a public group.
- Draft/published state per group.
- Per-profile vocabulary, following `lib/publicProfile.ts`, rather than hardcoding "Group".

### 3.1 Open decisions — consequences of D2

**(a) Unlimited groups × homepage sections will still break a homepage.** "Unlimited
groups" is fine; twenty full-width salon grids stacked on one page is not. The homepage
renders at most **6 sections** (by `display_order`), each showing **one row** of the
museum's grid variant with a "View all N →" link. With the index page now in scope,
nothing goes invisible past the sixth — everything is on `/sets`.

**(b) Unlimited groups × uncounted cover images is an unbounded free storage hole.**
Logos and heroes in `museum-assets` are deliberately not counted against
`storage_used_bytes`; there are at most two of them per museum. With unlimited groups
that reasoning stops holding. **Recommendation:** a set's cover **derives from its members
by default** (§8.2 — zero new storage, zero upload step), and an *uploaded* cover counts
toward the quota via the normal `checkStorageQuota` path. Community has no document
storage at all, so on that tier the cover is derived-only.

---

## 4. Data model

### 4.1 `collection_groups`

```sql
CREATE TABLE IF NOT EXISTS collection_groups (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id         uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  slug              text        NOT NULL,
  title             text        NOT NULL,
  subtitle          text,
  description       text,
  cover_image_url   text,                 -- uploaded cover; null = derive from members
  cover_object_id   uuid        REFERENCES objects(id) ON DELETE SET NULL,
  status            text        NOT NULL DEFAULT 'draft'
                                CHECK (status IN ('draft', 'published')),
  membership        text        NOT NULL DEFAULT 'manual'
                                CHECK (membership IN ('manual', 'rule')),
  rule              jsonb       NOT NULL DEFAULT '{}'::jsonb,
  sort_by           text        NOT NULL DEFAULT 'manual',
  show_as_section   boolean     NOT NULL DEFAULT true,
  show_as_chip      boolean     NOT NULL DEFAULT false,
  display_order     integer,
  date_start        date,
  date_end          date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (museum_id, slug)
);

CREATE INDEX collection_groups_museum_idx  ON collection_groups (museum_id, display_order);
CREATE INDEX collection_groups_public_idx  ON collection_groups (museum_id, status);
```

- `slug` — generated from `title`, validated with the museum-slug regex in
  `lib/validations.ts:26` (`^[a-z0-9-]+$`, ≤60). Unique per museum, not globally.
- `date_start` / `date_end` — optional. Present, they let a group render as *Current*,
  *Upcoming* or *Past*, which is what makes a museum's exhibition read as an exhibition.
  Absent, the group is timeless, which is what a collector's set wants.
- `sort_by` — `manual` | `alpha` | `date_added` | `date_made` | `grade`. Deliberately
  **excludes** `insured_value`, which `SortBy` in `SearchFilterBar.tsx` offers internally;
  see §5.2.
- `show_as_section` / `show_as_chip` — D3's per-group choice, controlling **extra**
  prominence only. Both false is the normal case: the set is still on the index, still in
  the nav's reach, still cross-linked from its siblings and from its members' pages. These
  two flags promote a set onto the homepage; they are not what makes it public. `status`
  is.

### 4.2 `collection_group_items`

One table serves both membership modes.

```sql
CREATE TABLE IF NOT EXISTS collection_group_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid        NOT NULL REFERENCES collection_groups(id) ON DELETE CASCADE,
  object_id   uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id   uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'include'
                          CHECK (role IN ('include', 'exclude')),
  sort_order  integer,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, object_id)
);

CREATE INDEX collection_group_items_group_idx  ON collection_group_items (group_id, sort_order);
CREATE INDEX collection_group_items_object_idx ON collection_group_items (object_id);
```

- On a `manual` group: rows are the membership. `role` is always `include`.
- On a `rule` group: rows are **overrides**. `include` pins an item the rule misses (and
  it sorts first); `exclude` removes one the rule catches. This is how smart playlists
  work everywhere else, and it means a rule that is 95% right is still usable.
- `museum_id` is denormalised so RLS and the public read policy don't need a join through
  `collection_groups` on every row.
- `note` — an optional per-item caption within the group ("the only one with the mint
  mark"). Cheap to store, and it is most of what makes a group feel curated.

### 4.3 RLS

Owner/staff policies follow `wanted_items` (`supabase/wishlist-duplicates-valuation.sql:44`)
verbatim, with `is_staff_of_museum(museum_id)` added so staff on Professional+ can edit.

The public read policies carry the load-bearing conditions:

```sql
CREATE POLICY "Public can view published groups"
  ON collection_groups FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM museums m
                WHERE m.id = collection_groups.museum_id AND m.locked_at IS NULL)
  );

CREATE POLICY "Public can view items of published groups"
  ON collection_group_items FOR SELECT
  USING (
    role = 'include'
    AND EXISTS (SELECT 1 FROM collection_groups g
                WHERE g.id = collection_group_items.group_id AND g.status = 'published')
    AND EXISTS (SELECT 1 FROM objects o
                WHERE o.id = collection_group_items.object_id
                  AND o.show_on_site = true AND o.deleted_at IS NULL)
  );
```

The `objects` clause matters: without it the junction row leaks the *existence and id* of
a hidden object even though the object row itself is unreadable. The `locked_at` clause
matches the layout's own check (`app/museum/[slug]/layout.tsx:59`) — a lapsed subscription
must not leave group pages serving from the anon key.

`role = 'exclude'` rows are never public. They are private editorial state.

### 4.4 Also needs migrating

- `page_views.page_type` has `CHECK (page_type IN ('home','object','events','visit','embed'))`
  (`supabase/page-views-schema.sql:6`). Add `'group'`, and add it to the
  `PageViewTrackerProps` union.
- Regenerate `lib/database.types.ts`.

---

## 5. The rule engine

This is the risky part of the build, and the risk is a specific one.

### 5.1 One evaluator, never two

Rules must produce identical membership in the dashboard preview (client, over the loaded
objects array) and on the public site (server). The tempting implementation — evaluate in
JS on the client, translate to a Supabase query on the server — is exactly the shape of
the **G2 bug** recorded in the collection-profiles work: two resolution paths that agree
in every unit test and silently diverge in production.

So: **a rule is never translated to SQL.** One pure predicate in
`lib/collectionGroups/rules.ts`:

```ts
export function matchesRule(rule: GroupRule, object: RuleObject): boolean
export function resolveMembers<T extends RuleObject>(
  group: GroupLike, objects: T[], overrides: GroupItemRow[]
): T[]
```

The public homepage already fetches every visible object for the museum
(`app/museum/[slug]/page.tsx:30`), so evaluating in JS costs one pass over an array that
is already in memory. The group page fetches the same set. Both call `resolveMembers`.

(That page's unbounded `select('*')` is a pre-existing scalability question at Institution
volumes. This plan does not make it worse, and does not fix it.)

### 5.2 The field whitelist is public-safe by construction

A rule leaks through its *membership* even when the field itself is never rendered. A
group built on `estimated_value >= 10000` publishes the sentence "these are the expensive
ones" to anyone who reads the page — on a museum that has `hide_money_values` set, that is
a straightforward breach of an existing promise.

**Invariant P:** a rule field must already be public on the object page.

Permitted: `medium`, `culture`, `object_type`, `artist`, `category`, `year`,
`production_date`, `status`, `condition_grade`, `rarity`, `origin_country`,
`cert_authority`, `cert_grade_numeric`, `collection_profile`.

Excluded, and not merely hidden in the UI — rejected by the validator: every
`estimated_value` / `insured_value` / `acquisition_value` field, `current_location` and
`location_note`, every `acquisition_source*` and donor field, `provenance`,
`deaccession_protected`, `barcode`, all `disposal_*`. Same reasoning bars
`sort_by = 'insured_value'`.

Enforce it in one place — a `RULE_FIELDS` registry in `lib/collectionGroups/fields.ts` —
and validate on write in the Zod schema, not only in the picker.

### 5.3 Rule shape

```ts
export interface GroupRule {
  match: 'all' | 'any'
  conditions: GroupCondition[]   // max 8
}
export interface GroupCondition {
  field: RuleField
  op: 'is' | 'is_not' | 'contains' | 'gte' | 'lte' | 'is_set' | 'is_not_set'
  value: string
}
```

Deliberately flat — no nested groups of conditions. `all`/`any` covers what a collector
actually wants, and a nested boolean builder is a UI project of its own.

Ops are validated per field type (`gte`/`lte` only on numeric and date fields), so a rule
can't be saved in a state that silently matches nothing.

### 5.4 Resolution order

1. Start from the museum's visible objects (`show_on_site`, not soft-deleted).
2. `manual` group: members are `role = 'include'` rows. `rule` group: objects matching the
   rule, **plus** `include` rows, **minus** `exclude` rows.
3. Sort: `include` overrides first by `sort_order`, then the rest by `sort_by`.
4. Drop the group entirely if the result is empty — an empty section on a public homepage
   is worse than no section.

---

## 6. Vocabulary

Groups get the same treatment every other noun got. Add to `CollectionProfile`:

```ts
group?: { singular: string; plural: string }
```

…surfaced through a new `group` / `groupPlural` pair on `PublicLabels`
(`lib/publicProfile.ts:31`) and on the dashboard's `resolveAppNouns`.

Defaults: full mode (Professional+) → **Exhibition / Exhibitions**; simple mode with no
profile opinion → **Set / Sets**.

Per-profile starting points — these are collector terms, and the ones marked ⚠ are the
ones I'd check with a collector in that field before shipping rather than trusting a
plausible-sounding word:

| Profile | Singular | | Profile | Singular |
|---|---|---|---|---|
| trading-cards | Set | | comics | Run |
| stamps | Series | | militaria | Grouping |
| coins-banknotes | Series ⚠ | | jewellery | Suite ⚠ |
| wine-spirits | Vertical ⚠ | | ceramics-glass | Service ⚠ |
| books | Series | | toys-models | Wave ⚠ |
| vinyl-music | Collection | | watches-clocks | Collection |
| art / photography | Series | | video-games | Collection |
| sports-memorabilia | Set | | fashion-sneakers | Line ⚠ |
| natural-history | Series | | antiques / automobilia / general | Collection |

Same discipline as the `verifyUrl` fields in the profiles work: an absent override falls
back to "Set", which is safe. A confidently wrong word is not.

---

## 7. Surface-by-surface changes

### 7.1 New files

| File | What |
|---|---|
| `supabase/collection-groups.sql` | Tables, indexes, RLS, `page_views` constraint widening |
| `lib/collectionGroups/index.ts` | `resolveMembers`, `groupsEnabled` (always true — a stub for honesty), slug helper |
| `lib/collectionGroups/rules.ts` | `matchesRule`, condition evaluators |
| `lib/collectionGroups/fields.ts` | `RULE_FIELDS` registry + Invariant P |
| `lib/collectionGroups/vocab.ts` | Group nouns per profile |
| `app/dashboard/groups/page.tsx` | List + reorder |
| `app/dashboard/groups/[id]/page.tsx` | Editor: details, membership, rule builder, preview |
| `app/api/groups/route.ts`, `[id]/route.ts`, `[id]/items/route.ts` | CRUD + bulk add |
| `app/museum/[slug]/sets/page.tsx` | Public **set index** — §7.5 |
| `app/museum/[slug]/sets/[group]/page.tsx` | Public set page — §7.6 |
| `components/groups/GroupPicker.tsx` | Add-to-group modal, used from bulk bar and object record |
| `components/groups/RuleBuilder.tsx` | Condition rows + live match count |
| `components/collection/GroupSection.tsx` | One homepage band |
| `components/collection/setCards.tsx` | The four set-card treatments — §8.1 |
| `components/collection/SetCover.tsx` | Cover derivation + mosaic composition — §8.2 |
| `components/collection/SetBrowser.tsx` | Search/sort/chips scoped to one set — §7.7 |
| `lib/collectionGroups/presentation.ts` | `grid_variant` → set treatment map, cover ladder |

### 7.2 `app/dashboard/page.tsx` — bulk bar

The bulk bar is currently `canEdit && fullMode` (line 621), and so are the row checkboxes
(line 583). Groups are ungated (D2), so a Hobbyist must be able to multi-select. Change the
gate on the **checkboxes and the bar** to `canEdit`, and keep the *existing actions*
(status change, bin) behind `fullMode` inside it. Simple mode therefore gets a bulk bar
with exactly two actions: *Add to group* and *Show/Hide on site*.

### 7.3 Object record

A Groups field on `OverviewTab` near the existing "Feature on your public page" toggle
(line 826): chips for current groups, plus an add control. Read-only for rule-derived
membership, with the reason shown ("in *Roman Silver* by rule") and an "exclude from this
group" action that writes a `role = 'exclude'` row.

### 7.4 Public homepage — `app/museum/[slug]/page.tsx`

Fetch published groups alongside objects, resolve members in JS, render up to 6 sections
(§3.1a) ordered by `display_order`, each one row deep with a "View all N →" header link.
Below the sixth, a single line: **"Browse all 12 sets →"** to the index. Nothing is
stranded, because everything is on the index either way.

`components/MuseumNav.tsx` gains a `hasSets` prop alongside the existing `hasEvents` /
`hasVisitInfo` / `hasWanted`, computed in the layout as a count of published sets — same
shape as the `eventCount` query at `app/museum/[slug]/layout.tsx:60`. The link label comes
from the vocabulary layer, so it reads "Exhibitions" on a museum and "Sets" on a card
collection.

**Invariant Q — the serialisation boundary.** Section items must go through
`toGridObject()` before crossing into the client grid. `select('*')` rows carry purchase
prices and valuations, and the grid is a client component: handing it raw rows publishes
them in the page payload. This is already recorded as a trap in the public-site design
notes; groups adds a second place to fall into it.

Chips: groups with `show_as_chip` join the Medium chips in `CollectionSearch`. They filter
the grid in place, so `CollectionSearch` needs each `GridObject` tagged with its group ids
— a `groupIds: string[]` field on `GridObject`, populated in `toGridObject`.

The existing featured strip (`is_featured`, 6 items, paid tiers) stays as it is for now.
It is arguably the built-in first group and the two should eventually merge, but changing
it would alter every existing paid site on the day groups ship.

### 7.5 Public set index — `/museum/[slug]/sets`

The page that makes the feature browsable. Reached from the nav item and from the
homepage's "Browse all 12 sets →".

- **Masthead** — the vocabulary word ("Sets" / "Exhibitions" / "Series"), a count line
  (*12 sets · 340 items*), and the museum's heading font. No hero image; the set covers
  are the imagery.
- **The cards** — one of four treatments, derived from the museum's `grid_variant` (§8.1).
  Each card carries cover, title, subtitle, item count and date range.
- **Sectioning** — if *any* published set has a date range, the index splits into
  **Current / Upcoming / Past** with the same rule the set page uses. Otherwise it is one
  flat run in `display_order`. Sets without dates on a dated index fall into an untitled
  first block, never into "Past".
- **Sorting** — owner's order by default; a small control offers *A–Z* and *Most items*.
  Three options, in the museum's `chrome` style. Not a filter bar.

**Route.** `/museum/[slug]/sets/[group]`, not `/museum/[slug]/[group]`. The bare form is
prettier but a set slugged `visit`, `events`, `wanted`, `object` or `embed` shadows a real
route, and reserving route names on a user-editable slug is a footgun that fires again
every time a public route is added. The `/sets` segment is fixed and English even when the
vocabulary says "Exhibitions" — URL stability beats URL vocabulary, and the visible label
is translated everywhere it appears.

### 7.6 Public set page — `/museum/[slug]/sets/[group]`

Three bands.

1. **Hero**, per treatment (§8.3) — cover, title, subtitle, description at a reading
   measure in the template's `body_font`, date range, item count.
2. **The members**, in the museum's own `grid_variant`, so a set inside a salon-hang site
   hangs like a salon. Per-item notes render as an extra caption line (§8.4).
3. **Other sets** — three or four sibling cards in the same treatment as the index, then
   a link to the full index. This is what stops a set page being a dead end for someone
   arriving from search.

Reuses `getMuseumStyles`, `buildPageMetadata`, and `PageViewTracker` with the new
`'group'` page type.

### 7.7 Browsing *within* a set

A 200-item set needs the same handling the collection got. `SetBrowser` wraps
`CollectionSearch` rather than reimplementing it, so the search box, chip styling and
`chrome` treatment are identical to the main collection:

- **Search** scoped to the set, placeholder from `labels.searchPlaceholder`.
- **Chips** built from the distinct mediums *of this set's members*, not the whole
  collection — a chip that matches nothing in view is noise.
- **Sort** defaulting to the set's `sort_by`; when that is `manual` the control offers
  "Curator's order" as the first option and returns to it on clear.
- The browser only renders above **12 items**. Below that it is chrome on a page that
  doesn't need it.

### 7.8 Set-aware item pages

The real browsing win, and cheap: every one of the eight grids routes its links through
`objectHref(slug, id)` in `components/collection/types.ts:83`. Widen it:

```ts
export function objectHref(slug: string, id: string, setSlug?: string): string
// → /museum/[slug]/object/[id]?set=roman-silver
```

All eight grids inherit set context from that one change. The object page then:

- **Validates membership before trusting the param.** A `?set=` naming a set the object
  isn't in is ignored, not rendered. Otherwise a crafted URL makes any item appear to
  belong to any set.
- **Breadcrumb** — *Collection / Roman Silver / This item*.
- **Prev / next within the set**, in the set's resolved order, with a position marker
  (*3 of 14*). Walking a set item by item is the thing that makes it feel like an
  exhibition rather than a filter.
- **The item's note for that set**, if one was written.
- **Set chips regardless of `?set=`** — every published set this object belongs to,
  listed on the page. That is how a visitor discovers sets from an item rather than only
  from the top down.

Prev/next must respect **Invariant R**: hidden and soft-deleted members are absent from
the walk, so the position marker counts visible members only.

### 7.9 Navigation summary

Every published set now has at least three routes in, and no state is unreachable:

| From | To |
|---|---|
| Nav item ("Sets") | Index |
| Homepage section header | That set |
| Homepage "Browse all N sets →" | Index |
| Collection filter chip | Filters the grid in place, with a banner linking to the set page |
| Index card | That set |
| Set page footer | Sibling sets, then the index |
| Item page chips | Every set the item is in |
| Item page prev/next | The neighbouring item, in set order |

The chip banner is worth calling out: chips keep filtering in place, consistent with the
existing Medium chips, but an active set chip puts a slim bar above the grid —
*"Roman Silver — 14 items. Read about this set →"*. Chip semantics preserved, editorial
content no longer invisible.

### 7.10 The easily-missed integrations

- **`app/sitemap.ts`** — add the `/sets` index **and** each published set page for
  discoverable, unlocked museums, alongside the existing museum and object entries. The
  index is the higher-priority entry: it is the page that links the rest.
- **`components/MuseumNav.tsx`** — a fifth link, behind `hasSets`, labelled from the
  vocabulary layer. Both the desktop row and the mobile sheet.
- **`app/admin/actions.ts:284`** — museum deletion enumerates `museum-assets` paths by
  name (hero, logo). Uploaded group covers live in the same bucket and will orphan on
  account deletion unless added to that list.
- **`app/api/account/export/route.ts`** — groups and membership belong in the GDPR export.
- **CSV import/export** — deliberately **not** touched. `54fc5a0` established that the
  exporter must not write columns the importer ignores; group membership is either both
  sides or neither, and neither is right for v1.
- **`lib/whatsNew.ts`** — new entry at the top on ship.
- **`lib/learn-descriptions.ts`** — entries for the new fields, keyed
  `collection_groups.*`, to match Learn Mode coverage elsewhere.

---

## 8. Presentation

The site already carries three axes of template identity — `layout_variant` (8, the
masthead), `grid_variant` (8, the collection), `object_variant` (7, the item page) — plus
`chrome` and paired `body_font`. Sets must not arrive as one generic layout bolted onto
nine differentiated sites. A set index rendered as rounded cards on **Archival**, whose
collection is a ruled catalogue list, would look like another product.

But nine hand-authored set layouts is the wrong answer too. Instead, **derive**.

### 8.1 Four set-card treatments, mapped from `grid_variant`

| `grid_variant` | Templates | Set treatment | What it looks like |
|---|---|---|---|
| `plate`, `uniform` | Minimal, Classic | **`plates`** | Cover matted on the page ground, generous margin, caption beneath. Centred and accent-ruled when `grid_options.frame` is set. |
| `catalogue` | Archival, Curator | **`ledger`** | Hairline-ruled rows. Numbered when `grid_options.numbered`. Cover as a small square at left, title and dates centre, item count right-aligned in tabular figures. |
| `spotlight`, `mosaic` | Dramatic, Magazine | **`tiles`** | Full-bleed cover tiles butted on a 1px gap, title over a bottom gradient scrim, revealed on hover exactly as `SpotlightGrid` does. |
| `salon`, `editorial`, `stack` | Salon, Editorial, Cover | **`feature`** | One large lead set, the rest smaller beneath in an asymmetric run. Matches the editorial rhythm of those collections. |

One `SET_TREATMENT: Record<GridVariant, SetTreatment>` map in
`lib/collectionGroups/presentation.ts`. Four components, nine templates covered, and a
new grid variant later only needs a line in the map.

Every treatment takes the same `GridTheme` the grids already take, so accent, radius,
border, `headingStyle`, `imageAspect` and dark-mode colours are inherited rather than
re-derived. **No treatment defines a colour of its own** — same discipline as the grids.

### 8.2 The cover ladder

Most sets will never have a cover uploaded, and a set index of grey placeholders is not
worth building. Resolve in order, first hit wins:

1. `cover_image_url` — uploaded.
2. `cover_object_id` — a nominated member's image.
3. **A mosaic of the first four member images** — the default that makes an untouched set
   look deliberate.
4. The first member's image alone (fewer than four members with images).
5. Accent-tinted ground, the museum's `logo_emoji` at 40% opacity, title over it.

**Mosaic composition.** 2×2 at square and portrait `image_ratio`; one large left plus a
stacked column of three at landscape. Gap of 1px in `theme.border`, images `object-cover`,
outer radius `theme.radius` with `overflow-hidden` so the tiles clip to the card corner.
Deterministic — first four by resolved order, never random, so the cover doesn't reshuffle
between renders and cache states.

The ladder is the reason §3.1b works: nobody has to upload anything, so uploaded covers
stay rare enough to charge against the storage quota without it biting.

### 8.3 Set page heroes

Also per treatment, so the set page belongs to its template:

- **`plates`** — cover as a wide matted plate, then title, subtitle and description
  beneath at `max-w-2xl`. A wall label, scaled up.
- **`ledger`** — no large cover. A ruled masthead: title in the heading face, hairline,
  then a definition row of *Items · Dates · Curator's order*. The catalogue templates
  earn their formality by not showing a hero image.
- **`tiles`** — full-bleed cover, title and subtitle overlaid on a bottom gradient, count
  in the accent. The dark templates' idiom.
- **`feature`** — asymmetric: cover to one side, title and description to the other,
  heavy rule between. The magazine idiom.

### 8.4 Details that decide whether it looks considered

- **Small sets don't render as gappy grids.** Clamp to
  `Math.min(theme.columns, items.length)`. A two-item set at four columns reads as broken.
- **Per-item notes** render as a third caption line in the shared `Caption` (uniform,
  plate) and in `CatalogueList`'s existing `lead` slot. **Skipped** on `spotlight` and
  `mosaic`, whose captions overlay the image and have no room. Documented, not accidental.
- **A depth cue on cards for sets over four items** — a 2px offset ghost card behind the
  cover, in `theme.border`. Reads as "there is more inside" without a word of copy.
- **Motion matches the grids exactly**: `duration-500 group-hover:scale-[1.03]` on covers,
  `hover:-translate-y-1` on the carded treatments. Nothing new invented.
- **Typography follows the pairing**: titles in `headingStyle`, descriptions in the
  template's `body_font` via `BODY_FONT_MAP`, counts and dates in the mono face the grids
  already use for metadata.
- **Dates read in words** — *Current*, *Until 4 June*, *Opens 12 March*, *2019* — not a
  raw range. A set with `date_start` only reads "Since 2019".
- **Empty index** — if a museum publishes no sets, the nav item is absent and `/sets`
  404s. No empty-state page.

### 8.5 Dashboard preview

The set editor shows the set as it will publish, in the museum's own treatment, next to
the fields. Reuse the same components with the museum's real `GridTheme`. For rule-based
sets this doubles as the rule preview — the live match count is the same query, and
seeing *what* matched beats seeing *how many*.

---

## 9. Invariants

| | |
|---|---|
| **P** | A rule field must already be public on the object page. Enforced in `RULE_FIELDS`, validated on write. |
| **Q** | Anything reaching a grid component goes through `toGridObject()`. |
| **R** | `show_on_site = false` or `deleted_at IS NOT NULL` beats membership, in the query, in RLS, and in `resolveMembers`. |
| **S** | One rule evaluator. Rules are never compiled to SQL. |
| **T** | `role = 'exclude'` rows are never readable publicly. |
| **U** | A group resolving to zero visible members does not render, and a museum with no published sets has no nav item and no `/sets` page. |
| **V** | Set treatments define no colours, fonts or radii of their own. Everything comes from `GridTheme` / `getMuseumStyles`, so dark mode and templates work by construction. |
| **W** | `?set=` is validated against actual membership before anything set-shaped renders on an item page. |

---

## 10. Build order

1. **Schema** — `supabase/collection-groups.sql`, RLS, `page_views` constraint, regenerate types.
2. **Library** — `lib/collectionGroups/*`, with the rule evaluator unit-tested before any UI exists.
3. **Dashboard CRUD** — list, editor, API routes. Manual membership only at this stage.
4. **Membership entry points** — bulk bar (and its de-gating), object record field, picker modal.
5. **Presentation layer** — `presentation.ts`, `SetCover` + the cover ladder, the four set-card
   treatments. Built before the pages, because the index, the set page, the homepage sections
   and the dashboard preview all consume them.
6. **Public surfaces** — index, set page, homepage sections, nav item, chips + chip banner.
7. **Set-aware item pages** — `objectHref` widening, breadcrumb, prev/next, set chips.
8. **In-set browsing** — `SetBrowser` over 12 items.
9. **Rule builder** — conditions UI, live match count, overrides.
10. **Integrations** — sitemap (index + set pages), page views, account export, admin deletion,
    Learn Mode, What's New.

Steps 1–7 are the shippable unit: manual sets, browsable, in every template. Step 8 only
matters once someone builds a large set, and step 9 is the part to cut if it turns out to
be more UI than it is worth.

## 11. Tests

- `__tests__/lib/collection-group-rules.test.ts` — the evaluator: each op, `all` vs `any`,
  include/exclude override precedence, sort order, empty results.
- `__tests__/lib/collection-group-fields.test.ts` — **Invariant P**: assert every money,
  donor, location and disposal column is absent from `RULE_FIELDS`, so the guard fails
  loudly if someone widens the whitelist later.
- `__tests__/lib/collection-group-presentation.test.tsx` — following the precedent of
  `collection-grids.test.tsx`: every `GridVariant` maps to a treatment, all four
  treatments render, and the cover ladder returns each rung (uploaded → nominated →
  mosaic → single → emoji) for the right inputs.
- `__tests__/lib/collection-groups-public.test.tsx` — a section renders under each grid
  variant; a set containing a hidden object renders without it; a two-item set clamps its
  columns; prev/next skips hidden members and counts only visible ones.
- **Invariant W** — an `?set=` for a set the object is not in renders no breadcrumb, no
  prev/next and no note.
- Manual: a set of hidden-only objects does not appear; a draft set 404s publicly; a
  locked museum's set page and index 404; the nav item is absent when nothing is
  published.
