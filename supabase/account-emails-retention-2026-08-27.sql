-- Delete a person's email log when their account is deleted.
--
-- `account_emails.museum_id` has cascaded to `museums` since the table was
-- created, so an owner's log rows have always gone when their museum was
-- deleted. `user_id` was added later with no constraint at all, which left one
-- asymmetric case: a signup that never completed onboarding has rows with
-- museum_id null, so nothing cascaded and the row survived the account —
-- holding the person's email address indefinitely, after the only thing it was
-- ever for (not emailing them twice, showing when they were last contacted)
-- had ceased to exist.
--
-- CASCADE rather than SET NULL: a row whose recipient is gone cannot inform a
-- future send, and keeping the address without the account is retention without
-- a purpose. This is a delivery log, not billing evidence — the six-year DMCCA
-- retention covers the latter and is stored separately.
--
-- Safe to add: checked before applying that no row references a missing user.

ALTER TABLE account_emails
  DROP CONSTRAINT IF EXISTS account_emails_user_id_fkey;

ALTER TABLE account_emails
  ADD CONSTRAINT account_emails_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
