-- Subscription end moves a museum to Community instead of locking it
--
-- Before: customer.subscription.deleted locked the museum, took the public
-- site offline and scheduled the whole account for deletion after 180 days
-- (ever paid) or 30 days (trial only).
--
-- Now: the museum drops to the free Community plan straight away and stays
-- usable. Anything over Community's limits is kept for the same 180 / 30 days,
-- then removed newest first by the account-deletion cron
-- (lib/billing/downgrade.ts). Resubscribing in the meantime cancels it.
--
--   over_limit_purge_at        when the over-limit data will be removed.
--                              Null when nothing is over the limit or the
--                              museum has resubscribed.
--   purge_warning_*_sent_at    idempotency flags for the 30 and 7 day
--                              reminder emails sent by deletion-warnings.
--
-- Additive only. Safe to apply before the code that uses it is deployed.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS over_limit_purge_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_warning_30d_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS purge_warning_7d_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS museums_over_limit_purge_at_idx
  ON museums (over_limit_purge_at)
  WHERE over_limit_purge_at IS NOT NULL;

-- enforce_object_limit had drifted from lib/plans.ts: it capped Hobbyist at
-- 500 objects when the plan sells 1,000, allowed Community 150 instead of 100,
-- and counted objects in the bin, which insert_object_if_quota_ok does not.
-- A paying Hobbyist customer would have been refused their 501st object.
--
-- The numbers must match PLANS[*].objects in lib/plans.ts.
-- __tests__/lib/objectLimitTrigger.test.ts fails if they drift again.
CREATE OR REPLACE FUNCTION public.enforce_object_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_count INTEGER;
  plan_limit    INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
    FROM objects WHERE museum_id = NEW.museum_id AND deleted_at IS NULL;
  SELECT CASE plan
    WHEN 'community'    THEN 100
    WHEN 'hobbyist'     THEN 1000
    WHEN 'professional' THEN 5000
    WHEN 'institution'  THEN 100000
    ELSE NULL  -- enterprise = unlimited
  END INTO plan_limit
    FROM museums WHERE id = NEW.museum_id;
  IF plan_limit IS NOT NULL AND current_count >= plan_limit THEN
    RAISE EXCEPTION 'object_limit_reached: % objects allowed on this plan', plan_limit;
  END IF;
  RETURN NEW;
END;
$function$;
