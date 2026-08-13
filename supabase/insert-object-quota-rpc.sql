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
  v_cols  text;
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

  -- Name only the columns actually supplied, so everything else takes its
  -- column default.
  --
  -- This previously read `INSERT INTO objects SELECT * FROM
  -- jsonb_populate_record(NULL::objects, v_data)`. jsonb_populate_record
  -- materialises EVERY column of the row type, so any column the caller didn't
  -- mention arrived as an explicit NULL — which overrides the DEFAULT instead
  -- of falling back to it. objects has four NOT NULL columns with defaults
  -- (id, show_on_site, origin_map_public, custom_fields), and show_on_site is
  -- stripped above, so every single call failed with
  -- 'null value in column "id" of relation "objects" violates not-null'.
  --
  -- Filtering against the catalogue also means an unrecognised key in the
  -- payload is ignored rather than aborting the insert.
  SELECT string_agg(quote_ident(c.column_name), ', ' ORDER BY c.column_name)
    INTO v_cols
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name   = 'objects'
    AND c.column_name IN (SELECT jsonb_object_keys(v_data));

  IF v_cols IS NULL THEN
    RAISE EXCEPTION 'no recognised object columns supplied';
  END IF;

  EXECUTE format(
    'INSERT INTO objects (%s) SELECT %s FROM jsonb_populate_record(NULL::objects, $1) RETURNING *',
    v_cols, v_cols
  ) USING v_data INTO v_obj;

  RETURN v_obj;
END;
$$;

-- Lock execution to the service role only. This function is SECURITY DEFINER
-- (bypasses RLS), so leaving the default PUBLIC EXECUTE grant would let any
-- authenticated browser session call it directly with an arbitrary p_museum_id
-- and bypass the API route's ownership + quota checks. It is only ever invoked
-- via the service-role client in app/api/objects/route.ts.
REVOKE EXECUTE ON FUNCTION insert_object_if_quota_ok(uuid, uuid, uuid, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION insert_object_if_quota_ok(uuid, uuid, uuid, integer, jsonb) TO service_role;
