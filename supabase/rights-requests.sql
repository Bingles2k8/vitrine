-- =============================================================
-- Rights & Reproduction Requests — Spectrum "Use of Collections"
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- Add rights_notes field to artifacts for general use restrictions
ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS rights_notes text;


-- Reproduction requests log
CREATE TABLE IF NOT EXISTS reproduction_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id    uuid        NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  museum_id      uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  requester_name text        NOT NULL,
  requester_org  text,
  request_date   date        NOT NULL,
  purpose        text,       -- Editorial | Academic | Commercial | Personal | Exhibition | Other
  status         text        NOT NULL DEFAULT 'Pending', -- Pending | Approved | Declined
  decision_date  date,
  decision_by    text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reproduction_requests_artifact_idx ON reproduction_requests (artifact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reproduction_requests_museum_idx   ON reproduction_requests (museum_id);


-- RLS
ALTER TABLE reproduction_requests ENABLE ROW LEVEL SECURITY;

-- Owner access
CREATE POLICY "Users can view reproduction_requests in their museums"
  ON reproduction_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = reproduction_requests.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create reproduction_requests in their museums"
  ON reproduction_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = reproduction_requests.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update reproduction_requests in their museums"
  ON reproduction_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = reproduction_requests.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = reproduction_requests.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete reproduction_requests in their museums"
  ON reproduction_requests FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = reproduction_requests.museum_id AND museums.owner_id = auth.uid()));

-- Staff access
CREATE POLICY "Staff can view reproduction_requests in their museums"
  ON reproduction_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = reproduction_requests.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create reproduction_requests in their museums"
  ON reproduction_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = reproduction_requests.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update reproduction_requests in their museums"
  ON reproduction_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = reproduction_requests.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = reproduction_requests.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));
