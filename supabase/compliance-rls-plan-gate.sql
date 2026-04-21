-- =============================================================
-- Plan-gate compliance INSERT policies
-- =============================================================
-- Mirrors the ticketing RLS plan-gating pattern
-- (supabase/ticketing-rls.sql) and applies it to the compliance
-- feature tables. After this migration, users on community and
-- hobbyist plans can no longer INSERT rows into compliance
-- tables at the database level, even if the UI is bypassed.
--
-- UPDATE and DELETE policies are deliberately left unchanged so
-- that a user who downgrades can still clean up or view existing
-- records. Only new rows require the compliance plan tier.
--
-- Helper function keeps the policy bodies short.
-- =============================================================

CREATE OR REPLACE FUNCTION museum_has_compliance_plan(p_museum_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM museums
    WHERE id = p_museum_id
      AND plan IN ('professional', 'institution', 'enterprise')
  );
$$;


-- -------------------------------------------------------------
-- ENTRY_RECORDS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create entry_records in their museums" ON entry_records;
CREATE POLICY "Users can create entry_records in their museums"
  ON entry_records FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = entry_records.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(entry_records.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create entry_records in their museums" ON entry_records;
CREATE POLICY "Staff editors can create entry_records in their museums"
  ON entry_records FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = entry_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(entry_records.museum_id)
  );


-- -------------------------------------------------------------
-- OBJECT_EXITS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create object_exits in their museums" ON object_exits;
CREATE POLICY "Users can create object_exits in their museums"
  ON object_exits FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = object_exits.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(object_exits.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create object_exits in their museums" ON object_exits;
CREATE POLICY "Staff editors can create object_exits in their museums"
  ON object_exits FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = object_exits.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(object_exits.museum_id)
  );


-- -------------------------------------------------------------
-- DOCUMENTATION_PLANS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create documentation_plans in their museums" ON documentation_plans;
CREATE POLICY "Users can create documentation_plans in their museums"
  ON documentation_plans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = documentation_plans.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(documentation_plans.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create documentation_plans in their museums" ON documentation_plans;
CREATE POLICY "Staff editors can create documentation_plans in their museums"
  ON documentation_plans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = documentation_plans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(documentation_plans.museum_id)
  );


-- -------------------------------------------------------------
-- CONDITION_ASSESSMENTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create condition_assessments in their museums" ON condition_assessments;
CREATE POLICY "Users can create condition_assessments in their museums"
  ON condition_assessments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = condition_assessments.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(condition_assessments.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create condition_assessments in their museums" ON condition_assessments;
CREATE POLICY "Staff editors can create condition_assessments in their museums"
  ON condition_assessments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = condition_assessments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(condition_assessments.museum_id)
  );


-- -------------------------------------------------------------
-- CONSERVATION_TREATMENTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create conservation_treatments in their museums" ON conservation_treatments;
CREATE POLICY "Users can create conservation_treatments in their museums"
  ON conservation_treatments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = conservation_treatments.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(conservation_treatments.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create conservation_treatments in their museums" ON conservation_treatments;
CREATE POLICY "Staff editors can create conservation_treatments in their museums"
  ON conservation_treatments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = conservation_treatments.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(conservation_treatments.museum_id)
  );


-- -------------------------------------------------------------
-- LOANS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create loans in their museums" ON loans;
CREATE POLICY "Users can create loans in their museums"
  ON loans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = loans.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(loans.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create loans in their museums" ON loans;
CREATE POLICY "Staff editors can create loans in their museums"
  ON loans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = loans.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(loans.museum_id)
  );


-- -------------------------------------------------------------
-- AUDIT_RECORDS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create audit_records in their museums" ON audit_records;
CREATE POLICY "Users can create audit_records in their museums"
  ON audit_records FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = audit_records.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(audit_records.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create audit_records in their museums" ON audit_records;
CREATE POLICY "Staff editors can create audit_records in their museums"
  ON audit_records FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = audit_records.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(audit_records.museum_id)
  );


-- -------------------------------------------------------------
-- DAMAGE_REPORTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create damage_reports in their museums" ON damage_reports;
CREATE POLICY "Users can create damage_reports in their museums"
  ON damage_reports FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = damage_reports.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(damage_reports.museum_id)
  );


-- -------------------------------------------------------------
-- EMERGENCY_PLANS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create emergency_plans in their museums" ON emergency_plans;
CREATE POLICY "Users can create emergency_plans in their museums"
  ON emergency_plans FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = emergency_plans.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(emergency_plans.museum_id)
  );


-- -------------------------------------------------------------
-- EMERGENCY_SALVAGE_PRIORITIES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum salvage priorities" ON emergency_salvage_priorities;
CREATE POLICY "Users can insert own museum salvage priorities"
  ON emergency_salvage_priorities FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- EMERGENCY_EVENTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum emergency events" ON emergency_events;
CREATE POLICY "Users can insert own museum emergency events"
  ON emergency_events FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- INSURANCE_POLICIES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create insurance_policies in their museums" ON insurance_policies;
CREATE POLICY "Users can create insurance_policies in their museums"
  ON insurance_policies FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = insurance_policies.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(insurance_policies.museum_id)
  );


-- -------------------------------------------------------------
-- RISK_REGISTER
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create risk_register in their museums" ON risk_register;
CREATE POLICY "Users can create risk_register in their museums"
  ON risk_register FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = risk_register.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(risk_register.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create risk_register in their museums" ON risk_register;
CREATE POLICY "Staff editors can create risk_register in their museums"
  ON risk_register FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = risk_register.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(risk_register.museum_id)
  );


-- -------------------------------------------------------------
-- VALUATIONS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create valuations in their museums" ON valuations;
CREATE POLICY "Users can create valuations in their museums"
  ON valuations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = valuations.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(valuations.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create valuations in their museums" ON valuations;
CREATE POLICY "Staff editors can create valuations in their museums"
  ON valuations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = valuations.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(valuations.museum_id)
  );


-- -------------------------------------------------------------
-- REPRODUCTION_REQUESTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create reproduction_requests in their museums" ON reproduction_requests;
CREATE POLICY "Users can create reproduction_requests in their museums"
  ON reproduction_requests FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM museums WHERE museums.id = reproduction_requests.museum_id AND museums.owner_id = auth.uid())
    AND museum_has_compliance_plan(reproduction_requests.museum_id)
  );

DROP POLICY IF EXISTS "Staff editors can create reproduction_requests in their museums" ON reproduction_requests;
CREATE POLICY "Staff editors can create reproduction_requests in their museums"
  ON reproduction_requests FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM staff_members WHERE staff_members.museum_id = reproduction_requests.museum_id AND staff_members.user_id = auth.uid() AND staff_members.access IN ('Admin', 'Editor'))
    AND museum_has_compliance_plan(reproduction_requests.museum_id)
  );


-- -------------------------------------------------------------
-- RIGHTS_RECORDS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum rights records" ON rights_records;
CREATE POLICY "Users can insert own museum rights records"
  ON rights_records FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- DISPOSAL_RECORDS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum disposal records" ON disposal_records;
CREATE POLICY "Users can insert own museum disposal records"
  ON disposal_records FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- COLLECTION_REVIEWS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum collection reviews" ON collection_reviews;
CREATE POLICY "Users can insert own museum collection reviews"
  ON collection_reviews FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- COLLECTION_USE_RECORDS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum collection use records" ON collection_use_records;
CREATE POLICY "Users can insert own museum collection use records"
  ON collection_use_records FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- AUDIT_EXERCISES
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum audit exercises" ON audit_exercises;
CREATE POLICY "Users can insert own museum audit exercises"
  ON audit_exercises FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- DOCUMENTATION_PLAN_BACKLOGS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum doc plan backlogs" ON documentation_plan_backlogs;
CREATE POLICY "Users can insert own museum doc plan backlogs"
  ON documentation_plan_backlogs FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );


-- -------------------------------------------------------------
-- DOCUMENTATION_PLAN_DOCUMENTS
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own museum doc plan documents" ON documentation_plan_documents;
CREATE POLICY "Users can insert own museum doc plan documents"
  ON documentation_plan_documents FOR INSERT
  WITH CHECK (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
    AND museum_has_compliance_plan(museum_id)
  );
