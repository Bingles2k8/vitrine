-- Spectrum 5.1 Procedure 10 (Use of Collections) gap fields

ALTER TABLE collection_use_records
  ADD COLUMN IF NOT EXISTS location_of_use         text,
  ADD COLUMN IF NOT EXISTS information_generated    text,
  ADD COLUMN IF NOT EXISTS reproduction_request_id uuid REFERENCES reproduction_requests(id) ON DELETE SET NULL;
