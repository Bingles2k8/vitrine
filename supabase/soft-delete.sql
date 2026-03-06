-- Soft delete support for artifacts
-- Add deleted_at column to enable trash/restore functionality

ALTER TABLE artifacts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial index for efficient filtering of active (non-deleted) artifacts
CREATE INDEX IF NOT EXISTS artifacts_active_idx
  ON artifacts (museum_id, deleted_at)
  WHERE deleted_at IS NULL;
