-- =============================================================
-- DMCCA compliance, phase 6: evidence retention
-- =============================================================
-- Run in Supabase Dashboard → SQL Editor.
--
-- The privacy policy states that billing compliance records and the deletion
-- log are kept for six years. Nothing enforced that: the evidence tables had no
-- expiry at all, and deletion_log has been kept indefinitely since it was
-- created. A privacy policy that promises a retention period the code does not
-- honour is worse than one that promises nothing, so this closes the gap.
--
-- Six years matches the limitation period for a contract claim in England and
-- Wales, which is the basis stated in the policy.
--
-- Why a SECURITY DEFINER function rather than a plain DELETE: the evidence
-- tables have UPDATE, DELETE and TRUNCATE revoked from every client role,
-- including service_role, so that history cannot be rewritten by application
-- code or by a compromised key. This function is owned by postgres and is the
-- single sanctioned exception. It can only ever delete rows past the retention
-- period; there is no parameter to widen that.
-- =============================================================

CREATE OR REPLACE FUNCTION purge_expired_billing_evidence()
RETURNS TABLE (table_name text, rows_deleted bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := now() - interval '6 years';
  n bigint;
BEGIN
  DELETE FROM cancellation_events WHERE created_at < cutoff;
  GET DIAGNOSTICS n = ROW_COUNT;
  table_name := 'cancellation_events'; rows_deleted := n; RETURN NEXT;

  DELETE FROM subscription_notices WHERE created_at < cutoff;
  GET DIAGNOSTICS n = ROW_COUNT;
  table_name := 'subscription_notices'; rows_deleted := n; RETURN NEXT;

  DELETE FROM refunds WHERE created_at < cutoff;
  GET DIAGNOSTICS n = ROW_COUNT;
  table_name := 'refunds'; rows_deleted := n; RETURN NEXT;

  DELETE FROM deletion_log WHERE deleted_at < cutoff;
  GET DIAGNOSTICS n = ROW_COUNT;
  table_name := 'deletion_log'; rows_deleted := n; RETURN NEXT;

  RETURN;
END;
$$;

COMMENT ON FUNCTION purge_expired_billing_evidence() IS
  'Deletes billing evidence and deletion-log rows older than six years, honouring the retention period stated in the privacy policy. The only sanctioned exception to the append-only grants on those tables. Called daily by /api/cron/subscription-notices.';

-- Only the service role may call it. Nothing customer-facing should be able to
-- reach a function whose job is deleting audit records.
REVOKE ALL ON FUNCTION purge_expired_billing_evidence() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION purge_expired_billing_evidence() TO service_role;
