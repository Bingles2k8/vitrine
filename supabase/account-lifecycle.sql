-- Account lifecycle: Professional trial + lockout + scheduled deletion
--
-- Adds columns to museums for:
--   - trial_used_at: set once a museum starts a trial; blocks re-trial forever
--   - ever_paid: true after the first successful paid invoice; distinguishes
--     a never-paying trial-only user (30-day deletion) from a former customer
--     (180-day deletion)
--   - locked_at / lock_reason: non-null means the museum is in payment-wall
--     state. Public site returns 404, dashboard redirects to billing-required.
--   - scheduled_deletion_at: when the daily cron will permanently delete.
--   - deletion_warning_*_sent_at: idempotency flags for the warning email cron.
--
-- Also creates deletion_log for audit trail after museum row is gone.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS ever_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS lock_reason text,
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_warning_30d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_warning_7d_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS museums_scheduled_deletion_at_idx
  ON museums (scheduled_deletion_at)
  WHERE scheduled_deletion_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS museums_locked_at_idx
  ON museums (locked_at)
  WHERE locked_at IS NOT NULL;

-- Audit trail that survives the museum row being deleted.
CREATE TABLE IF NOT EXISTS deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id uuid NOT NULL,
  museum_name text,
  museum_slug text,
  owner_email text,
  reason text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deletion_log_deleted_at_idx
  ON deletion_log (deleted_at DESC);

-- Service-role only; no RLS policies. Readable by admin via service key.
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

-- Backfill ever_paid for existing paying customers so they get the 180-day
-- window, not the 30-day trial-only window, if they cancel in the future.
UPDATE museums
  SET ever_paid = true
  WHERE stripe_customer_id IS NOT NULL
    AND ever_paid = false;
