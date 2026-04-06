-- =============================================================
-- Cached storage usage counter on museums
-- =============================================================
-- Adds storage_used_bytes to museums and keeps it in sync via
-- triggers on all storage-contributing tables. The plan page can
-- then read this single column instead of summing 6 tables.
--
-- Sources counted:
--   1. object_documents
--   2. disposal_record_documents
--   3. emergency_plan_documents
--   4. insurance_policy_documents
--   5. documentation_plan_documents
--   6. conservation_treatments.images (JSONB array, file_size per element)
--
-- Public gallery images (object_images) are NOT counted —
-- they are governed by the per-object imagesPerObject count limit.
-- =============================================================

-- 1. Add column
ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS storage_used_bytes bigint NOT NULL DEFAULT 0;

-- =============================================================
-- 2. Trigger function for flat document tables
--    Called by AFTER INSERT / AFTER DELETE triggers on each table.
--    The delta (+NEW.file_size or -OLD.file_size) is passed as arg.
-- =============================================================

CREATE OR REPLACE FUNCTION update_museum_storage_bytes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE museums
    SET storage_used_bytes = GREATEST(0, storage_used_bytes + COALESCE(NEW.file_size, 0))
    WHERE id = NEW.museum_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE museums
    SET storage_used_bytes = GREATEST(0, storage_used_bytes - COALESCE(OLD.file_size, 0))
    WHERE id = OLD.museum_id;
  END IF;
  RETURN NULL;
END;
$$;

-- object_documents
DROP TRIGGER IF EXISTS trg_storage_object_documents_insert ON object_documents;
CREATE TRIGGER trg_storage_object_documents_insert
  AFTER INSERT ON object_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

DROP TRIGGER IF EXISTS trg_storage_object_documents_delete ON object_documents;
CREATE TRIGGER trg_storage_object_documents_delete
  AFTER DELETE ON object_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

-- disposal_record_documents
DROP TRIGGER IF EXISTS trg_storage_disposal_docs_insert ON disposal_record_documents;
CREATE TRIGGER trg_storage_disposal_docs_insert
  AFTER INSERT ON disposal_record_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

DROP TRIGGER IF EXISTS trg_storage_disposal_docs_delete ON disposal_record_documents;
CREATE TRIGGER trg_storage_disposal_docs_delete
  AFTER DELETE ON disposal_record_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

-- emergency_plan_documents
DROP TRIGGER IF EXISTS trg_storage_emergency_docs_insert ON emergency_plan_documents;
CREATE TRIGGER trg_storage_emergency_docs_insert
  AFTER INSERT ON emergency_plan_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

DROP TRIGGER IF EXISTS trg_storage_emergency_docs_delete ON emergency_plan_documents;
CREATE TRIGGER trg_storage_emergency_docs_delete
  AFTER DELETE ON emergency_plan_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

-- insurance_policy_documents
DROP TRIGGER IF EXISTS trg_storage_insurance_docs_insert ON insurance_policy_documents;
CREATE TRIGGER trg_storage_insurance_docs_insert
  AFTER INSERT ON insurance_policy_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

DROP TRIGGER IF EXISTS trg_storage_insurance_docs_delete ON insurance_policy_documents;
CREATE TRIGGER trg_storage_insurance_docs_delete
  AFTER DELETE ON insurance_policy_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

-- documentation_plan_documents
DROP TRIGGER IF EXISTS trg_storage_doc_plan_docs_insert ON documentation_plan_documents;
CREATE TRIGGER trg_storage_doc_plan_docs_insert
  AFTER INSERT ON documentation_plan_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

DROP TRIGGER IF EXISTS trg_storage_doc_plan_docs_delete ON documentation_plan_documents;
CREATE TRIGGER trg_storage_doc_plan_docs_delete
  AFTER DELETE ON documentation_plan_documents
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_bytes();

-- =============================================================
-- 3. Trigger function for conservation_treatments (JSONB images)
--    Computes the sum of file_size across the images array for
--    old and new rows, then applies the delta to museums.
-- =============================================================

CREATE OR REPLACE FUNCTION update_museum_storage_conservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_bytes bigint := 0;
  v_new_bytes bigint := 0;
  v_museum_id uuid;
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    SELECT COALESCE(SUM((elem->>'file_size')::bigint), 0)
    INTO v_old_bytes
    FROM jsonb_array_elements(COALESCE(OLD.images, '[]'::jsonb)) AS elem
    WHERE elem->>'file_size' IS NOT NULL;
    v_museum_id := OLD.museum_id;
  END IF;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT COALESCE(SUM((elem->>'file_size')::bigint), 0)
    INTO v_new_bytes
    FROM jsonb_array_elements(COALESCE(NEW.images, '[]'::jsonb)) AS elem
    WHERE elem->>'file_size' IS NOT NULL;
    v_museum_id := NEW.museum_id;
  END IF;

  IF v_new_bytes != v_old_bytes THEN
    UPDATE museums
    SET storage_used_bytes = GREATEST(0, storage_used_bytes + v_new_bytes - v_old_bytes)
    WHERE id = v_museum_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_storage_conservation_insert ON conservation_treatments;
CREATE TRIGGER trg_storage_conservation_insert
  AFTER INSERT ON conservation_treatments
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_conservation();

DROP TRIGGER IF EXISTS trg_storage_conservation_update ON conservation_treatments;
CREATE TRIGGER trg_storage_conservation_update
  AFTER UPDATE ON conservation_treatments
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_conservation();

DROP TRIGGER IF EXISTS trg_storage_conservation_delete ON conservation_treatments;
CREATE TRIGGER trg_storage_conservation_delete
  AFTER DELETE ON conservation_treatments
  FOR EACH ROW EXECUTE FUNCTION update_museum_storage_conservation();

-- =============================================================
-- 4. Backfill existing data
-- =============================================================

UPDATE museums m
SET storage_used_bytes = (
  SELECT COALESCE(SUM(file_size), 0)
  FROM object_documents
  WHERE museum_id = m.id
    AND deleted_at IS NULL
) + (
  SELECT COALESCE(SUM(file_size), 0)
  FROM disposal_record_documents
  WHERE museum_id = m.id
) + (
  SELECT COALESCE(SUM(file_size), 0)
  FROM emergency_plan_documents
  WHERE museum_id = m.id
) + (
  SELECT COALESCE(SUM(file_size), 0)
  FROM insurance_policy_documents
  WHERE museum_id = m.id
) + (
  SELECT COALESCE(SUM(file_size), 0)
  FROM documentation_plan_documents
  WHERE museum_id = m.id
    AND deleted_at IS NULL
) + (
  SELECT COALESCE(SUM((elem->>'file_size')::bigint), 0)
  FROM conservation_treatments ct,
       jsonb_array_elements(COALESCE(ct.images, '[]'::jsonb)) AS elem
  WHERE ct.museum_id = m.id
    AND elem->>'file_size' IS NOT NULL
);
