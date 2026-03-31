-- Gap 1: Depositor signature fields on entry_records
ALTER TABLE entry_records
  ADD COLUMN IF NOT EXISTS depositor_signed          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS depositor_signed_date     date,
  ADD COLUMN IF NOT EXISTS digital_acknowledgement   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS digital_acknowledgement_date date;

-- Gap 2: Accession distinction on objects
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS formally_accessioned  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS non_accession_reason  text;

-- Backfill: existing objects with an accession number are formally accessioned
UPDATE objects
  SET formally_accessioned = true
  WHERE accession_no IS NOT NULL AND accession_no != '';

-- Gap 5: Cataloguing attribution fields on objects
ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS record_source       text,
  ADD COLUMN IF NOT EXISTS attributed_to       text,
  ADD COLUMN IF NOT EXISTS attribution_notes   text,
  ADD COLUMN IF NOT EXISTS record_completeness text;
