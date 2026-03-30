-- =============================================================
-- Wishlist, Duplicate Deletion & Collection Valuation
-- =============================================================


-- -------------------------------------------------------------
-- MUSEUMS — new toggle fields (must run before wanted_items policies)
-- -------------------------------------------------------------
ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS show_wanted          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_collection_value boolean DEFAULT false;


-- -------------------------------------------------------------
-- OBJECTS — new value fields
-- -------------------------------------------------------------
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS estimated_value          numeric(12,2),
  ADD COLUMN IF NOT EXISTS estimated_value_currency text DEFAULT 'GBP';


-- -------------------------------------------------------------
-- WANTED ITEMS (Wishlist)
-- Community & Hobbyist tiers only (enforced in app)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wanted_items (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id           uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  year                text,
  medium              text,
  notes               text,
  priority            text        NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  created_at          timestamptz NOT NULL DEFAULT now(),
  acquired_at         timestamptz,
  converted_object_id uuid        REFERENCES objects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS wanted_items_museum_idx    ON wanted_items (museum_id, acquired_at NULLS FIRST);
CREATE INDEX IF NOT EXISTS wanted_items_priority_idx  ON wanted_items (museum_id, priority);

ALTER TABLE wanted_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view wanted_items in their museums"
  ON wanted_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = wanted_items.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create wanted_items in their museums"
  ON wanted_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = wanted_items.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update wanted_items in their museums"
  ON wanted_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = wanted_items.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = wanted_items.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete wanted_items in their museums"
  ON wanted_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = wanted_items.museum_id AND museums.owner_id = auth.uid()));

-- Public read for wanted list page (when show_wanted = true, enforced in app)
CREATE POLICY "Public can view wanted_items for public collections"
  ON wanted_items FOR SELECT
  USING (
    acquired_at IS NULL
    AND EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = wanted_items.museum_id
        AND museums.show_wanted = true
    )
  );


-- -------------------------------------------------------------
-- OBJECT DUPLICATES
-- All tiers
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS object_duplicates (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id       uuid        NOT NULL REFERENCES museums(id) ON DELETE CASCADE,
  object_id       uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  duplicate_of_id uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (object_id, duplicate_of_id)
);

CREATE INDEX IF NOT EXISTS object_duplicates_object_idx ON object_duplicates (object_id);
CREATE INDEX IF NOT EXISTS object_duplicates_museum_idx ON object_duplicates (museum_id);

ALTER TABLE object_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object_duplicates in their museums"
  ON object_duplicates FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_duplicates.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create object_duplicates in their museums"
  ON object_duplicates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_duplicates.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete object_duplicates in their museums"
  ON object_duplicates FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_duplicates.museum_id AND museums.owner_id = auth.uid()));


