-- Link an exit record back to the disposal that created it.
--
-- Completing a disposal never created an object_exits row (audit 6.5 / O5), so
-- the object left the building with no exit in the register, and the
-- documentation metric that scores "exit records for deaccessioned objects"
-- had nothing to score. The disposal register now creates that exit.
--
-- This column makes the link explicit, which:
--   * keeps creation idempotent — completing an already-completed disposal
--     will not add a second exit;
--   * lets a reversal find and remove the exit it created, rather than
--     guessing from (object, date, reason).
--
-- ON DELETE SET NULL, not CASCADE: if a disposal record ever goes away the
-- exit is still a real historical event and must survive as an audit trail.
--
-- Additive and nullable — safe to apply live.

ALTER TABLE object_exits
  ADD COLUMN IF NOT EXISTS related_disposal_id uuid REFERENCES disposal_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS object_exits_related_disposal_id_idx
  ON object_exits (related_disposal_id) WHERE related_disposal_id IS NOT NULL;

COMMENT ON COLUMN object_exits.related_disposal_id IS
  'The disposal record whose completion created this exit, if any.';

-- Same idea for entry records: returning a deposit creates an exit, and the
-- link keeps that creation idempotent (audit E2).
ALTER TABLE object_exits
  ADD COLUMN IF NOT EXISTS related_entry_id uuid REFERENCES entry_records(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS object_exits_related_entry_id_idx
  ON object_exits (related_entry_id) WHERE related_entry_id IS NOT NULL;

COMMENT ON COLUMN object_exits.related_entry_id IS
  'The entry record whose "Returned to depositor" outcome created this exit, if any.';
