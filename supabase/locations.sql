-- =============================================================
-- Locations — Location & Movement Control
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Controlled location vocabulary for structured location hierarchy.
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id           uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  name                text        NOT NULL, -- display name, e.g. "Gallery A — Shelf 3"
  building            text,
  floor               text,
  room                text,
  unit                text,       -- shelving unit, cabinet, etc.
  position            text,       -- specific shelf, bin, or slot
  location_type       text        NOT NULL DEFAULT 'Storage', -- Display | Storage | Quarantine | Transit | Conservation Lab | Office
  environmental_notes text,       -- temperature, humidity, light conditions
  access_restrictions text,
  capacity_notes      text,
  status              text        NOT NULL DEFAULT 'Active', -- Active | Inactive | Under Maintenance
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS locations_museum_idx ON locations (museum_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view locations in their museums"
  ON locations FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = locations.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create locations in their museums"
  ON locations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = locations.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update locations in their museums"
  ON locations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = locations.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = locations.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete locations in their museums"
  ON locations FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = locations.museum_id AND museums.owner_id = auth.uid()));
