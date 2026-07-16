# Plan — remaining audit items (O12, N3, 4.9)

Follow-on to `fix-plan-2026-07-16.md`, whose seven phases shipped on 16 July. This covers the three items deliberately left open there. **Item 4 (dashboard compliance card) is explicitly out of scope** — it needs the RPC/materialized-view refactor to be worth doing, and is parked.

None of these is a bug. Nothing is broken, failing silently, or losing data — that class was cleared on 16 July. This is one genuine feature (C), two polish items (A, B), and one traceability gap (D).

**Ground rules** (same as part 1):
- **No new copy may mention Spectrum.** This bites hardest here: A, B and C are all *copy-heavy*, and the licensing constraint applies to Learn descriptions, checklist text, and anything linking to `/compliance`. Register names in plain museum vocabulary only. See the `spectrum_constraint` memory.
- Each phase = one branch; typecheck + `npx vitest run` + drive the real flow before merge.
- Any DB change ships as an idempotent file in `supabase/` **and** gets applied to production in the same session. The July failure mode was deferring a migration and never writing it.

---

## Phase A — Link the procedure index in-app (part of N3) · ~15 min

**The gap.** `/compliance` — the register index — is linked from `components/PublicFooter.tsx` and **nowhere inside the app** (verified: no `/compliance` references under `app/dashboard` or `components/Sidebar.tsx`). A paying Professional user cannot reach the page describing what they pay for.

**The work.** Add a link from `/dashboard/docs` (Compliance & Documentation) to `/compliance`. That page is the natural home — it already hosts the scoreboard, and the index explains what the scoreboard measures.

**Watch:** `/compliance` is a dark marketing page (`text-white`, its own shell). Opening it from inside the app is a jarring context switch. Prefer `target="_blank"` so the dashboard isn't replaced, or accept the jump. Do **not** restyle the marketing page for the app — that's a much bigger job pretending to be a link.

Ship this first. It's the highest value-per-minute item on the list.

---

## Phase B — Learn Mode on register pages (O12) · ~0.5–1 day

**The gap.** Learn Mode is `data-learn="key"` attributes resolved against `learnDescriptions` (184 keys, `lib/learn-descriptions.ts`) and rendered by `components/LearnTooltipOverlay.tsx`, which hit-tests with `target.closest('[data-learn]')`.

Verified coverage: **16 files carry `data-learn`, and every one is an object tab** (Overview, Condition, Valuation, Loans, Exits, Rights, Entry, Damage, Risk, Conservation, Audit, Acquisition) plus the Sidebar, the overlay itself, and the marketing homepage. **Every register page has zero:** valuation, disposal, insurance, risk, damage, locations, entry, loans.

So the teaching layer switches off exactly when a registrar moves from one object to the whole collection.

**Key strategy — decide before writing any copy.** Existing namespaces are already domain-scoped (`damage.*` 9 keys, `valuation.*` 8, `risk.*` 6, `loans.*` 10, `condition.*` 9 …), but those describe *object fields*.

- **Reuse** an existing key where the register column means the identical thing (the damage register's "Severity" column is `damage.severity`). Costs nothing, stays consistent.
- **Add `register.<page>.<thing>`** only for genuinely register-level concepts that have no object-tab equivalent — chiefly the **stat cards** ("Open Reports", "Total Repair Cost", "Overdue Returns") and register-wide filters.

This keeps new copy to a minimum and avoids two descriptions drifting apart for one concept.

**The work.**
1. Audit each of the 8 register pages: list its columns and stat cards, mark each *reuse* or *new*.
2. Add `data-learn` to column headers (`<th>`) and stat cards.
3. Write the new `register.*` entries, including the `technical` block (`table`, `column`, `practice`) the existing entries carry.
4. Spot-check hover behaviour on 2–3 registers — the overlay uses `closest()`, so an attribute on a `<th>` covers its text.

**Effort is mostly copy, not code.** The mechanical part is an hour; writing descriptions a registrar actually benefits from is the rest.

---

## Phase C — Upgrade onboarding checklist (N3) · ~1 day · the only real feature here

**The gap.** A Community/Hobbyist user upgrades → the Stripe webhook flips `museums.plan` → on the next dashboard load they face ~15 new sidebar items across five new groups (Object Lifecycle / Location & Care / Value & Rights / Accountability / …) with no orientation. `app/onboarding/page.tsx` (427 lines) only handles *initial* signup and plan choice; there is no upgrade path in it at all.

This is the activation moment immediately after someone starts paying. It's the one item on this list with money attached.

**Design decisions — resolve these first.**

1. **Where the "seen" flag lives.** The codebase's existing dismissal pattern is `localStorage` (`discover-banner-dismissed`, `cookie-consent`, `learnMode`). **Recommend a DB column instead:** `museums.upgrade_checklist_seen_at timestamptz`. localStorage is per-device, so the checklist would reappear on the user's laptop after they dismissed it on their desktop — bad for a once-ever welcome. `museums` already carries this shape of flag (`reengage_*_sent_at`, `trial_used_at`).

2. **Trigger condition.** Do **not** try to detect the upgrade event (there's no `plan_changed_at`; `museums` has only `plan, pending_downgrade_plan, ui_mode, trial_used_at, stripe_connect_onboarded`). Instead: *show it to any `fullMode` museum whose `upgrade_checklist_seen_at` is null.* Simple and self-healing.

3. **Backfill — important.** That trigger would show a "welcome to Professional" checklist to **existing** paying customers. There are currently **2 fullMode museums** (1 institution, 1 professional). The migration must backfill `upgrade_checklist_seen_at = now()` for existing fullMode museums so only *future* upgraders see it. Cheap now, embarrassing if missed.

4. **Content.** A short checklist of what the tier unlocks, each linking to the relevant register — e.g. record an object entry, log a condition assessment, set up locations, record a valuation, review the documentation plan. **Plain vocabulary, no Spectrum, no procedure counts.** Link to `/compliance` (Phase A) for the full index.

**The work.**
- Migration: `upgrade_checklist_seen_at` + backfill existing fullMode museums.
- `components/UpgradeChecklist.tsx`: dismissible card on `/dashboard`, gated on `fullMode && !seen`, owner/Admin only (match the discover banner's `isOwner || staffAccess === 'Admin'` gate).
- Dismiss → write the timestamp, hide.
- Optional stretch: tick items already done (they have objects, a valuation, etc.). **Costs queries** — the dashboard is already the page I paged in Phase 3. If done, derive ticks from data already fetched there; do not add queries.

---

## Phase D — Emergency ↔ risk / damage linkage (4.9) · ~0.5–1 day

**The gap (verified against the live schema).** `emergency_events` columns: `id, museum_id, plan_id, event_reference, event_type, event_date, description, response_taken, damage_summary, lessons_learned, status, notes, created_at`. Damage is a **free-text `damage_summary`**. `risk_register` has **no** emergency/damage FK. `damage_reports` has no emergency FK (its `object_status_after_event` describes the object, not the incident).

So a flood damaging twelve objects is recorded as prose in `damage_summary`, plus twelve damage reports with no link back to the flood — while the "flood" risk sits Open in the risk register, never learning it materialised.

**Why this ranks last:** unlike disposal→exit, *nothing required is missing*. The free-text summary is a crude but real record. This buys traceability in the module you hopefully use least.

**Two findings that make it cheaper than expected.**
- **`emergency_event_objects` already exists** — an event already records its affected objects (`app/dashboard/emergency/page.tsx:162,346`). That junction is the bridge; no new "which objects?" UI is needed.
- **Damage reports are only creatable from an object's Damage tab** — the `/dashboard/damage` register is read-only and links through (`damage/page.tsx:258`). So do **not** build a second create form on the emergency page. Deep-link instead, exactly like the existing entry-promote flow (`entry/page.tsx` → `?tab=entry`).

**The work.**
1. Migration: `damage_reports.emergency_event_id uuid REFERENCES emergency_events(id) ON DELETE SET NULL` (+ partial index). `ON DELETE SET NULL`, not CASCADE — a damage report is a real historical record that must outlive the event row, same reasoning as `related_disposal_id`.
2. Optional `emergency_events.risk_id uuid REFERENCES risk_register(id) ON DELETE SET NULL` — "this event is risk X materialising".
3. From an event's affected-object list, per object: **"Log damage →"** deep-linking to `/dashboard/objects/<id>?tab=damage&event=<eventId>`.
4. `DamageTab` reads `?event=`, prefills what it can from the event (date, a type mapped from `event_type` — Fire/Flood/Water Damage/Vandalism map cleanly onto damage types), and sets `emergency_event_id` on insert.
5. On the event: show "N damage reports linked", each clicking through.
6. If `risk_id` is set, surface the link both ways so a materialised risk is visible from the risk register.

**Leave `damage_summary` in place.** It's the human narrative of the incident; the linked reports are the itemised record. They complement each other — don't migrate one into the other.

---

## Order, effort, and what to decide

| Phase | Item | Effort | Why this order |
|---|---|---|---|
| **A** | `/compliance` linked in-app | ~15 min | Highest value per minute; Phase C links to it |
| **B** | Learn Mode on 8 registers | ~0.5–1 day | Mostly copy; no dependencies |
| **C** | Upgrade checklist | ~1 day | The only revenue-adjacent item; wants A done first |
| **D** | Emergency ↔ risk/damage | ~0.5–1 day | Lowest value; cheapest if done after nothing |

**Total ≈ 2–3 developer-days.**

If you want a different order: **A → C → B → D** puts the money item earliest and leaves the polish last. **A → B → C → D** (above) front-loads the cheap, low-risk work. I'd take A → C → B → D.

**Decisions I need from you (or I'll take the recommendation):**
1. **Phase B key strategy** — reuse existing domain keys + add `register.*` only for stat cards? *(recommended)*
2. **Phase C flag** — DB column `upgrade_checklist_seen_at` rather than localStorage? *(recommended — localStorage reappears per-device)*
3. **Phase C backfill** — set the flag on the 2 existing fullMode museums so current customers don't get a welcome popup? *(recommended yes)*
4. **Phase C ticks** — derive completed items from data the dashboard already fetches, or ship a static checklist? *(recommend static first; ticks only if free)*
5. **Phase D risk link** — include the optional `emergency_events.risk_id`, or damage-only? *(recommend include; it's one column and closes the loop)*
6. **Phase A** — open `/compliance` in a new tab? *(recommended — it's a dark marketing page, not app chrome)*
