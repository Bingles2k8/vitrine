-- =============================================================
-- Full Compliance — Gap-fill Migration
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
-- Safe to run on an existing database — all additions are
-- nullable / defaulted so existing rows are unaffected.
-- =============================================================


-- -------------------------------------------------------------
-- 1a. New columns on objects (Procedure 2 — Acquisition)
-- -------------------------------------------------------------
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS acquisition_source_contact   text,
  ADD COLUMN IF NOT EXISTS acquisition_authorised_by    text,
  ADD COLUMN IF NOT EXISTS acquisition_authority_date   date,
  ADD COLUMN IF NOT EXISTS acquisition_title_guarantee  text,
  ADD COLUMN IF NOT EXISTS acquisition_object_count     integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS accession_register_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ethics_art_loss_register     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ethics_cites                 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ethics_dealing_act           boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ethics_human_remains         boolean DEFAULT false;


-- -------------------------------------------------------------
-- 1b. New columns on location_history (Procedure 3 — Location)
-- -------------------------------------------------------------
ALTER TABLE location_history
  ADD COLUMN IF NOT EXISTS authorised_by text;


-- -------------------------------------------------------------
-- 1c. New columns on audit_records (Procedure 4 — Inventory)
-- -------------------------------------------------------------
ALTER TABLE audit_records
  ADD COLUMN IF NOT EXISTS inventory_outcome     text,
  ADD COLUMN IF NOT EXISTS action_required       text,
  ADD COLUMN IF NOT EXISTS action_completed      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS action_completed_date date;


-- -------------------------------------------------------------
-- 1d. New columns on loans (Procedures 7 & 8 — Loans In/Out)
-- -------------------------------------------------------------
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS loan_reference        text,
  ADD COLUMN IF NOT EXISTS agreement_reference   text,
  ADD COLUMN IF NOT EXISTS agreement_signed_date date,
  ADD COLUMN IF NOT EXISTS lender_object_ref     text,
  ADD COLUMN IF NOT EXISTS condition_arrival     text,
  ADD COLUMN IF NOT EXISTS condition_return      text,
  ADD COLUMN IF NOT EXISTS insurance_type        text,
  ADD COLUMN IF NOT EXISTS return_confirmed      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS return_confirmed_date date,
  ADD COLUMN IF NOT EXISTS loan_coordinator      text,
  ADD COLUMN IF NOT EXISTS approved_by           text;


-- -------------------------------------------------------------
-- 1e. entry_records — Object Entry (Procedure 1)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entry_records (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id           uuid        NOT NULL REFERENCES museums(id)    ON DELETE CASCADE,
  object_id         uuid                 REFERENCES objects(id)  ON DELETE SET NULL,
  entry_number        text        NOT NULL,
  entry_date          date        NOT NULL,
  depositor_name      text        NOT NULL,
  depositor_contact   text,
  entry_reason        text        NOT NULL,
  object_description  text        NOT NULL,
  object_count        integer     NOT NULL DEFAULT 1,
  legal_owner         text,
  terms_accepted      boolean     NOT NULL DEFAULT false,
  terms_accepted_date date,
  liability_statement text,
  receipt_issued      boolean     NOT NULL DEFAULT false,
  receipt_date        date,
  outcome             text,
  received_by         text        NOT NULL,
  risk_notes          text,
  quarantine_required boolean     DEFAULT false,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entry_records_museum_idx   ON entry_records (museum_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS entry_records_artifact_idx ON entry_records (object_id);


-- -------------------------------------------------------------
-- 1f. object_exits — Object Exit (Procedure 6)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS object_exits (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id            uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  object_id          uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  exit_number          text        NOT NULL,
  exit_date            date        NOT NULL,
  exit_reason          text        NOT NULL,
  recipient_name       text        NOT NULL,
  recipient_contact    text,
  destination_address  text,
  exit_condition       text,
  signed_receipt       boolean     NOT NULL DEFAULT false,
  signed_receipt_date  date,
  expected_return_date date,
  exit_authorised_by   text        NOT NULL,
  related_loan_id      uuid                 REFERENCES loans(id) ON DELETE SET NULL,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS object_exits_museum_idx   ON object_exits (museum_id, exit_date DESC);
CREATE INDEX IF NOT EXISTS object_exits_artifact_idx ON object_exits (object_id);


-- -------------------------------------------------------------
-- 1g. documentation_plans — Documentation Planning (Procedure 9)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentation_plans (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id               uuid        NOT NULL UNIQUE REFERENCES museums(id) ON DELETE CASCADE,
  plan_reference          text,
  plan_date               date,
  responsible_person      text,
  documentation_standards text        DEFAULT 'Museum standards',
  systems_in_use          text        DEFAULT 'Vitrine',
  review_date             date,
  backlog_notes           text,
  updated_at              timestamptz NOT NULL DEFAULT now()
);
