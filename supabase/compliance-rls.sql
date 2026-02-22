-- =============================================================
-- RLS Policies — Spectrum 5.1 Compliance Gap Tables
-- =============================================================
-- Run this after compliance-gaps.sql
-- =============================================================


-- -------------------------------------------------------------
-- ENTRY RECORDS (Object Entry — Procedure 1)
-- -------------------------------------------------------------
ALTER TABLE entry_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entry_records in their museums"
  ON entry_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = entry_records.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create entry_records in their museums"
  ON entry_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = entry_records.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update entry_records in their museums"
  ON entry_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = entry_records.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = entry_records.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete entry_records in their museums"
  ON entry_records FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = entry_records.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- OBJECT EXITS (Object Exit — Procedure 6)
-- -------------------------------------------------------------
ALTER TABLE object_exits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object_exits in their museums"
  ON object_exits FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_exits.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create object_exits in their museums"
  ON object_exits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_exits.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update object_exits in their museums"
  ON object_exits FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_exits.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_exits.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete object_exits in their museums"
  ON object_exits FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_exits.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- DOCUMENTATION PLANS (Documentation Planning — Procedure 9)
-- -------------------------------------------------------------
ALTER TABLE documentation_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documentation_plans in their museums"
  ON documentation_plans FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = documentation_plans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create documentation_plans in their museums"
  ON documentation_plans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = documentation_plans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update documentation_plans in their museums"
  ON documentation_plans FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = documentation_plans.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = documentation_plans.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete documentation_plans in their museums"
  ON documentation_plans FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = documentation_plans.museum_id AND museums.owner_id = auth.uid()));
