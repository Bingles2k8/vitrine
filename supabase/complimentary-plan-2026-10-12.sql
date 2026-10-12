-- Complimentary plans
--
-- A museum the admin has put on a paid plan for free, indefinitely: demo and
-- test accounts, partners, friends. museums.plan stays the single source of
-- entitlements (every gate reads it); complimentary_plan records that the plan
-- is a gift rather than a subscription, so that:
--
--   - the plan page does not offer to manage or cancel a subscription that
--     does not exist, and checkout refuses to start one on top of it;
--   - the admin MRR figure does not count it as revenue;
--   - if a Stripe subscription ever ends on such a museum, the webhook puts it
--     back on its complimentary plan instead of moving it to Community.
--
-- Granted and removed from the admin museum page (service role only). The
-- billing-column guard below refuses changes to it from the owner's session.
--
-- Requires protect-billing-columns-2026-10-05.sql (this replaces its function).

ALTER TABLE public.museums
  ADD COLUMN IF NOT EXISTS complimentary_plan text
  CHECK (complimentary_plan IN ('hobbyist', 'professional', 'institution', 'enterprise'));

COMMENT ON COLUMN public.museums.complimentary_plan IS
  'Paid plan given free by an admin, indefinitely. Null for everyone else. museums.plan still holds the entitlement.';

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
      OR NEW.over_limit_purge_at IS NOT NULL
      OR NEW.is_test_account IS DISTINCT FROM false
      OR NEW.complimentary_plan IS NOT NULL
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
    OR NEW.over_limit_purge_at IS DISTINCT FROM OLD.over_limit_purge_at
    OR NEW.purge_warning_30d_sent_at IS DISTINCT FROM OLD.purge_warning_30d_sent_at
    OR NEW.purge_warning_7d_sent_at IS DISTINCT FROM OLD.purge_warning_7d_sent_at
    OR NEW.is_test_account IS DISTINCT FROM OLD.is_test_account
    OR NEW.complimentary_plan IS DISTINCT FROM OLD.complimentary_plan
  THEN
    RAISE EXCEPTION 'Billing fields on museums can only be changed by the server.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
