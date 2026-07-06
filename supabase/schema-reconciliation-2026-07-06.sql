-- =============================================================
-- Schema reconciliation — 2026-07-06
-- Brings the committed migrations in supabase/ back in line with the
-- live database (as reflected by lib/database.types.ts). Before this
-- file, a fresh `supabase db reset` produced a schema that the app code
-- could not run against: three document tables had no definition, the
-- documentation_plans / locations / conservation columns had drifted,
-- and audit_records.exercise_id pointed at the wrong table.
--
-- Idempotent: safe to run against prod (all ADD/CREATE use IF [NOT] EXISTS;
-- drops are guarded). Reference UNIQUE indexes are intentionally NOT added
-- here — existing rows collide (every object's first record shares
-- e.g. LN-2026-001); they are renumbered and constrained in the Phase 2
-- reference-numbering migration.
-- =============================================================

-- -------------------------------------------------------------
-- 1. documentation_plans — status, created_at, drop single-plan UNIQUE
--    (compliance-gaps.sql created it with museum_id UNIQUE and no
--     status/created_at; the app inserts status, orders by created_at,
--     and supports multiple plans per museum.)
-- -------------------------------------------------------------
ALTER TABLE documentation_plans
  ADD COLUMN IF NOT EXISTS status     text        NOT NULL DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE
  con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'documentation_plans'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(museum_id)%';
  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE documentation_plans DROP CONSTRAINT %I', con);
  END IF;
END $$;

-- -------------------------------------------------------------
-- 2. Missing supporting-document tables. These three mirror
--    documentation_plan_documents (spectrum-rights-docs.sql) exactly,
--    differing only in the parent FK column. Only storage triggers
--    (cached-storage-usage.sql) referenced them before; the tables
--    themselves were never committed.
-- -------------------------------------------------------------

-- 2a. emergency_plan_documents
CREATE TABLE IF NOT EXISTS emergency_plan_documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       uuid        NOT NULL REFERENCES emergency_plans(id) ON DELETE CASCADE,
  museum_id     uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  label         text        NOT NULL,
  document_type text,
  file_url      text        NOT NULL,
  file_name     text        NOT NULL,
  file_size     bigint,
  mime_type     text,
  notes         text,
  uploaded_by   uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS emergency_plan_documents_plan_idx   ON emergency_plan_documents(plan_id);
CREATE INDEX IF NOT EXISTS emergency_plan_documents_museum_idx ON emergency_plan_documents(museum_id);

-- 2b. insurance_policy_documents
CREATE TABLE IF NOT EXISTS insurance_policy_documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id     uuid        NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  museum_id     uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  label         text        NOT NULL,
  document_type text,
  file_url      text        NOT NULL,
  file_name     text        NOT NULL,
  file_size     bigint,
  mime_type     text,
  notes         text,
  uploaded_by   uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS insurance_policy_documents_policy_idx ON insurance_policy_documents(policy_id);
CREATE INDEX IF NOT EXISTS insurance_policy_documents_museum_idx ON insurance_policy_documents(museum_id);

-- 2c. disposal_record_documents
CREATE TABLE IF NOT EXISTS disposal_record_documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  disposal_id   uuid        NOT NULL REFERENCES disposal_records(id) ON DELETE CASCADE,
  museum_id     uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  label         text        NOT NULL,
  document_type text,
  file_url      text        NOT NULL,
  file_name     text        NOT NULL,
  file_size     bigint,
  mime_type     text,
  notes         text,
  uploaded_by   uuid        REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX IF NOT EXISTS disposal_record_documents_disposal_idx ON disposal_record_documents(disposal_id);
CREATE INDEX IF NOT EXISTS disposal_record_documents_museum_idx   ON disposal_record_documents(museum_id);

-- RLS for the three document tables (mirrors documentation_plan_documents:
-- owner + staff of the museum; UPDATE left ungated like its sibling).
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['emergency_plan_documents','insurance_policy_documents','disposal_record_documents']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format($f$
      DROP POLICY IF EXISTS "Users can view own museum %1$s" ON %1$I;
      CREATE POLICY "Users can view own museum %1$s"
        ON %1$I FOR SELECT
        USING (museum_id IN (
          SELECT id FROM museums WHERE owner_id = auth.uid()
          UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
        ));
    $f$, tbl);

    EXECUTE format($f$
      DROP POLICY IF EXISTS "Users can insert own museum %1$s" ON %1$I;
      CREATE POLICY "Users can insert own museum %1$s"
        ON %1$I FOR INSERT
        WITH CHECK (museum_id IN (
          SELECT id FROM museums WHERE owner_id = auth.uid()
          UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
        ));
    $f$, tbl);

    EXECUTE format($f$
      DROP POLICY IF EXISTS "Users can delete own museum %1$s" ON %1$I;
      CREATE POLICY "Users can delete own museum %1$s"
        ON %1$I FOR DELETE
        USING (museum_id IN (
          SELECT id FROM museums WHERE owner_id = auth.uid()
          UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
        ));
    $f$, tbl);
  END LOOP;
END $$;

-- -------------------------------------------------------------
-- 3. locations — column drift (locations.sql shipped floor/room/unit/
--    position; live uses room_gallery/position1..3 + location_code).
-- -------------------------------------------------------------
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS room_gallery  text,
  ADD COLUMN IF NOT EXISTS position1     text,
  ADD COLUMN IF NOT EXISTS position2     text,
  ADD COLUMN IF NOT EXISTS position3     text,
  ADD COLUMN IF NOT EXISTS location_code text;

ALTER TABLE locations
  DROP COLUMN IF EXISTS room,
  DROP COLUMN IF EXISTS unit,
  DROP COLUMN IF EXISTS position;

-- 3b. location_history — location_code + authorised_by
ALTER TABLE location_history
  ADD COLUMN IF NOT EXISTS location_code text,
  ADD COLUMN IF NOT EXISTS authorised_by text;

-- -------------------------------------------------------------
-- 4. conservation_treatments — treatment_name + images (used by the app
--    and present in the live DB; no migration created them).
-- -------------------------------------------------------------
ALTER TABLE conservation_treatments
  ADD COLUMN IF NOT EXISTS treatment_name text,
  ADD COLUMN IF NOT EXISTS images         jsonb;

-- -------------------------------------------------------------
-- 5. audit_records.exercise_id — repoint FK from the app-unused
--    inventory_exercises to the live audit_exercises table.
-- -------------------------------------------------------------
DO $$
DECLARE
  con text;
BEGIN
  SELECT conname INTO con
  FROM pg_constraint
  WHERE conrelid = 'audit_records'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%exercise_id%';
  IF con IS NOT NULL THEN
    EXECUTE format('ALTER TABLE audit_records DROP CONSTRAINT %I', con);
  END IF;
END $$;

ALTER TABLE audit_records
  ADD CONSTRAINT audit_records_exercise_id_fkey
  FOREIGN KEY (exercise_id) REFERENCES audit_exercises(id) ON DELETE SET NULL;
