-- One-time orientation checklist for museums that reach a full-mode plan.
--
-- Upgrading flips museums.plan via the Stripe webhook and the user lands on a
-- dashboard with ~15 new sidebar items and no explanation. This flag tracks
-- whether they've seen the checklist that explains them.
--
-- A column rather than localStorage: localStorage is per-device, so a checklist
-- dismissed on a desktop would reappear on a laptop. This matches the shape of
-- the flags museums already carries (trial_used_at, reengage_*_sent_at).
--
-- There is no plan_changed_at on museums, so the trigger is not "detect the
-- upgrade" — it's "any full-mode museum that hasn't seen this yet". That is
-- simpler and self-healing, but it means existing paying customers would get a
-- welcome checklist for a plan they've had for months. Hence the backfill.

ALTER TABLE museums
  ADD COLUMN IF NOT EXISTS upgrade_checklist_seen_at timestamptz;

COMMENT ON COLUMN museums.upgrade_checklist_seen_at IS
  'When the owner dismissed the full-mode orientation checklist. Null means it is still due.';

-- Backfill: mark it seen for museums already on a full-mode plan, so only
-- future upgraders get the checklist. Idempotent — only touches nulls.
UPDATE museums
   SET upgrade_checklist_seen_at = now()
 WHERE upgrade_checklist_seen_at IS NULL
   AND plan IN ('professional', 'institution', 'enterprise');
