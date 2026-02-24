-- =============================================================
-- Activity Log — Change tracking / audit trail
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id   uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  artifact_id uuid                 REFERENCES artifacts(id) ON DELETE SET NULL,
  user_id     uuid,
  user_name   text,
  action_type text        NOT NULL,
  -- saved | condition_added | location_recorded | conservation_added
  -- loan_added | audit_recorded | deleted | entry_created | exit_created | valuation_added | risk_added
  description text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_museum_idx   ON activity_log (museum_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_artifact_idx ON activity_log (artifact_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity_log in their museums"
  ON activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = activity_log.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create activity_log in their museums"
  ON activity_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = activity_log.museum_id AND museums.owner_id = auth.uid()));

-- Activity log entries are immutable — no UPDATE or DELETE policies
