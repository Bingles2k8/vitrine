# Vitrine — Spectrum 5.1 Compliance Mapping

> Last updated: April 2026
> Spectrum version: 5.1 (Collections Trust)
> App version: current `main` branch

This document maps each Spectrum 5.1 procedure to its implementation in Vitrine, covering database schema, UI surfaces, and subscription tier requirements.

**Coverage summary:** All 21 Spectrum 5.1 procedures are implemented. Primary data entry procedures (1–8) are available on Professional and above; secondary procedures (9–21) are available on Institution and above unless noted.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented |
| 🟡 | Partially implemented |
| ❌ | Not implemented |
| 🔒 | Requires Professional plan |
| 🏛️ | Requires Institution plan |

---

## Procedure 1: Object Entry

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `entry_records`

| Field | Notes |
|-------|-------|
| `entry_number` | Auto-generated (EN-YYYY-NNN) |
| `entry_date` | Date object received |
| `entry_reason` | Acquisition / Loan / Enquiry / etc. |
| `entry_method` | How object arrived |
| `scheduled_return_date` | For temporary entries |
| `condition_on_entry` | Free text condition note |
| `depositor_name` | Who brought the object |
| `depositor_contact` | Contact details |
| `gdpr_consent` | GDPR consent flag |
| `gdpr_consent_date` | When consent was given |
| `object_description` | Description at point of entry |
| `object_count` | Number of items |
| `legal_owner` | Legal owner if different from depositor |
| `received_by` | Staff member who received |
| `terms_accepted` | Terms and conditions accepted flag |
| `terms_accepted_date` | When terms were signed |
| `receipt_issued` | Receipt issued flag |
| `receipt_date` | Date receipt sent |
| `quarantine_required` | Risk/biosecurity flag |
| `risk_notes` | Risk assessment notes |
| `outcome` | Final outcome of entry |
| `depositor_signed` | In-person signature obtained flag |
| `depositor_signed_date` | Date signed in person |
| `digital_acknowledgement` | Digital acknowledgement sent flag |
| `digital_acknowledgement_date` | Date of digital acknowledgement |

### UI

- **Per-object:** `EntryTab.tsx` — full form with GDPR consent tracking, receipt issuance, terms acceptance, and signature section (in-person or digital acknowledgement)
- **Central register:** `/dashboard/entry/` — lists all entry records with status
- **Receipt printing:** `/dashboard/entry/[id]/receipt/` — printable receipt; shows digital confirmation text if acknowledged digitally, blank signature line otherwise
- **Document attachments:** Supported (compliance-gated)

### Gaps

None identified.

---

## Procedure 2: Acquisition and Accessioning

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Fields on `objects` table:

| Field | Notes |
|-------|-------|
| `accession_no` | Unique accession reference |
| `accession_date` | Date formally accessioned |
| `acquisition_method` | Purchase / Gift / Bequest / Loan / etc. |
| `acquisition_source` | Where acquired from |
| `acquisition_justification` | Why object was acquired |
| `acquisition_documentation_ref` | Reference to supporting paperwork |
| `acquisition_value` | Value at time of acquisition |
| `acquisition_currency` | Currency for acquisition value |
| `conditions_attached_to_acquisition` | Legal or donor conditions |
| `acknowledgement_sent_to_donor` | Flag — donor thanked |
| `formally_accessioned` | Whether formally accessioned (default true) |
| `non_accession_reason` | Reason if not formally accessioned |

### UI

- **Per-object:** `OverviewTab.tsx` — acquisition section with all fields; accession status toggle (Formally accessioned / Not formally accessioned); if not formally accessioned, shows reason field instead
- **Document attachments:** Supported

### Gaps

No dedicated acquisition dashboard page; records accessed via object detail.

---

## Procedure 3: Location and Movement Control

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `location_history`

| Field | Notes |
|-------|-------|
| `object_id` | Object reference |
| `location` | Location (free text or structured name) |
| `moved_at` | Date/time of move |
| `moved_by` | Staff member |
| `move_type` | Permanent / Temporary / Return |
| `expected_return_date` | For temporary moves |
| `reason` | Movement reason/notes |

Table: `locations`

| Field | Notes |
|-------|-------|
| `location_code` | Mandatory unique code (Spectrum requirement) |
| `name` | Human-readable name |
| `building` | Building within site |
| `floor` | Floor level |
| `room` | Room identifier |
| `unit` | Shelving unit, cabinet, etc. |
| `position` | Specific shelf, bin, or slot |

### UI

- **Per-object:** `OverviewTab.tsx` — current location display; `ExitsTab.tsx` — records movements out
- **Central register:** `/dashboard/locations/` — Movement Register tab (all movements, filterable by type/object, CSV export) and Current Locations tab (objects grouped by location); overdue temporary move alert in page header

### Gaps

None identified.

---

## Procedure 4: Inventory

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `inventory_exercises` — formal planned inventory exercises
Table: `audit_records` — per-object audit check records

| Field | Notes |
|-------|-------|
| `object_id` | Object checked |
| `inventoried_at` | Date of check |
| `inventoried_by` | Staff member |
| `location_confirmed` | Location verified (text) |
| `condition_confirmed` | Condition at check |
| `discrepancy` | Any discrepancy noted |
| `notes` | Free text notes |

### UI

- **Central dashboard:** `/dashboard/audit/` — inventory statistics (never inventoried, overdue >12 months), searchable object grid, CSV export
- **Audit exercises:** Full exercise management with governance reporting

### Gaps

None identified.

---

## Procedure 5: Cataloguing

**Status:** ✅ Full
**Plan gate:** 🔒 Professional (basic); 🏛️ Institution (full cataloguing fields)

### Database

Fields on `objects` table (Spectrum-specific selection):

| Field | Notes |
|-------|-------|
| `title` | Object name/title |
| `maker_name` | Artist/maker |
| `maker_role` | Artist / Maker / Publisher / etc. |
| `production_date_early` | Date range start |
| `production_date_late` | Date range end |
| `production_date_qualifier` | Circa / After / Before / etc. |
| `production_place` | Place of production |
| `physical_materials` | Materials used |
| `technique` | Production technique |
| `school_style_period` | Art historical classification |
| `colour` | Colour description |
| `shape` | Shape description |
| `surface_treatment` | Surface treatment notes |
| `other_names` | Alternative titles/names |
| `full_description` | Long catalogue description |
| `dimension_height` | Height measurement |
| `dimension_width` | Width measurement |
| `dimension_depth` | Depth measurement |
| `dimension_weight` | Weight |
| `dimension_unit` | Unit for dimensions (cm/mm/in) |
| `dimension_weight_unit` | Unit for weight (kg/g/lb) |
| `dimension_notes` | Measurement notes/method |
| `object_type` | Type classification |
| `culture` | Cultural origin |
| `provenance` | Provenance narrative |
| `provenance_date_range` | Date range for provenance |
| `field_collection_info` | Archaeological/field collection details |
| `inscription` | Marks, signatures, inscriptions |
| `historical_context` | Historical background |
| `associated_person` | Associated individual |
| `associated_organisation` | Associated organisation |
| `associated_place` | Associated place |
| `credit_line` | Display credit line |
| `number_of_parts` | Number of parts/components |
| `record_source` | Who or what provided the catalogue record |
| `attributed_to` | Person/organisation responsible for the record |
| `attribution_notes` | Uncertainty, conflicting sources, research gaps |
| `record_completeness` | Minimal / Partial / Substantial / Complete |

Table: `object_components` — multi-part object tracking

### UI

- **Per-object:** `OverviewTab.tsx` — comprehensive cataloguing form covering all fields above, including Record Attribution section (source, attributed to, attribution notes, completeness level — fullMode only)

### Gaps

None identified.

---

## Procedure 6: Object Exit

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `object_exits`

| Field | Notes |
|-------|-------|
| `exit_number` | Auto-generated reference |
| `exit_date` | Date of exit |
| `exit_reason` | Loan / Return / Sale / Disposal / etc. |
| `recipient_name` | Who received the object |
| `destination_address` | Destination address |
| `transport_method` | How it was transported |
| `insurance_indemnity_confirmed` | Insurance check flag |
| `packing_notes` | Packing/condition notes |
| `exit_condition` | Condition when it left |
| `signed_receipt` | Receipt obtained flag |
| `expected_return_date` | For temporary exits |
| `exit_authorised_by` | Who authorised the exit |

### UI

- **Per-object:** `ExitsTab.tsx` — full exit form, temporary/permanent distinction, active loan picker, status management
- **Document attachments:** Supported

### Gaps

No dedicated central exit register page; exits accessed via object detail.

---

## Procedure 7: Loans In

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `loans` (direction = 'In')

| Field | Notes |
|-------|-------|
| `loan_number` | Auto-generated (LN-YYYY-NNN) |
| `direction` | 'In' |
| `borrowing_institution` | Institution we are borrowing from |
| `contact_name` / `contact_email` | Lender contact |
| `loan_start_date` | When loan begins |
| `loan_end_date` | When loan ends / expected return |
| `purpose` | Why we are borrowing |
| `insurance_value` | Declared value |
| `borrower_address` | Our address for legal record |
| `agreement_reference` | Loan agreement reference |
| `agreement_signed_date` | Date agreement was signed |
| `facility_report_reference` | Facility report reference |
| `environmental_requirements` | Climate/light requirements |
| `display_requirements` | Display specification |
| `courier_transport_arrangements` | Transport/courier details |
| `condition_arrival` | Condition when received |
| `conditions` | Any special terms |
| `status` | Requested / Active / Returned / Extended / Cancelled |

### UI

- **Central register:** `/dashboard/loans/` — loan register with In/Out/Overdue tabs, alerts for due-soon loans
- **Per-object:** `LoansTab.tsx` — loan form and history per object
- **Document attachments:** Supported

### Gaps

None identified.

---

## Procedure 8: Loans Out

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `loans` (direction = 'Out') — same fields as Loans In, plus:

| Field | Notes |
|-------|-------|
| `direction` | 'Out' |
| `condition_return` | Condition when returned |

### UI

- **Central register:** `/dashboard/loans/` — shared with Loans In, filtered by direction
- **Per-object:** `LoansTab.tsx` — direction selector, end loan workflow with return condition
- **Document attachments:** Supported

### Gaps

None identified.

---

## Procedure 9: Documentation Planning

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `documentation_plans` (one record per museum)

| Field | Notes |
|-------|-------|
| `plan_reference` | Reference number for the plan |
| `plan_date` | Date the plan was created/updated |
| `responsible_person` | Who is accountable |
| `documentation_standards` | Standards in use (default: 'Museum standards') |
| `systems_in_use` | CMS/systems used (default: 'Vitrine') |
| `review_date` | When plan is next due for review |
| `backlog_notes` | Free text backlog and outstanding tasks |

### UI

- Integrated into dashboard administration; no dedicated standalone page.

### Gaps

No dedicated `/dashboard/documentation/` page.

---

## Procedure 10: Use of Collections

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `collection_use_records`

| Field | Notes |
|-------|-------|
| `use_reference` | Auto-generated (CU-YYYY-NNN) |
| `object_id` | Object being used |
| `use_type` | Research / Exhibition / Photography / etc. |
| `requester_name` | Who is using it |
| `requester_org` | Requester's organisation |
| `purpose` | Stated purpose |
| `use_date_start` / `use_date_end` | Duration |
| `status` | Pending / Approved / In Use / Completed |
| `approved_by` | Who approved |
| `location_of_use` | Where it will be used |
| `information_generated` | Notes on research output |
| `reproduction_request_id` | Link to reproduction request if applicable |

### UI

- **Central dashboard:** `/dashboard/collections-use/` — full status workflow, stats (pending/in-use/completed)

### Gaps

None identified.

---

## Procedure 11: Condition Checking and Technical Assessment

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `condition_assessments`

| Field | Notes |
|-------|-------|
| `assessment_reference` | Reference number |
| `object_id` | Object assessed |
| `assessor` | Conservator/assessor |
| `assessed_at` | When assessed |
| `grade` | Good / Fair / Poor / Critical |
| `long_description` | Full condition description |
| `specific_issues` | Specific problems noted |
| `hazard_note` | Safety/handling hazard |
| `recommendations` | Recommended action |
| `next_check_date` | When to reassess |

Object-level: `condition_grade` (current grade snapshot), `hazard_note`

### UI

- **Per-object:** `ConditionTab.tsx` — condition assessment form and history

### Gaps

No dedicated central condition assessments dashboard page.

---

## Procedure 12: Conservation and Collections Care

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `conservation_treatments`

| Field | Notes |
|-------|-------|
| `treatment_reference` | Auto-generated (CT-YYYY-NNN) |
| `object_id` | Object treated |
| `treatment_type` | Cleaning / Repair / Stabilisation / etc. |
| `conservator` | Name of conservator |
| `start_date` / `end_date` | Treatment duration |
| `condition_before` | Condition description before |
| `condition_after` | Condition description after |
| `materials_used` | Conservation materials |
| `cost` / `cost_currency` | Treatment cost |
| `recommendation_future` | Future care recommendations |
| `before_image_url` | Before treatment image |
| `after_image_url` | After treatment image |
| `status` | Active / Completed / Cancelled |

### UI

- **Per-object:** `ConservationTab.tsx` — treatment form, before/after images, history with status management
- **Central register:** `/dashboard/conservation/` — all treatments with stats (active, completed this year)
- **Document attachments:** Supported

### Gaps

None identified.

---

## Procedure 13: Valuation

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `valuations`

| Field | Notes |
|-------|-------|
| `valuation_reference` | Reference number |
| `object_id` | Object valued |
| `valuation_date` | When valued |
| `valuer` | Who carried out valuation |
| `valuation_basis` | Insurance / Market / Replacement / etc. |
| `value` / `currency` | Monetary value |
| `validity_date` | When valuation expires |
| `notes` | Valuation notes |

Object-level: `insured_value`, `insured_value_currency`, latest valuation displayed in OverviewTab.

### UI

- **Per-object:** `ValuationTab.tsx` — valuation history and entry
- **Central register:** `/dashboard/valuation/` — aggregate view, total collection value, unvalued count

### Gaps

None identified.

---

## Procedure 14: Insurance and Indemnity

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `insurance_policies`

| Field | Notes |
|-------|-------|
| `policy_number` | Policy reference |
| `provider` | Insurance company |
| `coverage_amount` / `coverage_currency` | Total coverage |
| `deductible` | Excess amount |
| `start_date` / `end_date` | Policy dates |
| `covers_loans` | Loan coverage flag |
| `covers_transit` | Transit coverage flag |
| `covers_exhibitions` | Exhibition coverage flag |
| `contact_name` / `contact_email` | Insurer contact |
| `exclusions` | Policy exclusions |
| `claims_procedure` | How to make a claim |
| `status` | Active / Pending Renewal / Expired / Cancelled |

Table: `insurance_policy_objects` — many-to-many junction linking policies to specific objects

### UI

- **Central dashboard:** `/dashboard/insurance/` — policy management, expandable object picker, status workflow
- **Per-object:** Insurance value displayed in `OverviewTab.tsx`

### Gaps

None identified.

---

## Procedure 15: Emergency Planning for Collections

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `emergency_plans`

| Field | Notes |
|-------|-------|
| `plan_title` | Name of plan |
| `plan_type` | Fire / Flood / Theft / Structural / etc. |
| `status` | Draft / Active / Under Review / Archived |
| `description` | Plan details |
| `contact_list` | Emergency contacts |
| `plan_last_tested` | Date plan was last tested |
| `salvage_equipment_location` | Where salvage kit is stored |

Table: `emergency_salvage_priorities` — ranked object list per plan
Table: `emergency_events` — incident records
Table: `emergency_event_objects` — junction linking events to affected objects

| Field | Notes |
|-------|-------|
| `event_type` | Type of incident |
| `event_date` | When it occurred |
| `description` | What happened |
| `response_taken` | Actions taken |
| `damage_summary` | Summary of damage |

### UI

- **Central dashboard:** `/dashboard/plan/` — emergency plans with status management
- **Incident register:** `/dashboard/emergency/` — event logging with affected object picker

### Gaps

None identified.

---

## Procedure 16: Loss and Damage Reporting

**Status:** ✅ Full
**Plan gate:** 🔒 Professional

### Database

Table: `damage_reports`

| Field | Notes |
|-------|-------|
| `object_id` | Object damaged/lost |
| `incident_date` | When the incident occurred |
| `discovered_date` | When damage was discovered |
| `damage_type` | Loss / Theft / Vandalism / Accidental / etc. |
| `description` | What happened |
| `severity` | Minor / Moderate / Significant / Severe / Total Loss |
| `repair_estimate` | Cost to repair |
| `police_report_ref` | Police report reference |
| `insurance_claim_outcome` | Outcome of insurance claim |
| `reported_to_governing_body` | Governance notification flag |
| `status` | Open / Under Investigation / Repaired / Claimed / Closed / Write-off |

### UI

- **Per-object:** `DamageTab.tsx` — damage report form
- **Central register:** `/dashboard/damage/` — all reports with stats (open, critical, total repair cost)

### Gaps

None identified.

---

## Procedure 17: Disposal / Deaccession

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `disposal_records`

| Field | Notes |
|-------|-------|
| `object_id` | Object being deaccessioned |
| `disposal_method` | Sale / Donation / Destruction / Transfer / etc. |
| `disposal_reason` | Why it is being disposed of |
| `justification` | Detailed justification |
| `deaccession_date` | Date of formal deaccession |
| `authorised_by` | Who authorised |
| `proceeds_amount` | Money received (if sold) |
| `governing_body_approval` | Governance body sign-off flag |
| `public_notice` | Public notice text/reference |
| `status` | Proposed / Approved / Completed |

Object-level: `deaccession_protected` flag prevents accidental disposal

### UI

- **Central dashboard:** `/dashboard/disposal/` — full workflow from Proposed to Completed, status transitions

### Gaps

None identified.

---

## Procedure 18: Rights Management

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `rights_records`

| Field | Notes |
|-------|-------|
| `rights_reference` | Auto-generated (RR-YYYY-NNN) |
| `object_id` | Object this applies to |
| `rights_type` | Copyright / Moral Rights / Licence / etc. |
| `rights_status` | Cleared / Pending / Unknown / Restricted |
| `rights_holder` | Who holds the rights |
| `expiry_date` | When rights expire |
| `licence_terms` | Licence terms |
| `restrictions` | Usage restrictions |

Object-level rights summary fields:

| Field | Notes |
|-------|-------|
| `rights_type` | Summary type |
| `rights_holder_contact` | Contact for rights holder |
| `rights_expiry_date` | Expiry date |
| `licence_type_terms` | Summary licence terms |
| `rights_in_obtained` | Rights in secured flag |
| `rights_out_granted` | Rights out granted flag |

### UI

- **Per-object:** `RightsTab.tsx` — rights records form and history, document attachments

### Gaps

No central rights register dashboard page.

---

## Procedure 19: Reproduction Rights

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `reproduction_requests`

| Field | Notes |
|-------|-------|
| `object_id` | Object to be reproduced |
| `requester_name` | Who is requesting |
| `requester_contact` | Contact details |
| `reproduction_type` | Digital / Print / Broadcast / etc. |
| `purpose` | Intended use |
| `decision` | Approved / Refused / Pending |
| `decision_date` | When decided |
| `terms_issued` | Terms sent flag |
| `fee_charged` | Fee amount |

Linked from `collection_use_records.reproduction_request_id`

### UI

- **Per-object:** `RightsTab.tsx` — reproduction request form, decision tracking, alongside rights records

### Gaps

None identified.

---

## Procedure 20: Collections Review

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `collection_reviews`

| Field | Notes |
|-------|-------|
| `review_reference` | Auto-generated (CR-YYYY-NNN) |
| `review_title` | Name of review programme |
| `scope` | What collections are being reviewed |
| `reviewer` | Who is conducting the review |
| `criteria` | Review criteria |
| `review_date_start` / `review_date_end` | Review period |
| `objects_reviewed` | How many objects assessed |
| `objects_recommended_disposal` | Objects recommended for disposal |
| `governing_body_reported` | Governance body notified flag |
| `status` | In Progress / Completed |

### UI

- **Central dashboard:** `/dashboard/collections-review/` — full review tracking

### Gaps

None identified.

---

## Procedure 21: Audit Exercises

**Status:** ✅ Full
**Plan gate:** 🏛️ Institution

### Database

Table: `audit_exercises`

| Field | Notes |
|-------|-------|
| `audit_reference` | Auto-generated (AUD-YYYY-NNN) |
| `scope` | Scope of the audit |
| `method` | How audit was conducted |
| `date_started` / `date_completed` | Audit period |
| `auditor` | Staff/team responsible |
| `objects_checked` | How many objects checked |
| `discrepancies` | Number of discrepancies |
| `governance_reported` | Reported to governance flag |
| `actions_required` | Actions arising from audit |
| `actions_completed` | Whether actions are done |
| `overall_audit_report` | Full audit report text |
| `status` | In Progress / Completed |

### UI

- **Central dashboard:** `/dashboard/audit/` — audit exercises and per-object audit records, stats (never inventoried, overdue >12 months), CSV export

### Gaps

None identified.

---

## Supporting Infrastructure

### Risk Management

Table: `risk_register`

- **Central dashboard:** `/dashboard/risk/` — risk register with severity, status, and due-date tracking
- Object-level risk notes on entry records (quarantine flags)

### Document Attachments

All compliance procedures support document attachments via `object_documents` and `StagedDocumentPicker`. Gated to Professional+ plan.

### Activity Logging

Table: `activity_log` — tracks all changes with staff attribution and timestamps.

### Row-Level Security

All Spectrum tables are protected by Supabase RLS policies, isolating data by museum. Defined in `spectrum-rls.sql` and `compliance-rls.sql`.

### Multi-Currency Support

Valuations, insurance, acquisition value, conservation costs, and disposal proceeds all support configurable currency codes.

### Wishlist / Wanted Items

Table: `wanted_items`

- Columns: `title`, `year`, `medium`, `notes`, `priority` (low/medium/high), `acquired_at`, `converted_object_id`
- **Plan gate:** Community & Hobbyist tiers only (inverted gate — not available on Professional+)
- **UI page:** `/dashboard/wanted/`
- Optional public wishlist page when `museums.show_wanted = true`

### Object Duplicates

Table: `object_duplicates`

- Junction table linking `object_id` → `duplicate_of_id` within the same museum
- **Plan gate:** All tiers
- Used for duplicate detection and collection cleanup

### Estimated Object Value

Fields on `objects`: `estimated_value`, `estimated_value_currency`

- Lightweight per-object value field distinct from formal `valuations` table entries
- Displayed in collection aggregate view when `museums.show_collection_value = true`
- **Plan gate:** Community & Hobbyist tiers only

### Learn Mode

`data-learn="table.field"` attributes are attached to all form labels across the dashboard, paired with `lib/learn-descriptions.ts`. When enabled, hovering a field label shows a tooltip explaining its purpose and Spectrum relevance.

---

## Summary Table

| # | Procedure | Status | DB Tables | UI | Plan Gate |
|---|-----------|--------|-----------|-----|-----------|
| 1 | Object Entry | ✅ | `entry_records` (incl. signature fields) | EntryTab, /entry, receipt | 🔒 |
| 2 | Acquisition | ✅ | `objects` (acquisition_*, formally_accessioned) | OverviewTab | 🔒 |
| 3 | Location & Movement | ✅ | `location_history`, `locations` | ExitsTab, OverviewTab, /locations | 🔒 |
| 4 | Inventory | ✅ | `inventory_exercises`, `audit_records` | /audit | 🏛️ |
| 5 | Cataloguing | ✅ | `objects` (70+ fields, incl. attribution) | OverviewTab | 🔒/🏛️ |
| 6 | Object Exit | ✅ | `object_exits` | ExitsTab | 🔒 |
| 7 | Loans In | ✅ | `loans` (In) | LoansTab, /loans | 🔒 |
| 8 | Loans Out | ✅ | `loans` (Out) | LoansTab, /loans | 🔒 |
| 9 | Documentation Planning | ✅ | `documentation_plans` | Admin settings | 🏛️ |
| 10 | Use of Collections | ✅ | `collection_use_records` | /collections-use | 🏛️ |
| 11 | Condition Checking | ✅ | `condition_assessments` | ConditionTab | 🔒 |
| 12 | Conservation | ✅ | `conservation_treatments` | ConservationTab, /conservation | 🔒 |
| 13 | Valuation | ✅ | `valuations` | ValuationTab, /valuation | 🔒 |
| 14 | Insurance & Indemnity | ✅ | `insurance_policies`, `insurance_policy_objects` | /insurance | 🔒 |
| 15 | Emergency Planning | ✅ | `emergency_plans`, `emergency_events`, `emergency_event_objects` | /plan, /emergency | 🔒 |
| 16 | Loss & Damage | ✅ | `damage_reports` | DamageTab, /damage | 🔒 |
| 17 | Disposal | ✅ | `disposal_records` | /disposal | 🏛️ |
| 18 | Rights Management | ✅ | `rights_records` | RightsTab | 🏛️ |
| 19 | Reproduction Rights | ✅ | `reproduction_requests` | RightsTab | 🏛️ |
| 20 | Collections Review | ✅ | `collection_reviews` | /collections-review | 🏛️ |
| 21 | Audit Exercises | ✅ | `audit_exercises` | /audit | 🏛️ |

**All 21 Spectrum 5.1 procedures: ✅ Implemented**
