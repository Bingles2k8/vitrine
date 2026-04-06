-- =============================================================
-- Atomic document insert with quota enforcement
-- =============================================================
-- Locks the museum row (FOR UPDATE) so that concurrent uploads
-- from the same museum are serialised. The quota check and
-- insert happen inside the same transaction, eliminating the
-- TOCTOU race that exists when they are done separately in
-- application code.
--
-- Reads storage_used_bytes from museums (kept in sync by triggers)
-- rather than summing object_documents at query time.
--
-- Auth is pre-verified in the API route before this is called.
-- SECURITY DEFINER lets the function lock the museums row and
-- write to object_documents regardless of the caller's RLS context.
-- =============================================================

CREATE OR REPLACE FUNCTION insert_document_if_quota_ok(
  p_museum_id        uuid,
  p_object_id        uuid,
  p_uploaded_by      uuid,
  p_related_to_type  text,
  p_related_to_id    uuid,
  p_label            text,
  p_document_type    text,
  p_file_url         text,
  p_file_name        text,
  p_file_size        bigint,
  p_mime_type        text,
  p_limit_bytes      bigint  -- null = unlimited
)
RETURNS object_documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used  bigint;
  v_doc   object_documents;
BEGIN
  -- Serialise concurrent uploads for the same museum.
  -- Any other call to this function for the same museum_id will
  -- block here until this transaction commits or rolls back.
  -- The FOR UPDATE lock also ensures storage_used_bytes is current.
  SELECT storage_used_bytes INTO v_used
  FROM museums WHERE id = p_museum_id FOR UPDATE;

  -- Quota check (skipped when limit is null = unlimited plan)
  IF p_limit_bytes IS NOT NULL THEN
    IF COALESCE(v_used, 0) + COALESCE(p_file_size, 0) > p_limit_bytes THEN
      RAISE EXCEPTION 'storage_limit_exceeded';
    END IF;
  END IF;

  INSERT INTO object_documents (
    object_id, museum_id, uploaded_by,
    related_to_type, related_to_id,
    label, document_type,
    file_url, file_name, file_size, mime_type
  ) VALUES (
    p_object_id, p_museum_id, p_uploaded_by,
    p_related_to_type, p_related_to_id,
    p_label, p_document_type,
    p_file_url, p_file_name, p_file_size, p_mime_type
  )
  RETURNING * INTO v_doc;

  RETURN v_doc;
END;
$$;
