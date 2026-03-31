-- Spectrum 5.1 Procedure 21 (Audit) gap fields on audit_exercises

ALTER TABLE audit_exercises
  ADD COLUMN IF NOT EXISTS actions_required     text,
  ADD COLUMN IF NOT EXISTS actions_completed    text,
  ADD COLUMN IF NOT EXISTS overall_audit_report text;
