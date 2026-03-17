-- Sub-objects / components for multi-part objects (e.g. a pair of shoes)
-- Run this in the Supabase SQL editor after object-entry-overhaul.sql

CREATE TABLE IF NOT EXISTS object_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  parent_object_id uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  component_number integer NOT NULL,
  component_accession_no text,
  title text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (parent_object_id, component_number)
);

ALTER TABLE object_components ENABLE ROW LEVEL SECURITY;

-- Museum owners and staff can manage their own components
CREATE POLICY "museum members manage components"
  ON object_components FOR ALL
  USING (
    museum_id IN (
      SELECT id FROM museums WHERE owner_id = auth.uid()
      UNION
      SELECT museum_id FROM staff_members WHERE user_id = auth.uid()
    )
  );
