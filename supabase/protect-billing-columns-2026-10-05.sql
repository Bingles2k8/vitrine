-- Billing columns on museums are server-managed
--
-- The "Users can update their own museums" policy lets an owner update any
-- column of their own row, and authenticated/anon hold UPDATE on every column.
-- So from the browser, with the public anon key and their own session, an
-- owner could run
--
--   supabase.from('museums').update({ plan: 'institution' }).eq('owner_id', me)
--
-- and get Institution without paying, or clear locked_at to get past the
-- payment wall. Every plan gate in this schema (compliance-rls-plan-gate.sql,
-- the insert_*_quota RPCs) reads museums.plan, so none of them hold either.
--
-- These columns are only ever written legitimately by the Stripe webhook,
-- the crons and the server-side billing routes, all through the service role.
-- This trigger refuses changes to them from the authenticated and anon roles.
-- service_role and direct SQL (postgres) are untouched.
--
-- On INSERT the only plan a client may create a museum on is 'community',
-- which is what onboarding already does. Checkout upgrades it via the webhook.
--
-- Deploy note: app/api/stripe/checkout/route.ts must write stripe_customer_id
-- through the service role before this is applied, or checkout will fail for
-- museums without a Stripe customer yet.

CREATE OR REPLACE FUNCTION public.protect_museum_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.plan IS DISTINCT FROM 'community'
      OR NEW.stripe_customer_id IS NOT NULL
      OR NEW.stripe_subscription_id IS NOT NULL
      OR NEW.pending_downgrade_plan IS NOT NULL
      OR NEW.pending_downgrade_date IS NOT NULL
      OR NEW.payment_past_due IS DISTINCT FROM false
      OR NEW.trial_used_at IS NOT NULL
      OR NEW.ever_paid IS DISTINCT FROM false
      OR NEW.locked_at IS NOT NULL
      OR NEW.lock_reason IS NOT NULL
      OR NEW.read_only_until IS NOT NULL
      OR NEW.scheduled_deletion_at IS NOT NULL
      OR NEW.is_test_account IS DISTINCT FROM false
    THEN
      RAISE EXCEPTION 'New museums start on the community plan. Billing fields are set by the server.'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
    OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
    OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
    OR NEW.pending_downgrade_plan IS DISTINCT FROM OLD.pending_downgrade_plan
    OR NEW.pending_downgrade_date IS DISTINCT FROM OLD.pending_downgrade_date
    OR NEW.payment_past_due IS DISTINCT FROM OLD.payment_past_due
    OR NEW.trial_used_at IS DISTINCT FROM OLD.trial_used_at
    OR NEW.ever_paid IS DISTINCT FROM OLD.ever_paid
    OR NEW.locked_at IS DISTINCT FROM OLD.locked_at
    OR NEW.lock_reason IS DISTINCT FROM OLD.lock_reason
    OR NEW.read_only_until IS DISTINCT FROM OLD.read_only_until
    OR NEW.scheduled_deletion_at IS DISTINCT FROM OLD.scheduled_deletion_at
    OR NEW.deletion_warning_30d_sent_at IS DISTINCT FROM OLD.deletion_warning_30d_sent_at
    OR NEW.deletion_warning_7d_sent_at IS DISTINCT FROM OLD.deletion_warning_7d_sent_at
    OR NEW.is_test_account IS DISTINCT FROM OLD.is_test_account
  THEN
    RAISE EXCEPTION 'Billing fields on museums can only be changed by the server.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_museum_billing_columns ON public.museums;
CREATE TRIGGER protect_museum_billing_columns
  BEFORE INSERT OR UPDATE ON public.museums
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_museum_billing_columns();
