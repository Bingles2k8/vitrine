-- Spectrum 5.1 Rights, Reproduction & Documentation Plan
-- Procs 9 (Doc Plan), 18 (Rights), 19 (Reproduction)

-- ── Proc 18: Rights Records ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rights_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id        uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  artifact_id      uuid REFERENCES artifacts(id) ON DELETE CASCADE,
  rights_reference text NOT NULL,
  rights_type      text NOT NULL,
  rights_status    text NOT NULL,
  rights_holder    text,
  expiry_date      date,
  licence_terms    text,
  restrictions     text,
  rights_in        text,
  rights_out       text,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rights_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum rights records"
  ON rights_records FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum rights records"
  ON rights_records FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum rights records"
  ON rights_records FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum rights records"
  ON rights_records FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Proc 19: Reproduction ────────────────────────────────────────────────
ALTER TABLE reproduction_requests
  ADD COLUMN IF NOT EXISTS reproduction_type          text,
  ADD COLUMN IF NOT EXISTS reproduced_by              text,
  ADD COLUMN IF NOT EXISTS reproduction_date          date,
  ADD COLUMN IF NOT EXISTS rights_clearance_confirmed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS licence_terms              text,
  ADD COLUMN IF NOT EXISTS image_file_reference       text,
  ADD COLUMN IF NOT EXISTS credit_line                text,
  ADD COLUMN IF NOT EXISTS fee                        numeric(12,2),
  ADD COLUMN IF NOT EXISTS fee_currency               text DEFAULT 'GBP';

-- ── Proc 9: Documentation Plan ──────────────────────────────────────────
ALTER TABLE documentation_plans
  ADD COLUMN IF NOT EXISTS scope_documented_pct    numeric(5,2),
  ADD COLUMN IF NOT EXISTS priority_order          text,
  ADD COLUMN IF NOT EXISTS target_completion_dates text,
  ADD COLUMN IF NOT EXISTS resources_allocated     text;

CREATE TABLE IF NOT EXISTS documentation_plan_backlogs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        uuid NOT NULL REFERENCES documentation_plans(id) ON DELETE CASCADE,
  museum_id      uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  procedure_name text NOT NULL,
  backlog_count  integer DEFAULT 0,
  target_date    date,
  priority       text DEFAULT 'Medium',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documentation_plan_backlogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum doc plan backlogs"
  ON documentation_plan_backlogs FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum doc plan backlogs"
  ON documentation_plan_backlogs FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum doc plan backlogs"
  ON documentation_plan_backlogs FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum doc plan backlogs"
  ON documentation_plan_backlogs FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
