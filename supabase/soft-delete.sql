-- Soft delete support for objects
-- Add deleted_at column to enable trash/restore functionality

ALTER TABLE objects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Partial index for efficient filtering of active (non-deleted) objects
CREATE INDEX IF NOT EXISTS artifacts_active_idx
  ON objects (museum_id, deleted_at)
  WHERE deleted_at IS NULL;
