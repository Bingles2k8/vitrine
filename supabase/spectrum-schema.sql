-- =============================================================
-- Collections Compliance — Schema Migration
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
-- Safe to run on an existing database — all new columns are
-- nullable with no defaults, so existing rows are unaffected.
-- =============================================================


-- -------------------------------------------------------------
-- STEP 1: New columns on the objects table
-- -------------------------------------------------------------

-- Cataloguing additions (Procedure 1)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS object_type text,
  ADD COLUMN IF NOT EXISTS inscription text,
  ADD COLUMN IF NOT EXISTS marks       text,
  ADD COLUMN IF NOT EXISTS provenance  text;

-- Acquisition (Procedure 2)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS acquisition_method    text,
  ADD COLUMN IF NOT EXISTS acquisition_date      date,
  ADD COLUMN IF NOT EXISTS acquisition_source    text,
  ADD COLUMN IF NOT EXISTS acquisition_note      text,
  ADD COLUMN IF NOT EXISTS legal_transfer_date   date;

-- Location snapshot (Procedure 3)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS current_location text,
  ADD COLUMN IF NOT EXISTS location_note    text;

-- Condition snapshot (Procedure 4)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS condition_grade    text,
  ADD COLUMN IF NOT EXISTS condition_date     date,
  ADD COLUMN IF NOT EXISTS condition_assessor text;

-- Rights Management (Procedure 9)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS copyright_status text,
  ADD COLUMN IF NOT EXISTS rights_holder    text;

-- Deaccession & Disposal (Procedure 8)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS disposal_method        text,
  ADD COLUMN IF NOT EXISTS disposal_date          date,
  ADD COLUMN IF NOT EXISTS disposal_note          text,
  ADD COLUMN IF NOT EXISTS disposal_authorization text,
  ADD COLUMN IF NOT EXISTS disposal_recipient     text;

-- Audit & Inventory (Procedure 7)
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS last_inventoried date,
  ADD COLUMN IF NOT EXISTS inventoried_by   text;


-- -------------------------------------------------------------
-- STEP 2: Location history table (Procedure 3)
-- Tracks every physical move of an object.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS location_history (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id   uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  location    text        NOT NULL,
  moved_at    timestamptz NOT NULL DEFAULT now(),
  moved_by    text,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS location_history_artifact_idx ON location_history (object_id, moved_at DESC);
CREATE INDEX IF NOT EXISTS location_history_museum_idx   ON location_history (museum_id);


-- -------------------------------------------------------------
-- STEP 3: Condition assessments table (Procedure 4)
-- Tracks condition check history for each object.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS condition_assessments (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid  NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id   uuid  NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  grade       text  NOT NULL,   -- Excellent | Good | Fair | Poor | Critical
  assessed_at date  NOT NULL,
  assessor    text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS condition_assessments_artifact_idx ON condition_assessments (object_id, assessed_at DESC);
CREATE INDEX IF NOT EXISTS condition_assessments_museum_idx   ON condition_assessments (museum_id);


-- -------------------------------------------------------------
-- STEP 4: Conservation treatments table (Procedure 5)
-- Tracks conservation and restoration work on each object.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conservation_treatments (
  id             uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id    uuid  NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id      uuid  NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  treatment_type text  NOT NULL,  -- Cleaning|Stabilisation|Restoration|Rehousing|Examination|Other
  conservator    text,
  start_date     date,
  end_date       date,
  description    text,
  outcome        text,
  status         text  NOT NULL DEFAULT 'Active',  -- Active | Completed | Cancelled
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conservation_treatments_artifact_idx ON conservation_treatments (object_id);
CREATE INDEX IF NOT EXISTS conservation_treatments_museum_idx   ON conservation_treatments (museum_id, status);


-- -------------------------------------------------------------
-- STEP 5: Loans table (Procedures 4 & 5 — Loans In/Out)
-- Tracks loans to and from other institutions.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id           uuid    NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id             uuid    NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  direction             text    NOT NULL,   -- 'Out' (we lend) | 'In' (we borrow)
  borrowing_institution text,
  contact_name          text,
  contact_email         text,
  loan_start_date       date,
  loan_end_date         date,
  purpose               text,
  conditions            text,
  insurance_value       numeric(12,2),
  insurance_currency    text    NOT NULL DEFAULT 'GBP',
  status                text    NOT NULL DEFAULT 'Active',  -- Active|Returned|Extended|Cancelled
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loans_artifact_idx ON loans (object_id);
CREATE INDEX IF NOT EXISTS loans_museum_idx   ON loans (museum_id, status);


-- -------------------------------------------------------------
-- STEP 6: Audit records table (Procedure 6 — Audit)
-- Tracks formal inventory and audit checks.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_records (
  id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id         uuid  NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id           uuid  NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  inventoried_at      date  NOT NULL,
  inventoried_by      text,
  location_confirmed  text,
  condition_confirmed text,
  discrepancy         text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_records_artifact_idx ON audit_records (object_id);
CREATE INDEX IF NOT EXISTS audit_records_museum_idx   ON audit_records (museum_id, inventoried_at DESC);
