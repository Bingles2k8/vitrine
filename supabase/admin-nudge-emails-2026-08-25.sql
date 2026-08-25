-- Log of account email sent to a museum owner, plus the manual nudge.
--
-- Until now there was no single answer to "when did we last email this person?".
-- The reengagement cron records five flags on `museums`, the deletion cron
-- records two more, and everything else (billing, compliance, tickets) records
-- nothing at all. The admin table needs one timestamp, so this adds a log every
-- deliberate account email can be written to, and the admin page takes the
-- newest of the log and the existing flag columns.
--
-- Not backfilled. The flag columns still hold the history of past cron sends
-- and the admin page reads them, so a backfill would only duplicate what is
-- already being displayed.
--
-- Written by the service role only. Nothing in the product reads this table, so
-- RLS is enabled with no policies at all: authenticated and anon get nothing,
-- which is the intent.

CREATE TABLE IF NOT EXISTS account_emails (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id     uuid REFERENCES museums(id) ON DELETE CASCADE,
  recipient     text NOT NULL,
  kind          text NOT NULL,
  subject       text NOT NULL,
  sent_at       timestamptz NOT NULL DEFAULT now(),
  -- Resend's message id where the send succeeded, null where it did not.
  message_id    text,
  -- Provider error, kept so a failed send is visible rather than silently absent.
  error         text,
  -- The admin who pressed the button. Null for anything sent by a cron.
  sent_by       uuid
);

-- The admin page asks for the newest row per museum.
CREATE INDEX IF NOT EXISTS account_emails_museum_sent_idx
  ON account_emails (museum_id, sent_at DESC);

ALTER TABLE account_emails ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE account_emails IS
  'Account email sent to museum owners. Service-role only. Read by /admin to show when someone was last contacted.';
COMMENT ON COLUMN account_emails.kind IS
  'Which email this was. Currently "nudge_dormant" or "nudge_never_returned" from the admin nudge button.';
