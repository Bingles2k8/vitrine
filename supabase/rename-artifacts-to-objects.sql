-- =============================================================
-- Migration: Rename artifacts → objects
-- =============================================================
-- Based on actual schema — only 4 tables need changes.
-- Run in your Supabase SQL editor.
-- =============================================================

-- 1. Rename the main table
ALTER TABLE artifacts RENAME TO objects;

-- 2. Rename artifact_images (table first, then column)
ALTER TABLE artifact_images RENAME TO object_images;
ALTER TABLE object_images RENAME COLUMN artifact_id TO object_id;

-- 3. Rename artifact_documents (table first, then column)
ALTER TABLE artifact_documents RENAME TO object_documents;
ALTER TABLE object_documents RENAME COLUMN artifact_id TO object_id;

-- 4. Rename artifact_id in activity_log
ALTER TABLE activity_log RENAME COLUMN artifact_id TO object_id;

-- 5. Rename indexes
ALTER INDEX IF EXISTS artifact_images_artifact_idx    RENAME TO object_images_object_idx;
ALTER INDEX IF EXISTS artifact_images_museum_idx      RENAME TO object_images_museum_idx;
ALTER INDEX IF EXISTS artifact_documents_artifact_idx RENAME TO object_documents_object_idx;
ALTER INDEX IF EXISTS artifact_documents_museum_idx   RENAME TO object_documents_museum_idx;
ALTER INDEX IF EXISTS artifact_documents_related_idx  RENAME TO object_documents_related_idx;
ALTER INDEX IF EXISTS activity_log_artifact_idx       RENAME TO activity_log_object_idx;

-- 6. Storage buckets: rename via Supabase dashboard
--    artifact-images    →  object-images
--    artifact-documents →  object-documents
--    (existing file URLs in object_images.url will still work
--     if you keep the old buckets or update the URLs separately)
