# SPECTRUM 5.1 Audit — Remediation Verification + Full Re-review

**Date:** 16 July 2026
**Baseline:** HEAD `3d4980c`. Previous audit: `spectrum-audit-2026-07-06.md` (HEAD `656effc`). The July remediation (Phases 0–5, commits `cf3c7eb..043755a`) landed between the two.
**Scope:** All 21 SPECTRUM 5.1 procedures + systemic patterns S1–S6 + nav/UX N1–N10 + regression sweep of features shipped since (messaging inbox, staff role management, re-engagement cron, admin changes, legal bare routes, What's New).
**Method:** Five parallel code-level reviews, every claim cited to `file:line`, cross-checked against `supabase/*.sql` and `lib/database.types.ts`, plus **live-database verification** (information_schema / pg_indexes / pg_roles queries, read-only). Internal document — never ship or quote any of this in product copy.

---

## Verdict

The July remediation was **largely real**: of the ~40 tracked findings, roughly **three-quarters are verifiably fixed**, including all 3 Criticals (Use of Collections inoperative, EntryTab orphaned, Location register empty), the silent document-loss bug, edit/void across every register, the schema reconciliation, the reminders cron, currency conversion on most surfaces, print coverage for exits/damage/disposal/valuations, and the deaccession trigger. Procedures 2, 4, 9, 11, 12, 13, 16, 17, 19, 21 are now in genuinely good shape.

But the audit found:

1. **One Critical business finding that isn't a code bug:** the Spectrum-removal work was never merged. The live site still carries all the licensing-risk copy.
2. **The remediation quietly skipped items it claimed:** the reference-numbering migration (Phase 0 item 3) was never written; Phase 5's N2/N3/N5/N7 items weren't done; disposal→exit / entry-return→exit / loan-in→exit lifecycle links (Phase 3 item 13) weren't wired.
3. **A handful of new bugs introduced by the remediation itself** — two of them High.
4. **The N5 row-cap risk is now confirmed against the live DB** — no `max_rows` override exists, so the 1,000-row PostgREST default applies to every unbounded dashboard query.

**Counts:** 1 Critical (business/legal) · 5 High · ~14 Medium · ~10 Low.

---

## Part 0 — CRITICAL: the Spectrum-removal branch was never merged

`fa8a001` "Remove all Spectrum references from shipped code and content" (14 July) sits on `feature/remove-spectrum-claims`, pushed to origin, **not merged to main**. Main (= production, via Vercel) still contains "Spectrum" in **17 shipped files**, including:

- `app/page.tsx:312,408,443` — homepage ("Spectrum-aligned compliance tools", "21 Spectrum compliance procedures")
- `app/compliance/page.tsx:8,10,560,574` — meta title/description + body
- `lib/plans.ts:137,178,214` — pricing feature bullets ("21 Spectrum-aligned procedures")
- `app/llms.txt/route.ts:25,34` — actively fed to AI crawlers
- `lib/whatsNew.ts:50,64` — in-app changelog; `lib/segments.ts:3227,3229` — public FAQ copy
- `lib/learn-descriptions.ts` (~90 `spectrum:` strings) rendered in-app via `components/LearnTooltipOverlay.tsx:163`
- `components/tabs/RightsTab.tsx:291,353` ("Spectrum-compliant" helper text), `app/dashboard/docs/page.tsx:812` (placeholder), condition-report tool copy

Verified: at `fa8a001` the same grep over `app/ components/ lib/ public/ content/` returns **0 files**. The branch is complete and **merges cleanly into current main (0 conflicts)**.

**Action: merge `feature/remove-spectrum-claims` and deploy.** This is a one-command fix for the audit's only Critical. Side benefit: it rewrites `lib/learn-descriptions.ts`, which also disposes of the wrong-procedure-number tooltip findings below (the "Spectrum: Procedure N" line is removed entirely).

> Note for the record: the tooltip numbering on main is systematically wrong anyway (e.g. Object Exit labelled "Procedure 16", Valuation "13", Use of Collections "10", Deaccession "17", Documentation Planning "21" — a mix of +1 offsets and swaps). If the merge were ever *not* taken, this would need fixing on its own; after the merge it's moot.

---

## Part 1 — Live-database verification results

| Check | Result | Consequence |
|---|---|---|
| `object_exits.returned_date` / `returned_condition` in prod | **Present** | The exit-return migration WAS applied. The 6.2 "Mark returned" fix works in production. `lib/database.types.ts` is merely **stale** (columns missing at :2350-2416) — regenerate types. |
| `pgrst.db_max_rows` override on `authenticator` role | **None** (only safeupdate/timeouts set) | PostgREST default **1,000-row cap confirmed live**. See N5 below. |
| UNIQUE indexes on any reference column (entry/exit/loan/use/rights/review/disposal/valuation/damage) | **None** | S2 confirmed at DB level — no collision guard exists in production. |
| `emergency_plan_documents` / `insurance_policy_documents` / `disposal_record_documents` | All present, **RLS ON** | S3 reconciliation genuinely applied. |

---

## Part 2 — July-finding scorecard

### Fixed and verified (with evidence)

| Finding | Evidence |
|---|---|
| C1 Use of Collections inoperative | `collections-use/page.tsx:187` inserts `use_reference`; errors surfaced `:178,:190` |
| C2 EntryTab orphaned | imported + in TABS + rendered, `objects/[id]/page.tsx:13,32,615`; unknown-tab fallback `:70` |
| C3 Location register embed | `locations/page.tsx:94-99` — bad embed gone, renders real columns |
| S2(a) doc-loss `.eq(ref).single()` re-fetch | eliminated everywhere — all inserts use `.insert().select('id').single()` (Exits :124, Loans :91, Valuation :67, Damage :134, Rights :95, Repro :186) |
| S1 edit/void everywhere | verified across Exits, Loans (+Extended/Cancelled), Condition, Conservation, Valuation, Insurance, Emergency, Damage, Risk (object-level), Use, Review, Rights, Repro, Disposal (+Rejected/Cancelled) — correct `.eq('id',…)` filters + error handling. *(No shared component was built — rolled out per-page; functionally fine.)* |
| S3 schema reconciliation | `schema-reconciliation-2026-07-06.sql` covers every listed drift; confirmed applied live (Part 1) |
| P10-1 silent RLS swallow | try/catch + toast, `ConditionTab.tsx:103,137` |
| P11-1/2/5 conservation outcome / before-after images / schema | `ConservationTab.tsx:396,404,472`; reconciliation :173-175 |
| P12-1/2/3/7 valuation basis/method/purpose + edit | `ValuationTab.tsx:73,258,264-273,94-143` |
| P13-1/3 insurance schedule reads valuations; policies editable | `print/insurance/page.tsx:68-97,207-211`; `insurance/page.tsx:188-250` |
| 15.1/15.5/15.2/15.3 emergency fields, ranked salvage, edit | `emergency/page.tsx:711,716,356-383,232-342` |
| P14-1 collection-level risk creation | `risk/page.tsx:72-91,199-259` *(but see new bug below)* |
| P15-1/2/3 damage date guard, doc-loss, edit | `DamageTab.tsx:105,129,134-144,64-160` *(minor button-state bug below)* |
| A1/A2 acquisition fields | `AcquisitionTab.tsx:130-138`; persisted + printed |
| 19-HIGH audit method; N6 AuditTab; exercise FK | `audit/page.tsx:346-351`; `objects/[id]/page.tsx:27,44,659`; reconciliation :181-197 |
| 20-HIGH deaccession trigger | BEFORE UPDATE trigger + `search_path=''` (99e1bab) + FK RESTRICT backstop |
| 18/21-HIGH rights + reproduction registers | `/dashboard/rights`, `/dashboard/reproductions`, in nav `Sidebar.tsx:378-379`, expiry/pending stats |
| C1-cat dimensions in print/CSV; Marks emptied | `print…:105` via `formatDimensions`; `export…:119`; Marks column dropped, merged into inscription |
| 6.1 permanent exit → status | `ExitsTab.tsx:145-148` sets Deaccessioned for Disposal/Sale/Transfer |
| 6.2 temp exit close | `ExitsTab.tsx:108-116` + live columns confirmed |
| 6.6 exit + loan history in print | `print/object/[id]/page.tsx:151-159,196-208` |
| 9.1 documentation_plans schema; multi-plan + archive | reconciliation §1; `docs/page.tsx:474-490` |
| Loan renewal / Extended / Cancelled | `LoansTab.tsx:204-228`; `status-check-constraints-expand-2026-07-06.sql` |
| X1 currency (3 of 5 surfaces) | valuation register `valuation/page.tsx:104,115`; insurance coverage `insurance/page.tsx:314`; insurance print `print/insurance/page.tsx:97` |
| N1 sidebar regrouped | `Sidebar.tsx:331-401` (9 logical groups) |
| N4 tooltip contrast + double-hover classes | `LearnTooltipOverlay.tsx:128-136`; conflicting classes gone |
| N9 reminders cron | `vercel.json` + `api/cron/compliance-reminders/route.ts` — CRON_SECRET-gated, correct columns, sends via Resend |
| N10 URL-synced tabs + simple-mode stranding | `objects/[id]/page.tsx:66-79,554` |
| N7 dangling learn keys | defined at `learn-descriptions.ts:157,162,167` |

### Still open (carried from July)

| # | Finding | Sev | Where |
|---|---|---|---|
| O1 | **S2: no UNIQUE reference indexes anywhere** (repo *and* live DB) — the promised "Phase 2 reference-numbering migration" was never written (`schema-reconciliation-2026-07-06.sql:11-14` defers to it) | High | supabase/ |
| O2 | **S2: object-tab reference generation still per-object** — every object's first record collides: `ExitsTab.tsx:122`, `LoansTab.tsx:90`, `DamageTab.tsx:132`, `ValuationTab.tsx:65`, `RightsTab.tsx:94`, `ConditionTab.tsx:86`, `ConservationTab.tsx:204`. (Register *pages* — entry, use, review, disposal — were correctly moved to museum-wide numbering.) No doc loss anymore, but refs are non-unique on the new cross-collection registers. | High | 7 object tabs |
| O3 | **N5: unbounded queries + 1,000-row cap — now CONFIRMED live.** 0 `.range()` in the dashboard tree; `docs/page.tsx:151-172` fires 20 uncapped queries. At >1,000 objects the collection list, every compliance denominator, and exports silently truncate — exactly the Institution-tier scale. | High | dashboard-wide |
| O4 | **7.2/7.3: loan-IN still sets borrowed object to "On Loan"** — `LoansTab.tsx:93-96,635` write `status:'On Loan'` with no `direction` check | High | LoansTab |
| O5 | S4 lifecycle links still missing: disposal→exit (`disposal/page.tsx:267-286`), entry-return→exit/status (`EntryTab.tsx:117-136`), loan-in end→exit (`confirmEndLoan` `LoansTab.tsx:236-251` — also sets returned *inbound* loans to "Storage", wrong, and writes `moved_by:''`), damage→conservation/insurance (claim ref still free text), emergency↔risk/damage | Med | multiple |
| O6 | X2: Condition/Valuation tabs shown to Community/Hobbyist whose RLS blocks INSERT (`SIMPLE_TABS` `objects/[id]/page.tsx:47` vs `compliance-rls-plan-gate.sql:95-108,261-274`). No longer *silent* (toast added) but still a dead-end; Community still markets "Value & condition tracking" (`plans.ts:64`) | Med | tiers |
| O7 | N2: compliance scoreboard still buried in `/dashboard/docs` under "Documentation Plan" (`docs/page.tsx:604-640`); N3: no in-app link to the procedure index, no upgrade onboarding | Med | nav |
| O8 | S6 print gaps: risk history and reproduction history absent from `print/object/[id]`; rights section prints object-level fields only, not `rights_records` (18-MED) | Med | print |
| O9 | S6 export gaps: CSV is a flat object export — no exit/loan/disposal/rights/repro/use/review history; new production/attribution fields also missing (`export…route.ts:104-112`) | Med | export |
| O10 | Proc 3: temporary internal move not capturable — `LocationTab.addLocation` (`LocationTab.tsx:339-346`) writes no `move_type`/`expected_return_date`/`reason`, so the register's Move Type/Expected Return/Overdue stats populate only from Exits | Med | LocationTab |
| O11 | P10: `location_on_object`/`specific_issues`/`priority` were resolved by **removal** — now dead nullable columns, fields uncapturable | Low | ConditionTab |
| O12 | N7: Learn Mode still absent on register pages (valuation, disposal, etc.) | Low | registers |
| O13 | Use of Collections `outcome` only settable via `window.prompt` at completion; not in the edit form — typo uncorrectable after (`collections-use/page.tsx:227`) | Low | collections-use |

---

## Part 3 — New bugs introduced since 6 July

| # | Finding | Sev | Where |
|---|---|---|---|
| B1 | **`maker_name`/`maker_role` don't round-trip.** The new Production & Attribution card renders them (`OverviewTab.tsx:737,742`) and saves work, but `objects/[id]/page.tsx` never initialises/loads either field (0 grep hits) — stored values never display; edits appear to vanish on reload. Looks like data loss to the user. The other 4 fields (production_place, technique, school_style_period, subject_depicted) round-trip fine. | **High** | objects/[id] |
| B2 | **Main dashboard Collection Value ignores currency.** `dashboard/page.tsx:298` calls `getCollectionValue(objects, valuations)` without `{rates, targetCurrency}` → mixed-currency collections sum raw. Highest-traffic stat in the app; the X1 fix missed it. | **High** | dashboard |
| B3 | Damage register repair-cost total also unconverted; labelled with first record's currency (`damage/page.tsx:141-143`) | Med | damage register |
| B4 | **Collection-wide risks are create-only.** The new form inserts `object_id: null`, but rows only navigate when `object_id` is set (`risk/page.tsx:307`) — no edit/status/delete/detail for collection risks; they're stuck "Open" forever and permanently inflate the Open Risks stat. | Med | risk register |
| B5 | **Deleting a Completed disposal wedges the object.** Delete button is unconditional (`disposal/page.tsx:542`); removing the row leaves `status='Deaccessioned'` + `deaccession_protected=true`, and the trigger's error says "Reverse the disposal in the Disposal register first" — but the register row is gone. No UI path out; FK RESTRICT protection also gone. | Med | disposal |
| B6 | Exit-deaccession path doesn't set `deaccession_protected` (contrast `disposal/page.tsx:281`), so exit-deaccessioned objects aren't guarded by the trigger; and `saveExitEdit` never re-fires status side-effects when a reason is edited into Sale/Disposal/Transfer (`ExitsTab.tsx:71-97,145-148`) | Low | ExitsTab |
| B7 | `returned_condition` column exists (live) but the UI never writes it — `markReturned` sets only `returned_date` (`ExitsTab.tsx:111`) | Low | ExitsTab |
| B8 | Damage submit button's `disabled` omits `discovered_date` while the handler requires it → enabled button, silent no-op click (`DamageTab.tsx:274` vs `:105`) | Low | DamageTab |
| B9 | `lib/database.types.ts` is stale vs live DB (missing `object_exits.returned_date/returned_condition`) — regenerate to keep type-checking honest | Low | types |
| B10 | Duplicate "Record Inventory Check" card on both LocationTab and AuditTab of the same object | Low | UX |

## Part 4 — New-feature regression sweep (shipped 8–14 July)

| Feature | Verdict |
|---|---|
| Messaging inbox | **Clean.** Deny-by-default RLS (no client INSERT/UPDATE/DELETE policies; writes via service role); `accept_messages` opt-out enforced server-side on conversation start (`api/messages/route.ts:129-131`), replies intentionally exempt; role gate, self-message block, object-scope validation all present. |
| Staff role management | **Clean.** `STAFF_ACCESS_LEVELS` excludes Owner (`lib/validations.ts:15`) → no escalation path; museum-scoped; can't edit own access or self-delete. |
| Admin orphan signups | **Clean.** Server Component gated on `ADMIN_USER_ID`; service-role key never reaches the client. |
| Legal bare routes | **Clean.** `/legal/privacy` + `/legal/terms` unlinked from all on-site nav (App Store 3.1.3(f) requirement holds). |
| Re-engagement cron | Auth fine (CRON_SECRET), idempotent per stage. **Finding (Med): no unsubscribe/opt-out anywhere** — these are unsolicited marketing-ish emails to dormant users with no opt-out column or unsubscribe link (`api/cron/reengagement/route.ts`). UK PECR/GDPR exposure; add an unsubscribe link + suppression flag before this runs against real users. |

---

## Part 5 — Per-procedure scorecard (21/21)

| # | Procedure | Verdict | Blocking issues |
|---|---|---|---|
| 1 | Object entry | Partly works | entry-return→exit unwired (O5) |
| 2 | Acquisition & accessioning | **Works** | — |
| 3 | Location & movement | Partly works | temp-move fields uncapturable from LocationTab (O10) |
| 4 | Inventory | **Works** | duplicate form (B10, cosmetic) |
| 5 | Cataloguing | Partly works | maker round-trip (B1); fields not in print/CSV (O9) |
| 6 | Object exit | Partly works | ref collisions (O2); protect-flag + edit side-effects (B6) |
| 7 | Loans in | **Partly broken** | direction-blind "On Loan" (O4); no end→exit (O5) |
| 8 | Loans out | Works | ref collisions (O2) |
| 9 | Documentation planning | **Works** | scoreboard math truncates >1,000 objects (O3) |
| 10 | Condition checking | Works | dead columns (O11); free-tier RLS wall (O6) |
| 11 | Conservation | **Works** | — |
| 12 | Valuation | **Works** | free-tier RLS wall (O6) |
| 13 | Insurance & indemnity | **Works** | — |
| 14 | Emergency planning | Works | no risk/damage linkage (O5) |
| 15 | Damage & loss | Works | claim-ref free text (O5); button state (B8) |
| 16 | Use of collections | **Works** | outcome edit gap (O13) |
| 17 | Collections review | **Works** | — |
| 18 | Rights management | Works | RR- per-object refs (O2); not in print (O8) |
| 19 | Audit | **Works** | — |
| 20 | Deaccession & disposal | Works | no disposal→exit (O5); delete-wedge (B5) |
| 21 | Reproduction | Works | not in print (O8) |

Ten procedures fully clean, ten with non-blocking gaps, one (Loans in) with a genuinely wrong user-visible behaviour.

---

## Part 6 — Recommended actions, in order

1. **Merge `feature/remove-spectrum-claims` → main and deploy.** (Critical, ~0 effort, 0 conflicts. Kills the licensing exposure and the tooltip mislabels in one move.)
2. **B1 maker round-trip** — initialise/load `maker_name`/`maker_role` in `objects/[id]/page.tsx` (~15 min).
3. **B2 dashboard Collection Value** — pass `{rates, targetCurrency}` like every other call site (~15 min); do B3 damage totals at the same time.
4. **O4 loan-in status** — branch on `direction` before writing `'On Loan'`; decide correct status for borrowed objects (~30 min).
5. **Write the deferred reference migration (O1+O2):** museum-wide numbering in the 7 object tabs + `UNIQUE (museum_id, ref)` indexes + retry-on-conflict. Requires a one-time dedup pass on existing collided refs before the indexes can apply.
6. **O3 row cap:** either raise `db.max_rows` for the near term, or (better) move dashboard/docs/export to `count:'exact'` + paged queries. Decide before the first >1,000-object museum signs up.
7. **B4 + B5** — edit/close path for collection-wide risks; block deleting Completed disposals (or make delete reverse the object flags).
8. **Re-engagement unsubscribe** (legal hygiene) — suppression flag + link.
9. Lifecycle links batch (O5), then print/export completeness (O8/O9), then nav polish (O7), types regen (B9), and the Low items.

Items 1–4 are an afternoon and remove everything user-visible-broken. Item 5–6 are the two structural debts the July remediation deferred and quietly dropped.

---

## Corrections to earlier docs

- `spectrum-audit-2026-07-06.md`'s implied "Phases 0–5 shipped" is overstated: Phase 0 item 3 (ref indexes), Phase 3 item 13 (lifecycle links), Phase 4 item 16 (CSV history), and Phase 5 items N2/N3/N5/N7 were not delivered.
- The 6.2 exit-return fix IS live (the July "type drift = maybe unapplied" worry is resolved — only the generated types are stale).
