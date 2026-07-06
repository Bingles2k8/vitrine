-- =============================================================
-- Deaccession protection enforcement — 2026-07-06 (Phase 3 / S4)
-- deaccession_protected was only checked in ONE of three delete paths
-- (the single-object delete). The dashboard row-delete, bulk "Move to
-- bin", bulkUpdateStatus, and the Overview status <select> all ignored
-- it, so a completed-disposal object could be un-deaccessioned or binned.
-- Enforce it at the database with a BEFORE UPDATE trigger so every path
-- is covered. Hard DELETE is intentionally NOT blocked (disposal_records'
-- ON DELETE RESTRICT already guards the legal audit trail, and cascade
-- deletes must still work).
-- =============================================================

CREATE OR REPLACE FUNCTION enforce_deaccession_protection()
RETURNS trigger AS $$
BEGIN
  IF OLD.deaccession_protected IS TRUE THEN
    -- Block reverting the deaccession (status change away from Deaccessioned)
    IF NEW.status IS DISTINCT FROM 'Deaccessioned' THEN
      RAISE EXCEPTION 'Object % is a completed deaccession and cannot change status. Reverse the disposal in the Disposal register first.', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
    -- Block binning (soft delete) a protected object
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      RAISE EXCEPTION 'Object % is a completed deaccession and cannot be moved to the bin.', OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_deaccession_protection ON objects;
CREATE TRIGGER trg_enforce_deaccession_protection
  BEFORE UPDATE ON objects
  FOR EACH ROW
  EXECUTE FUNCTION enforce_deaccession_protection();
