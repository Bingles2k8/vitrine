-- =============================================================
-- Atomic staff_members insert with quota enforcement
-- =============================================================
-- Mirrors insert_object_if_quota_ok / insert_document_if_quota_ok.
-- Locks the museum row FOR UPDATE so concurrent invites from the
-- same museum serialise, and the quota check + insert happen
-- inside the same transaction.
-- =============================================================

CREATE OR REPLACE FUNCTION insert_staff_member_if_quota_ok(
  p_museum_id  uuid,
  p_limit      integer,   -- null = unlimited
  p_name       text,
  p_email      text,
  p_role       text,
  p_department text,
  p_access     text
)
RETURNS staff_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_row   staff_members;
BEGIN
  PERFORM 1 FROM museums WHERE id = p_museum_id FOR UPDATE;

  IF p_limit IS NOT NULL THEN
    SELECT count(*) INTO v_count
      FROM staff_members
      WHERE museum_id = p_museum_id;
    IF v_count >= p_limit THEN
      RAISE EXCEPTION 'staff_limit_exceeded';
    END IF;
  END IF;

  INSERT INTO staff_members (museum_id, name, email, role, department, access)
  VALUES (p_museum_id, p_name, p_email, p_role, p_department, p_access)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Lock execution to the service role only. This function is SECURITY DEFINER
-- (bypasses RLS), so leaving the default PUBLIC EXECUTE grant would let any
-- authenticated browser session call it directly with an arbitrary p_museum_id
-- and bypass the API route's ownership + quota checks. It is only ever invoked
-- via the service-role client in app/api/staff-members/route.ts.
REVOKE EXECUTE ON FUNCTION insert_staff_member_if_quota_ok(uuid, integer, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION insert_staff_member_if_quota_ok(uuid, integer, text, text, text, text, text) TO service_role;
