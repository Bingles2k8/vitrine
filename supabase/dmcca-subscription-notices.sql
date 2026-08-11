-- =============================================================
-- DMCCA compliance, phase 2: subscription notices
-- =============================================================
-- Run in Supabase Dashboard → SQL Editor, after dmcca-billing-foundations.sql.
--
-- Every statutory communication we send about a subscription is recorded here:
-- the pre-contract information sent on subscribing (phase 2), the renewal and
-- trial reminders (phase 3), and price-change notices (phase 3).
--
-- This table is the evidence if we are ever asked to show that a notice was
-- sent. It therefore records not just that we sent something, but what: the
-- provider's message id and a SHA-256 of the exact rendered HTML, plus the
-- content version so the wording can be identified even if the template has
-- since changed.
--
-- Same two properties as cancellation_events, for the same reasons:
--   1. APPEND-ONLY. UPDATE, DELETE and TRUNCATE revoked from every client role.
--      Note TRUNCATE specifically: Supabase grants it by default and without
--      revoking it the other two revocations are decorative.
--   2. OUTLIVES THE MUSEUM. No foreign key, no cascade. Must NOT be added to
--      TABLES_IN_DEPENDENCY_ORDER in lib/delete-museum-data.ts.
--
-- One deviation from strict append-only: a notice is inserted when it is
-- scheduled and must later be marked sent. Rather than update the row, the
-- dispatcher inserts a second row for the send. `scheduled_at` and `sent_at`
-- are both nullable so a row can represent either, and the pair is linked by
-- (subscription id, notice type, scheduled_at).
-- =============================================================

CREATE TABLE IF NOT EXISTS subscription_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- No FK. See note above.
  museum_id uuid NOT NULL,
  stripe_subscription_id text,

  -- pre_contract          key contract information, sent on subscribing
  -- trial_ending_7d       trial reminders
  -- trial_ending_2d
  -- trial_ending_mid      short-trial fallback, under 7 days
  -- trial_ending_24h
  -- renewal_30d           annual renewal reminders
  -- renewal_7d
  -- periodic_6m           the at-least-every-six-months reminder for monthly plans
  -- price_change_30d      price change, at least 30 days ahead
  notice_type text NOT NULL,

  -- When it was due to go out, and when it actually did. A row with sent_at
  -- null and an error set is a failed attempt, which is itself evidence.
  scheduled_at timestamptz,
  sent_at timestamptz,

  recipient_email text,

  -- Resend's id for the message, so a specific send can be traced with the
  -- provider.
  provider_message_id text,

  -- SHA-256 of the exact HTML sent, plus the template version. Together these
  -- let us show precisely what a customer was shown without storing a copy of
  -- every email.
  content_hash text,
  content_version text,

  error text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Guards against sending the same notice twice for the same period. The
-- dispatcher inserts with ON CONFLICT DO NOTHING against this.
CREATE UNIQUE INDEX IF NOT EXISTS subscription_notices_unique_send
  ON subscription_notices (stripe_subscription_id, notice_type, scheduled_at)
  WHERE stripe_subscription_id IS NOT NULL AND scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscription_notices_museum_idx
  ON subscription_notices (museum_id, created_at DESC);

CREATE INDEX IF NOT EXISTS subscription_notices_pending_idx
  ON subscription_notices (scheduled_at)
  WHERE sent_at IS NULL;

-- Deny-by-default backstop for the anon/cookie client; authorisation is
-- enforced in application code through the service-role client.
ALTER TABLE subscription_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their notices" ON subscription_notices;
CREATE POLICY "Owners can view their notices"
  ON subscription_notices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = subscription_notices.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

REVOKE UPDATE, DELETE, TRUNCATE ON subscription_notices FROM anon, authenticated, service_role;
