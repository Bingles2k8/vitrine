-- =============================================================
-- entry_records — Change object_id FK to ON DELETE CASCADE
-- =============================================================
-- Previously ON DELETE SET NULL, which left orphaned entry rows
-- when an object was permanently deleted. Now CASCADE ensures
-- entry records are removed along with their object.
-- =============================================================

ALTER TABLE entry_records
  DROP CONSTRAINT entry_records_artifact_id_fkey,
  ADD CONSTRAINT entry_records_artifact_id_fkey
    FOREIGN KEY (object_id) REFERENCES objects(id) ON DELETE CASCADE;
