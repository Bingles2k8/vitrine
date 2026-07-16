-- Opt-out flag for re-engagement emails.
--
-- The re-engagement cron (app/api/cron/reengagement/route.ts) sends unsolicited
-- lifecycle email to museum owners. The 16 July 2026 audit found it had no
-- unsubscribe mechanism of any kind — no link, no suppression flag — which is a
-- problem under UK PECR / GDPR the moment REENGAGEMENT_ENABLED is turned on.
--
-- Set by /api/reengagement/unsubscribe via a signed token (lib/emailTokens.ts),
-- so a recipient can opt out from the email without logging in. The cron skips
-- any museum with this set.
--
-- Nullable additive column with a default — safe to apply live.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS reengage_opt_out boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN museums.reengage_opt_out IS
  'Owner has unsubscribed from re-engagement emails. Set by the signed unsubscribe link; honoured by the reengagement cron.';
