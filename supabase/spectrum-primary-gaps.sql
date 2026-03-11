-- Spectrum 5.1 Primary Procedure Gap-Fill
-- Procs 1 (Entry), 2 (Acquisition), 3 (Location), 4 (Inventory), 6 (Exit), 7/8 (Loans)

-- ── Proc 1: Object Entry ─────────────────────────────────────────────────
ALTER TABLE entry_records
  ADD COLUMN IF NOT EXISTS scheduled_return_date  date,
  ADD COLUMN IF NOT EXISTS condition_on_entry     text,
  ADD COLUMN IF NOT EXISTS entry_method           text;

-- ── Proc 2: Acquisition ──────────────────────────────────────────────────
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS accession_date                      date,
  ADD COLUMN IF NOT EXISTS conditions_attached_to_acquisition  text,
  ADD COLUMN IF NOT EXISTS location_after_accessioning         text,
  ADD COLUMN IF NOT EXISTS acknowledgement_sent_to_donor       boolean DEFAULT false;

-- ── Proc 3: Location / Movement Control ──────────────────────────────────
ALTER TABLE location_history
  ADD COLUMN IF NOT EXISTS expected_return_date     date,
  ADD COLUMN IF NOT EXISTS expected_return_location text,
  ADD COLUMN IF NOT EXISTS move_type                text DEFAULT 'Permanent';

-- ── Proc 4: Inventory Exercises ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_exercises (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id           uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  exercise_reference  text NOT NULL,
  scope               text,
  date_started        date NOT NULL,
  date_completed      date,
  number_checked      integer DEFAULT 0,
  discrepancies_found integer DEFAULT 0,
  coordinator         text,
  progress_status     text NOT NULL DEFAULT 'In Progress',
  method              text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_records
  ADD COLUMN IF NOT EXISTS exercise_id uuid REFERENCES inventory_exercises(id) ON DELETE SET NULL;

-- RLS for inventory_exercises
ALTER TABLE inventory_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum inventory exercises"
  ON inventory_exercises FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION
    SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own museum inventory exercises"
  ON inventory_exercises FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION
    SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own museum inventory exercises"
  ON inventory_exercises FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION
    SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own museum inventory exercises"
  ON inventory_exercises FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION
    SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Proc 6: Object Exit ─────────────────────────────────────────────────
ALTER TABLE object_exits
  ADD COLUMN IF NOT EXISTS transport_method              text,
  ADD COLUMN IF NOT EXISTS insurance_indemnity_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS packing_notes                 text;

-- ── Proc 7/8: Loans In / Loans Out ──────────────────────────────────────
ALTER TABLE loans
  ADD COLUMN IF NOT EXISTS loan_number                    text,
  ADD COLUMN IF NOT EXISTS borrower_address               text,
  ADD COLUMN IF NOT EXISTS borrower_phone                 text,
  ADD COLUMN IF NOT EXISTS facility_report_reference      text,
  ADD COLUMN IF NOT EXISTS environmental_requirements     text,
  ADD COLUMN IF NOT EXISTS display_requirements           text,
  ADD COLUMN IF NOT EXISTS courier_transport_arrangements text,
  ADD COLUMN IF NOT EXISTS object_location_during_loan    text;
