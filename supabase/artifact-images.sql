-- =============================================================
-- Object Images — Multi-image support per object
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS object_images (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid        NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
  museum_id   uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  url         text        NOT NULL,
  caption     text,
  is_primary  boolean     NOT NULL DEFAULT false,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artifact_images_artifact_idx ON object_images (object_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS artifact_images_museum_idx   ON object_images (museum_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE object_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view object_images in their museums"
  ON object_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_images.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create object_images in their museums"
  ON object_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_images.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update object_images in their museums"
  ON object_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_images.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_images.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete object_images in their museums"
  ON object_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = object_images.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- Public read access (for the public museum website)
-- Mirror pattern used for objects: show images for on-display objects
-- -------------------------------------------------------------
CREATE POLICY "Public can view images for public objects"
  ON object_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM objects
      WHERE objects.id = object_images.object_id
        AND objects.show_on_site = true
        AND objects.status IN ('On Display', 'On Loan')
    )
  );
