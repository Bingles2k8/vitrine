-- Spectrum 5.1 New Procedures + Deaccession Protection
-- Procs 10 (Use of Collections), 17 (Disposal), 20 (Collections Review), 21 (Audit Exercises)

-- ── Proc 10: Use of Collections ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collection_use_records (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id      uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  object_id    uuid REFERENCES objects(id) ON DELETE SET NULL,
  use_reference  text NOT NULL,
  use_type       text NOT NULL,
  requester_name text,
  requester_org  text,
  request_date   date NOT NULL,
  use_date_start date,
  use_date_end   date,
  purpose        text,
  conditions     text,
  outcome        text,
  approved_by    text,
  status         text NOT NULL DEFAULT 'Pending',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collection_use_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum collection use records"
  ON collection_use_records FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum collection use records"
  ON collection_use_records FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum collection use records"
  ON collection_use_records FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum collection use records"
  ON collection_use_records FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Proc 17: Disposal ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disposal_records (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id               uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  object_id             uuid NOT NULL REFERENCES objects(id) ON DELETE RESTRICT,
  disposal_reference      text NOT NULL,
  disposal_method         text NOT NULL,
  disposal_reason         text NOT NULL,
  justification           text,
  governing_body_approval boolean DEFAULT false,
  governing_body_date     date,
  public_notice           text,
  public_notice_date      date,
  deaccession_date        date NOT NULL,
  register_annotated      boolean DEFAULT false,
  outcome_documentation   text,
  recipient_name          text,
  recipient_contact       text,
  proceeds_amount         numeric(12,2),
  proceeds_currency       text DEFAULT 'GBP',
  authorised_by           text NOT NULL,
  status                  text NOT NULL DEFAULT 'Proposed',
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE disposal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum disposal records"
  ON disposal_records FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum disposal records"
  ON disposal_records FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum disposal records"
  ON disposal_records FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum disposal records"
  ON disposal_records FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Proc 20: Collections Review ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collection_reviews (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id                      uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  review_reference               text NOT NULL,
  review_title                   text NOT NULL,
  scope                          text,
  review_date_start              date NOT NULL,
  review_date_end                date,
  reviewer                       text,
  criteria                       text,
  recommendations                text,
  objects_reviewed               integer DEFAULT 0,
  objects_recommended_disposal   integer DEFAULT 0,
  governing_body_reported        boolean DEFAULT false,
  report_date                    date,
  status                         text NOT NULL DEFAULT 'In Progress',
  notes                          text,
  created_at                     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collection_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum collection reviews"
  ON collection_reviews FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum collection reviews"
  ON collection_reviews FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum collection reviews"
  ON collection_reviews FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum collection reviews"
  ON collection_reviews FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Proc 21: Formal Audit Exercises ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_exercises (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id              uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  audit_reference        text NOT NULL,
  scope                  text,
  method                 text,
  auditor                text,
  date_started           date NOT NULL,
  date_completed         date,
  objects_checked        integer DEFAULT 0,
  objects_found          integer DEFAULT 0,
  objects_not_found      integer DEFAULT 0,
  discrepancies          integer DEFAULT 0,
  report_reference       text,
  governance_reported    boolean DEFAULT false,
  governance_report_date date,
  status                 text NOT NULL DEFAULT 'In Progress',
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own museum audit exercises"
  ON audit_exercises FOR SELECT
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own museum audit exercises"
  ON audit_exercises FOR INSERT
  WITH CHECK (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can update own museum audit exercises"
  ON audit_exercises FOR UPDATE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own museum audit exercises"
  ON audit_exercises FOR DELETE
  USING (museum_id IN (
    SELECT id FROM museums WHERE owner_id = auth.uid()
    UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
  ));

-- ── Deaccession Protection ───────────────────────────────────────────────
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS deaccession_protected boolean DEFAULT false;
