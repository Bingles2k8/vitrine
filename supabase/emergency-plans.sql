-- =============================================================
-- Emergency Plans — Spectrum 5.1 (Emergency Planning for Collections)
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_plans (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id             uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  plan_title            text        NOT NULL,
  plan_type             text        NOT NULL DEFAULT 'General', -- General | Fire | Flood | Theft | Pest | Environmental | Structural
  status                text        NOT NULL DEFAULT 'Draft',   -- Draft | Active | Under Review | Archived
  responsible_person    text,
  emergency_contacts    text,       -- key contacts and their roles
  evacuation_procedures text,
  salvage_priorities    text,       -- priority list for salvage operations
  alternative_storage   text,       -- backup storage location information
  recovery_procedures   text,       -- post-disaster recovery steps
  last_review_date      date,
  next_review_date      date,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS emergency_plans_museum_idx ON emergency_plans (museum_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE emergency_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emergency_plans in their museums"
  ON emergency_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = emergency_plans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create emergency_plans in their museums"
  ON emergency_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = emergency_plans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update emergency_plans in their museums"
  ON emergency_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = emergency_plans.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = emergency_plans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete emergency_plans in their museums"
  ON emergency_plans FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = emergency_plans.museum_id AND museums.owner_id = auth.uid()));
