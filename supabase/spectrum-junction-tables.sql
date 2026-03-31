-- Spectrum 5.1 Procedure 15 (Emergency Planning) — affected objects per event
CREATE TABLE IF NOT EXISTS emergency_event_objects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   uuid NOT NULL REFERENCES emergency_events(id) ON DELETE CASCADE,
  museum_id  uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  object_id  uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, object_id)
);
ALTER TABLE emergency_event_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "museum members can select emergency_event_objects"
  ON emergency_event_objects FOR SELECT
  USING (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
CREATE POLICY "museum members can insert emergency_event_objects"
  ON emergency_event_objects FOR INSERT
  WITH CHECK (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
CREATE POLICY "museum members can update emergency_event_objects"
  ON emergency_event_objects FOR UPDATE
  USING (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
CREATE POLICY "museum members can delete emergency_event_objects"
  ON emergency_event_objects FOR DELETE
  USING (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));

-- Spectrum 5.1 Procedure 14 (Insurance) — objects covered per policy
CREATE TABLE IF NOT EXISTS insurance_policy_objects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id  uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  museum_id  uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  object_id  uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (policy_id, object_id)
);
ALTER TABLE insurance_policy_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "museum members can select insurance_policy_objects"
  ON insurance_policy_objects FOR SELECT
  USING (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
CREATE POLICY "museum members can insert insurance_policy_objects"
  ON insurance_policy_objects FOR INSERT
  WITH CHECK (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
CREATE POLICY "museum members can update insurance_policy_objects"
  ON insurance_policy_objects FOR UPDATE
  USING (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
CREATE POLICY "museum members can delete insurance_policy_objects"
  ON insurance_policy_objects FOR DELETE
  USING (museum_id IN (SELECT museum_id FROM staff_members WHERE user_id = auth.uid() UNION SELECT id FROM museums WHERE owner_id = auth.uid()));
