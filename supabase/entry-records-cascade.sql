-- =============================================================
-- entry_records — Change artifact_id FK to ON DELETE CASCADE
-- =============================================================
-- Previously ON DELETE SET NULL, which left orphaned entry rows
-- when an artifact was permanently deleted. Now CASCADE ensures
-- entry records are removed along with their artifact.
-- =============================================================

ALTER TABLE entry_records
  DROP CONSTRAINT entry_records_artifact_id_fkey,
  ADD CONSTRAINT entry_records_artifact_id_fkey
    FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE;
