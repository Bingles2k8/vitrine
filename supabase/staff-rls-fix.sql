-- =============================================================
-- Staff RLS Fix — Break circular reference between museums and staff_members
-- =============================================================
-- The museums staff SELECT policy queries staff_members (with RLS), and
-- the staff_members owner policy queries museums (with RLS). This creates
-- a circular dependency that causes PostgreSQL to throw
-- "stack depth limit exceeded", which the JS client receives as {data: null},
-- causing the dashboard to redirect everyone to /onboarding.
--
-- Fix: use a scalar boolean SECURITY DEFINER function. It runs as the
-- database owner, bypasses RLS on staff_members, and returns a plain
-- boolean — which is what policy expressions require.
-- (Set-returning functions are not allowed in policy expressions.)
-- =============================================================

-- Drop any previous versions of these functions
DROP FUNCTION IF EXISTS get_staff_museum_ids();
DROP FUNCTION IF EXISTS is_staff_of_museum(uuid);

-- Scalar boolean SECURITY DEFINER function.
-- Checks whether the current user is a staff member of a specific museum
-- without triggering RLS on staff_members (breaks the circular reference).
CREATE FUNCTION is_staff_of_museum(museum_uuid uuid)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
      AND museum_id = museum_uuid
  );
$$;

GRANT EXECUTE ON FUNCTION is_staff_of_museum(uuid) TO authenticated;

DROP POLICY IF EXISTS "Staff can view their museum" ON museums;
CREATE POLICY "Staff can view their museum"
  ON museums FOR SELECT
  USING (is_staff_of_museum(id));
