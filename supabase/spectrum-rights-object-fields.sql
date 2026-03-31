-- Spectrum 5.1 Procedure 18 (Rights Management) gap fields
-- Adds object-level rights summary fields to the objects table

ALTER TABLE objects
  ADD COLUMN IF NOT EXISTS rights_type           text,
  ADD COLUMN IF NOT EXISTS rights_holder_contact text,
  ADD COLUMN IF NOT EXISTS rights_expiry_date    date,
  ADD COLUMN IF NOT EXISTS licence_type_terms    text,
  ADD COLUMN IF NOT EXISTS rights_in_obtained    boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rights_out_granted    boolean DEFAULT false;
