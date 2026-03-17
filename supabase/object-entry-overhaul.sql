-- Object entry overhaul: new fields on objects and entry_records tables
-- Run this in the Supabase SQL editor

-- objects table additions
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS credit_line text,
  ADD COLUMN IF NOT EXISTS is_gift boolean,
  ADD COLUMN IF NOT EXISTS historical_context text,
  ADD COLUMN IF NOT EXISTS production_date text;
-- Note: production_date_early / production_date_late are retained for data safety,
--       just hidden from the UI. New entries write to production_date.

-- entry_records table additions
ALTER TABLE entry_records
  ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdpr_consent_date date;
