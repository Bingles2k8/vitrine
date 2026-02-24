-- =============================================================
-- Staff RLS Fix — Break circular reference between museums and staff_members
-- =============================================================
-- The museums staff SELECT policy queries staff_members (with RLS), and
-- the staff_members owner policy queries museums (with RLS). This creates
-- a circular dependency that causes PostgreSQL to throw
-- "stack depth limit exceeded", which the JS client receives as {data: null},
-- causing the dashboard to redirect everyone to /onboarding.
--
-- Fix: replace the direct subquery in the museums staff policy with a
-- SECURITY DEFINER function. The function runs as the database owner and
-- bypasses RLS on staff_members, so it does not recurse back into museums.
-- =============================================================

CREATE OR REPLACE FUNCTION get_staff_museum_ids()
  RETURNS SETOF uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT museum_id FROM staff_members WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_staff_museum_ids() TO authenticated;

DROP POLICY IF EXISTS "Staff can view their museum" ON museums;
CREATE POLICY "Staff can view their museum"
  ON museums FOR SELECT
  USING (id = ANY(get_staff_museum_ids()));
