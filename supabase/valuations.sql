-- =============================================================
-- Valuations — Valuation Procedure
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS valuations (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id    uuid          NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  museum_id      uuid          NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  value          numeric(12,2) NOT NULL,
  currency       text          NOT NULL DEFAULT 'GBP',
  valuation_date date          NOT NULL,
  valuer         text,
  method         text, -- Market value | Insurance value | Replacement cost | Expert opinion | Auction estimate
  purpose        text, -- Insurance | Sale | Estate | Grant | Other
  notes          text,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS valuations_artifact_idx ON valuations (artifact_id, valuation_date DESC);
CREATE INDEX IF NOT EXISTS valuations_museum_idx   ON valuations (museum_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view valuations in their museums"
  ON valuations FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = valuations.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create valuations in their museums"
  ON valuations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = valuations.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update valuations in their museums"
  ON valuations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = valuations.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = valuations.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete valuations in their museums"
  ON valuations FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = valuations.museum_id AND museums.owner_id = auth.uid()));
