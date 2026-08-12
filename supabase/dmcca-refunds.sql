-- =============================================================
-- DMCCA compliance, phase 4: refunds
-- =============================================================
-- Run in Supabase Dashboard → SQL Editor, after dmcca-billing-foundations.sql.
--
-- Records every refund we issue on a subscription, what it was for, and how it
-- was reconciled against Stripe. This is the money-moving part of the regime,
-- so the record matters more here than anywhere else.
--
-- Same two properties as the other evidence tables:
--   1. APPEND-ONLY. UPDATE, DELETE and TRUNCATE revoked from every client role.
--   2. OUTLIVES THE MUSEUM. No foreign key, no cascade, and must NOT be added
--      to TABLES_IN_DEPENDENCY_ORDER in lib/delete-museum-data.ts.
--
-- Reconciliation, like the notices table, is done by inserting a further row
-- rather than updating: an 'issued' row when we call Stripe, and a 'confirmed'
-- row when charge.refunded comes back. The two are matched on
-- stripe_refund_id. A gap between them is the thing to alert on.
-- =============================================================

CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- No FK. See note above.
  museum_id uuid NOT NULL,
  stripe_subscription_id text,

  -- issued     we called the Stripe Refunds API and it accepted
  -- confirmed  charge.refunded came back and the amounts agree
  -- mismatch   charge.refunded came back and the amounts do NOT agree
  -- failed     Stripe rejected the refund
  event text NOT NULL,

  stripe_refund_id text,
  stripe_charge_id text,
  stripe_payment_intent_id text,

  -- Smallest currency unit, as Stripe reports it.
  amount integer,
  currency text,

  -- cooling_off | goodwill | support
  reason text,

  -- 'pro_rata' or 'full', recording which policy was in force at the time.
  -- The constant can change; what a given customer was given must not.
  refund_mode text,

  -- The idempotency key sent to Stripe. Recorded so a duplicate attempt can be
  -- traced, and so we can prove the same key was reused rather than a second
  -- refund being issued.
  idempotency_key text,

  error text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- One 'issued' row per idempotency key. This is the database-level guard
-- against a double refund: even if the application logic is wrong, a second
-- issue with the same key cannot be recorded, and the reconciliation will
-- surface the discrepancy.
CREATE UNIQUE INDEX IF NOT EXISTS refunds_issued_idempotency_idx
  ON refunds (idempotency_key)
  WHERE event = 'issued' AND idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS refunds_museum_idx
  ON refunds (museum_id, created_at DESC);

CREATE INDEX IF NOT EXISTS refunds_stripe_refund_idx
  ON refunds (stripe_refund_id)
  WHERE stripe_refund_id IS NOT NULL;

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their refunds" ON refunds;
CREATE POLICY "Owners can view their refunds"
  ON refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM museums
      WHERE museums.id = refunds.museum_id
        AND museums.owner_id = auth.uid()
    )
  );

REVOKE UPDATE, DELETE, TRUNCATE ON refunds FROM anon, authenticated, service_role;
