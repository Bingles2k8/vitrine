-- Re-engagement emails: idempotency flags for the daily reengagement cron.
--
-- Two tracks, keyed off the museum owner's auth account (see
-- app/api/cron/reengagement/route.ts):
--
--   Track A — signed up, never came back (last sign-in within ~24h of signup):
--     reengage_a3_sent_at   day 3 after signup
--     reengage_a7_sent_at   day 7 after signup
--     reengage_a30_sent_at  day 30 after signup
--
--   Track B — came back at least once, then went quiet:
--     reengage_b30_sent_at   30 days after last sign-in
--     reengage_b180_sent_at  180 days (6 months) after last sign-in
--
-- Each flag is set the first time its email is sent, so re-running the cron
-- is a no-op. Nullable additive columns only — safe to apply live.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS reengage_a3_sent_at   timestamptz,
  ADD COLUMN IF NOT EXISTS reengage_a7_sent_at   timestamptz,
  ADD COLUMN IF NOT EXISTS reengage_a30_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reengage_b30_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reengage_b180_sent_at timestamptz;
