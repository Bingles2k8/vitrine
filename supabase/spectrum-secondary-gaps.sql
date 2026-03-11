-- Spectrum 5.1 Secondary Procedure Enhancement
-- Procs 11 (Condition), 12 (Conservation), 13 (Valuation), 14 (Insurance), 15 (Emergency), 16 (Damage)

-- ── Proc 11: Condition Checking ──────────────────────────────────────────
ALTER TABLE condition_assessments
  ADD COLUMN IF NOT EXISTS assessment_reference text,
  ADD COLUMN IF NOT EXISTS long_description     text,
  ADD COLUMN IF NOT EXISTS specific_issues      text,
  ADD COLUMN IF NOT EXISTS location_on_object   text,
  ADD COLUMN IF NOT EXISTS reason_for_check     text,
  ADD COLUMN IF NOT EXISTS hazard_note          text,
  ADD COLUMN IF NOT EXISTS recommendations      text,
  ADD COLUMN IF NOT EXISTS priority             text,
  ADD COLUMN IF NOT EXISTS next_check_date      date;

-- ── Proc 12: Conservation ────────────────────────────────────────────────
ALTER TABLE conservation_treatments
  ADD COLUMN IF NOT EXISTS treatment_reference   text,
  ADD COLUMN IF NOT EXISTS condition_before      text,
  ADD COLUMN IF NOT EXISTS condition_after       text,
  ADD COLUMN IF NOT EXISTS materials_used        text,
  ADD COLUMN IF NOT EXISTS cost                  numeric(12,2),
  ADD COLUMN IF NOT EXISTS cost_currency         text DEFAULT 'GBP',
  ADD COLUMN IF NOT EXISTS recommendation_future text;

-- ── Proc 13: Valuation ──────────────────────────────────────────────────
ALTER TABLE valuations
  ADD COLUMN IF NOT EXISTS valuation_reference text,
  ADD COLUMN IF NOT EXISTS valuation_basis     text,
  ADD COLUMN IF NOT EXISTS validity_date       date;

-- ── Proc 14: Insurance ──────────────────────────────────────────────────
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS insured_value          numeric(12,2),
  ADD COLUMN IF NOT EXISTS insured_value_currency text DEFAULT 'GBP';

ALTER TABLE insurance_policies
  ADD COLUMN IF NOT EXISTS indemnity_reference text,
  ADD COLUMN IF NOT EXISTS related_loan_id     uuid REFERENCES loans(id) ON DELETE SET NULL;

-- ── Proc 15: Emergency Planning ─────────────────────────────────────────
ALTER TABLE emergency_plans
  ADD COLUMN IF NOT EXISTS plan_last_tested           date,
  ADD COLUMN IF NOT EXISTS salvage_equipment_location  text;

CREATE TABLE IF NOT EXISTS emergency_salvage_priorities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id     uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  plan_id       uuid NOT NULL REFERENCES emergency_plans(id) ON DELETE CASCADE,
  object_id   uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  priority_rank integer NOT NULL,
  salvage_notes text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emergency_salvage_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum salvage priorities"
  ON emergency_salvage_priorities FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum salvage priorities"
  ON emergency_salvage_priorities FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum salvage priorities"
  ON emergency_salvage_priorities FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum salvage priorities"
  ON emergency_salvage_priorities FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

CREATE TABLE IF NOT EXISTS emergency_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id       uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  plan_id         uuid REFERENCES emergency_plans(id) ON DELETE SET NULL,
  event_reference text NOT NULL,
  event_type      text NOT NULL,
  event_date      date NOT NULL,
  description     text NOT NULL,
  response_taken  text,
  damage_summary  text,
  lessons_learned text,
  status          text NOT NULL DEFAULT 'Open',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum emergency events"
  ON emergency_events FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum emergency events"
  ON emergency_events FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum emergency events"
  ON emergency_events FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum emergency events"
  ON emergency_events FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Proc 16: Damage & Loss ──────────────────────────────────────────────
ALTER TABLE damage_reports
  ADD COLUMN IF NOT EXISTS police_report_ref          text,
  ADD COLUMN IF NOT EXISTS insurance_claim_outcome     text,
  ADD COLUMN IF NOT EXISTS object_status_after_event   text,
  ADD COLUMN IF NOT EXISTS reported_to_governing_body  boolean DEFAULT false;
