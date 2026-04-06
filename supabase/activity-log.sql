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
  object_id uuid                 REFERENCES objects(id) ON DELETE SET NULL,
  user_id     uuid,
  user_name   text,
  action_type text        NOT NULL,
  -- saved | condition_added | location_recorded | conservation_added
  -- loan_added | audit_recorded | deleted | entry_created | exit_created | valuation_added | risk_added
  description text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_log_museum_idx   ON activity_log (museum_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_artifact_idx ON activity_log (object_id);


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


-- -------------------------------------------------------------
-- RETENTION TRIGGER
-- Keeps at most 200 entries per museum.
-- After each insert, deletes entries older than 7 days that are
-- not in the most recent 20. If the museum still has >200 entries
-- after the 7-day pass, also trims the oldest beyond 200.
-- The last 20 entries are always preserved regardless of age.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION activity_log_trim()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Step 1: delete entries older than 7 days, but preserve the 20 most recent
  DELETE FROM activity_log
  WHERE museum_id = NEW.museum_id
    AND created_at < now() - INTERVAL '7 days'
    AND id NOT IN (
      SELECT id FROM activity_log
      WHERE museum_id = NEW.museum_id
      ORDER BY created_at DESC
      LIMIT 20
    );

  -- Step 2: if still over 200, trim oldest beyond 200
  DELETE FROM activity_log
  WHERE museum_id = NEW.museum_id
    AND id NOT IN (
      SELECT id FROM activity_log
      WHERE museum_id = NEW.museum_id
      ORDER BY created_at DESC
      LIMIT 200
    );

  RETURN NEW;
END;
$$;

CREATE TRIGGER activity_log_after_insert
  AFTER INSERT ON activity_log
  FOR EACH ROW EXECUTE FUNCTION activity_log_trim();
