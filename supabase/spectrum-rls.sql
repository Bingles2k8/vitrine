-- =============================================================
-- Row Level Security — Compliance Tables Only
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This adds RLS policies for the 5 new compliance tables.
-- The existing policies for museums/artifacts/staff_members
-- were already applied separately and are NOT repeated here.
-- =============================================================


-- -------------------------------------------------------------
-- LOCATION HISTORY (Location & Movement Control)
-- -------------------------------------------------------------
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view location_history in their museums"
  ON location_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = location_history.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create location_history in their museums"
  ON location_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = location_history.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update location_history in their museums"
  ON location_history FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = location_history.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = location_history.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete location_history in their museums"
  ON location_history FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = location_history.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- CONDITION ASSESSMENTS (Condition Checking)
-- -------------------------------------------------------------
ALTER TABLE condition_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view condition_assessments in their museums"
  ON condition_assessments FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = condition_assessments.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create condition_assessments in their museums"
  ON condition_assessments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = condition_assessments.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update condition_assessments in their museums"
  ON condition_assessments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = condition_assessments.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = condition_assessments.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete condition_assessments in their museums"
  ON condition_assessments FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = condition_assessments.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- CONSERVATION TREATMENTS (Conservation & Collections Care)
-- -------------------------------------------------------------
ALTER TABLE conservation_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conservation_treatments in their museums"
  ON conservation_treatments FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = conservation_treatments.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create conservation_treatments in their museums"
  ON conservation_treatments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = conservation_treatments.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update conservation_treatments in their museums"
  ON conservation_treatments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = conservation_treatments.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = conservation_treatments.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete conservation_treatments in their museums"
  ON conservation_treatments FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = conservation_treatments.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- LOANS (Loans In / Loans Out)
-- -------------------------------------------------------------
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loans in their museums"
  ON loans FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = loans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create loans in their museums"
  ON loans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = loans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update loans in their museums"
  ON loans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = loans.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = loans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete loans in their museums"
  ON loans FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = loans.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- AUDIT RECORDS (Audit)
-- -------------------------------------------------------------
ALTER TABLE audit_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit_records in their museums"
  ON audit_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = audit_records.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create audit_records in their museums"
  ON audit_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = audit_records.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update audit_records in their museums"
  ON audit_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = audit_records.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = audit_records.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete audit_records in their museums"
  ON audit_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = audit_records.museum_id AND museums.owner_id = auth.uid()));
