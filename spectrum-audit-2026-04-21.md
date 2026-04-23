# Spectrum 5.1 Compliance Audit — Vitrine CMS
**Date:** 2026-04-21
**Scope:** Professional / Institution / Enterprise tiers (`fullMode + compliance = true`)
**Method:** Static code review only — no live testing
**Primary concern from user:** “data being entered in one section of the app and then not being carried through to another section” (e.g. description entered at object entry not reaching the object page)

---

## Executive Summary

Vitrine covers all **21 Spectrum 5.1 procedures** — 9 primary + 12 secondary — with dedicated tables, dashboard pages, and tab-based data capture on each object. Quota enforcement (objects, staff, documents) is implemented atomically via `SECURITY DEFINER` RPCs with `FOR UPDATE` locks, and DB-level compliance RLS correctly restricts INSERTs on compliance tables to `plan IN ('professional','institution','enterprise')`.

However, the audit identified **one critical data-flow gap**, **multiple schema-mismatch bugs in print/export paths**, and **one column-name bug in the Emergency dashboard**. These do not prevent use but either corrupt Spectrum registers or produce silently-blank printed output. **None of these are UI complaints — all are verified by reading the source code against migration files.**

### Severity summary

| # | Severity | Area | File | Status |
|---|---|---|---|---|
| 1 | **Critical** | Disposal register → objects table not synced | [app/dashboard/disposal/page.tsx:119-133](app/dashboard/disposal/page.tsx#L119-L133) | BUG |
| 2 | **High** | Emergency dashboard uses non-existent `deleted` column | [app/dashboard/emergency/page.tsx:78](app/dashboard/emergency/page.tsx#L78) | BUG |
| 3 | **High** | Print object page reads non-existent columns in 3 tables | [app/print/object/[id]/page.tsx:48-51,124,154,169](app/print/object/[id]/page.tsx#L48-L51) | BUG |
| 4 | Medium | Collections Use upsell text contradicts actual gating | [app/dashboard/collections-use/page.tsx:85-86](app/dashboard/collections-use/page.tsx#L85-L86) | UX |
| 5 | Low | Loans/valuations bypass `/api/objects` quota path when creating standalone | n/a | By design |

---

## Spectrum 5.1 Procedure Map — Implementation Status

### Primary Procedures (9)

| # | Procedure | DB table | Dashboard page | Object tab | Status |
|---|---|---|---|---|---|
| 1 | **Object entry** | `entry_records` | [/dashboard/entry](app/dashboard/entry/page.tsx) | EntryTab (orphaned — see Finding P-1) | ✓ Complete |
| 2 | **Acquisition & accessioning** | `objects.acquisition_*`, `objects.accession_*` | [/dashboard/register](app/dashboard/register/page.tsx) | AcquisitionTab / AccessionTab | ✓ Complete |
| 3 | **Location & movement control** | `location_history`, `objects.current_location` | [/dashboard/locations](app/dashboard/locations/page.tsx) | LocationTab | ✓ Complete |
| 4 | **Inventory** | `audit_records`, `audit_exercises` | [/dashboard/audit](app/dashboard/audit/page.tsx) | AuditTab | ✓ Complete |
| 5 | **Cataloguing** | `objects.*` (~80 cols), `object_components` | (on object pages) | CataloguingTab / DimensionsTab / SignatureTab | ✓ Complete |
| 6 | **Object exit** | `object_exits` | [/dashboard/exits](app/dashboard/exits/page.tsx) | ExitTab | ✓ Complete |
| 7 | **Loans in/out** | `loans` | [/dashboard/loans](app/dashboard/loans/page.tsx) | LoansTab | ✓ Complete |
| 8 | **Documentation planning** | `documentation_plans`, `documentation_plan_backlogs` | [/dashboard/docs](app/dashboard/docs/page.tsx) | — | ✓ Complete |
| 9 | **Emergency planning** | `emergency_plans`, `emergency_events`, `emergency_salvage_priorities` | [/dashboard/emergency](app/dashboard/emergency/page.tsx) | — | ⚠ Bug (see P-2) |

### Secondary Procedures (12)

| # | Procedure | DB table | Dashboard page | Status |
|---|---|---|---|---|
| 10 | **Condition checking / assessment** | `condition_assessments` | (on object page) | ✓ |
| 11 | **Conservation & care** | `conservation_treatments` | [/dashboard/conservation](app/dashboard/conservation/page.tsx) | ✓ |
| 12 | **Valuation** | `valuations` | [/dashboard/valuation](app/dashboard/valuation/page.tsx) | ✓ |
| 13 | **Insurance & indemnity** | `insurance_policies` | [/dashboard/insurance](app/dashboard/insurance/page.tsx) | ✓ |
| 14 | **Risk management** | `risk_register` | [/dashboard/risk](app/dashboard/risk/page.tsx) | ✓ |
| 15 | **Damage & loss** | `damage_reports` | [/dashboard/damage](app/dashboard/damage/page.tsx) | ✓ |
| 16 | **Use of collections** | `collection_use_records` | [/dashboard/collections-use](app/dashboard/collections-use/page.tsx) | ⚠ UX (S-1) |
| 17 | **Collections review** | `collection_reviews` | [/dashboard/collections-review](app/dashboard/collections-review/page.tsx) | ✓ |
| 18 | **Rights management** | `rights_records`, `reproduction_requests` | (on object page — RightsTab) | ✓ |
| 19 | **Audit (formal audit exercise)** | `audit_exercises` | [/dashboard/audit](app/dashboard/audit/page.tsx) | ✓ |
| 20 | **Deaccession & disposal** | `disposal_records`, `objects.disposal_*` | [/dashboard/disposal](app/dashboard/disposal/page.tsx) | ❌ Bug (P-3 — data-flow gap) |
| 21 | **Reproduction** | `reproduction_requests` | (on object page) | ✓ |

---

## Critical & High-Severity Findings

### P-3 ❌ Critical — Disposal register does not sync back to `objects` table

**User’s primary concern, confirmed.** The standalone Disposal register creates `disposal_records` rows but **never updates the corresponding `objects` row** with `status = 'Deaccessioned'`, `disposal_method`, `disposal_date`, `disposal_recipient`, `disposal_authorization`, or `disposal_note`.

**Evidence — [app/dashboard/disposal/page.tsx:119-133](app/dashboard/disposal/page.tsx#L119-L133):**
```ts
await supabase.from('disposal_records').insert({
  museum_id: museum.id,
  object_id: selectedObjectId,
  disposal_method, disposal_reason, deaccession_date,
  authorised_by, governing_body_approval, recipient_name,
  proceeds_amount, register_annotated, public_notice, ...
})
// ← nothing else. No UPDATE on objects.
```

Meanwhile, [components/tabs/RightsTab.tsx:460-485](components/tabs/RightsTab.tsx#L460-L485) reads disposal info **from `objects.disposal_*`**, not from `disposal_records`. So:

- A Professional user enters a formal disposal on `/dashboard/disposal`.
- They navigate to that object’s page → Rights tab.
- **The disposal fields still say “—”**. The object’s status is unchanged. Printed object reports ([app/print/object/[id]](app/print/object/[id]/page.tsx)) show no disposal.
- Compliance register says the object is disposed; object page says it is active on display.

**Two incompatible sources of truth** for the same Spectrum 5.1 Procedure 20 data. This matches the user’s phrased concern exactly.

**Fix direction:** after `disposal_records.insert`, also `update objects set status = 'Deaccessioned', disposal_method = ..., disposal_date = deaccession_date, disposal_recipient = recipient_name, disposal_authorization = authorised_by, deaccession_protected = true where id = selectedObjectId`.

---

### P-2 ❌ High — Emergency dashboard uses non-existent `deleted` column

**[app/dashboard/emergency/page.tsx:78](app/dashboard/emergency/page.tsx#L78):**
```ts
supabase.from('objects').select('id, title, accession_no, emoji')
  .eq('museum_id', museum.id)
  .eq('deleted', false)  // ← column does not exist
  .order('title')
```

The `objects` table uses `deleted_at timestamptz` soft-delete ([supabase/soft-delete.sql](supabase/soft-delete.sql)); a `deleted boolean` column was never added. Supabase will either return 0 rows or a 400 error depending on PostgREST version, silently breaking the salvage-priority object picker. Emergency planning (Spectrum Procedure 9) lists no objects to prioritise.

**Fix:** change to `.is('deleted_at', null)`.

Note: the same pattern is already correct in [app/print/insurance/page.tsx:47](app/print/insurance/page.tsx#L47), [app/dashboard/entry/page.tsx:75](app/dashboard/entry/page.tsx#L75), [app/dashboard/objects/[id]/page.tsx:322](app/dashboard/objects/[id]/page.tsx#L322), and every RPC — this is a single outlier.

---

### P-1 ❌ High — Printable object report has 6 column-name mismatches

**[app/print/object/[id]/page.tsx](app/print/object/[id]/page.tsx)** queries three compliance tables with columns that do not exist per [supabase/spectrum-schema.sql](supabase/spectrum-schema.sql):

| Line | Code | Actual schema | Effect |
|---|---|---|---|
| 48 | `condition_assessments.order('assessment_date', …)` | column is `assessed_at` | Order silently ignored → wrong sort |
| 124 | `{fmt(c.assessment_date)}` | column is `assessed_at` | Prints `—` |
| 50 | `loans.order('loan_start', …)` | column is `loan_start_date` | Order silently ignored |
| 154 | `{val(l.loan_type)}`, `{val(l.borrower_lender)}`, `{fmt(l.loan_start)}`, `{fmt(l.loan_end)}` | schema has `direction`, `borrowing_institution`, `loan_start_date`, `loan_end_date` | All four cells blank/`—` |
| 51 | `conservation_treatments.order('treatment_date', …)` | columns are `start_date` / `end_date` | Order silently ignored |
| 169 | `{fmt(c.treatment_date)}` | use `start_date` or `end_date` | Prints `—` |

So Pro-tier users who “Print full record” get a report whose Condition History, Loan History, and Conservation Treatments sections either have wrong row order, blank date cells, or entirely empty columns. `condition_assessments.grade`/`assessor`/`notes` and `conservation_treatments.treatment_type`/`conservator`/`description` are correctly read.

The insurance print page ([app/print/insurance/page.tsx](app/print/insurance/page.tsx)) is schema-correct.

---

### S-1 ⚠ Medium — Collections Use upsell text vs actual gating

**[app/dashboard/collections-use/page.tsx:76-86](app/dashboard/collections-use/page.tsx#L76-L86):**

The page gates by `getPlan(museum.plan).compliance` (line 76) — which is `true` for **Professional and above**. But the upsell banner at line 85-86 tells users the feature is for "Institution and Enterprise plans". Pro users have access; the marketing copy is simply wrong. Low risk — does not gate the feature, only misleads users reading the upsell.

---

## Verified OK

### Quota enforcement (user confirmed concern)

- **Object inserts** — [supabase/insert-object-quota-rpc.sql](supabase/insert-object-quota-rpc.sql): `SECURITY DEFINER` RPC locks museum row `FOR UPDATE`, then atomically counts and inserts. Strips `id`, `deleted_at`, `created_at`, `updated_at`, `show_on_site` from caller JSONB; forces museum/owner/created_by from trusted API params. Defence-in-depth: the entry page, duplicate handler, and CSV import all also check the limit client-side before POSTing — the RPC is the authority but the UX is friendly.
- **Staff inserts** — [supabase/insert-staff-quota-rpc.sql](supabase/insert-staff-quota-rpc.sql): mirrors the pattern. Professional cap = 10 staff ([lib/plans.ts:113](lib/plans.ts#L113)), Institution = null (unlimited). Enforced by `insert_staff_member_if_quota_ok` at [app/api/staff-members/route.ts:52](app/api/staff-members/route.ts#L52).
- **Document storage quota** — `insert-document-quota-rpc.sql` applies the same pattern; `museums.storage_used_bytes` is maintained by triggers ([lib/storageUsage.ts](lib/storageUsage.ts)).

### Compliance RLS plan gate

[supabase/compliance-rls-plan-gate.sql](supabase/compliance-rls-plan-gate.sql) provides `museum_has_compliance_plan(uuid) → boolean` checked against `plan IN ('professional','institution','enterprise')`. Applied as `WITH CHECK` to INSERT policies on **all 20 compliance tables**: entry_records, object_exits, documentation_plans, condition_assessments, conservation_treatments, loans, audit_records, damage_reports, emergency_plans, emergency_salvage_priorities, emergency_events, insurance_policies, risk_register, valuations, reproduction_requests, rights_records, disposal_records, collection_reviews, collection_use_records, audit_exercises, documentation_plan_backlogs, documentation_plan_documents. UPDATE/DELETE are deliberately left ungated so downgraded users can still clean up. Defence-in-depth against a bypass of the `/dashboard/*` page redirects.

### Public collection site

[app/museum/[slug]/page.tsx](app/museum/[slug]/page.tsx) and [app/museum/[slug]/object/[id]/page.tsx](app/museum/[slug]/object/[id]/page.tsx) render 7 layouts, all using `.eq('show_on_site', true).is('deleted_at', null)`. The object detail page surfaces: culture, title, artist, description, rarity, production_date, production_date_qualifier, object_type, medium, production_place, accession_no (Full mode only), dimensions via `formatDimensions()` over `dimension_*` cols, number_of_parts, status (Full), current_location (Full), condition_grade, historical_context, inscription, physical_materials, provenance, credit_line, associated_person/organisation/place (Full). These **do** match the `objects` schema and the cataloguing tab writes.

### Entry → Object data flow

[app/dashboard/entry/page.tsx:188-210](app/dashboard/entry/page.tsx#L188-L210) — `handleCreateEntry` creates the entry_record, then immediately POSTs `/api/objects` with `title`, `description` (from `object_description`), `acquisition_source` (from `depositor_name`), `acquisition_source_contact`, `acquisition_object_count`, `number_of_parts`, `accession_no`, `condition_grade`, `status='Entry'`. Finally `update entry_records set object_id = ...`. **This carries through correctly.** The user’s earlier fear about description-not-reaching-object is not a current bug — `object_description → objects.description` is wired.

### Images, documents, attachments

- [app/api/objects/[id]/images/route.ts](app/api/objects/[id]/images/route.ts), [app/api/objects/[id]/documents/route.ts](app/api/objects/[id]/documents/route.ts), [app/api/objects/[id]/documents/[docId]/route.ts](app/api/objects/[id]/documents/[docId]/route.ts), [app/api/objects/[id]/duplicates/route.ts](app/api/objects/[id]/duplicates/route.ts) exist and are scoped by museum membership. Doc uploads flow through [lib/uploadStagedDocs.ts](lib/uploadStagedDocs.ts) → [lib/r2-upload.ts](lib/r2-upload.ts) → R2, with DB tracking via `object_documents` and `insert_document_if_quota_ok` RPC enforcing MB quotas from `lib/plans.ts`.

### Tier feature gating

`getPlan(plan).compliance` is the canonical gate for all /dashboard/ compliance pages (entry, exits, loans, conservation, valuation, damage, risk, locations, emergency, audit, collections-review, collections-use, disposal). Redirects to `/dashboard/plan`. Numeric limits (objects, staff, images/object, docStorageMb) are distinct per tier and enforced at the RPC layer, so Pro (5000 obj / 10 staff / 1024 MB), Institution (100000 / unlimited / 10240 MB), and Enterprise (unlimited/unlimited/unlimited) are correctly differentiated despite sharing feature flags.

---

## Other Notes (Informational, not bugs)

- **Institution plan `comingSoon: true`** ([lib/plans.ts:180](lib/plans.ts#L180)) — the Institution card on the homepage pricing is non-purchasable, but the plan ID is still valid if set via Stripe/admin. Not a code bug, just a business-state signal.
- **`entry` tab deep-link** — the promote flow sends users to `?tab=entry`, but the EntryTab component is only rendered in specific object tab sets; confirm rendering before release if this path is important.
- **Valuation basis hardcoded null** — ValuationTab writes `valuation_basis: null` rather than exposing the field; Spectrum Procedure 12 permits but does not mandate basis, so informational.
- **Loans page bypass** — [app/dashboard/loans/page.tsx](app/dashboard/loans/page.tsx) inserts directly via the supabase client rather than through `/api/objects`, which is correct (it’s creating a loan not an object) but means loan records rely on the `loans` RLS (`compliance-rls-plan-gate.sql`) rather than the quota RPC. Plan-gated, so no bypass — just worth knowing when auditing flow provenance.

---

## Recommended order of fix

1. **P-2 emergency.deleted → deleted_at** — 1-line change, no migration, zero risk. Fix first.
2. **P-1 print/object column names** — 6-line code change, no migration; ship with the next print polish.
3. **P-3 disposal → objects sync** — requires a design decision on whether `objects` fields are canonical or `disposal_records` are. Simplest: make disposal register also update `objects.status` + `disposal_*` fields so everything stays in sync; audit trail remains in `disposal_records`. Also consider doing the reverse-sync (RightsTab disposal edit → `disposal_records`) for completeness, or deprecate the RightsTab disposal fields in favour of a "View in Disposal Register" link.
4. **S-1 Collections Use upsell text** — 1-line copy fix.

No other Spectrum-compliance gaps identified in Professional+ tier code. The 21 procedures are structurally complete; the bugs above are localised and isolated, not architectural.
