-- =============================================================
-- Artifact Images — Multi-image support per artifact
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================


-- -------------------------------------------------------------
-- TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artifact_images (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid        NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  museum_id   uuid        NOT NULL REFERENCES museums(id)   ON DELETE CASCADE,
  url         text        NOT NULL,
  caption     text,
  is_primary  boolean     NOT NULL DEFAULT false,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artifact_images_artifact_idx ON artifact_images (artifact_id, sort_order ASC);
CREATE INDEX IF NOT EXISTS artifact_images_museum_idx   ON artifact_images (museum_id);


-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE artifact_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifact_images in their museums"
  ON artifact_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = artifact_images.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can create artifact_images in their museums"
  ON artifact_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = artifact_images.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can update artifact_images in their museums"
  ON artifact_images FOR UPDATE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = artifact_images.museum_id AND museums.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM museums WHERE museums.id = artifact_images.museum_id AND museums.owner_id = auth.uid()));

CREATE POLICY "Users can delete artifact_images in their museums"
  ON artifact_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM museums WHERE museums.id = artifact_images.museum_id AND museums.owner_id = auth.uid()));


-- -------------------------------------------------------------
-- Public read access (for the public museum website)
-- Mirror pattern used for artifacts: show images for on-display artifacts
-- -------------------------------------------------------------
CREATE POLICY "Public can view images for public artifacts"
  ON artifact_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artifacts
      WHERE artifacts.id = artifact_images.artifact_id
        AND artifacts.show_on_site = true
        AND artifacts.status IN ('On Display', 'On Loan')
    )
  );
