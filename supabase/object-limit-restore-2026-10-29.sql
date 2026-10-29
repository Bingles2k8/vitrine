-- Restoring from the bin now counts against the plan's object limit.
--
-- enforce_object_limit only ran BEFORE INSERT. Items in the bin don't count
-- towards the limit, so a Community museum at 100 could bin some, add new
-- ones, then restore the binned ones and end up over 100. The bin page checks
-- in the browser first, but nothing on the server stopped it.
--
-- The trigger now also runs when deleted_at changes, and checks only when an
-- object comes back out of the bin. Moving an object into the bin, and every
-- other update, is unaffected.
--
-- The numbers must match PLANS[*].objects in lib/plans.ts.
-- __tests__/lib/objectLimitTrigger.test.ts fails if they drift.
CREATE OR REPLACE FUNCTION public.enforce_object_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_count INTEGER;
  plan_limit    INTEGER;
BEGIN
  IF TG_OP = 'UPDATE' AND NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE TRIGGER enforce_object_limit_trigger
  BEFORE INSERT OR UPDATE OF deleted_at ON public.objects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_object_limit();
