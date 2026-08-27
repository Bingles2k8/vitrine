-- An opt-out for the reminder emails, and the flags the orphan re-engagement
-- track needs.
--
-- Two gaps this closes.
--
-- 1. `reminder_opt_out`. The compliance-digest and overdue-loan crons send on a
--    schedule the recipient never asked for per-send, and neither carried an
--    unsubscribe link or had anything to check before sending. They are not
--    billing or security notices, so they need a way out.
--
--    Deliberately NOT reusing `reengage_opt_out`. Someone who is tired of being
--    asked to come back may still very much want to be told that an object they
--    lent out is overdue. Folding the two together would silently take the
--    second away with the first.
--
-- 2. Nothing here for the orphan re-engagement track. Its idempotency comes from
--    the `account_emails` rows written by the send (kind = 'reengage_c3' and so
--    on), because a user with no museum has no row to hold a per-stage flag and
--    a table of five booleans keyed by user id would duplicate a log we already
--    keep. See app/api/cron/reengagement/route.ts.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS reminder_opt_out boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN museums.reminder_opt_out IS
  'Owner opted out of the compliance-digest and overdue-loan reminder emails. Separate from reengage_opt_out: these are two different kinds of mail and one is useful to people who want nothing to do with the other.';

-- The reminder crons ask for museums that have not opted out.
CREATE INDEX IF NOT EXISTS museums_reminder_opt_out_idx
  ON museums (reminder_opt_out)
  WHERE reminder_opt_out = false;

-- The orphan track asks "has this user had stage X yet?".
CREATE INDEX IF NOT EXISTS account_emails_user_kind_idx
  ON account_emails (user_id, kind)
  WHERE user_id IS NOT NULL;
