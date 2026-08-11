-- =============================================================
-- DMCCA compliance, phase 0: billing foundations
-- =============================================================
-- Run in Supabase Dashboard → SQL Editor.
--
-- Background: the DMCCA subscription regime is in force from January 2027 and
-- requires renewal reminders, pre-contract information, cooling-off windows and
-- an evidence trail. See docs/dmcca-subscription-compliance.md.
--
-- Everything about a subscription currently lives in Stripe, with a handful of
-- mutable columns mirrored onto museums. That is not enough to work from:
--   - the nightly reconciliation in phase 3 needs a local source of truth to
--     reconcile Stripe *against*, otherwise a missed webhook is invisible;
--   - the cooling-off window in phase 4 must be persisted so the UI can render
--     "you can cancel and get a refund until X" without recomputing it;
--   - notices must be keyed to a stable subscription record.
--
-- This file adds that local mirror plus a webhook event log for deduplication.
-- It is additive only. Nothing here is read by application code yet, and no
-- existing table is altered, so applying it changes no behaviour.
--
-- Both tables are operational rather than evidential: they carry no statutory
-- proof and are deleted with the museum. The append-only evidence tables
-- (cancellation_events, subscription_notices, refunds) arrive in later phases
-- and deliberately outlive the museum row, the way deletion_log already does.
-- =============================================================

-- -------------------------------------------------------------
-- subscriptions: local mirror of the Stripe subscription
-- -------------------------------------------------------------
-- Populated from webhooks, corrected by the nightly reconciliation added in
-- phase 3. Stripe remains authoritative; this is a queryable copy.
--
-- Keyed on stripe_subscription_id rather than museum_id, because a museum that
-- cancels and later resubscribes has more than one subscription over its life.
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  museum_id uuid NOT NULL REFERENCES museums(id) ON DELETE CASCADE,

  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  stripe_price_id text,

  plan text,
  status text,

  -- Billing cadence, mirrored from price.recurring so that reminder scheduling
  -- can be computed generically. An annual price added later is then covered
  -- with no code change.
  billing_interval text,
  billing_interval_count integer,

  -- The currency the customer is actually charged in. This exists nowhere we
  -- control today: it lives in the vitrine_currency cookie and inside Stripe.
  -- Notices must state the amount in the right currency, so it is mirrored here.
  currency text,
  unit_amount integer,          -- smallest currency unit, as Stripe reports it

  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,

  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  ended_at timestamptz,

  -- Cooling-off window, persisted rather than derived. Vitrine grants 14 days
  -- from initial signup, from trial conversion, and from every renewal
  -- including monthly, which is broader than the statute requires.
  -- cooling_off_reason records which of those opened the current window.
  cooling_off_started_at timestamptz,
  cooling_off_ends_at timestamptz,
  cooling_off_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_museum_id_idx
  ON subscriptions (museum_id);

-- Drives the nightly reconciliation and the renewal reminder sweep.
CREATE INDEX IF NOT EXISTS subscriptions_current_period_end_idx
  ON subscriptions (current_period_end)
  WHERE current_period_end IS NOT NULL;

-- Drives "is this subscription still inside its cooling-off window".
CREATE INDEX IF NOT EXISTS subscriptions_cooling_off_ends_at_idx
  ON subscriptions (cooling_off_ends_at)
  WHERE cooling_off_ends_at IS NOT NULL;

-- Drives the trial conversion reminders in phase 3.
CREATE INDEX IF NOT EXISTS subscriptions_trial_end_idx
  ON subscriptions (trial_end)
  WHERE trial_end IS NOT NULL;

-- RLS follows the convention used by messaging-rls.sql and staff-rls.sql:
-- authorisation is enforced in application code through the service-role
-- client, and these policies are a deny-by-default backstop so the anon/cookie
-- client can never read another museum's billing. The service role bypasses RLS.
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their subscription" ON subscriptions;
CREATE POLICY "Owners can view their subscription"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = subscriptions.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

-- No INSERT, UPDATE or DELETE policy. Writes are service-role only.

-- -------------------------------------------------------------
-- stripe_webhook_events: deduplication and ordering guard
-- -------------------------------------------------------------
-- There is no event log today. Idempotency is ad hoc and per-branch: the
-- payment_past_due flag guards the dunning email, a ticket count guards ticket
-- generation. That is adequate while every handler writes idempotent columns,
-- and stops being adequate the moment a replayed event could send a second
-- statutory notice or issue a second refund.
--
-- The Stripe event id is the primary key, so an INSERT ... ON CONFLICT DO
-- NOTHING is the whole dedupe mechanism.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id text PRIMARY KEY,                    -- Stripe event.id, e.g. evt_123
  type text NOT NULL,
  api_version text,
  livemode boolean,

  -- When Stripe created the event, as opposed to when we received it. Out-of-
  -- order delivery is detected by comparing this against the row already held
  -- for the same object.
  stripe_created_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,

  -- received | processed | failed | ignored
  status text NOT NULL DEFAULT 'received',
  error text,

  -- Retained so a mis-handled event can be replayed from our own copy without
  -- depending on Stripe's 30-day event retention.
  payload jsonb
);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_type_idx
  ON stripe_webhook_events (type, received_at DESC);

CREATE INDEX IF NOT EXISTS stripe_webhook_events_status_idx
  ON stripe_webhook_events (status)
  WHERE status <> 'processed';

-- Service-role only; no policies. Nothing here is customer-facing.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
