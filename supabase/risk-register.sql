-- =============================================================
-- Risk Register — Spectrum 5.1 (Risk Management Procedure)
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_register (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id          uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  artifact_id        uuid                 REFERENCES artifacts(id) ON DELETE SET NULL, -- nullable: collection-level vs object-level
  risk_type          text        NOT NULL, -- Theft | Fire | Flood | Pest | Light damage | Handling damage | Environmental | Provenance | Legal | Other
  description        text        NOT NULL,
  severity           text        NOT NULL DEFAULT 'Medium', -- Low | Medium | High | Critical
  likelihood         text        NOT NULL DEFAULT 'Medium', -- Low | Medium | High
  mitigation         text,
  review_date        date,
  status             text        NOT NULL DEFAULT 'Open', -- Open | Mitigated | Closed
  responsible_person text,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_register_museum_idx   ON risk_register (museum_id);
CREATE INDEX IF NOT EXISTS risk_register_artifact_idx ON risk_register (artifact_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk_register in their museums"
  ON risk_register FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = risk_register.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create risk_register in their museums"
  ON risk_register FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = risk_register.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update risk_register in their museums"
  ON risk_register FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = risk_register.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = risk_register.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete risk_register in their museums"
  ON risk_register FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = risk_register.museum_id AND museums.owner_id = auth.uid()));
