# SPECTRUM 5.1 Audit — Vitrine Professional Tier (Completeness, Data Flow, UX)

**Date:** 6 July 2026
**Scope:** Professional / Institution / Enterprise (`getPlan().compliance && fullMode`). All 21 SPECTRUM 5.1 procedures + cross-cutting navigation/UX.
**Method:** Six parallel code-level audits (4 procedure groups, 1 navigation/UX, plus this synthesis). Every finding cited to `file:line` and verified against `supabase/*.sql` / `lib/database.types.ts`. Read-only — no behaviour changed by the audit itself.
**Baseline:** HEAD `656effc` (after the Part A conversion fixes). The three bugs from the April audit (disposal sync, emergency `deleted` column, print columns) are confirmed fixed.

---

## Verdict

All 21 procedures have tables, plan-gated RLS, dashboard pages, and mostly-correct SPECTRUM field coverage — the *structure* is genuinely complete and, in places (disposal, damage, documentation planning, audit exercises), better than several commercial competitors. But the audit found **3 procedures that are broken or unusable in normal operation**, and a set of **recurring systemic defects** that repeat across 10+ procedures. The headline problem is not missing features — it's that data entered in one place silently fails to save, can't be edited afterwards, or never reaches the registers/print/export where SPECTRUM expects it to be retrievable.

**Counts:** 3 Critical · 18 High · ~30 Medium · ~20 Low/Polish. The Criticals and the six systemic patterns below account for most of the user-visible pain; fixing the patterns once resolves dozens of individual findings.

---

## Part 1 — Critical (procedure is broken in normal use)

### C1 · Use of Collections is completely inoperative — silent failure on every save
**Procedure 16.** The page inserts/queries/renders a column named `reference`, but the table column is `use_reference text NOT NULL` (no `reference` column exists).
- `supabase/spectrum-new-procedures.sql:9` → `use_reference`
- `app/dashboard/collections-use/page.tsx:141` inserts `reference`; `:127` `.ilike('reference', …)`; `:22,:402` render `r.reference`
Every insert fails (unknown column + NOT NULL unmet). `handleSubmit` (`:158-175`) has no error branch, so the form just sits there — the user clicks "Create record" and nothing happens, no message. The procedure cannot be used at all.
**Fix:** rename to `use_reference` in the insert/ilike/interface/cell, and surface `error.message`. ~15 minutes.

### C2 · Object Entry tab is orphaned — the whole entry lifecycle is uncapturable
**Procedure 1.** `components/tabs/EntryTab.tsx` (396 lines, the full Proc-1 form) is imported by no file; `app/dashboard/objects/[id]/page.tsx` has no `entry` in `TABS` and never renders it. Verified: no `EntryTab` import, no `id: 'entry'`.
Consequences (all verified):
- The promote flow deep-links to `?tab=entry` (`app/dashboard/entry/page.tsx:198`) → **blank content area** (no matching tab, no fallback).
- Entry `outcome` is only editable in EntryTab → every entry is stuck "Pending" forever; register "Acquired"/"Returned" stats are permanently 0; the "Create object →" button (shown only when outcome = Acquired) is unreachable.
- Receipt fields (receipt issued, terms accepted, legal owner, liability, scheduled return, quarantine, depositor signature) are uncapturable; the "Receipt" column always reads "Pending".
- The printable entry receipt page is linked only from EntryTab → dead route.
**Fix:** import `EntryTab`, add `{ id: 'entry', label: 'Entry' }` to `TABS`, render it, and add an unknown-tab → `overview` fallback. ~1 hour.

### C3 · Location & Movement Register is always empty — bad embedded join
**Procedure 3.** `app/dashboard/locations/page.tsx:96` selects `location_history` with `locations(name, location_code)`, but `location_history` has no FK to `locations` (relationships in `lib/database.types.ts` list only `museums`, `objects`). PostgREST rejects the embed (PGRST200), `data` is null, the error is unchecked → `movements = []`. The register table, movement stats, overdue alerts, and the CSV export all show nothing even when history exists.
**Fix:** drop the `locations(...)` embed; display `location_history.location`/`location_code` directly (or add a `location_id` FK + backfill). ~30 minutes.

---

## Part 2 — Systemic patterns (each repeats across many procedures)

Fixing these six patterns once clears the majority of the High/Medium findings.

### S1 · Create-only records — no edit, void, reject, or supersede path
Records are immutable after creation across **Exits (6.7), Loans (7.1), Emergency plans & events (15.2/15.3), Use (16-MED), Review (17-HIGH), Rights (18-MED), Disposal (20-MED), Reproduction (21-MED), Condition (P10-6), Valuation (P12-7), Insurance (P13-3), Risk (P14-2), Damage (P15-3)**. A typo in a legal audit-trail field (authoriser, recipient, policy number, phone) is permanent; outcomes that resolve *after* creation (insurance claim result, conservation outcome, review recommendations, reproduction fulfilment) can never be recorded; workflow states that only make sense later ('Rejected', 'Cancelled', 'Extended', 'Claimed') are unreachable — some are even forbidden by CHECK constraints (`status-check-constraints.sql:4-10`).
**Fix pattern:** add an edit modal + status transitions to each register's detail view (RLS already permits UPDATE). Standardise one editable-detail component; roll out per procedure. This is the single highest-leverage fix in the audit.

### S2 · Client-side reference numbering → museum-wide collisions + silent document loss
References are generated as `XX-{year}-{count-of-this-object's-rows+1}` with no DB unique constraint, so **every object's first record collides** (`EN-2026-001`, `LN-2026-001`, `OE-2026-001`, `RR-2026-001`, `CU-2026-001`, `VL-2026-001`, `DR-2026-001`, `CR-2026-001`). Affected: Entry (E5), Exit (6.4), Loan (7.5), Rights (18-MED), Use (16-LOW), Valuation (P12), Damage (P15), Review (17-LOW), Disposal (20-LOW).
**This also causes a data-loss bug:** several tabs re-fetch the just-inserted row with `.eq('<ref>', ref).single()` to attach staged documents; once two objects share a reference, `.single()` errors and **the documents are silently dropped** — confirmed in Valuation (P12-3), Damage (P15-2), Exit (6.3).
**Fix pattern:** (a) replace every `.eq(ref).single()` re-fetch with `.insert(...).select('id').single()` (the ID is already returned — this kills the data-loss bug immediately); (b) generate references museum-wide per year + add `UNIQUE (museum_id, <ref>)` indexes and retry-on-conflict.

### S3 · Committed migrations lag the live database — `supabase/` cannot rebuild production
Several columns/tables exist in `lib/database.types.ts` (live DB) but have **no CREATE/ALTER in `supabase/*.sql`**, so a fresh deploy breaks:
- `documentation_plans.status` + `created_at` and the dropped `museum_id UNIQUE` (9.1) — docs page inserts/filters/orders on them.
- `emergency_plan_documents`, `insurance_policy_documents`, `disposal_record_documents` — **no CREATE TABLE + no RLS anywhere** (only storage triggers reference them). RLS posture unverifiable from the repo.
- `locations.room_gallery/position1..3`, `location_history.location_code/authorised_by` — repo still has the old `floor/room/unit` columns (L2). LocationTab inserts would fail on a repo-built schema.
- `conservation_treatments.treatment_name` + `images` (P11-5); `audit_records.exercise_id` FK points at the unused `inventory_exercises` in the repo vs live `audit_exercises`.
**Fix pattern:** reconcile schema — dump the live schema and commit the missing migrations (tables, columns, RLS, FKs, unique indexes). Do this **before** any other DB work so fixes are reproducible.

### S4 · Object status & lifecycle links don't propagate
SPECTRUM procedures are meant to interlock; here they don't:
- Recording an **exit** never changes object status — a permanent Transfer/Sale/Disposal exit still shows "On Display" everywhere (6.1); temporary exits can't be closed (no return field) (6.2).
- Activating a **loan-in** wrongly sets the borrowed object to "On Loan"/"Lent Out" (7.2/7.3); ending a loan-in doesn't create the required exit.
- **Disposal → exit**: completing a disposal never creates/prompts an exit even though the docs metric scores it (6.5).
- **Entry → return**: "Returned to depositor" creates no exit and doesn't update status (E2).
- **Damage → conservation/insurance**: "Awaiting conservation" creates no treatment; `insurance_claim_ref` is free text unlinked to policies; the 'Claimed' status is unreachable (P15-4).
- **Emergency → risk / damage**: no linkage between the emergency module and the risk register or damage reports (15.4, 15.7).
**Fix pattern:** add the connecting writes/prompts at each transition (status updates, "create linked record" actions). Best done after S1 so the edit/transition scaffolding exists.

### S5 · Fields displayed or required but not capturable (dead form plumbing)
Columns that are shown in registers/print or are `NOT NULL`, yet have no input:
- **Valuation** `basis` (hardcoded `null`), `method`, `purpose` — all three shown as columns, always "—" (P12-1/2).
- **Audit** `method` — in `AUDIT_METHODS` + form state, no `<select>` rendered, always null (19-HIGH).
- **Conservation** `condition_after` + `outcome` — no UI (P11-1); before/after image designation dead (P11-2).
- **Acquisition** `legal_transfer_date` (title transfer) and `location_after_accessioning` — printed/stated, no input (A1/A2).
- **Condition** `specific_issues`, `location_on_object`, `priority`, and extended fields are write-only (P10-1/3).
- **Cataloguing** structured dimensions never reach print/CSV (C1-cat, HIGH); `maker_name/role`, `production_place`, `technique`, `style/period`, `subject` etc. have columns + are searched, but no capture UI (C2-cat); the CSV "Marks" column is actively emptied on every save (C2-cat).
- **Damage** `discovered_date` is `NOT NULL` but not required by the form → raw Postgres error on submit (P15-1).
- **Emergency** `plan_last_tested`, `salvage_equipment_location`, ranked `emergency_salvage_priorities` — no UI (15.1/15.5).
**Fix pattern:** for each, either render the missing input or delete the dead column + form-state. Prioritise the ones that are displayed (users see permanent "—") and the `NOT NULL` one (P15-1 causes hard errors).

### S6 · Print & CSV export lag the data model
The printable object record and the CSV export omit data SPECTRUM expects to be retrievable: exit history (6.6), damage & risk history (P15-7), disposal/deaccession section (20-MED, despite the sync comment claiming otherwise), rights records + newer rights fields (18-MED), reproduction history (21-LOW), structured dimensions (reads dead legacy `dimensions` → "—"), and most Professional-tier cataloguing/valuation depth. The insurance schedule print is built on `objects.estimated_value`, a field Professional users can't edit, ignoring the valuations table entirely (P13-1).
**Fix pattern:** add the missing sections to `app/print/object/[id]` and columns to `app/api/export/objects`; share one structured-dimensions helper with the public page; point the insurance schedule at `valuations`.

---

## Part 3 — Other notable High findings (not covered by a pattern)

- **Multi-currency is unwired (X1, HIGH).** `fx_rates` + `getCollectionValue(rates)` exist, but every dashboard stat (valuation total, insurance coverage, damage costs, insurance print) sums raw amounts across mixed currencies with a hardcoded "£". Load cached rates once and pass them in.
- **No cross-collection register for Rights (18) or Reproduction (21).** Both live only on object tabs; "which licences expire this year?" / "what reproduction requests are pending?" are unanswerable, and there's no nav route. Expiring rights are surfaced nowhere. Add `/dashboard/rights` and `/dashboard/reproductions` (or a combined page) with expiry/pending stats.
- **Collection-level risks can't be created (P14-1, HIGH).** Schema supports `object_id NULL` and the register renders a "Collection-wide" cell, but the only creation UI is the per-object RiskTab — so fire/flood/theft risks to the whole collection (the core of Proc 14) are unrecordable. Add an "Add risk" form on `/dashboard/risk`.
- **`deaccession_protected` is bypassable (20-HIGH).** Enforced only in the single-object delete path; the dashboard row-delete, bulk "Move to bin", `bulkUpdateStatus`, and the Overview status select all ignore it — a completed-disposal object can be un-deaccessioned or binned. Also wedges the 90-day bin purge (FK `ON DELETE RESTRICT`). Enforce via a BEFORE UPDATE/DELETE trigger.
- **RLS plan-gate vs free-tier UI mismatch (X2, HIGH).** `condition_assessments`/`valuations` INSERT is blocked below Professional, but the object page shows those tabs to Community/Hobbyist and Community markets "Value & condition tracking"; logging fails at the DB. ConditionTab swallows the error silently (P10-1). Either exempt those two tables or hide the forms below Professional, and add a catch+toast.

---

## Part 4 — Navigation & cross-cutting UX

- **N1 (HIGH) · 17-item flat sidebar, no SPECTRUM grouping** (`Sidebar.tsx:296-313`); "Deleted Objects" sits inside the procedures list. Regroup into Object Lifecycle / Location & Care / Accountability / Use, with collapsible headers.
- **N2 (HIGH) · The compliance overview is buried.** A genuine per-procedure scoreboard already exists in `/dashboard/docs` (`ComplianceRow`, "Overall Compliance Score") but is labelled "Documentation Plan" and sits last. Surface it as "Compliance Overview" near the top, or as a card on `/dashboard`.
- **N3 (HIGH) · The 21-procedure index is marketing-only and unreachable from the app** (`/app/compliance`), and there's no upgrade onboarding — a new Professional user gets 15 new sidebar items with no orientation. Link it from the dashboard + add a one-time "you now have all 21 procedures" checklist.
- **N4 (HIGH) · Broken button/tooltip styling from a bad find/replace.** ~40 primary buttons carry two conflicting `hover:bg-*` classes (undefined winner); worse, the **Learn Mode tooltip itself** is visually broken (amber-on-amber label, mismatched dark arrow, low contrast) — `LearnTooltipOverlay.tsx:128,132,142`. Extract one `<PrimaryButton>`, restore the tooltip's original `bg-stone-900 text-white`.
- **N5 (HIGH) · All registers load every row client-side; possible silent 1,000-row truncation.** `/dashboard`, `/dashboard/docs` (21 unbounded queries), and the sidebar export pull whole tables with `select('*')`; there are 2 `.limit()` and 0 `.range()` calls in the whole dashboard tree. PostgREST's default `max_rows` is 1,000 — **no `max_rows` override exists in the repo**, so at >1,000 objects the collection list, compliance denominators, and JSON export may be **silently truncated** for exactly the Institution-sized museums the tier targets. Verify `db.max_rows` in the Supabase project; add server-side pagination + `count`-based metrics. (Upgrades to Critical if `max_rows` is unraised.)
- **N6 (MED) · AuditTab is also orphaned** (like EntryTab) — no per-object inventory history; the Audit register links to `?tab=location` instead.
- **N7 (MED) · Learn Mode is absent on all 26 register pages** and has 3 dangling keys (`dashboard.on_public_site`, `.collection_value`, `.col.public`) that silently render nothing.
- **N8 (MED) · 4 registers lack object click-through** (Insurance, Disposal, Use, Collections Review); no global search of register records; no per-object "activity/history" view; no "back to register" from an object.
- **N9 (MED) · No reminder crons (X3).** Nothing emails owners about condition re-checks, valuation validity, insurance renewals, or risk reviews — all "alerts" compute only on page visit.
- **N10 (MED) · Tab state not written to URL**; `fullMode`+`ui_mode='simple'` strands 6 tabs on desktop; help modal advertises an "N" shortcut whose hook is never imported.

---

## Implementation plan

Six phases, ordered so each unblocks the next. Effort is engineering-days for one developer; ✅ = ship behind existing plan gates, no new infra.

### Phase 0 — Schema reconciliation (prerequisite) · ~1–2 days
Do this first; everything else assumes the repo can rebuild prod.
1. Dump live schema; diff against `supabase/`.
2. Commit missing migrations: `documentation_plans.status/created_at` (+ drop UNIQUE); CREATE TABLE + RLS for `emergency_plan_documents`, `insurance_policy_documents`, `disposal_record_documents`; `locations`/`location_history` column rename + `location_code`/`authorised_by`; `conservation_treatments.treatment_name/images`; repoint `audit_records.exercise_id` FK to `audit_exercises`.
3. Add `UNIQUE (museum_id, <reference>)` indexes for entry/exit/loan/rights/use/valuation/damage/review/disposal (supports S2).
4. **Verify `db.max_rows`** in Supabase; raise it or commit to pagination (N5).

### Phase 1 — Criticals + the data-loss bug · ~2–3 days ✅
5. C1 Use of Collections `reference → use_reference` + error toast.
6. C2 wire `EntryTab` into object tabs + unknown-tab fallback; fixes the entry lifecycle, receipt fields, promote deep-link.
7. C3 fix the Location register embed.
8. S2(a) — replace every `.eq(ref).single()` re-fetch with `.insert().select('id').single()` (Valuation, Damage, Exit) — stops silent document loss.
9. P15-1 require `discovered_date` (stops hard Postgres errors on damage submit).

### Phase 2 — Edit/void everywhere (pattern S1) · ~4–6 days ✅
10. Build one reusable editable-detail component; roll out edit + status transitions to Exits, Loans (incl. renewal/Extended + Cancel), Emergency plans & events, Use, Review, Rights, Disposal (+ Rejected/Cancelled), Reproduction, Condition, Valuation, Insurance, Risk, Damage.
11. Add the CHECK-constraint statuses this unblocks (`Extended`, `Rejected`, `Cancelled`, `Claimed`).

### Phase 3 — Capturable fields + lifecycle links (S5, S4) · ~4–5 days ✅
12. Render the missing inputs: valuation basis/method/purpose; audit method; conservation outcome/condition-after + before/after stage; acquisition legal-transfer-date + location-after-accessioning; damage claim outcome; emergency plan-last-tested + salvage-equipment + ranked salvage priorities; collection-level risk form (P14-1); production/attribution cataloguing card. Delete any genuinely unwanted dead columns instead.
13. Wire lifecycle links: exit↔status, loan-in↔exit, disposal↔exit, entry-return↔exit, damage↔conservation/insurance, emergency↔risk/damage.
14. Enforce `deaccession_protected` via a DB trigger (20-HIGH).

### Phase 4 — Retrievability: registers, print, export, currency (S6, X1) · ~4–5 days ✅
15. Add `/dashboard/rights` and `/dashboard/reproductions` registers with expiry/pending stats + nav entries.
16. Extend `app/print/object/[id]` (exit, damage, risk, disposal, full rights, reproduction, structured dimensions) and `app/api/export/objects` (drop dead Marks; add dimensions + procedure history); point insurance schedule at `valuations`.
17. Wire multi-currency: load cached `fx_rates`, pass `{rates,target}` into all value aggregations; per-currency or converted totals.
18. Add the daily reminder cron (condition/valuation/insurance/risk dates) → owner email (N9).

### Phase 5 — Navigation & UX polish · ~3–4 days ✅
19. Regroup the sidebar (N1); surface Compliance Overview (N2); link the 21-procedure index + add upgrade onboarding checklist (N3).
20. Extract `<PrimaryButton>`, strip conflicting hover classes, fix the Learn tooltip (N4); add Learn Mode to register pages + fix dangling keys (N7).
21. Wire AuditTab (N6); add object↔register cross-links, per-object activity/history tab, URL-synced tabs, register object click-throughs (N6/N8/N10).
22. Server-side pagination for large collections if Phase-0 verification showed truncation (N5).

**Rough total:** ~18–25 developer-days. Phases 0–1 (the correctness-critical block) are ~4–6 days and should ship first; they stop active data loss and make three dead procedures work. Phases 2–3 remove the "can't fix a mistake / can't record the outcome" class that a real registrar hits daily. Phases 4–5 are retrievability and polish.

### Update needed to earlier docs
`SPECTRUM-MAPPING.md` marks several of these fields "✅ Fully implemented / Gaps: None" (`condition_after`, `valuation_basis`, `specific_issues`, before/after images, ranked salvage priorities). It should be corrected to match this audit, or it will keep masking these gaps.
