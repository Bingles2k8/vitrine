-- =============================================================
-- Damage Reports — Spectrum 5.1 (Damage & Loss Procedure)
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS damage_reports (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id            uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  artifact_id          uuid                 REFERENCES artifacts(id) ON DELETE SET NULL,
  report_number        text        NOT NULL,                          -- DR-YYYY-###
  incident_date        date        NOT NULL,
  discovered_date      date        NOT NULL,
  discovered_by        text        NOT NULL,
  damage_type          text        NOT NULL DEFAULT 'Accidental', -- Accidental | Environmental | Theft | Vandalism | Pest | Handling | Transit | Unknown
  severity             text        NOT NULL DEFAULT 'Minor',      -- Minor | Moderate | Significant | Severe | Total Loss
  description          text        NOT NULL,
  cause                text,
  location_at_incident text,
  repair_estimate      numeric,
  repair_currency      text        DEFAULT 'GBP',
  insurance_claim_ref  text,
  insurance_notified   boolean     NOT NULL DEFAULT false,
  investigation_notes  text,
  action_taken         text,
  status               text        NOT NULL DEFAULT 'Open', -- Open | Under Investigation | Repaired | Claimed | Closed | Write-off
  reported_by          text,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS damage_reports_museum_idx   ON damage_reports (museum_id);
CREATE INDEX IF NOT EXISTS damage_reports_artifact_idx ON damage_reports (artifact_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view damage_reports in their museums"
  ON damage_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = damage_reports.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create damage_reports in their museums"
  ON damage_reports FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = damage_reports.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update damage_reports in their museums"
  ON damage_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = damage_reports.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = damage_reports.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete damage_reports in their museums"
  ON damage_reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = damage_reports.museum_id AND museums.owner_id = auth.uid()));
