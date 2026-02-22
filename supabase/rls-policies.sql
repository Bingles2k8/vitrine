-- =============================================================
-- Row Level Security (RLS) Policies for Vitrine
-- =============================================================
-- Run this in your Supabase Dashboard → SQL Editor
-- This ensures users can only access their own museums and data.
-- =============================================================


-- -------------------------------------------------------------
-- MUSEUMS
-- Each museum belongs to one user (owner_id = auth user's ID)
-- -------------------------------------------------------------
ALTER TABLE museums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own museums"
  ON museums FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own museums"
  ON museums FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own museums"
  ON museums FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own museums"
  ON museums FOR DELETE
  USING (auth.uid() = owner_id);


-- -------------------------------------------------------------
-- ARTIFACTS
-- Each artifact belongs to a museum, which belongs to a user.
-- -------------------------------------------------------------
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifacts in their museums"
  ON artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artifacts.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create artifacts in their museums"
  ON artifacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artifacts.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update artifacts in their museums"
  ON artifacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artifacts.museum_id
        AND museums.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artifacts.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete artifacts in their museums"
  ON artifacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = artifacts.museum_id
        AND museums.owner_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- STAFF MEMBERS
-- Same pattern — linked to a museum, which belongs to a user.
-- -------------------------------------------------------------
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view staff in their museums"
  ON staff_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = staff_members.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create staff in their museums"
  ON staff_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = staff_members.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update staff in their museums"
  ON staff_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = staff_members.museum_id
        AND museums.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = staff_members.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete staff in their museums"
  ON staff_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = staff_members.museum_id
        AND museums.owner_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- LOCATION HISTORY (Spectrum — Location & Movement Control)
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
-- CONDITION ASSESSMENTS (Spectrum — Condition Checking)
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
-- CONSERVATION TREATMENTS (Spectrum — Conservation & Collections Care)
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
-- LOANS (Spectrum — Loans In / Loans Out)
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
-- AUDIT RECORDS (Spectrum — Audit)
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
