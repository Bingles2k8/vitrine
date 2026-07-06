-- =============================================================
-- object_exits: return tracking — 2026-07-06 (Phase 2)
-- Temporary exits (loan-out, temporary removal) had no way to be closed:
-- the register's "Overdue" badge persisted forever because there was no
-- actual-return field. Add returned_date + returned_condition so the
-- ExitsTab "Mark returned" action can close a temporary exit.
-- =============================================================

ALTER TABLE object_exits
  ADD COLUMN IF NOT EXISTS returned_date      date,
  ADD COLUMN IF NOT EXISTS returned_condition text;
