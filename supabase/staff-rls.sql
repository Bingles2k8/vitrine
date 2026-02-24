-- =============================================================
-- Staff RLS Policies — Multi-user Access Control
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Adds database-level access for staff members on all tables.
-- The existing owner-only policies remain in place — these are
-- additive policies so Postgres uses OR logic between them.
--
-- Role permissions:
--   Viewer  → SELECT only
--   Editor  → SELECT + INSERT + UPDATE
--   Admin   → SELECT + INSERT + UPDATE + DELETE
-- =============================================================


-- -------------------------------------------------------------
-- MUSEUMS
-- Staff can read their museum's details (needed for sidebar,
-- plan info, etc). Only owners can modify museum settings.
-- -------------------------------------------------------------
CREATE POLICY "Staff can view their museum"
  ON museums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = museums.id
        AND staff_members.user_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- STAFF MEMBERS
-- All staff can view who else is on the team.
-- Only owners manage staff (handled by existing owner policy).
-- -------------------------------------------------------------
CREATE POLICY "Staff can view other staff in their museum"
  ON staff_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members s2
      WHERE s2.museum_id = staff_members.museum_id
        AND s2.user_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- ARTIFACTS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view artifacts in their museums"
  ON artifacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = artifacts.museum_id
        AND staff_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff editors can create artifacts in their museums"
  ON artifacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = artifacts.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.role IN ('Admin', 'Editor')
    )
  );

CREATE POLICY "Staff editors can update artifacts in their museums"
  ON artifacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = artifacts.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.role IN ('Admin', 'Editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = artifacts.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.role IN ('Admin', 'Editor')
    )
  );

CREATE POLICY "Staff admins can delete artifacts in their museums"
  ON artifacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = artifacts.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.role = 'Admin'
    )
  );


-- -------------------------------------------------------------
-- LOCATION HISTORY
-- -------------------------------------------------------------
CREATE POLICY "Staff can view location_history in their museums"
  ON location_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create location_history in their museums"
  ON location_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update location_history in their museums"
  ON location_history FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete location_history in their museums"
  ON location_history FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- CONDITION ASSESSMENTS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view condition_assessments in their museums"
  ON condition_assessments FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create condition_assessments in their museums"
  ON condition_assessments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update condition_assessments in their museums"
  ON condition_assessments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete condition_assessments in their museums"
  ON condition_assessments FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- CONSERVATION TREATMENTS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view conservation_treatments in their museums"
  ON conservation_treatments FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create conservation_treatments in their museums"
  ON conservation_treatments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update conservation_treatments in their museums"
  ON conservation_treatments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete conservation_treatments in their museums"
  ON conservation_treatments FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- LOANS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view loans in their museums"
  ON loans FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create loans in their museums"
  ON loans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update loans in their museums"
  ON loans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete loans in their museums"
  ON loans FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- AUDIT RECORDS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view audit_records in their museums"
  ON audit_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create audit_records in their museums"
  ON audit_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update audit_records in their museums"
  ON audit_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete audit_records in their museums"
  ON audit_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- ENTRY RECORDS (Object Entry)
-- -------------------------------------------------------------
CREATE POLICY "Staff can view entry_records in their museums"
  ON entry_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create entry_records in their museums"
  ON entry_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update entry_records in their museums"
  ON entry_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete entry_records in their museums"
  ON entry_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- OBJECT EXITS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view object_exits in their museums"
  ON object_exits FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create object_exits in their museums"
  ON object_exits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update object_exits in their museums"
  ON object_exits FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete object_exits in their museums"
  ON object_exits FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- DOCUMENTATION PLANS
-- All staff can read the compliance plan.
-- Admin + Editor can update it.
-- -------------------------------------------------------------
CREATE POLICY "Staff can view documentation_plans in their museums"
  ON documentation_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create documentation_plans in their museums"
  ON documentation_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update documentation_plans in their museums"
  ON documentation_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));


-- -------------------------------------------------------------
-- VALUATIONS
-- -------------------------------------------------------------
CREATE POLICY "Staff can view valuations in their museums"
  ON valuations FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create valuations in their museums"
  ON valuations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update valuations in their museums"
  ON valuations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete valuations in their museums"
  ON valuations FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- RISK REGISTER
-- -------------------------------------------------------------
CREATE POLICY "Staff can view risk_register in their museums"
  ON risk_register FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create risk_register in their museums"
  ON risk_register FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update risk_register in their museums"
  ON risk_register FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete risk_register in their museums"
  ON risk_register FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));


-- -------------------------------------------------------------
-- ACTIVITY LOG
-- All staff can view the activity log.
-- All staff can create entries (for audit trail purposes).
-- Activity log is immutable — no UPDATE or DELETE for staff.
-- -------------------------------------------------------------
CREATE POLICY "Staff can view activity_log in their museums"
  ON activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = activity_log.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff can create activity_log in their museums"
  ON activity_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = activity_log.museum_id AND staff_members.user_id = auth.uid()));


-- -------------------------------------------------------------
-- ARTIFACT IMAGES
-- -------------------------------------------------------------
CREATE POLICY "Staff can view artifact_images in their museums"
  ON artifact_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = artifact_images.museum_id AND staff_members.user_id = auth.uid()));

CREATE POLICY "Staff editors can create artifact_images in their museums"
  ON artifact_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = artifact_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff editors can update artifact_images in their museums"
  ON artifact_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = artifact_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = artifact_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role IN ('Admin', 'Editor')));

CREATE POLICY "Staff admins can delete artifact_images in their museums"
  ON artifact_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = artifact_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.role = 'Admin'));
