-- =============================================================
-- Staff RLS Policies — Multi-user Access Control
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Adds database-level access for staff members on all tables.
-- The existing owner-only policies remain in place — these are
-- additive policies so Postgres uses OR logic between them.
--
-- Re-runnable: each policy is dropped before being (re)created.
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
DROP POLICY IF EXISTS "Staff can view their museum" ON museums;
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
DROP POLICY IF EXISTS "Staff can view other staff in their museum" ON staff_members;
CREATE POLICY "Staff can view other staff in their museum"
  ON staff_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = staff_members.museum_id
        AND museums.owner_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- ARTIFACTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view objects in their museums" ON objects;
CREATE POLICY "Staff can view objects in their museums"
  ON objects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = objects.museum_id
        AND staff_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff editors can create objects in their museums" ON objects;
CREATE POLICY "Staff editors can create objects in their museums"
  ON objects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = objects.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.access IN ('Admin', 'Editor')
    )
  );

DROP POLICY IF EXISTS "Staff editors can update objects in their museums" ON objects;
CREATE POLICY "Staff editors can update objects in their museums"
  ON objects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = objects.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.access IN ('Admin', 'Editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = objects.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.access IN ('Admin', 'Editor')
    )
  );

DROP POLICY IF EXISTS "Staff admins can delete objects in their museums" ON objects;
CREATE POLICY "Staff admins can delete objects in their museums"
  ON objects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE staff_members.museum_id = objects.museum_id
        AND staff_members.user_id = auth.uid()
        AND staff_members.access = 'Admin'
    )
  );


-- -------------------------------------------------------------
-- LOCATION HISTORY
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view location_history in their museums" ON location_history;
CREATE POLICY "Staff can view location_history in their museums"
  ON location_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create location_history in their museums" ON location_history;
CREATE POLICY "Staff editors can create location_history in their museums"
  ON location_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update location_history in their museums" ON location_history;
CREATE POLICY "Staff editors can update location_history in their museums"
  ON location_history FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete location_history in their museums" ON location_history;
CREATE POLICY "Staff admins can delete location_history in their museums"
  ON location_history FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = location_history.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- CONDITION ASSESSMENTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view condition_assessments in their museums" ON condition_assessments;
CREATE POLICY "Staff can view condition_assessments in their museums"
  ON condition_assessments FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create condition_assessments in their museums" ON condition_assessments;
CREATE POLICY "Staff editors can create condition_assessments in their museums"
  ON condition_assessments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update condition_assessments in their museums" ON condition_assessments;
CREATE POLICY "Staff editors can update condition_assessments in their museums"
  ON condition_assessments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete condition_assessments in their museums" ON condition_assessments;
CREATE POLICY "Staff admins can delete condition_assessments in their museums"
  ON condition_assessments FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- CONSERVATION TREATMENTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view conservation_treatments in their museums" ON conservation_treatments;
CREATE POLICY "Staff can view conservation_treatments in their museums"
  ON conservation_treatments FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create conservation_treatments in their museums" ON conservation_treatments;
CREATE POLICY "Staff editors can create conservation_treatments in their museums"
  ON conservation_treatments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update conservation_treatments in their museums" ON conservation_treatments;
CREATE POLICY "Staff editors can update conservation_treatments in their museums"
  ON conservation_treatments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete conservation_treatments in their museums" ON conservation_treatments;
CREATE POLICY "Staff admins can delete conservation_treatments in their museums"
  ON conservation_treatments FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- LOANS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view loans in their museums" ON loans;
CREATE POLICY "Staff can view loans in their museums"
  ON loans FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create loans in their museums" ON loans;
CREATE POLICY "Staff editors can create loans in their museums"
  ON loans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update loans in their museums" ON loans;
CREATE POLICY "Staff editors can update loans in their museums"
  ON loans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete loans in their museums" ON loans;
CREATE POLICY "Staff admins can delete loans in their museums"
  ON loans FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- AUDIT RECORDS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view audit_records in their museums" ON audit_records;
CREATE POLICY "Staff can view audit_records in their museums"
  ON audit_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create audit_records in their museums" ON audit_records;
CREATE POLICY "Staff editors can create audit_records in their museums"
  ON audit_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update audit_records in their museums" ON audit_records;
CREATE POLICY "Staff editors can update audit_records in their museums"
  ON audit_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete audit_records in their museums" ON audit_records;
CREATE POLICY "Staff admins can delete audit_records in their museums"
  ON audit_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- ENTRY RECORDS (Object Entry)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view entry_records in their museums" ON entry_records;
CREATE POLICY "Staff can view entry_records in their museums"
  ON entry_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create entry_records in their museums" ON entry_records;
CREATE POLICY "Staff editors can create entry_records in their museums"
  ON entry_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update entry_records in their museums" ON entry_records;
CREATE POLICY "Staff editors can update entry_records in their museums"
  ON entry_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete entry_records in their museums" ON entry_records;
CREATE POLICY "Staff admins can delete entry_records in their museums"
  ON entry_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- OBJECT EXITS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view object_exits in their museums" ON object_exits;
CREATE POLICY "Staff can view object_exits in their museums"
  ON object_exits FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create object_exits in their museums" ON object_exits;
CREATE POLICY "Staff editors can create object_exits in their museums"
  ON object_exits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update object_exits in their museums" ON object_exits;
CREATE POLICY "Staff editors can update object_exits in their museums"
  ON object_exits FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete object_exits in their museums" ON object_exits;
CREATE POLICY "Staff admins can delete object_exits in their museums"
  ON object_exits FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- DOCUMENTATION PLANS
-- All staff can read the compliance plan.
-- Admin + Editor can update it.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view documentation_plans in their museums" ON documentation_plans;
CREATE POLICY "Staff can view documentation_plans in their museums"
  ON documentation_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create documentation_plans in their museums" ON documentation_plans;
CREATE POLICY "Staff editors can create documentation_plans in their museums"
  ON documentation_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update documentation_plans in their museums" ON documentation_plans;
CREATE POLICY "Staff editors can update documentation_plans in their museums"
  ON documentation_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));


-- -------------------------------------------------------------
-- VALUATIONS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view valuations in their museums" ON valuations;
CREATE POLICY "Staff can view valuations in their museums"
  ON valuations FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create valuations in their museums" ON valuations;
CREATE POLICY "Staff editors can create valuations in their museums"
  ON valuations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update valuations in their museums" ON valuations;
CREATE POLICY "Staff editors can update valuations in their museums"
  ON valuations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete valuations in their museums" ON valuations;
CREATE POLICY "Staff admins can delete valuations in their museums"
  ON valuations FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- RISK REGISTER
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view risk_register in their museums" ON risk_register;
CREATE POLICY "Staff can view risk_register in their museums"
  ON risk_register FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create risk_register in their museums" ON risk_register;
CREATE POLICY "Staff editors can create risk_register in their museums"
  ON risk_register FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update risk_register in their museums" ON risk_register;
CREATE POLICY "Staff editors can update risk_register in their museums"
  ON risk_register FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete risk_register in their museums" ON risk_register;
CREATE POLICY "Staff admins can delete risk_register in their museums"
  ON risk_register FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));


-- -------------------------------------------------------------
-- ACTIVITY LOG
-- All staff can view the activity log.
-- All staff can create entries (for audit trail purposes).
-- Activity log is immutable — no UPDATE or DELETE for staff.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view activity_log in their museums" ON activity_log;
CREATE POLICY "Staff can view activity_log in their museums"
  ON activity_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = activity_log.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff can create activity_log in their museums" ON activity_log;
CREATE POLICY "Staff can create activity_log in their museums"
  ON activity_log FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = activity_log.museum_id AND staff_members.user_id = auth.uid()));


-- -------------------------------------------------------------
-- ARTIFACT IMAGES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can view object_images in their museums" ON object_images;
CREATE POLICY "Staff can view object_images in their museums"
  ON object_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_images.museum_id AND staff_members.user_id = auth.uid()));

DROP POLICY IF EXISTS "Staff editors can create object_images in their museums" ON object_images;
CREATE POLICY "Staff editors can create object_images in their museums"
  ON object_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff editors can update object_images in their museums" ON object_images;
CREATE POLICY "Staff editors can update object_images in their museums"
  ON object_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')))
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor')));

DROP POLICY IF EXISTS "Staff admins can delete object_images in their museums" ON object_images;
CREATE POLICY "Staff admins can delete object_images in their museums"
  ON object_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_images.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access = 'Admin'));
