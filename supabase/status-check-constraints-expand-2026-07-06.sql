-- =============================================================
-- Expand status CHECK constraints — 2026-07-06 (Phase 2)
-- The original constraints (status-check-constraints.sql) forbade
-- workflow states the UI now needs: loan renewal (Extended), rejected/
-- cancelled disposals, and cancelled reviews. Drop and recreate with the
-- wider value sets. Idempotent.
-- =============================================================

ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans
  ADD CONSTRAINT loans_status_check
  CHECK (status IN ('Requested', 'Agreed', 'Active', 'Extended', 'Returned', 'Cancelled'));

ALTER TABLE disposal_records DROP CONSTRAINT IF EXISTS disposal_records_status_check;
ALTER TABLE disposal_records
  ADD CONSTRAINT disposal_records_status_check
  CHECK (status IN ('Proposed', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Cancelled'));

ALTER TABLE collection_reviews DROP CONSTRAINT IF EXISTS collection_reviews_status_check;
ALTER TABLE collection_reviews
  ADD CONSTRAINT collection_reviews_status_check
  CHECK (status IN ('In Progress', 'Completed', 'Cancelled'));
