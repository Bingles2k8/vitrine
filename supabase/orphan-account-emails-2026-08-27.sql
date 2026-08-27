-- Emailing accounts that never completed onboarding.
--
-- Every lifecycle email Vitrine sends is keyed off a museum row: the
-- reengagement cron selects from `museums`, the deletion crons set flags on
-- `museums`, and the admin nudge button takes a museum id. Someone who created
-- an account and dropped out before the onboarding insert therefore has never
-- received anything from us at all, and there was no way to email them or to
-- see that we hadn't.
--
-- Two changes, both small:
--
--   1. `account_emails.user_id`, so a send can be recorded against a person
--      rather than a museum. `museum_id` was already nullable, so an orphan row
--      is simply (museum_id null, user_id set). Owner sends keep writing
--      museum_id and now also carry user_id where the caller knows it.
--
--   2. `account_email_opt_outs`, the equivalent of `museums.reengage_opt_out`
--      for someone with no museum row to store the flag on. Unsubscribe has to
--      work from the first email we ever send them, so it cannot depend on a
--      record onboarding would have created.

ALTER TABLE account_emails
  ADD COLUMN IF NOT EXISTS user_id uuid;

COMMENT ON COLUMN account_emails.user_id IS
  'Auth user the email went to. The only identifier for a recipient with no museum; set alongside museum_id for owners.';

-- The admin page asks for the newest row per user, the same question the
-- museum index answers for owners. Partial: owner rows are found by museum_id.
CREATE INDEX IF NOT EXISTS account_emails_user_sent_idx
  ON account_emails (user_id, sent_at DESC)
  WHERE user_id IS NOT NULL;

-- Opt-out for recipients who have no museum row.
--
-- Presence of the row is the opt-out; there is no boolean to get out of step
-- with it, and re-subscribing is a delete. Service-role only, like the log:
-- the unsubscribe route runs unauthenticated and writes with the service key,
-- and nothing in the product reads this.
CREATE TABLE IF NOT EXISTS account_email_opt_outs (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  opted_out_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_email_opt_outs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE account_email_opt_outs IS
  'Users who unsubscribed from non-essential account email and have no museum row to hold museums.reengage_opt_out. Presence of the row is the opt-out.';
