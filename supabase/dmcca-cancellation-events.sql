-- =============================================================
-- DMCCA compliance, phase 1: cancellation evidence
-- =============================================================
-- Run in Supabase Dashboard → SQL Editor, after dmcca-billing-foundations.sql.
--
-- Records every cancellation interaction, whoever initiated it and through
-- whichever channel. If a customer or a regulator later asks what we did and
-- when, this table is the answer.
--
-- Two properties matter and are enforced here rather than by convention:
--
-- 1. APPEND-ONLY. UPDATE and DELETE are revoked from every client role, so
--    history cannot be rewritten. Correcting a mistake means inserting a
--    further event, which is the behaviour we want from an audit trail.
--
-- 2. OUTLIVES THE MUSEUM. There is deliberately no foreign key to museums and
--    no cascade. Records must be retained for six years, and an ex-customer
--    is exactly the person most likely to dispute what happened. deletion_log
--    already works this way. This table must NOT be added to
--    TABLES_IN_DEPENDENCY_ORDER in lib/delete-museum-data.ts.
--
-- Consequence to be reflected in the privacy policy: an email address may
-- survive account deletion here for up to six years, retained on the basis of
-- a legal obligation.
-- =============================================================

CREATE TABLE IF NOT EXISTS cancellation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- No FK. See note above.
  museum_id uuid NOT NULL,
  stripe_subscription_id text,

  -- requested                 customer or agent asked to cancel
  -- scheduled_at_period_end   Stripe accepted, service continues to period end
  -- cancelled_immediately     Stripe accepted, service ended now (cooling-off)
  -- reversed                  cancellation undone before it took effect
  -- failed                    we tried and Stripe rejected it
  event text NOT NULL,

  -- self_serve    customer used the in-app cancel flow
  -- support       an agent actioned a request received by email or phone
  -- stripe_portal customer cancelled in Stripe's hosted portal
  initiated_by text NOT NULL,

  -- Who performed the action. For a support cancellation this is the agent,
  -- not the customer, which is the point of recording it separately.
  actor_user_id uuid,
  actor_email text,

  -- The email we treated as the customer of record at the time.
  customer_email text,

  -- When service actually ends. For a period-end cancellation this is in the
  -- future at the time the row is written.
  effective_at timestamptz,

  -- Cooling-off position at the moment of cancellation, captured so we can
  -- show later why a refund was or was not due.
  cooling_off_active boolean NOT NULL DEFAULT false,
  refund_amount integer,          -- smallest currency unit, null if none due
  currency text,

  -- Free text for a support agent to record how the request arrived.
  note text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cancellation_events_museum_id_idx
  ON cancellation_events (museum_id, created_at DESC);

CREATE INDEX IF NOT EXISTS cancellation_events_subscription_idx
  ON cancellation_events (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Deny-by-default backstop for the anon/cookie client, matching the pattern in
-- messaging-rls.sql. Authorisation is enforced in application code through the
-- service-role client.
ALTER TABLE cancellation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their cancellation history" ON cancellation_events;
CREATE POLICY "Owners can view their cancellation history"
  ON cancellation_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = cancellation_events.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

-- Append-only, enforced by the database rather than by discipline. The service
-- role bypasses RLS but not table grants, so this binds our own server code too.
--
-- TRUNCATE is revoked alongside UPDATE and DELETE. Supabase grants it by
-- default, and without this the whole audit trail could be emptied in one
-- statement, which would make the other two revocations pointless.
REVOKE UPDATE, DELETE, TRUNCATE ON cancellation_events FROM anon, authenticated, service_role;
