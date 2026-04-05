-- Add CHECK constraints to enforce valid status values on compliance tables.
-- Prevents silent data corruption from case-mismatched inserts (e.g. lowercase via SQL).

ALTER TABLE loans
  ADD CONSTRAINT loans_status_check
  CHECK (status IN ('Requested', 'Agreed', 'Active', 'Returned', 'Cancelled'));

ALTER TABLE disposal_records
  ADD CONSTRAINT disposal_records_status_check
  CHECK (status IN ('Proposed', 'Approved', 'In Progress', 'Completed'));

ALTER TABLE collection_reviews
  ADD CONSTRAINT collection_reviews_status_check
  CHECK (status IN ('In Progress', 'Completed'));
