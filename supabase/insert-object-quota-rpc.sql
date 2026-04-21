-- =============================================================
-- Atomic object insert with quota enforcement
-- =============================================================
-- Locks the museum row (FOR UPDATE) so that concurrent inserts
-- from the same museum are serialised. Quota check and insert
-- happen inside one transaction, eliminating the TOCTOU race.
--
-- Auth is pre-verified in the API route before this is called.
-- SECURITY DEFINER lets the function lock the museums row and
-- write to objects regardless of the caller's RLS context.
--
-- p_object_data is a whitelisted JSONB built in the API layer.
-- The function overrides museum_id / owner_id / created_by /
-- updated_by with the trusted values passed as named params,
-- so callers cannot spoof ownership via the JSONB.
-- =============================================================

CREATE OR REPLACE FUNCTION insert_object_if_quota_ok(
  p_museum_id   uuid,
  p_owner_id    uuid,
  p_created_by  uuid,
  p_limit       integer,   -- null = unlimited
  p_object_data jsonb
)
RETURNS objects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_obj   objects;
  v_data  jsonb;
BEGIN
  -- Serialise concurrent inserts for the same museum.
  PERFORM 1 FROM museums WHERE id = p_museum_id FOR UPDATE;

  IF p_limit IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM objects
      WHERE museum_id = p_museum_id AND deleted_at IS NULL;
    IF v_count >= p_limit THEN
      RAISE EXCEPTION 'object_limit_exceeded';
    END IF;
  END IF;

  -- Merge trusted fields over anything the caller supplied, so the
  -- JSONB cannot be used to forge ownership or audit metadata.
  v_data := COALESCE(p_object_data, '{}'::jsonb) || jsonb_build_object(
    'museum_id',  p_museum_id,
    'owner_id',   p_owner_id,
    'created_by', p_created_by,
    'updated_by', p_created_by
  );

  -- Strip fields that must never come from the caller.
  v_data := v_data
    - 'id'
    - 'deleted_at'
    - 'created_at'
    - 'updated_at'
    - 'show_on_site';

  INSERT INTO objects
  SELECT * FROM jsonb_populate_record(NULL::objects, v_data)
  RETURNING * INTO v_obj;

  RETURN v_obj;
END;
$$;
